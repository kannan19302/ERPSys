import { Injectable } from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";
import { z } from "zod";

export const DripCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  goal: z.string().optional(),
  targetSegment: z.enum(["LEAD", "CONTACT", "CUSTOMER", "ALL"]),
  triggerEvent: z.enum([
    "FORM_SUBMISSION",
    "PAGE_VISIT",
    "EMAIL_OPEN",
    "MANUAL",
    "SCHEDULED",
  ]),
  emails: z.array(
    z.object({
      stepOrder: z.number().int(),
      subject: z.string().min(1),
      templateId: z.string().optional(),
      body: z.string().optional(),
      delayDays: z.number().int().min(0),
      condition: z.string().optional(),
      aBTestEnabled: z.boolean().default(false),
      bSubject: z.string().optional(),
      bBody: z.string().optional(),
    }),
  ),
  exitCondition: z.string().optional(),
  maxEmailsPerContact: z.number().int().min(1).default(10),
  isActive: z.boolean().default(true),
});

export const LandingPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  layoutTemplate: z.enum([
    "CENTERED",
    "SPLIT",
    "FULL_WIDTH",
    "MINIMAL",
    "CUSTOM",
  ]),
  fields: z.array(
    z.object({
      fieldName: z.string().min(1),
      fieldType: z.enum([
        "TEXT",
        "EMAIL",
        "PHONE",
        "NUMBER",
        "DATE",
        "SELECT",
        "CHECKBOX",
        "TEXTAREA",
      ]),
      required: z.boolean().default(false),
      placeholder: z.string().optional(),
    }),
  ),
  thankyouMessage: z.string().optional(),
  redirectUrl: z.string().optional(),
  trackingCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const ABTestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  objectType: z.enum([
    "EMAIL_SUBJECT",
    "EMAIL_BODY",
    "LANDING_PAGE",
    "CTA",
    "OFFER",
  ]),
  variantA: z.record(z.unknown()),
  variantB: z.record(z.unknown()),
  trafficSplit: z.number().int().min(1).max(99).default(50),
  minimumSampleSize: z.number().int().min(100).default(1000),
  durationDays: z.number().int().min(1).default(14),
  successMetric: z.enum([
    "OPEN_RATE",
    "CLICK_RATE",
    "CONVERSION_RATE",
    "BOUNCE_RATE",
    "REVENUE",
  ]),
  isActive: z.boolean().default(true),
});

@Injectable()
export class CrmMarketingAutomationService {
  async createDripCampaign(
    tenantId: string,
    data: z.infer<typeof DripCampaignSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.campaign.create({
        data: { ...data, tenantId, type: "DRIP", name: data.name } as any,
      });
    });
  }

  async getDripCampaigns(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findMany({
        where: { tenantId, type: "DRIP" } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getDripCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateDripCampaign(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof DripCampaignSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteDripCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.delete({ where: { id, tenantId } }),
    );
  }

  async activateDripCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({
        where: { id, tenantId },
        data: { status: "ACTIVE" } as any,
      }),
    );
  }

  async pauseDripCampaign(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({
        where: { id, tenantId },
        data: { status: "PAUSED" } as any,
      }),
    );
  }

  async getDripEmailAnalytics(tenantId: string, campaignId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        campaignId,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        bounceCount: 0,
        conversionCount: 0,
        openRate: 0,
        clickRate: 0,
      };
    });
  }

  async getDripCampaignStats(tenantId: string, campaignId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId, tenantId },
      });
      return {
        campaignId,
        name: campaign?.name,
        enrolledCount: 0,
        activeCount: 0,
        completedCount: 0,
        unsubscribedCount: 0,
      };
    });
  }

  async createLandingPage(
    tenantId: string,
    data: z.infer<typeof LandingPageSchema>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.webToLeadForm.create({
        data: { ...data, tenantId } as any,
      });
    });
  }

  async getLandingPages(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.webToLeadForm.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getLandingPage(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.webToLeadForm.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateLandingPage(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof LandingPageSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.webToLeadForm.update({
        where: { id, tenantId },
        data: data as any,
      }),
    );
  }

  async deleteLandingPage(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.webToLeadForm.delete({ where: { id, tenantId } }),
    );
  }

  async publishLandingPage(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.webToLeadForm.update({ where: { id, tenantId }, data: {} as any }),
    );
  }

  async getLandingPageStats(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        landingPageId: id,
        totalVisits: 0,
        uniqueVisitors: 0,
        conversions: 0,
        conversionRate: 0,
      };
    });
  }

  async createABTest(tenantId: string, data: z.infer<typeof ABTestSchema>) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return prisma.campaign.create({
        data: { ...data, tenantId, type: "AB_TEST", name: data.name } as any,
      });
    });
  }

  async getABTests(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findMany({
        where: { tenantId, type: "AB_TEST" } as any,
        orderBy: { createdAt: "desc" },
      }),
    );
  }

  async getABTest(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.findUnique({ where: { id, tenantId } }),
    );
  }

  async updateABTest(
    tenantId: string,
    id: string,
    data: Partial<z.infer<typeof ABTestSchema>>,
  ) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.update({ where: { id, tenantId }, data: data as any }),
    );
  }

  async deleteABTest(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, () =>
      prisma.campaign.delete({ where: { id, tenantId } }),
    );
  }

  async getABTestResults(tenantId: string, id: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      return {
        testId: id,
        variantA: { impressions: 0, conversions: 0, rate: 0 },
        variantB: { impressions: 0, conversions: 0, rate: 0 },
        winner: null,
        confidenceLevel: 0,
        isComplete: false,
      };
    });
  }

  async getEmailAnalyticsDashboard(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const totalCampaigns = await prisma.campaign.count({
        where: { tenantId },
      });
      return {
        totalCampaigns,
        sentCount: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      };
    });
  }

  async getMarketingDashboard(tenantId: string) {
    return runWithTenantSession({ tenantId, userId: "system" }, async () => {
      const [totalCampaigns, activeCampaigns, landingPages] = await Promise.all(
        [
          prisma.campaign.count({ where: { tenantId } }),
          prisma.campaign.count({ where: { tenantId, status: "ACTIVE" } }),
          prisma.webToLeadForm.count({ where: { tenantId } }),
        ],
      );
      return { totalCampaigns, activeCampaigns, landingPages };
    });
  }
}
