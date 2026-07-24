import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class CrmExpansionV1Service {
  // ═══ 1. SALES PLAYBOOKS & DEAL GUIDANCE ═══

  async getPlaybooks(tenantId: string) {
    return prisma.crmSalesPlaybook.findMany({
      where: { tenantId, isActive: true },
      include: {
        stages: { include: { actions: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlaybook(tenantId: string, dto: any) {
    return prisma.crmSalesPlaybook.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        methodology: dto.methodology || "MEDDPICC",
        description: dto.description || null,
        version: dto.version || 1,
        stages: {
          create: (dto.stages || []).map((s: any, idx: number) => ({
            tenantId,
            stageName: s.stageName,
            sortOrder: s.sortOrder ?? idx,
            requiredFields: s.requiredFields || [],
            exitCriteria: s.exitCriteria || [],
            guidance: s.guidance || null,
            actions: {
              create: (s.actions || []).map((a: any, aIdx: number) => ({
                tenantId,
                actionName: a.actionName,
                actionType: a.actionType || "TASK",
                isMandatory: a.isMandatory || false,
                sortOrder: a.sortOrder ?? aIdx,
                templateId: a.templateId || null,
              })),
            },
          })),
        },
      } as any,
      include: { stages: { include: { actions: true } } },
    });
  }

  async getDealGuidance(tenantId: string, dealId: string) {
    let guidance = await prisma.crmDealGuidance.findFirst({
      where: { tenantId, dealId },
    });
    if (!guidance) {
      guidance = await prisma.crmDealGuidance.create({
        data: {
          tenantId,
          dealId,
          healthScore: 75,
          riskFactors: ["Competitor feature gap", "Budget sign-off pending"],
          nextBestAction: "Schedule executive sponsor alignment call",
          winProbability: new Prisma.Decimal(0.65),
          aiSummary:
            "Deal progressing steadily. Primary risk is economic buyer sign-off timeline.",
        } as any,
      });
    }
    return guidance;
  }

  async getCompetitorBattlecards(tenantId: string) {
    return prisma.crmCompetitorBattlecard.findMany({
      where: { tenantId, isActive: true },
      include: { objections: true },
      orderBy: { competitorName: "asc" },
    });
  }

  async createCompetitorBattlecard(tenantId: string, dto: any) {
    return prisma.crmCompetitorBattlecard.create({
      data: {
        tenantId,
        competitorName: dto.competitorName,
        category: dto.category || null,
        strengths: dto.strengths || [],
        weaknesses: dto.weaknesses || [],
        landmines: dto.landmines || [],
        pricingInfo: dto.pricingInfo || null,
        keyDifferentiators: dto.keyDifferentiators || null,
        objections: {
          create: (dto.objections || []).map((o: any) => ({
            tenantId,
            objection: o.objection,
            category: o.category || null,
            suggestedResponse: o.suggestedResponse,
            successRate: o.successRate
              ? new Prisma.Decimal(o.successRate)
              : new Prisma.Decimal(0.8),
            tags: o.tags || [],
          })),
        },
      } as any,
      include: { objections: true },
    });
  }

  // ═══ 2. OMNICHANNEL CAMPAIGNS & MARKETING ═══

  async getOmnichannelCampaigns(tenantId: string) {
    return prisma.crmOmnichannelCampaign.findMany({
      where: { tenantId },
      include: { nodes: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createOmnichannelCampaign(tenantId: string, dto: any) {
    return prisma.crmOmnichannelCampaign.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        campaignType: dto.campaignType || "EMAIL",
        status: dto.status || "DRAFT",
        budget: dto.budget
          ? new Prisma.Decimal(dto.budget)
          : new Prisma.Decimal(0),
        spend: dto.spend
          ? new Prisma.Decimal(dto.spend)
          : new Prisma.Decimal(0),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        targetAudience: dto.targetAudience || {},
        nodes: {
          create: (dto.nodes || []).map((n: any, idx: number) => ({
            tenantId,
            nodeType: n.nodeType || "ACTION",
            name: n.name,
            config: n.config || {},
            sortOrder: n.sortOrder ?? idx,
          })),
        },
      } as any,
      include: { nodes: true },
    });
  }

  async getAttributionSummary(tenantId: string, dealId?: string) {
    const where: any = { tenantId };
    if (dealId) where.dealId = dealId;
    return prisma.crmAttributionModel.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getMarketingAssets(tenantId: string) {
    return prisma.crmMarketingAsset.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createMarketingAsset(tenantId: string, dto: any) {
    return prisma.crmMarketingAsset.create({
      data: {
        tenantId,
        title: dto.title,
        assetType: dto.assetType || "EBOOK",
        fileUrl: dto.fileUrl || null,
        downloadCount: dto.downloadCount || 0,
        leadGenCount: dto.leadGenCount || 0,
      } as any,
    });
  }

  async getEventWebinars(tenantId: string) {
    return prisma.crmEventWebinar.findMany({
      where: { tenantId },
      orderBy: { eventDate: "desc" },
    });
  }

  async createEventWebinar(tenantId: string, dto: any) {
    return prisma.crmEventWebinar.create({
      data: {
        tenantId,
        title: dto.title,
        eventDate: new Date(dto.eventDate || Date.now()),
        durationMins: dto.durationMins || 60,
        platform: dto.platform || "ZOOM",
        joinUrl: dto.joinUrl || null,
        registrantCount: dto.registrantCount || 0,
        attendeeCount: dto.attendeeCount || 0,
        recordingUrl: dto.recordingUrl || null,
      } as any,
    });
  }

  // ═══ 3. ACCOUNT-BASED MARKETING (ABM) & INTENT SIGNALS ═══

  async getAbmAccountGroups(tenantId: string) {
    return prisma.crmAbmAccountGroup.findMany({
      where: { tenantId },
      orderBy: { tier: "asc" },
    });
  }

  async createAbmAccountGroup(tenantId: string, dto: any) {
    return prisma.crmAbmAccountGroup.create({
      data: {
        tenantId,
        name: dto.name,
        tier: dto.tier || "TIER_1",
        targetRevenue: dto.targetRevenue
          ? new Prisma.Decimal(dto.targetRevenue)
          : new Prisma.Decimal(0),
        dedicatedRepId: dto.dedicatedRepId || null,
        description: dto.description || null,
      } as any,
    });
  }

  async getIntentSignals(tenantId: string, customerId?: string) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    return prisma.crmIntentSignal.findMany({
      where,
      orderBy: { signalDate: "desc" },
    });
  }

  async logIntentSignal(tenantId: string, dto: any) {
    return prisma.crmIntentSignal.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        source: dto.source || "G2",
        topic: dto.topic,
        score: dto.score || 50,
        signalDate: dto.signalDate ? new Date(dto.signalDate) : new Date(),
        rawMetadata: dto.rawMetadata || {},
      } as any,
    });
  }

  async getBuyingCommitteeMembers(tenantId: string, customerId: string) {
    return prisma.crmBuyingCommitteeMember.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: "asc" },
    });
  }

  async addBuyingCommitteeMember(tenantId: string, dto: any) {
    return prisma.crmBuyingCommitteeMember.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        contactId: dto.contactId,
        role: dto.role || "DECISION_MAKER",
        influenceLevel: dto.influenceLevel || "HIGH",
        sentiment: dto.sentiment || "POSITIVE",
      } as any,
    });
  }

  // ═══ 4. CUSTOMER SUCCESS & HEALTH SCORES ═══

  async getAccountHealthRecord(tenantId: string, customerId: string) {
    let record = await prisma.crmAccountHealthRecord.findFirst({
      where: { tenantId, customerId },
      orderBy: { evaluatedAt: "desc" },
    });
    if (!record) {
      record = await prisma.crmAccountHealthRecord.create({
        data: {
          tenantId,
          customerId,
          overallHealth: "HEALTHY",
          usageScore: 88,
          supportScore: 92,
          npsScore: 90,
          paymentScore: 100,
          churnProbability: new Prisma.Decimal(0.02),
        } as any,
      });
    }
    return record;
  }

  async getRenewalPipelines(tenantId: string) {
    return prisma.crmRenewalPipeline.findMany({
      where: { tenantId },
      orderBy: { renewalDate: "asc" },
    });
  }

  async createRenewalPipeline(tenantId: string, dto: any) {
    return prisma.crmRenewalPipeline.create({
      data: {
        tenantId,
        contractId: dto.contractId || null,
        customerId: dto.customerId,
        renewalDate: new Date(dto.renewalDate),
        arrAmount: dto.arrAmount
          ? new Prisma.Decimal(dto.arrAmount)
          : new Prisma.Decimal(0),
        expansionAmount: dto.expansionAmount
          ? new Prisma.Decimal(dto.expansionAmount)
          : new Prisma.Decimal(0),
        stage: dto.stage || "UPCOMING",
        ownerId: dto.ownerId || null,
        riskReason: dto.riskReason || null,
      } as any,
    });
  }

  async getFeedbackSurveys(tenantId: string) {
    return prisma.crmCustomerFeedbackSurvey.findMany({
      where: { tenantId },
      include: { responses: { orderBy: { submittedAt: "desc" }, take: 20 } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createFeedbackSurvey(tenantId: string, dto: any) {
    return prisma.crmCustomerFeedbackSurvey.create({
      data: {
        tenantId,
        title: dto.title,
        surveyType: dto.surveyType || "NPS",
        questions: dto.questions || [],
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      } as any,
    });
  }

  // ═══ 5. FIELD SALES & ROUTE PLANNING ═══

  async getFieldVisitSchedules(tenantId: string, repId?: string) {
    const where: any = { tenantId };
    if (repId) where.repId = repId;
    return prisma.crmFieldVisitSchedule.findMany({
      where,
      orderBy: { scheduledDate: "asc" },
    });
  }

  async createFieldVisitSchedule(tenantId: string, dto: any) {
    return prisma.crmFieldVisitSchedule.create({
      data: {
        tenantId,
        repId: dto.repId,
        customerId: dto.customerId,
        scheduledDate: new Date(dto.scheduledDate),
        purpose: dto.purpose,
        status: dto.status || "PLANNED",
        notes: dto.notes || null,
      } as any,
    });
  }

  async getSalesRoutePlans(tenantId: string, repId?: string) {
    const where: any = { tenantId };
    if (repId) where.repId = repId;
    return prisma.crmSalesRoutePlan.findMany({
      where,
      orderBy: { planDate: "asc" },
    });
  }

  async createSalesRoutePlan(tenantId: string, dto: any) {
    return prisma.crmSalesRoutePlan.create({
      data: {
        tenantId,
        repId: dto.repId,
        planDate: new Date(dto.planDate),
        stops: dto.stops || [],
        totalDistanceKm: dto.totalDistanceKm
          ? new Prisma.Decimal(dto.totalDistanceKm)
          : new Prisma.Decimal(0),
        estimatedDurationMins: dto.estimatedDurationMins || 0,
        status: dto.status || "DRAFT",
      } as any,
    });
  }

  // ═══ 6. PRM & CHANNEL PARTNER CERTIFICATIONS ═══

  async getPartnerTierBenefits(tenantId: string) {
    return prisma.crmPartnerTierBenefit.findMany({
      where: { tenantId },
      orderBy: { mdfBudget: "desc" },
    });
  }

  async createPartnerTierBenefit(tenantId: string, dto: any) {
    return prisma.crmPartnerTierBenefit.create({
      data: {
        tenantId,
        tierName: dto.tierName,
        mdfBudget: dto.mdfBudget
          ? new Prisma.Decimal(dto.mdfBudget)
          : new Prisma.Decimal(0),
        commissionRate: dto.commissionRate
          ? new Prisma.Decimal(dto.commissionRate)
          : new Prisma.Decimal(0.1),
        discountPercentage: dto.discountPercentage
          ? new Prisma.Decimal(dto.discountPercentage)
          : new Prisma.Decimal(15),
        requiredCertifications: dto.requiredCertifications || 1,
        perks: dto.perks || [],
      } as any,
    });
  }

  async getPartnerCertifications(tenantId: string, partnerId?: string) {
    const where: any = { tenantId };
    if (partnerId) where.partnerId = partnerId;
    return prisma.crmPartnerCertification.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });
  }

  async addPartnerCertification(tenantId: string, dto: any) {
    return prisma.crmPartnerCertification.create({
      data: {
        tenantId,
        partnerId: dto.partnerId,
        contactId: dto.contactId || null,
        certificationName: dto.certificationName,
        issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : new Date(),
        expiryDate: new Date(dto.expiryDate),
        status: dto.status || "ACTIVE",
        credentialUrl: dto.credentialUrl || null,
      } as any,
    });
  }
}
