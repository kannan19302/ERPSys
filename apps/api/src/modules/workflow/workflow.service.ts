import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma, WorkflowStep } from '@prisma/client';

@Injectable()
export class WorkflowService {
  async getWorkflows(tenantId: string) {
    return prisma.workflow.findMany({
      where: { tenantId },
      include: { steps: true },
      orderBy: { name: 'asc' },
    });
  }

  async createWorkflow(
    tenantId: string,
    dto: { name: string; triggerType: string; steps: { stepOrder: number; actionType: string; assigneeRole: string; slaLimitHours?: number; backupAssigneeRole?: string }[] }
  ) {
    const existing = await prisma.workflow.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new BadRequestException(`Workflow named ${dto.name} already exists.`);

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const flow = await tx.workflow.create({
        data: {
          tenantId,
          name: dto.name,
          triggerType: dto.triggerType,
          status: 'ACTIVE',
        },
      });

      for (const step of dto.steps) {
        await tx.workflowStep.create({
          data: {
            tenantId,
            workflowId: flow.id,
            stepOrder: step.stepOrder,
            actionType: step.actionType,
            assigneeRole: step.assigneeRole,
            slaLimitHours: step.slaLimitHours || null,
            backupAssigneeRole: step.backupAssigneeRole || null,
          },
        });
      }

      return tx.workflow.findUnique({
        where: { id: flow.id },
        include: { steps: true },
      });
    });
  }

  async getApprovalChains(tenantId: string) {
    return prisma.approvalChain.findMany({
      where: { tenantId },
      include: { step: { include: { workflow: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async triggerWorkflow(
    tenantId: string,
    dto: { triggerType: string; entityType: string; entityId: string }
  ) {
    const flow = await prisma.workflow.findFirst({
      where: { tenantId, triggerType: dto.triggerType, status: 'ACTIVE' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!flow || flow.steps.length === 0) return null; // No workflow configured for this trigger

    const firstStep = flow.steps[0];
    if (!firstStep) return null;

    return prisma.approvalChain.create({
      data: {
        tenantId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        stepId: firstStep.id,
        status: 'PENDING',
      },
      include: { step: true },
    });
  }

  async submitApprovalAction(
    tenantId: string,
    chainId: string,
    dto: { status: 'APPROVED' | 'REJECTED'; comments?: string },
    userId: string
  ) {
    const chain = await prisma.approvalChain.findFirst({
      where: { id: chainId, tenantId },
      include: { step: { include: { workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } } } } },
    });
    if (!chain) throw new NotFoundException('Approval step not found');
    if (chain.status !== 'PENDING') throw new BadRequestException('This step has already been actioned.');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.approvalChain.update({
        where: { id: chainId },
        data: {
          status: dto.status,
          actionBy: userId,
          actionAt: new Date(),
          comments: dto.comments || null,
        },
      });

      // If approved, trigger next step in workflow if it exists
      if (dto.status === 'APPROVED') {
        const currentStepOrder = chain.step.stepOrder;
        const allSteps = chain.step.workflow.steps;
        const nextStep = allSteps.find((s: WorkflowStep) => s.stepOrder === currentStepOrder + 1);

        if (nextStep) {
          // Create next step in approval chain
          await tx.approvalChain.create({
            data: {
              tenantId,
              entityType: chain.entityType,
              entityId: chain.entityId,
              stepId: nextStep.id,
              status: 'PENDING',
            },
          });
        }
      }

      return updated;
    });
  }

  async checkSlaBreaches(tenantId: string) {
    const pendingChains = await prisma.approvalChain.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { step: true },
    });

    const now = new Date();
    const breaches = [];

    for (const chain of pendingChains) {
      if (chain.step.slaLimitHours) {
        const limitMs = chain.step.slaLimitHours * 60 * 60 * 1000;
        const elapsed = now.getTime() - chain.createdAt.getTime();

        if (elapsed > limitMs && !chain.delegatedRole) {
          const backupRole = chain.step.backupAssigneeRole || 'Admin';
          const updatedChain = await prisma.approvalChain.update({
            where: { id: chain.id },
            data: { delegatedRole: backupRole },
          });

          await prisma.notification.create({
            data: {
              tenantId,
              userId: chain.actionBy || 'system',
              title: 'SLA Breach: Workflow Task Reassigned',
              content: `Approval step ${chain.step.stepOrder} for ${chain.entityType} (${chain.entityId}) breached SLA and was reassigned to role ${backupRole}.`,
              type: 'WORKFLOW',
              status: 'UNREAD',
            },
          });

          breaches.push(updatedChain);
        }
      }
    }
    return breaches;
  }

  async simulateWorkflow(tenantId: string, triggerType: string, _entityType: string, _entityId: string) {
    const flow = await prisma.workflow.findFirst({
      where: { tenantId, triggerType, status: 'ACTIVE' },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!flow) return { success: false, message: 'No active workflow found' };
    return {
      success: true,
      workflowName: flow.name,
      stepsCount: flow.steps.length,
      sequence: flow.steps.map((s: WorkflowStep) => ({
        stepOrder: s.stepOrder,
        actionType: s.actionType,
        assigneeRole: s.assigneeRole,
        slaHours: s.slaLimitHours,
        backupRole: s.backupAssigneeRole,
      })),
    };
  }
}
