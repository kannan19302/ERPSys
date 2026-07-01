import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface WorkflowContext {
  tenantId: string;
  triggeredBy: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
}

@Injectable()
export class WorkflowEngineService {
  constructor(private eventEmitter: EventEmitter2) {}

  async executeWorkflow(tenantId: string, workflowId: string, context: WorkflowContext) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, tenantId, status: 'ACTIVE' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found or inactive');

    const executionLog: Array<{ stepId: string; actionType: string; result: string; timestamp: string }> = [];

    for (const step of workflow.steps) {
      try {
        const result = await this.executeStep(step, context);
        executionLog.push({
          stepId: step.id,
          actionType: step.actionType,
          result: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });
        if (result.halt) break;
      } catch (err: any) {
        executionLog.push({
          stepId: step.id,
          actionType: step.actionType,
          result: `ERROR: ${err.message || 'Unknown'}`,
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    this.eventEmitter.emit('workflow.executed', {
      tenantId,
      workflowId,
      entityType: context.entityType,
      entityId: context.entityId,
      stepsExecuted: executionLog.length,
    });

    return {
      workflowId,
      workflowName: workflow.name,
      stepsTotal: workflow.steps.length,
      stepsExecuted: executionLog.length,
      executionLog,
    };
  }

  private async executeStep(
    step: { id: string; actionType: string; assigneeRole: string; slaLimitHours: number | null },
    context: WorkflowContext,
  ): Promise<{ halt?: boolean }> {
    switch (step.actionType.toUpperCase()) {
      case 'APPROVAL': {
        await prisma.approvalChain.create({
          data: {
            tenantId: context.tenantId,
            entityType: context.entityType,
            entityId: context.entityId,
            stepId: step.id,
            status: 'PENDING',
          },
        });

        this.eventEmitter.emit('notification.send', {
          tenantId: context.tenantId,
          userId: context.triggeredBy,
          type: 'APPROVAL_REQUEST',
          title: `Approval required: ${context.entityType}`,
        });
        return {};
      }

      case 'NOTIFICATION': {
        this.eventEmitter.emit('notification.send', {
          tenantId: context.tenantId,
          userId: context.triggeredBy,
          type: 'WORKFLOW',
          title: `Workflow step completed for ${context.entityType}`,
        });
        return {};
      }

      case 'AI_REVIEWER': {
        return this.runAiReviewStep(step, context);
      }

      default:
        return {};
    }
  }

  private async runAiReviewStep(
    step: { id: string; actionType: string; assigneeRole: string; slaLimitHours: number | null },
    context: WorkflowContext,
  ): Promise<{ halt?: boolean }> {
    const entitySummary = JSON.stringify(context.data, null, 2).slice(0, 3000);

    const prompt = `You are an ERP risk reviewer. A ${context.entityType} record (ID: ${context.entityId}) has been submitted for approval.

Record data:
${entitySummary}

Assess the risk level. Respond ONLY with a JSON object like:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "One sentence explanation",
  "recommendation": "APPROVE" | "ESCALATE"
}

LOW + APPROVE = auto-approve. MEDIUM or HIGH + ESCALATE = route to human reviewer.`;

    let riskLevel = 'MEDIUM';
    let reasoning = 'AI review unavailable; defaulting to human escalation.';
    let recommendation = 'ESCALATE';

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (res.ok) {
          const body = await res.json() as { content?: Array<{ type: string; text: string }> };
          const text = body.content?.[0]?.type === 'text' ? body.content[0].text : '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as { riskLevel?: string; reasoning?: string; recommendation?: string };
            riskLevel = parsed.riskLevel || riskLevel;
            reasoning = parsed.reasoning || reasoning;
            recommendation = parsed.recommendation || recommendation;
          }
        }
      } catch {
        // Keep defaults on network/parse error
      }
    }

    if (recommendation === 'APPROVE' && riskLevel === 'LOW') {
      this.eventEmitter.emit('notification.send', {
        tenantId: context.tenantId,
        userId: context.triggeredBy,
        type: 'WORKFLOW',
        title: `AI auto-approved ${context.entityType}: ${reasoning}`,
      });
      this.eventEmitter.emit('workflow.ai-reviewed', {
        tenantId: context.tenantId,
        entityType: context.entityType,
        entityId: context.entityId,
        riskLevel,
        reasoning,
        outcome: 'AUTO_APPROVED',
      });
      return {};
    }

    // High/medium risk → create approval chain for human review
    await prisma.approvalChain.create({
      data: {
        tenantId: context.tenantId,
        entityType: context.entityType,
        entityId: context.entityId,
        stepId: step.id,
        status: 'PENDING',
      },
    });

    this.eventEmitter.emit('notification.send', {
      tenantId: context.tenantId,
      userId: context.triggeredBy,
      type: 'APPROVAL_REQUEST',
      title: `AI flagged ${context.entityType} for human review (${riskLevel} risk): ${reasoning}`,
    });

    this.eventEmitter.emit('workflow.ai-reviewed', {
      tenantId: context.tenantId,
      entityType: context.entityType,
      entityId: context.entityId,
      riskLevel,
      reasoning,
      outcome: 'ESCALATED_TO_HUMAN',
    });

    return {};
  }

  async processEventTrigger(tenantId: string, triggerType: string, entityType: string, entityId: string, data: Record<string, unknown>, triggeredBy: string) {
    const workflows = await prisma.workflow.findMany({
      where: { tenantId, triggerType, status: 'ACTIVE' },
    });

    const results = [];
    for (const wf of workflows) {
      const result = await this.executeWorkflow(tenantId, wf.id, {
        tenantId, triggeredBy, entityType, entityId, data,
      });
      results.push(result);
    }

    return { triggerType, workflowsTriggered: results.length, results };
  }
}
