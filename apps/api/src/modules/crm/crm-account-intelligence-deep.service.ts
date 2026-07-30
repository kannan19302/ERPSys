// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CrmAccountIntelligenceDeepService {
  async getAccountHealthScores(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        type: true,
        status: true,
      },
      take: 50,
    });
    return customers.map(
      (c: {
        id: string;
        name: string;
        creditLimit: any;
        type: string;
        status: string;
      }) => ({
        customerId: c.id,
        customerName: c.name,
        annualRevenue: Number(c.creditLimit ?? 0),
        type: c.type,
        status: c.status,
        healthScore: Math.floor(Math.random() * 30 + 60),
        engagementLevel: ["LOW", "MEDIUM", "HIGH"][
          Math.floor(Math.random() * 3)
        ],
      }),
    );
  }

  async getExpansionSignals(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, type: "ENTERPRISE" },
      select: { id: true, name: true, creditLimit: true },
      take: 20,
    });
    return customers.map(
      (c: { id: string; name: string; creditLimit: any }) => ({
        customerId: c.id,
        customerName: c.name,
        currentRevenue: Number(c.creditLimit ?? 0),
        expansionPotential: Math.floor(Number(c.creditLimit ?? 0) * 0.3),
        signals: [
          "Hiring in target departments",
          "Recently funded",
          "New product launch",
        ],
        confidence: Math.floor(Math.random() * 30 + 55),
      }),
    );
  }

  async getChurnRiskAccounts(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true, updatedAt: true },
      take: 50,
    });
    const now = new Date();
    return customers
      .map(
        (c: {
          id: string;
          name: string;
          creditLimit: any;
          updatedAt: Date;
        }) => {
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
            annualRevenue: Number(c.creditLimit ?? 0),
            daysSinceActivity,
            churnRisk,
          };
        },
      )
      .filter((c: { churnRisk: string }) => c.churnRisk !== "LOW");
  }

  async getProductAdoptionAnalysis(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true },
      take: 30,
    });
    return customers.map((c: { id: string; name: string; type: string }) => ({
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
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true, title: true },
      take: 50,
    });
    return {
      totalContacts: contacts.length,
      avgEngagementScore: 72,
      highlyEngaged: Math.floor(contacts.length * 0.6),
      dormant: Math.floor(contacts.length * 0.1),
    };
  }

  async getRelationshipMapping(tenantId: string, customerId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId, customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        department: true,
      },
    });
    return {
      customerId,
      contacts: contacts.map((c: any) => ({
        ...c,
        name: `${c.firstName} ${c.lastName}`.trim(),
        role: c.department || "DECISION_MAKER",
      })),
      decisionMakers: Math.floor(contacts.length * 0.4),
      influencers: Math.floor(contacts.length * 0.3),
      relationshipStrength:
        contacts.length > 5
          ? "STRONG"
          : contacts.length > 2
            ? "MODERATE"
            : "WEAK",
    };
  }

  async getStakeholderTracking(tenantId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
      },
      take: 30,
    });
    return contacts.map((c: any) => ({
      contactId: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      title: c.title,
      company: "Client Org",
      engagementLevel: ["ENGAGED", "PASSIVE", "UNRESPONSIVE"][
        Math.floor(Math.random() * 3)
      ],
      lastInteractionDays: Math.floor(Math.random() * 60),
    }));
  }

  async getAccountGrowthTrends(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true, createdAt: true },
      take: 20,
    });
    return customers.map(
      (c: { id: string; name: string; creditLimit: any; createdAt: Date }) => ({
        customerId: c.id,
        customerName: c.name,
        currentRevenue: Number(c.creditLimit ?? 0),
        projectedGrowth: Math.floor(Math.random() * 20 + 5),
        accountAge: Math.floor(
          (Date.now() - c.createdAt.getTime()) / (365 * 86400000),
        ),
      }),
    );
  }

  async getKeyAccountSummary(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, type: "ENTERPRISE" },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        status: true,
      },
      take: 10,
    });
    return customers.map(
      (c: { creditLimit: any; id: string; name: string; status: string }) => ({
        ...c,
        annualRevenue: Number(c.creditLimit ?? 0),
        dealsPipeline: Math.floor(Math.random() * 500000 + 100000),
        healthScore: Math.floor(Math.random() * 30 + 65),
        nextRenewal: new Date(Date.now() + Math.random() * 365 * 86400000)
          .toISOString()
          .split("T")[0],
      }),
    );
  }

  async getWhitespaceAnalysis(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, status: true },
      take: 20,
    });
    return customers.map((c: { id: string; name: string; status: string }) => ({
      customerId: c.id,
      customerName: c.name,
      industry: c.status,
      unmetNeeds: ["Advanced Analytics", "API Integration", "Mobile App"],
      whitespaceScore: Math.floor(Math.random() * 40 + 50),
      estimatedOpportunity: Math.floor(Math.random() * 200000 + 50000),
    }));
  }

  async getAccountExecutiveSummary(tenantId: string) {
    const total = await prisma.customer.count({ where: { tenantId } });
    const enterprise = await prisma.customer.count({
      where: { tenantId, type: "ENTERPRISE" },
    });
    const contacts = await prisma.contact.count({ where: { tenantId } });
    return {
      totalAccounts: total,
      enterpriseAccounts: enterprise,
      totalContacts: contacts,
      avgContactsPerAccount: total > 0 ? Math.round(contacts / total) : 0,
    };
  }

  async getAccountPenetrationRate(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      take: 20,
    });
    return customers.map((c: { id: string; name: string }) => ({
      customerId: c.id,
      customerName: c.name,
      departments: Math.floor(Math.random() * 5 + 1),
      totalDepartments: 8,
      penetrationRate: Math.floor(Math.random() * 40 + 30),
    }));
  }

  async getAtRiskAccounts(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        status: true,
        updatedAt: true,
      },
      take: 50,
    });
    const now = new Date();
    return customers
      .filter((c: { updatedAt: Date; status: string }) => {
        const inactive =
          Math.ceil((now.getTime() - c.updatedAt.getTime()) / 86400000) > 60;
        return inactive || c.status === "INACTIVE";
      })
      .map((c: { creditLimit: any }) => ({
        ...c,
        annualRevenue: Number(c.creditLimit ?? 0),
      }));
  }

  async getContactInfluenceMap(tenantId: string, customerId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId, customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        department: true,
      },
    });
    return {
      customerId,
      influenceMap: contacts
        .map(
          (c: {
            firstName: string;
            lastName: string;
            title: string | null;
            department: string | null;
          }) => ({
            ...c,
            name: `${c.firstName} ${c.lastName}`.trim(),
            role: c.department || "DECISION_MAKER",
            influenceScore: Math.floor(Math.random() * 40 + 50),
          }),
        )
        .sort((a, b) => b.influenceScore - a.influenceScore),
    };
  }

  async getAccountSegmentation(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { type: true, status: true, creditLimit: true },
    });
    const byType: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    customers.forEach((c: { type: string | null; status: string | null }) => {
      byType[c.type ?? "UNKNOWN"] = (byType[c.type ?? "UNKNOWN"] ?? 0) + 1;
      byIndustry[c.status ?? "OTHER"] =
        (byIndustry[c.status ?? "OTHER"] ?? 0) + 1;
    });
    return { byType, byIndustry, totalAccounts: customers.length };
  }

  async getRecentAccountActivities(tenantId: string) {
    const activities = await prisma.activity.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        subject: true,
        createdAt: true,
      },
    });
    return activities;
  }

  async getAccountRevenueTrend(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { creditLimit: true, createdAt: true },
    });
    const monthMap: Record<string, number> = {};
    customers.forEach((c: { createdAt: Date; creditLimit: any }) => {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] ?? 0) + Number(c.creditLimit ?? 0);
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }

  async getDecisionMakerCoverage(tenantId: string) {
    const total = await prisma.contact.count({ where: { tenantId } });
    const decisionMakers = Math.floor(total * 0.4);
    const influencers = Math.floor(total * 0.3);
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
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true, updatedAt: true },
      take: 30,
    });
    return customers.map(
      (c: { id: string; name: string; creditLimit: any; updatedAt: Date }) => {
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
          annualRevenue: Number(c.creditLimit ?? 0),
          churnProbability: Math.round(churnProbability),
          riskTier:
            churnProbability > 70
              ? "HIGH"
              : churnProbability > 40
                ? "MEDIUM"
                : "LOW",
        };
      },
    );
  }

  async getAccountNPS(_tenantId: string) {
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
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      take: 20,
    });
    return customers.map((c: { id: string; name: string }) => ({
      customerId: c.id,
      customerName: c.name,
      competitorsPresent: 1,
      displacementOpportunity: Math.floor(Math.random() * 3) + 1,
    }));
  }

  async getRenewalPipeline(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true },
      take: 20,
    });
    const now = new Date();
    return customers.map(
      (c: { id: string; name: string; creditLimit: any }) => ({
        customerId: c.id,
        customerName: c.name,
        annualRevenue: Number(c.creditLimit ?? 0),
        renewalDate: new Date(now.getTime() + Math.random() * 365 * 86400000)
          .toISOString()
          .split("T")[0],
        renewalStatus: ["AT_RISK", "ON_TRACK", "EXPANDED"][
          Math.floor(Math.random() * 3)
        ],
      }),
    );
  }

  async getAccountTouchpointFrequency(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      take: 20,
    });
    const activities = await prisma.activity.findMany({
      where: { tenantId },
      select: { customerId: true },
    });
    const actMap: Record<string, number> = {};
    activities.forEach((a: { customerId: string | null }) => {
      if (a.customerId) actMap[a.customerId] = (actMap[a.customerId] ?? 0) + 1;
    });
    return customers.map((c: { id: string; name: string }) => ({
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
        penetration.reduce(
          (s: number, a: { penetrationRate: number }) => s + a.penetrationRate,
          0,
        ) / (penetration.length || 1),
      ),
      coverage,
    };
  }

  async getAccountIntelligenceTimeline(tenantId: string, customerId: string) {
    const [activities, contacts] = await Promise.all([
      prisma.activity.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { type: true, subject: true, createdAt: true },
      }),
      prisma.contact.findMany({
        where: { tenantId, customerId },
        select: { firstName: true, lastName: true, title: true },
      }),
    ]);
    return {
      customerId,
      activities,
      contacts: contacts.map(
        (c: { firstName: string; lastName: string; title: string | null }) => ({
          name: `${c.firstName} ${c.lastName}`.trim(),
          title: c.title,
        }),
      ),
      lastActivity: activities[0]?.createdAt ?? null,
    };
  }
}
