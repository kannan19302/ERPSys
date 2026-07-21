import { Injectable } from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";
import { z } from "zod";

export const AutoAssignmentRuleSchema = z.object({
  name: z.string().min(1),
  objectType: z.enum(["LEAD", "OPPORTUNITY", "CASE", "TICKET"]),
  criteria: z.record(z.unknown()),
  assignmentMethod: z.enum([
    "ROUND_ROBIN",
    "LEAST_LOADED",
    "SKILL_BASED",
    "GEOGRAPHIC",
    "MANUAL",
  ]),
  teamId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
});

export const EscalationRuleSchema = z.object({
  name: z.string().min(1),
  objectType: z.enum(["LEAD", "OPPORTUNITY", "CASE", "TICKET"]),
  triggerType: z.enum([
    "TIME_ELAPSED",
    "STAGE_STALLED",
    "VALUE_CHANGE",
    "SLA_BREACH",
  ]),
  threshold: z.number().int().min(0),
  thresholdUnit: z.enum(["MINUTES", "HOURS", "DAYS"]),
  escalateTo: z.enum(["MANAGER", "SPECIFIC_USER", "QUEUE", "HIGHER_TIER"]),
  targetUserId: z.string().optional(),
  targetQueueId: z.string().optional(),
  notificationTemplate: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const LeadScoringModelSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  modelType: z.enum(["DEMOGRAPHIC", "BEHAVIORAL", "FIT", "INTENT", "HYBRID"]),
  weights: z.record(z.number().min(0).max(100)),
  thresholds: z.object({
    hot: z.number().min(0).max(100),
    warm: z.number().min(0).max(100),
    cold: z.number().min(0).max(100),
  }),
  isActive: z.boolean().default(true),
});

export const SequenceStepSchema = z.object({
  stepOrder: z.number().int().min(0),
  actionType: z.enum(["EMAIL", "CALL", "SMS", "TASK", "LINKEDIN", "WAIT"]),
  delayDays: z.number().int().min(0).default(0),
  delayHours: z.number().int().min(0).default(0),
  templateId: z.string().optional(),
  content: z.string().optional(),
  condition: z.string().optional(),
});

export const SalesSequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectType: z.enum(["LEAD", "OPPORTUNITY", "CONTACT"]),
  goal: z.string().optional(),
  steps: z.array(SequenceStepSchema),
  enrollCondition: z.string().optional(),
  unenrollCondition: z.string().optional(),
  maxAttempts: z.number().int().min(1).default(5),
  isActive: z.boolean().default(true),
});

