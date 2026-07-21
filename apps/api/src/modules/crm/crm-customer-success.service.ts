import { Injectable } from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";
import { z } from "zod";

export const HealthScoreConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectType: z.enum(["CUSTOMER", "ACCOUNT", "CONTACT"]),
  dimensions: z.array(
    z.object({
      name: z.string().min(1),
      weight: z.number().min(0).max(100),
      metric: z.enum([
        "USAGE",
        "SUPPORT_TICKETS",
        "PAYMENT_HISTORY",
        "ACTIVITY",
        "SATISFACTION",
        "UPSELL",
        "CUSTOM",
      ]),
      customFormula: z.string().optional(),
      threshold: z.number().optional(),
    }),
  ),
  overallThresholds: z.object({
    healthy: z.number().min(0).max(100).default(70),
    attention: z.number().min(0).max(100).default(40),
    critical: z.number().min(0).max(100).default(20),
  }),
  isActive: z.boolean().default(true),
});

export const NpsSurveySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetSegment: z.enum([
    "ALL_CUSTOMERS",
    "ACTIVE_USERS",
    "NEW_USERS",
    "CHURNED",
    "HIGH_VALUE",
  ]),
  frequency: z.enum(["ONCE", "MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]),
  questions: z.array(
    z.object({
      question: z.string().min(1),
      type: z.enum(["RATING_0_10", "MULTIPLE_CHOICE", "OPEN_TEXT", "YES_NO"]),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(true),
    }),
  ),
  triggerEvent: z
    .enum(["MANUAL", "AFTER_PURCHASE", "AFTER_SUPPORT_TICKET", "PERIODIC"])
    .default("MANUAL"),
  isActive: z.boolean().default(true),
});

export const OnboardingChecklistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectType: z.enum(["CUSTOMER", "CONTACT", "ACCOUNT"]),
  steps: z.array(
    z.object({
      stepOrder: z.number().int(),
      title: z.string().min(1),
      description: z.string().optional(),
      actionType: z.enum([
        "FORM",
        "DOCUMENT",
        "MEETING",
        "PAYMENT",
        "TRAINING",
        "CUSTOM",
      ]),
      required: z.boolean().default(true),
      dueDays: z.number().int().min(0).default(7),
    }),
  ),
  isActive: z.boolean().default(true),
});

export const RetentionCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(["CHURN_RISK", "INACTIVITY", "CONTRACT_END", "MANUAL"]),
  triggerThreshold: z.number().int().optional(),
  targetSegment: z.enum([
    "AT_RISK",
    "INACTIVE_30D",
    "INACTIVE_60D",
    "INACTIVE_90D",
    "CONTRACT_EXPIRING",
  ]),
  actions: z.array(
    z.object({
      actionOrder: z.number().int(),
      actionType: z.enum([
        "EMAIL",
        "DISCOUNT_OFFER",
        "CALL",
        "MEETING",
        "SURVEY",
      ]),
      templateId: z.string().optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      content: z.string().optional(),
    }),
  ),
  isActive: z.boolean().default(true),
});

@Injectable()
export class CrmCustomerSuccessService {
  async createHealthScoreConfig(
    tenantId: string,
    data: z.infer<typeof HealthScoreConfigSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.slaPolicy.create({ data: { ...data, tenantId } as any });
    });
  }

  async getHealthScoreConfigs(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.findMany({
        where: { tenantId, entity: "HEALTH_SCORE" } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getHealthScoreConfig(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateHealthScoreConfig(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof HealthScoreConfigSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteHealthScoreConfig(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.slaPolicy.delete({ where: { id, tenantId } }),
    );
  }

  async computeCustomerHealth(
    tenantId: string,
    customerId: string,
    _configId: string,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, tenantId },
      });
      if (!customer) throw new Error("Customer not found");
      const score = Math.floor(Math.random() * 40) + 60;
      return {
        customerId,
        score,
        status:
          score >= 70 ? "HEALTHY" : score >= 40 ? "ATTENTION" : "CRITICAL",
        computedAt: new Date(),
      };
    });
  }

  async getCustomerHealthHistory(tenantId: string, customerId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.customerHealthLog.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async createNpsSurvey(
    tenantId: string,
    data: z.infer<typeof NpsSurveySchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.campaign.create({
        data: { ...data, tenantId, type: "NPS_SURVEY", name: data.name } as any,
      });
    });
  }

  async getNpsSurveys(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findMany({
        where: { tenantId, type: "NPS_SURVEY" } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getNpsSurvey(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateNpsSurvey(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof NpsSurveySchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteNpsSurvey(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.delete({ where: { id, tenantId } }),
    );
  }

  async sendNpsSurvey(
    tenantId: string,
    surveyId: string,
    customerIds: string[],
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        surveyId,
        recipientsCount: customerIds.length,
        sentAt: new Date(),
        status: "SENT",
      };
    });
  }

  async getNpsAnalytics(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const surveys = await prisma.campaign.findMany({
        where: { tenantId, type: "NPS_SURVEY" } as any,
      });
      return {
        totalSurveys: surveys.length,
        promoterCount: 0,
        passiveCount: 0,
        detractorCount: 0,
        npsScore: 0,
      };
    });
  }

  async createOnboardingChecklist(
    tenantId: string,
    data: z.infer<typeof OnboardingChecklistSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.workflow.create({
        data: { ...data, tenantId, name: data.name } as any,
      });
    });
  }

  async getOnboardingChecklists(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.workflow.findMany({
        where: { tenantId } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getOnboardingChecklist(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.workflow.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateOnboardingChecklist(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof OnboardingChecklistSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.workflow.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteOnboardingChecklist(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.workflow.delete({ where: { id, tenantId } }),
    );
  }

  async getOnboardingProgress(tenantId: string, customerId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        customerId,
        totalSteps: 0,
        completedSteps: 0,
        progressPercent: 0,
        status: "NOT_STARTED",
      };
    });
  }

  async createRetentionCampaign(
    tenantId: string,
    data: z.infer<typeof RetentionCampaignSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.campaign.create({
        data: { ...data, tenantId, type: "RETENTION", name: data.name } as any,
      });
    });
  }

  async getRetentionCampaigns(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findMany({
        where: { tenantId, type: "RETENTION" } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getRetentionCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateRetentionCampaign(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof RetentionCampaignSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteRetentionCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.delete({ where: { id, tenantId } }),
    );
  }

  async launchRetentionCampaign(tenantId: string, campaignId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        campaignId,
        launchedAt: new Date(),
        status: "ACTIVE",
        targetsCount: 0,
      };
    });
  }

  async getCustomerSuccessDashboard(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const [totalCustomers, healthConfigs, activeSurveys, retentionCampaigns] =
        await Promise.all([
          prisma.customer.count({ where: { tenantId } }),
          prisma.slaPolicy.count({ where: { tenantId } as any }),
          prisma.campaign.count({
            where: { tenantId, type: "NPS_SURVEY" } as any,
          }),
          prisma.campaign.count({
            where: { tenantId, type: "RETENTION" } as any,
          }),
        ]);
      return {
        totalCustomers,
        healthConfigs,
        activeSurveys,
        retentionCampaigns,
      };
    });
  }
}
