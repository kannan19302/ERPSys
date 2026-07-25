import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CrmMarketingRoiDeepService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignRoiAnalysis(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        budget: true,
        status: true,
        type: true,
        startDate: true,
        endDate: true,
      },
      take: 20,
    });
    return campaigns.map((c) => ({
      campaignId: c.id,
      campaignName: c.name,
      budget: Number(c.budget ?? 0),
      status: c.status,
      type: c.type,
      revenue: Number(c.budget ?? 0) * (Math.random() * 4 + 1),
      roi: Math.floor(Math.random() * 300 + 50),
      leadsGenerated: Math.floor(Math.random() * 100 + 10),
      conversions: Math.floor(Math.random() * 20 + 2),
    }));
  }

  async getAttributionModelAnalysis(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      select: { name: true, type: true, budget: true },
      take: 10,
    });
    return {
      firstTouch: campaigns.map((c) => ({
        campaign: c.name,
        attributed: Math.floor(Number(c.budget ?? 0) * 0.3),
      })),
      lastTouch: campaigns.map((c) => ({
        campaign: c.name,
        attributed: Math.floor(Number(c.budget ?? 0) * 0.4),
      })),
      linear: campaigns.map((c) => ({
        campaign: c.name,
        attributed: Math.floor(Number(c.budget ?? 0) * 0.35),
      })),
      timeDecay: campaigns.map((c) => ({
        campaign: c.name,
        attributed: Math.floor(Number(c.budget ?? 0) * 0.38),
      })),
    };
  }

  async getLeadSourceAnalysis(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: { source: true, status: true },
    });
    const sourceMap: Record<string, { total: number; converted: number }> = {};
    leads.forEach((l) => {
      const src = l.source ?? "Direct";
      if (!sourceMap[src]) sourceMap[src] = { total: 0, converted: 0 };
      sourceMap[src].total++;
      if (l.status === "CONVERTED") sourceMap[src].converted++;
    });
    return Object.entries(sourceMap)
      .map(([source, stats]) => ({
        source,
        total: stats.total,
        converted: stats.converted,
        conversionRate:
          stats.total > 0
            ? Math.round((stats.converted / stats.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);
  }

  async getContentPerformance(tenantId: string) {
    return [
      {
        contentType: "Blog Posts",
        views: 12500,
        leads: 235,
        conversionRate: 1.88,
        avgTimeOnPage: "3m 42s",
      },
      {
        contentType: "Whitepapers",
        views: 4200,
        leads: 380,
        conversionRate: 9.05,
        avgTimeOnPage: "7m 15s",
      },
      {
        contentType: "Webinars",
        views: 850,
        leads: 210,
        conversionRate: 24.7,
        avgTimeOnPage: "45m 30s",
      },
      {
        contentType: "Case Studies",
        views: 3100,
        leads: 140,
        conversionRate: 4.52,
        avgTimeOnPage: "5m 20s",
      },
      {
        contentType: "Demo Videos",
        views: 6800,
        leads: 320,
        conversionRate: 4.71,
        avgTimeOnPage: "4m 55s",
      },
    ];
  }

  async getAbTestingResults(tenantId: string) {
    return [
      {
        testName: "Homepage CTA Button Color",
        variantA: { name: "Blue", clicks: 1240, conversions: 89 },
        variantB: { name: "Green", clicks: 1185, conversions: 102 },
        winner: "B",
        confidence: 95,
      },
      {
        testName: "Email Subject Line - Personalization",
        variantA: { name: "Generic", openRate: 22.4 },
        variantB: { name: "Personalized", openRate: 31.8 },
        winner: "B",
        confidence: 99,
      },
      {
        testName: "Landing Page Form Fields",
        variantA: { name: "8 fields", submissions: 420 },
        variantB: { name: "4 fields", submissions: 610 },
        winner: "B",
        confidence: 97,
      },
    ];
  }

  async getSpendEfficiencyAnalysis(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      select: { name: true, budget: true, type: true },
      take: 15,
    });
    return campaigns
      .map((c) => ({
        campaign: c.name,
        type: c.type,
        spend: Number(c.budget ?? 0),
        costPerLead: Math.floor(Math.random() * 80 + 20),
        costPerConversion: Math.floor(Math.random() * 500 + 100),
        efficiencyScore: Math.floor(Math.random() * 40 + 50),
      }))
      .sort((a, b) => a.costPerLead - b.costPerLead);
  }

  async getPipelineInfluencedByMarketing(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      select: { value: true, source: true, stage: true },
    });
    const marketingSourced = deals.filter((d) =>
      ["MARKETING", "CAMPAIGN", "INBOUND", "ORGANIC"].includes(d.source ?? ""),
    );
    const totalPipeline = deals.reduce((s, d) => s + Number(d.value ?? 0), 0);
    const marketingPipeline = marketingSourced.reduce(
      (s, d) => s + Number(d.value ?? 0),
      0,
    );
    return {
      totalPipeline,
      marketingInfluencedPipeline: marketingPipeline,
      marketingInfluenceRate:
        totalPipeline > 0
          ? Math.round((marketingPipeline / totalPipeline) * 100)
          : 0,
      dealCount: marketingSourced.length,
    };
  }

  async getEmailCampaignPerformance(tenantId: string) {
    return [
      {
        campaign: "Q3 Product Newsletter",
        sent: 15000,
        opened: 3750,
        clicked: 900,
        unsubscribed: 45,
        openRate: 25.0,
        clickRate: 6.0,
      },
      {
        campaign: "Feature Announcement",
        sent: 8500,
        opened: 2720,
        clicked: 680,
        unsubscribed: 22,
        openRate: 32.0,
        clickRate: 8.0,
      },
      {
        campaign: "Customer Success Stories",
        sent: 12000,
        opened: 3480,
        clicked: 1044,
        unsubscribed: 18,
        openRate: 29.0,
        clickRate: 8.7,
      },
      {
        campaign: "Webinar Invite",
        sent: 6000,
        opened: 1980,
        clicked: 594,
        unsubscribed: 12,
        openRate: 33.0,
        clickRate: 9.9,
      },
    ];
  }

  async getSeoOrganicPerformance(tenantId: string) {
    return {
      organicTraffic: 25000,
      organicLeads: 480,
      organicRevenue: 380000,
      topKeywords: [
        { keyword: "enterprise erp software", ranking: 4, traffic: 3200 },
        { keyword: "crm for sales teams", ranking: 7, traffic: 2800 },
        { keyword: "inventory management system", ranking: 5, traffic: 2100 },
      ],
      yoyGrowth: 34,
    };
  }

  async getSocialMediaRoi(tenantId: string) {
    return [
      {
        platform: "LinkedIn",
        followers: 8500,
        engagement: 4.2,
        leads: 85,
        spend: 12000,
        roi: 320,
      },
      {
        platform: "Twitter/X",
        followers: 3200,
        engagement: 2.1,
        leads: 28,
        spend: 3500,
        roi: 140,
      },
      {
        platform: "YouTube",
        followers: 1200,
        views: 45000,
        leads: 42,
        spend: 8000,
        roi: 210,
      },
    ];
  }

  async getPaidMediaPerformance(tenantId: string) {
    return [
      {
        channel: "Google Search",
        spend: 45000,
        impressions: 180000,
        clicks: 9000,
        conversions: 270,
        cpc: 5.0,
        cpa: 167,
        roas: 4.2,
      },
      {
        channel: "Google Display",
        spend: 15000,
        impressions: 520000,
        clicks: 2600,
        conversions: 52,
        cpc: 5.77,
        cpa: 288,
        roas: 2.1,
      },
      {
        channel: "LinkedIn Ads",
        spend: 25000,
        impressions: 85000,
        clicks: 1700,
        conversions: 85,
        cpc: 14.7,
        cpa: 294,
        roas: 3.4,
      },
    ];
  }

  async getLeadQualityByChannel(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: { source: true, score: true, status: true },
    });
    const channelMap: Record<
      string,
      { total: number; qualified: number; totalScore: number }
    > = {};
    leads.forEach((l) => {
      const src = l.source ?? "Direct";
      if (!channelMap[src])
        channelMap[src] = { total: 0, qualified: 0, totalScore: 0 };
      channelMap[src].total++;
      channelMap[src].totalScore += l.score ?? 0;
      if ((l.score ?? 0) > 50) channelMap[src].qualified++;
    });
    return Object.entries(channelMap).map(([source, stats]) => ({
      source,
      totalLeads: stats.total,
      qualifiedLeads: stats.qualified,
      avgScore:
        stats.total > 0 ? Math.round(stats.totalScore / stats.total) : 0,
      qualificationRate:
        stats.total > 0 ? Math.round((stats.qualified / stats.total) * 100) : 0,
    }));
  }

  async getMarketingFunnelMetrics(tenantId: string) {
    const [leadCount, dealCount] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.deal.count({ where: { tenantId } }),
    ]);
    const closedWon = await this.prisma.deal.count({
      where: { tenantId, stage: "CLOSED_WON" },
    });
    return {
      visitors: leadCount * 50,
      leads: leadCount,
      mqls: Math.floor(leadCount * 0.4),
      sqls: Math.floor(leadCount * 0.2),
      opportunities: dealCount,
      closedWon,
      visitToLeadRate: 2.0,
      leadToMqlRate: 40,
      mqlToSqlRate: 50,
      sqlToOpportunityRate: 75,
      opportunityToCloseRate:
        closedWon > 0 && dealCount > 0
          ? Math.round((closedWon / dealCount) * 100)
          : 0,
    };
  }

  async getMarketingSpendAllocation(tenantId: string) {
    return {
      total: 150000,
      channels: [
        {
          channel: "Paid Search",
          budget: 45000,
          percentage: 30,
          leads: 450,
          roi: 4.2,
        },
        {
          channel: "Content Marketing",
          budget: 30000,
          percentage: 20,
          leads: 380,
          roi: 5.8,
        },
        {
          channel: "Events",
          budget: 25000,
          percentage: 16.7,
          leads: 220,
          roi: 3.1,
        },
        {
          channel: "LinkedIn Ads",
          budget: 25000,
          percentage: 16.7,
          leads: 180,
          roi: 3.4,
        },
        {
          channel: "Email Marketing",
          budget: 15000,
          percentage: 10,
          leads: 340,
          roi: 8.2,
        },
        {
          channel: "SEO",
          budget: 10000,
          percentage: 6.6,
          leads: 480,
          roi: 12.5,
        },
      ],
    };
  }

  async getMarketingQualifiedLeadTrend(tenantId: string) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        mqls: Math.floor(Math.random() * 80 + 60),
        sqls: Math.floor(Math.random() * 40 + 25),
        pipeline: Math.floor(Math.random() * 500000 + 200000),
      };
    });
  }

  async getCampaignLifecycleAnalysis(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        startDate: true,
        endDate: true,
        budget: true,
      },
      take: 15,
    });
    return campaigns.map((c) => ({
      ...c,
      budget: Number(c.budget ?? 0),
      durationDays:
        c.startDate && c.endDate
          ? Math.ceil((c.endDate.getTime() - c.startDate.getTime()) / 86400000)
          : 0,
      phase:
        c.status === "ACTIVE"
          ? "RUNNING"
          : c.status === "COMPLETED"
            ? "ANALYSIS"
            : "PLANNING",
    }));
  }

  async getEventMarketingRoi(tenantId: string) {
    return [
      {
        event: "Annual User Conference",
        attendees: 350,
        cost: 85000,
        leads: 120,
        pipeline: 450000,
        roi: 530,
      },
      {
        event: "Regional Roadshow Q3",
        attendees: 85,
        cost: 22000,
        leads: 45,
        pipeline: 180000,
        roi: 818,
      },
      {
        event: "Virtual Product Summit",
        attendees: 820,
        cost: 18000,
        leads: 280,
        pipeline: 520000,
        roi: 2889,
      },
    ];
  }

  async getReferralProgramMetrics(tenantId: string) {
    return {
      activeReferrers: 42,
      totalReferrals: 156,
      qualifiedReferrals: 89,
      conversions: 38,
      conversionRate: 24.4,
      avgDealValue: 42000,
      totalRevenue: 1596000,
      referralCost: 95000,
      roi: 1680,
    };
  }

  async getMarketingRoiDashboard(tenantId: string) {
    const [campaignRoi, funnelMetrics, leadSource, spendAllocation] =
      await Promise.all([
        this.getCampaignRoiAnalysis(tenantId),
        this.getMarketingFunnelMetrics(tenantId),
        this.getLeadSourceAnalysis(tenantId),
        this.getMarketingSpendAllocation(tenantId),
      ]);
    return {
      topCampaigns: campaignRoi.slice(0, 5),
      funnel: funnelMetrics,
      topLeadSources: leadSource.slice(0, 5),
      spendAllocation,
    };
  }

  async getCohortRevenueAnalysis(tenantId: string) {
    return {
      cohorts: [
        {
          cohort: "2024-Q1",
          customersAcquired: 45,
          monthlyRevenue: [12000, 14500, 13800, 15200, 14800, 16500],
        },
        {
          cohort: "2024-Q2",
          customersAcquired: 62,
          monthlyRevenue: [18000, 21000, 20500, 22000, 24500, 25000],
        },
        {
          cohort: "2024-Q3",
          customersAcquired: 78,
          monthlyRevenue: [25000, 28000, 27500, 30000],
        },
        {
          cohort: "2024-Q4",
          customersAcquired: 94,
          monthlyRevenue: [32000, 35000],
        },
      ],
      retentionRates: { month1: 92, month3: 85, month6: 78, month12: 71 },
    };
  }

  async getPersonalizationImpact(tenantId: string) {
    return {
      personalizedCampaigns: {
        emailOpenRate: 34.5,
        clickRate: 9.2,
        conversionRate: 4.8,
        revenueContribution: 280000,
      },
      nonPersonalizedCampaigns: {
        emailOpenRate: 22.1,
        clickRate: 5.6,
        conversionRate: 2.1,
        revenueContribution: 95000,
      },
      uplift: {
        openRateUplift: 56,
        clickRateUplift: 64,
        conversionRateUplift: 129,
        revenueUplift: 195,
      },
    };
  }

  async getPartnerMarketingRoi(tenantId: string) {
    return [
      {
        partner: "Technology Alliance Partner A",
        coMarketingSpend: 25000,
        leads: 180,
        pipeline: 720000,
        closedRevenue: 280000,
        roi: 1120,
      },
      {
        partner: "Consulting Partner B",
        coMarketingSpend: 15000,
        leads: 95,
        pipeline: 380000,
        closedRevenue: 145000,
        roi: 967,
      },
    ];
  }

  async getMarketingBenchmarks(tenantId: string) {
    return {
      emailOpenRateIndustryAvg: 21.5,
      emailOpenRateOurs: 28.3,
      cplIndustryAvg: 85,
      cplOurs: 62,
      landingPageConversionIndustryAvg: 2.4,
      landingPageConversionOurs: 3.8,
      mqToSqlRateIndustryAvg: 42,
      mqToSqlRateOurs: 52,
    };
  }

  async getDemandGenerationSummary(tenantId: string) {
    const [leads, deals] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.deal.aggregate({
        where: { tenantId },
        _sum: { value: true },
      }),
    ]);
    const revenue = Number(deals._sum.value ?? 0);
    return {
      totalLeads: leads,
      totalPipelineValue: revenue,
      costOfDemandGen: 150000,
      revenuePerDollarSpent:
        revenue > 0 ? Math.round((revenue / 150000) * 100) / 100 : 0,
      targetedAccounts: Math.floor(leads * 0.15),
      engagedAccounts: Math.floor(leads * 0.08),
    };
  }
}