@Injectable()
export class CrmSalesAutomationService {
  async createAutoAssignmentRule(
    tenantId: string,
    data: z.infer<typeof AutoAssignmentRuleSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.territoryAssignmentRule.create({
        data: { ...data, tenantId } as any,
      }),
    );
  }

  async getAutoAssignmentRules(tenantId: string, objectType?: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.territoryAssignmentRule.findMany({
        where: {
          tenantId,
          ...(objectType ? { objectType: objectType as any } : {}),
        },
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getAutoAssignmentRule(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.territoryAssignmentRule.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateAutoAssignmentRule(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof AutoAssignmentRuleSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.territoryAssignmentRule.update({
        where: { id, tenantId },
        data: data as any,
      }),
    );
  }

  async deleteAutoAssignmentRule(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.territoryAssignmentRule.delete({ where: { id, tenantId } }),
    );
  }

  async assignLeadToUser(tenantId: string, leadId: string, userId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const lead = await prisma.lead.update({
        where: { id: leadId, tenantId },
        data: { assignedToId: userId, updatedAt: new Date() },
      });
      await prisma.territoryAssignmentLog.create({
        data: {
          tenantId,
          entityType: "LEAD",
          entityId: leadId,
          assignedToId: userId,
          reason: "MANUAL",
        } as any,
      });
      return lead;
    });
  }

  async roundRobinAssign(
    tenantId: string,
    _objectType: string,
    ruleId: string,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const rule = await prisma.territoryAssignmentRule.findUnique({
        where: { id: ruleId, tenantId },
      });
      if (!rule || !rule.territoryId) return null;
      const lastState = await prisma.territoryRoundRobinState.findUnique({
        where: {
          tenantId_territoryId: { tenantId, territoryId: rule.territoryId },
        },
      });
      const lastIndex = lastState?.lastMemberIndex ?? -1;
      const nextIndex = lastIndex + 1;
      await prisma.territoryRoundRobinState.upsert({
        where: {
          tenantId_territoryId: { tenantId, territoryId: rule.territoryId },
        },
        update: { lastMemberIndex: nextIndex },
        create: {
          tenantId,
          territoryId: rule.territoryId,
          lastMemberIndex: nextIndex,
        },
      });
      return nextIndex;
    });
  }

  async getAssignmentStats(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const [totalRules, totalAssignments, methodBreakdown] = await Promise.all(
        [
          prisma.territoryAssignmentRule.count({ where: { tenantId } }),
          prisma.territoryAssignmentLog.count({ where: { tenantId } }),
          prisma.territoryAssignmentLog.groupBy({
            by: ["reason"],
            where: { tenantId },
            _count: true,
          }),
        ],
      );
      return { totalRules, totalAssignments, methodBreakdown };
    });
  }

  async createEscalationRule(
    tenantId: string,
    data: z.infer<typeof EscalationRuleSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.create({
        data: { ...data, tenantId, policyType: "ESCALATION" } as any,
      }),
    );
  }

  async getEscalationRules(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.findMany({
        where: { tenantId } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getEscalationRule(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateEscalationRule(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof EscalationRuleSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteEscalationRule(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.delete({ where: { id, tenantId } }),
    );
  }

  async getEscalationStats(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const totalRules = await prisma.slaPolicy.count({
        where: { tenantId } as any,
      });
      const activeRules = await prisma.slaPolicy.count({
        where: { tenantId, active: true } as any,
      });
      return { totalRules, activeRules };
    });
  }

  async createScoringModel(
    tenantId: string,
    data: z.infer<typeof LeadScoringModelSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.leadScoringRule.create({ data: { ...data, tenantId } as any }),
    );
  }

  async getScoringModels(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.leadScoringRule.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getScoringModel(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.leadScoringRule.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateScoringModel(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof LeadScoringModelSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.leadScoringRule.update({
        where: { id, tenantId },
        data: data as any,
      }),
    );
  }

  async deleteScoringModel(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.leadScoringRule.delete({ where: { id, tenantId } }),
    );
  }

  async recalculateScores(tenantId: string, modelId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const model = await prisma.leadScoringRule.findUnique({
        where: { id: modelId, tenantId },
      });
      if (!model) throw new Error("Scoring model not found");
      const leads = await prisma.lead.findMany({ where: { tenantId } });
      return {
        modelId,
        leadsProcessed: leads.length,
        recalculatedAt: new Date(),
      };
    });
  }

  async createSalesSequence(
    tenantId: string,
    data: z.infer<typeof SalesSequenceSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const { steps, ...rest } = data;
      return prisma.crmWorkflowRule.create({
        data: { ...rest, tenantId, steps: JSON.stringify(steps) } as any,
      });
    });
  }

  async getSalesSequences(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.crmWorkflowRule.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getSalesSequence(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.crmWorkflowRule.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateSalesSequence(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof SalesSequenceSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.crmWorkflowRule.update({
        where: { id, tenantId },
        data: data as any,
      }),
    );
  }

  async deleteSalesSequence(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.crmWorkflowRule.delete({ where: { id, tenantId } }),
    );
  }

  async enrollInSequence(
    tenantId: string,
    sequenceId: string,
    objectId: string,
    objectType: string,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const sequence = await prisma.crmWorkflowRule.findUnique({
        where: { id: sequenceId, tenantId },
      });
      if (!sequence) throw new Error("Sequence not found");
      return {
        sequenceId,
        objectId,
        objectType,
        enrolledAt: new Date(),
        status: "ACTIVE",
      };
    });
  }

  async unenrollFromSequence(
    tenantId: string,
    sequenceId: string,
    objectId: string,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () => ({
      sequenceId,
      objectId,
      unenrolledAt: new Date(),
      status: "REMOVED",
    }));
  }

  async getSequenceAnalytics(tenantId: string, sequenceId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        sequenceId,
        enrolledCount: 0,
        completedCount: 0,
        conversionRate: 0,
      };
    });
  }

  async getCrmDashboard(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const [totalLeads, totalOpportunities, totalCustomers, pipelineAgg] =
        await Promise.all([
          prisma.lead.count({ where: { tenantId } }).catch(() => 0),
          prisma.opportunity.count({ where: { tenantId } }).catch(() => 0),
          prisma.customer.count({ where: { tenantId } }).catch(() => 0),
          prisma.opportunity
            .aggregate({ where: { tenantId }, _sum: { amount: true } })
            .catch(() => ({ _sum: { amount: null } })),
        ]);
      return {
        kpis: {
          totalLeads,
          totalOpportunities,
          totalCustomers,
          pipelineValue: pipelineAgg._sum.amount || 0,
        },
      };
    });
  }

  async getAutomationDashboard(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const [totalRules, activeRules, totalSequences, totalAssignments] =
        await Promise.all([
          prisma.territoryAssignmentRule.count({ where: { tenantId } }),
          prisma.territoryAssignmentRule.count({
            where: { tenantId, isActive: true },
          }),
          prisma.crmWorkflowRule.count({ where: { tenantId } }),
          prisma.territoryAssignmentLog.count({ where: { tenantId } }),
        ]);
      return { totalRules, activeRules, totalSequences, totalAssignments };
    });
  }
}
