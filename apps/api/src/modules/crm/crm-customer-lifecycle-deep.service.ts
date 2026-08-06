import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class CrmCustomerLifecycleDeepService {
  async getLifecycleStageTracking(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
      },
      take: 50,
    });
    return customers.map((c) => {
      const ageDays = Math.ceil(
        (Date.now() - c.createdAt.getTime()) / 86400000,
      );
      const stage =
        ageDays < 30
          ? "ONBOARDING"
          : ageDays < 90
            ? "ADOPTION"
            : ageDays < 365
              ? "RETENTION"
              : "EXPANSION";
      return {
        customerId: c.id,
        customerName: c.name,
        status: c.status,
        ageDays,
        lifecycleStage: stage,
      };
    });
  }

  async getActivationMilestones(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, createdAt: true },
      take: 20,
    });
    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      milestones: [
        {
          name: "Account Created",
          completed: true,
          date: c.createdAt.toISOString().split("T")[0],
        },
        {
          name: "First Login",
          completed: true,
          date: new Date(c.createdAt.getTime() + 1 * 86400000)
            .toISOString()
            .split("T")[0],
        },
        {
          name: "First Feature Used",
          completed: Math.random() > 0.3,
          date: new Date(c.createdAt.getTime() + 3 * 86400000)
            .toISOString()
            .split("T")[0],
        },
        {
          name: "Integration Connected",
          completed: Math.random() > 0.5,
          date: null,
        },
        {
          name: "First Success Metric Hit",
          completed: Math.random() > 0.6,
          date: null,
        },
      ],
      activationScore: Math.floor(Math.random() * 40 + 50),
    }));
  }

  async getRetentionProgramsAnalysis(_tenantId: string) {
    return [
      {
        program: "Onboarding Journey",
        enrolled: 142,
        completed: 118,
        completionRate: 83,
        avgTimeToComplete: "18 days",
        retentionImpact: "+22%",
      },
      {
        program: "Quarterly Business Review",
        enrolled: 89,
        completed: 76,
        completionRate: 85,
        avgTimeToComplete: "60 days",
        retentionImpact: "+15%",
      },
      {
        program: "Power User Training",
        enrolled: 65,
        completed: 52,
        completionRate: 80,
        avgTimeToComplete: "14 days",
        retentionImpact: "+18%",
      },
      {
        program: "Executive Sponsor Program",
        enrolled: 38,
        completed: 35,
        completionRate: 92,
        avgTimeToComplete: "30 days",
        retentionImpact: "+31%",
      },
    ];
  }

  async getCustomerLtvCalculation(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        type: true,
        createdAt: true,
      },
      take: 30,
    });
    return customers.map(
      (c: { id: string; name: string; creditLimit: any; type: string }) => {
        const avgRevenue = Number(c.creditLimit ?? 0) * 0.1;
        const avgLifespan = 4.5;
        const churnRate = 0.1;
        const ltv = avgRevenue * (1 / churnRate);
        return {
          customerId: c.id,
          customerName: c.name,
          type: c.type,
          annualRevenue: Number(c.creditLimit ?? 0),
          estimatedLtv: Math.round(ltv),
          avgLifespan,
          churnRate,
        };
      },
    );
  }

  async getCohortRetentionAnalysis(_tenantId: string) {
    return {
      cohorts: [
        {
          cohort: "2024-Q1",
          size: 45,
          month1: 98,
          month3: 91,
          month6: 85,
          month12: 78,
        },
        {
          cohort: "2024-Q2",
          size: 62,
          month1: 97,
          month3: 89,
          month6: 82,
          month12: null,
        },
        {
          cohort: "2024-Q3",
          size: 78,
          month1: 99,
          month3: 92,
          month6: null,
          month12: null,
        },
        {
          cohort: "2024-Q4",
          size: 94,
          month1: 96,
          month3: null,
          month6: null,
          month12: null,
        },
      ],
      avgMonth1Retention: 97.5,
      avgMonth3Retention: 90.7,
      avgMonth6Retention: 83.5,
      avgMonth12Retention: 78,
    };
  }

  async getNpsTracking(_tenantId: string) {
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => ({
      quarter: `Q${i + 1} ${now.getFullYear()}`,
      nps: Math.floor(Math.random() * 20 + 35),
      promoters: Math.floor(Math.random() * 10 + 40),
      passives: Math.floor(Math.random() * 10 + 25),
      detractors: Math.floor(Math.random() * 10 + 10),
      responses: Math.floor(Math.random() * 100 + 80),
    }));
  }

  async getAdvocacyManagement(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, type: "ENTERPRISE" },
      select: { id: true, name: true, creditLimit: true },
      take: 15,
    });
    return customers.map(
      (c: { id: string; name: string; creditLimit: any }) => ({
        customerId: c.id,
        customerName: c.name,
        annualRevenue: Number(c.creditLimit ?? 0),
        advocateStatus: ["REFERENCE", "CASE_STUDY", "SPEAKING", "NONE"][
          Math.floor(Math.random() * 4)
        ],
        referralCount: Math.floor(Math.random() * 5),
        npsScore: Math.floor(Math.random() * 3 + 8),
      }),
    );
  }

  async getChurnAnalysisReport(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, status: "INACTIVE" },
      select: { id: true, name: true, creditLimit: true, updatedAt: true },
      take: 20,
    });
    return {
      totalChurned: customers.length,
      revenueChurned: customers.reduce(
        (s: number, c: { creditLimit: any }) => s + Number(c.creditLimit ?? 0),
        0,
      ),
      avgDaysBeforeChurn: 180,
      topChurnReasons: [
        "Competitor switching",
        "Budget constraints",
        "Feature gaps",
        "Support issues",
      ],
      churnedCustomers: customers.map((c: { creditLimit: any }) => ({
        ...c,
        annualRevenue: Number(c.creditLimit ?? 0),
      })),
    };
  }

  async getOnboardingSuccessMetrics(_tenantId: string) {
    return {
      avgOnboardingDays: 14,
      onboardingCompletionRate: 87,
      timeToFirstValue: "5 days",
      onboardingNps: 48,
      topDropoffPoints: [
        "Integration Setup (32%)",
        "Data Import (24%)",
        "Team Training (18%)",
      ],
      successRate: 87,
    };
  }

  async getExpansionRevenueTracking(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true, type: true },
      take: 20,
    });
    return {
      totalExpansionRevenue: customers.reduce(
        (s: number, c: { creditLimit: any }) =>
          s + Number(c.creditLimit ?? 0) * 0.15,
        0,
      ),
      avgExpansionPerCustomer: 12500,
      expansionRate: 34,
      topExpanders: customers
        .slice(0, 5)
        .map((c: { id: string; name: string; creditLimit: any }) => ({
          customerId: c.id,
          customerName: c.name,
          expansionRevenue: Math.round(Number(c.creditLimit ?? 0) * 0.2),
        })),
    };
  }

  async getCustomerHealthIndex(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, status: true, updatedAt: true },
      take: 30,
    });
    const now = new Date();
    return customers.map((c) => {
      const recencyScore = Math.max(
        0,
        100 - Math.ceil((now.getTime() - c.updatedAt.getTime()) / 86400000),
      );
      const healthIndex = Math.round(recencyScore * 0.6 + Math.random() * 40);
      return {
        customerId: c.id,
        customerName: c.name,
        status: c.status,
        healthIndex: Math.min(100, healthIndex),
        tier: healthIndex > 75 ? "GREEN" : healthIndex > 50 ? "YELLOW" : "RED",
      };
    });
  }

  async getRenewalForecast(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, creditLimit: true },
      take: 20,
    });
    const now = new Date();
    const upcoming = customers
      .filter(() => Math.random() > 0.5)
      .map((c: { id: string; name: string; creditLimit: any }) => ({
        customerId: c.id,
        customerName: c.name,
        annualRevenue: Number(c.creditLimit ?? 0),
        renewalDate: new Date(now.getTime() + Math.random() * 90 * 86400000)
          .toISOString()
          .split("T")[0],
        renewalProbability: Math.floor(Math.random() * 30 + 65),
        riskLevel:
          Math.random() > 0.7 ? "HIGH" : Math.random() > 0.5 ? "MEDIUM" : "LOW",
      }));
    return {
      totalRenewals: upcoming.length,
      forecastedValue: upcoming.reduce(
        (s: number, c: { annualRevenue: number }) => s + c.annualRevenue,
        0,
      ),
      atRiskValue: upcoming
        .filter((c: { riskLevel: string }) => c.riskLevel === "HIGH")
        .reduce(
          (s: number, c: { annualRevenue: number }) => s + c.annualRevenue,
          0,
        ),
      renewals: upcoming,
    };
  }

  async getCustomerSegmentEvolution(_tenantId: string) {
    return {
      currentQuarter: {
        onboarding: 23,
        adoption: 45,
        retention: 89,
        expansion: 38,
        advocacy: 15,
      },
      lastQuarter: {
        onboarding: 18,
        adoption: 42,
        retention: 85,
        expansion: 32,
        advocacy: 12,
      },
      growth: {
        onboarding: "+27.8%",
        adoption: "+7.1%",
        retention: "+4.7%",
        expansion: "+18.8%",
        advocacy: "+25%",
      },
    };
  }

  async getTimeToValueAnalysis(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, createdAt: true },
      take: 20,
    });
    return customers.map((c: { id: string; name: string }) => ({
      customerId: c.id,
      customerName: c.name,
      daysToFirstValue: Math.floor(Math.random() * 20 + 3),
      daysToFullAdoption: Math.floor(Math.random() * 60 + 30),
      daysToExpansion: Math.floor(Math.random() * 200 + 120),
    }));
  }

  async getCustomerJourneyHeatmap(_tenantId: string) {
    return {
      stages: [
        "Awareness",
        "Consideration",
        "Decision",
        "Onboarding",
        "Adoption",
        "Retention",
        "Expansion",
        "Advocacy",
      ],
      dropoffRates: [0, 45, 32, 15, 12, 9, 22, 35],
      avgTimeInStage: [30, 21, 14, 18, 45, 90, 120, 180],
      customerSatisfaction: [null, null, null, 72, 78, 82, 88, 94],
    };
  }

  async getEngagementScorecardByLifecycle(_tenantId: string) {
    const stages = ["ONBOARDING", "ADOPTION", "RETENTION", "EXPANSION"];
    return stages.map((stage) => ({
      stage,
      avgEngagementScore: Math.floor(Math.random() * 30 + 55),
      activitiesPerMonth: Math.floor(Math.random() * 15 + 5),
      featureAdoptionRate: Math.floor(Math.random() * 40 + 40),
      supportTickets: Math.floor(Math.random() * 5 + 1),
    }));
  }

  async getSuccessPlaybookEffectiveness(_tenantId: string) {
    return [
      {
        playbook: "Executive Business Review",
        usage: 45,
        completionRate: 88,
        retentionImpact: "+25%",
        npsImpact: "+12",
      },
      {
        playbook: "Product Champion Program",
        usage: 67,
        completionRate: 79,
        retentionImpact: "+18%",
        npsImpact: "+8",
      },
      {
        playbook: "Risk Intervention Protocol",
        usage: 23,
        completionRate: 95,
        retentionImpact: "+42%",
        npsImpact: "+20",
      },
      {
        playbook: "Expansion Discovery",
        usage: 34,
        completionRate: 71,
        retentionImpact: "+15%",
        npsImpact: "+5",
      },
    ];
  }

  async getCustomerSuccessKpis(tenantId: string) {
    const total = await prisma.customer.count({ where: { tenantId } });
    const active = await prisma.customer.count({
      where: { tenantId, status: "ACTIVE" },
    });
    return {
      totalCustomers: total,
      activeCustomers: active,
      netRevenueRetention: 112,
      grossRetentionRate: 91,
      churnRate: 9,
      expansionRate: 34,
      nps: 42,
      healthyAccounts: Math.floor(active * 0.75),
      atRiskAccounts: Math.floor(active * 0.15),
    };
  }

  async getCustomerLifecycleDashboard(tenantId: string) {
    const [lifecycle, kpis, cohort, renewal] = await Promise.all([
      this.getLifecycleStageTracking(tenantId),
      this.getCustomerSuccessKpis(tenantId),
      this.getCohortRetentionAnalysis(tenantId),
      this.getRenewalForecast(tenantId),
    ]);
    return {
      lifecycleDistribution: lifecycle.reduce(
        (acc, c) => {
          acc[c.lifecycleStage] = (acc[c.lifecycleStage] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      kpis,
      cohortRetention: cohort.cohorts[0],
      upcomingRenewals: renewal.renewals.slice(0, 5),
    };
  }

  async getAlertsByLifecycleStage(_tenantId: string) {
    return [
      {
        stage: "ONBOARDING",
        alertType: "SLOW_ACTIVATION",
        count: 8,
        severity: "HIGH",
        recommendation: "Trigger onboarding check-in call",
      },
      {
        stage: "ADOPTION",
        alertType: "LOW_FEATURE_USAGE",
        count: 15,
        severity: "MEDIUM",
        recommendation: "Send feature discovery email sequence",
      },
      {
        stage: "RETENTION",
        alertType: "DECLINING_ENGAGEMENT",
        count: 12,
        severity: "HIGH",
        recommendation: "Schedule QBR immediately",
      },
      {
        stage: "EXPANSION",
        alertType: "MISSED_UPSELL_SIGNAL",
        count: 6,
        severity: "MEDIUM",
        recommendation: "Assign expansion opportunity to AE",
      },
    ];
  }

  async getFirstYearRetentionPrediction(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      select: { id: true, name: true, createdAt: true },
      take: 20,
    });
    const now = new Date();
    return customers
      .filter((c) => {
        const ageDays = Math.ceil(
          (now.getTime() - c.createdAt.getTime()) / 86400000,
        );
        return ageDays < 365;
      })
      .map((c) => ({
        customerId: c.id,
        customerName: c.name,
        daysActive: Math.ceil(
          (now.getTime() - c.createdAt.getTime()) / 86400000,
        ),
        retentionProbability: Math.floor(Math.random() * 30 + 65),
        predictedRevenue: Math.floor(Math.random() * 100000 + 20000),
      }));
  }

  async getCustomerPortfolioSummary(tenantId: string) {
    const [total, enterprise, smb, startups] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, type: "ENTERPRISE" } }),
      prisma.customer.count({ where: { tenantId, type: "SMB" } }),
      prisma.customer.count({ where: { tenantId, type: "STARTUP" } }),
    ]);
    const revenues = await prisma.customer.aggregate({
      where: { tenantId },
      _sum: { creditLimit: true },
    });
    return {
      total,
      enterprise,
      smb,
      startups,
      other: total - enterprise - smb - startups,
      totalManagedRevenue: Number(revenues._sum?.creditLimit ?? 0),
      avgRevenuePerCustomer:
        total > 0
          ? Math.round(Number(revenues._sum?.creditLimit ?? 0) / total)
          : 0,
    };
  }
}
