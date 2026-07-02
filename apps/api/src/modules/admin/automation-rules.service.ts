import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AutomationRulesService {
  async getRules(tenantId: string) {
    return prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRule(tenantId: string, id: string) {
    return prisma.automationRule.findFirstOrThrow({
      where: { id, tenantId },
    });
  }

  async createRule(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      trigger: string;
      triggerConfig?: any;
      conditions?: any;
      actions?: any;
      status?: string;
      settings?: any;
    },
    userId: string,
  ) {
    return prisma.automationRule.create({
      data: {
        tenantId,
        createdBy: userId,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        triggerConfig: data.triggerConfig ?? {},
        conditions: data.conditions ?? [],
        actions: data.actions ?? [],
        status: data.status ?? 'DRAFT',
        settings: data.settings ?? {},
      },
    });
  }

  async updateRule(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      trigger?: string;
      triggerConfig?: any;
      conditions?: any;
      actions?: any;
      status?: string;
      settings?: any;
    },
  ) {
    return prisma.automationRule.update({
      where: { id, tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.triggerConfig !== undefined && { triggerConfig: data.triggerConfig }),
        ...(data.conditions !== undefined && { conditions: data.conditions }),
        ...(data.actions !== undefined && { actions: data.actions }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settings !== undefined && { settings: data.settings }),
      },
    });
  }

  async deleteRule(tenantId: string, id: string) {
    return prisma.automationRule.delete({
      where: { id, tenantId },
    });
  }

  /**
   * Shared condition-evaluation logic. Extracted so both `testRule` (sample-data,
   * caller-supplied) and `AutomationRuleEngineService` (real domain events) evaluate
   * a rule's stored `conditions` identically — do not duplicate this logic elsewhere.
   */
  static evaluateConditions(conditions: any[], data: Record<string, any>) {
    const matchedConditions = conditions.filter((condition: any) => {
      const fieldValue = data[condition.field];
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'is_empty':
          return !fieldValue;
        case 'is_not_empty':
          return !!fieldValue;
        default:
          return false;
      }
    });

    const allConditionsMet = matchedConditions.length === conditions.length;
    return { matchedConditions, allConditionsMet };
  }

  async testRule(tenantId: string, id: string, sampleData: any) {
    const startTime = Date.now();
    const rule = await prisma.automationRule.findFirstOrThrow({
      where: { id, tenantId },
    });

    const conditions = rule.conditions as any[];
    const actions = rule.actions as any[];

    const { matchedConditions, allConditionsMet } = AutomationRulesService.evaluateConditions(
      conditions,
      sampleData,
    );
    const actionsToFire = allConditionsMet ? actions : [];
    const durationMs = Date.now() - startTime;

    await prisma.automationRuleExecution.create({
      data: {
        tenantId,
        ruleId: id,
        status: 'TEST',
        triggerData: sampleData,
        result: { matchedConditions, actionsToFire, allConditionsMet },
        durationMs,
      },
    });

    return { allConditionsMet, matchedConditions, actionsToFire, durationMs };
  }

  async getExecutionHistory(tenantId: string, ruleId?: string, limit = 50) {
    return prisma.automationRuleExecution.findMany({
      where: {
        tenantId,
        ...(ruleId && { ruleId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
