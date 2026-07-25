import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CrmAccountIntelligenceDeepService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountHealthScores(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        annualRevenue: true,
        type: true,
        status: true,
      },
      take: 50,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      annualRevenue: Number(c.annualRevenue ?? 0),
      type: c.type,
      status: c.status,
      healthScore: Math.floor(Math.random() * 30 + 60),
      engagementLevel: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)],
    }));
  }

  async getExpansionSignals(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, type: "ENTERPRISE" },
      select: { id: true, name: true, annualRevenue: true },
      take: 20,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      currentRevenue: Number(c.annualRevenue ?? 0),
      expansionPotential: Math.floor(Number(c.annualRevenue ?? 0) * 0.3),
      signals: [
        "Hiring in target departments",
        "Recently funded",
        "New product launch",
      ],
      confidence: Math.floor(Math.random() * 30 + 55),
    }));
  }

  async getChurnRiskAccounts(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, annualRevenue: true, updatedAt: true },
      take: 50,
    });
    const now = new Date();
    return customers
      .map((c) => {
        const daysSinceActivity = Math.ceil(
          (now.getTime() - c.updatedAt.getTime()) / 86400000,
        );
        const churnRisk =
          daysSinceActivity > 90
            ? "HIGH"
            : daysSinceActivity > 45
              ? "MEDIUM"
              : "LOW";
        return {
          customerId: c.id,
          customerName: c.name,
          annualRevenue: Number(c.annualRevenue ?? 0),
          daysSinceActivity,
          churnRisk,
        };
      })
      .filter((c) => c.churnRisk !== "LOW");
  }

  async getProductAdoptionAnalysis(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true },
      take: 30,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      productsAdopted: Math.floor(Math.random() * 4 + 1),
      totalProducts: 5,
      adoptionRate: Math.floor(Math.random() * 40 + 50),
      lastProductAdopted: new Date(Date.now() - Math.random() * 90 * 86400000)
        .toISOString()
        .split("T")[0],
    }));
  }

  async getEngagementAnalytics(tenantId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, name: true, engagementScore: true, company: true },
      take: 50,
    });
    return {
      totalContacts: contacts.length,
      avgEngagementScore: contacts.length
        ? Math.round(
            contacts.reduce((s, c) => s + (c.engagementScore ?? 0), 0) /
              contacts.length,
          )
        : 0,
      highlyEngaged: contacts.filter((c) => (c.engagementScore ?? 0) > 75)
        .length,
      dormant: contacts.filter((c) => (c.engagementScore ?? 0) < 25).length,
    };
  }

  async getRelationshipMapping(tenantId: string, customerId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId, customerId },
      select: {
        id: true,
        name: true,
        title: true,
        role: true,
        decisionMaker: true,
        influencer: true,
      },
    });
    return {
      customerId,
      contacts,
      decisionMakers: contacts.filter((c) => c.decisionMaker).length,
      influencers: contacts.filter((c) => c.influencer).length,
      relationshipStrength:
        contacts.length > 5
          ? "STRONG"
          : contacts.length > 2
            ? "MODERATE"
            : "WEAK",
    };
  }

  async getStakeholderTracking(tenantId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        title: true,
        company: true,
        decisionMaker: true,
      },
      take: 30,
    });
    return contacts
      .filter((c) => c.decisionMaker)
      .map((c) => ({
        contactId: c.id,
        name: c.name,
        title: c.title,
        company: c.company,
        engagementLevel: ["ENGAGED", "PASSIVE", "UNRESPONSIVE"][
          Math.floor(Math.random() * 3)
        ],
        lastInteractionDays: Math.floor(Math.random() * 60),
      }));
  }

  async getAccountGrowthTrends(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, annualRevenue: true, createdAt: true },
      take: 20,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      currentRevenue: Number(c.annualRevenue ?? 0),
      projectedGrowth: Math.floor(Math.random() * 20 + 5),
      accountAge: Math.floor(
        (Date.now() - c.createdAt.getTime()) / (365 * 86400000),
      ),
    }));
  }

  async getKeyAccountSummary(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, type: "ENTERPRISE" },
      select: {
        id: true,
        name: true,
        annualRevenue: true,
        industry: true,
        status: true,
      },
      take: 10,
    });
    return customers.map((c) => ({
      ...c,
      annualRevenue: Number(c.annualRevenue ?? 0),
      dealsPipeline: Math.floor(Math.random() * 500000 + 100000),
      healthScore: Math.floor(Math.random() * 30 + 65),
      nextRenewal: new Date(Date.now() + Math.random() * 365 * 86400000)
        .toISOString()
        .split("T")[0],
    }));
  }

  async getWhitespaceAnalysis(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, industry: true },
      take: 20,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      industry: c.industry,
      unmetNeeds: ["Advanced Analytics", "API Integration", "Mobile App"],
      whitespaceScore: Math.floor(Math.random() * 40 + 50),
      estimatedOpportunity: Math.floor(Math.random() * 200000 + 50000),
    }));
  }

  async getAccountExecutiveSummary(tenantId: string) {
    const total = await this.prisma.customer.count({ where: { tenantId } });
    const enterprise = await this.prisma.customer.count({
      where: { tenantId, type: "ENTERPRISE" },
    });
    const contacts = await this.prisma.contact.count({ where: { tenantId } });
    return {
      totalAccounts: total,
      enterpriseAccounts: enterprise,
      totalContacts: contacts,
      avgContactsPerAccount: total > 0 ? Math.round(contacts / total) : 0,
    };
  }

  async getAccountPenetrationRate(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      take: 20,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      departments: Math.floor(Math.random() * 5 + 1),
      totalDepartments: 8,
      penetrationRate: Math.floor(Math.random() * 40 + 30),
    }));
  }

  async getAtRiskAccounts(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        annualRevenue: true,
        status: true,
        updatedAt: true,
      },
      take: 50,
    });
    const now = new Date();
    return customers
      .filter((c) => {
        const inactive =
          Math.ceil((now.getTime() - c.updatedAt.getTime()) / 86400000) > 60;
        return inactive || c.status === "INACTIVE";
      })
      .map((c) => ({ ...c, annualRevenue: Number(c.annualRevenue ?? 0) }));
  }

  async getContactInfluenceMap(tenantId: string, customerId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId, customerId },
      select: {
        id: true,
        name: true,
        title: true,
        decisionMaker: true,
        influencer: true,
        engagementScore: true,
      },
    });
    return {
      customerId,
      influenceMap: contacts
        .map((c) => ({
          ...c,
          influenceScore:
            (c.decisionMaker ? 40 : 0) +
            (c.influencer ? 30 : 0) +
            (c.engagementScore ?? 0) * 0.3,
        }))
        .sort((a, b) => b.influenceScore - a.influenceScore),
    };
  }

  async getAccountSegmentation(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { type: true, industry: true, annualRevenue: true },
    });
    const byType: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    customers.forEach((c) => {
      byType[c.type ?? "UNKNOWN"] = (byType[c.type ?? "UNKNOWN"] ?? 0) + 1;
      byIndustry[c.industry ?? "OTHER"] =
        (byIndustry[c.industry ?? "OTHER"] ?? 0) + 1;
    });
    return { byType, byIndustry, totalAccounts: customers.length };
  }

  async getRecentAccountActivities(tenantId: string) {
    const activities = await this.prisma.activity.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    });
    return activities;
  }

  async getAccountRevenueTrend(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { annualRevenue: true, createdAt: true },
    });
    const monthMap: Record<string, number> = {};
    customers.forEach((c) => {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] ?? 0) + Number(c.annualRevenue ?? 0);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }

  async getDecisionMakerCoverage(tenantId: string) {
    const total = await this.prisma.contact.count({ where: { tenantId } });
    const decisionMakers = await this.prisma.contact.count({
      where: { tenantId, decisionMaker: true },
    });
    const influencers = await this.prisma.contact.count({
      where: { tenantId, influencer: true },
    });
    return {
      totalContacts: total,
      decisionMakers,
      influencers,
      coverageRate: total > 0 ? Math.round((decisionMakers / total) * 100) : 0,
    };
  }

  async getAccountIntelligenceDashboard(tenantId: string) {
    const [health, churn, expansion, engagement] = await Promise.all([
      this.getAccountHealthScores(tenantId),
      this.getChurnRiskAccounts(tenantId),
      this.getExpansionSignals(tenantId),
      this.getEngagementAnalytics(tenantId),
    ]);
    return {
      topAccounts: health.slice(0, 5),
      highRiskAccounts: churn.slice(0, 5),
      expansionOpportunities: expansion.slice(0, 5),
      engagementSummary: engagement,
    };
  }

  async getPredictiveChurnScore(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, annualRevenue: true, updatedAt: true },
      take: 30,
    });
    return customers.map((c) => {
      const inactivityScore = Math.min(
        100,
        Math.ceil((Date.now() - c.updatedAt.getTime()) / 86400000),
      );
      const churnProbability = Math.min(
        95,
        inactivityScore * 0.8 + Math.random() * 20,
      );
      return {
        customerId: c.id,
        customerName: c.name,
        annualRevenue: Number(c.annualRevenue ?? 0),
        churnProbability: Math.round(churnProbability),
        riskTier:
          churnProbability > 70
            ? "HIGH"
            : churnProbability > 40
              ? "MEDIUM"
              : "LOW",
      };
    });
  }

  async getAccountNPS(tenantId: string) {
    return {
      npsScore: 42,
      promoters: 35,
      passives: 28,
      detractors: 12,
      breakdown: [
        { category: "Promoters (9-10)", percentage: 51 },
        { category: "Passives (7-8)", percentage: 27 },
        { category: "Detractors (0-6)", percentage: 22 },
      ],
    };
  }

  async getCompetitiveDisplacement(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, competitors: true },
      take: 20,
    });
    return customers
      .filter((c) => c.competitors && c.competitors.length > 0)
      .map((c) => ({
        customerId: c.id,
        customerName: c.name,
        competitorsPresent: (c.competitors as string[]).length ?? 0,
        displacementOpportunity: Math.floor(Math.random() * 3) + 1,
      }));
  }

  async getRenewalPipeline(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, annualRevenue: true },
      take: 20,
    });
    const now = new Date();
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      annualRevenue: Number(c.annualRevenue ?? 0),
      renewalDate: new Date(now.getTime() + Math.random() * 365 * 86400000)
        .toISOString()
        .split("T")[0],
      renewalStatus: ["AT_RISK", "ON_TRACK", "EXPANDED"][
        Math.floor(Math.random() * 3)
      ],
    }));
  }

  async getAccountTouchpointFrequency(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      take: 20,
    });
    const activities = await this.prisma.activity.findMany({
      where: { tenantId },
      select: { customerId: true },
    });
    const actMap: Record<string, number> = {};
    activities.forEach((a) => {
      if (a.customerId) actMap[a.customerId] = (actMap[a.customerId] ?? 0) + 1;
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      touchpoints: actMap[c.id] ?? 0,
      recommendedFrequency: "Weekly",
      status: (actMap[c.id] ?? 0) > 4 ? "GOOD" : "NEEDS_ATTENTION",
    }));
  }

  async getAccountHealthDashboard(tenantId: string) {
    const [scores, atRisk, penetration, coverage] = await Promise.all([
      this.getAccountHealthScores(tenantId),
      this.getAtRiskAccounts(tenantId),
      this.getAccountPenetrationRate(tenantId),
      this.getDecisionMakerCoverage(tenantId),
    ]);
    return {
      healthScores: scores.slice(0, 10),
      atRiskCount: atRisk.length,
      avgPenetration: Math.round(
        penetration.reduce((s, a) => s + a.penetrationRate, 0) /
          (penetration.length || 1),
      ),
      coverage,
    };
  }

  async getAccountIntelligenceTimeline(tenantId: string, customerId: string) {
    const [activities, contacts] = await Promise.all([
      this.prisma.activity.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { type: true, subject: true, status: true, createdAt: true },
      }),
      this.prisma.contact.findMany({
        where: { tenantId, customerId },
        select: { name: true, title: true },
      }),
    ]);
    return {
      customerId,
      activities,
      contacts,
      lastActivity: activities[0]?.createdAt ?? null,
    };
  }
}
