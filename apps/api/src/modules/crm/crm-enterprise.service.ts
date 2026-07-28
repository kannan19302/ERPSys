import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CrmEnterpriseService {
  async getSalesForecast(
    tenantId: string,
    period?: string,
    methodology?: string,
  ) {
    const where: any = { tenantId };
    if (period) where.createdAt = { gte: new Date(period) };
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { lead: { select: { firstName: true, lastName: true } } },
    });
    const weightedForecast = opportunities.reduce(
      (s, o) => s + Number(o.amount || 0) * (Number(o.probability || 0) / 100),
      0,
    );
    const totalPipeline = opportunities.reduce(
      (s, o) => s + Number(o.amount || 0),
      0,
    );
    return {
      period,
      methodology: methodology || "weighted",
      totalPipeline,
      weightedForecast,
      opportunityCount: opportunities.length,
      byStage: {},
    };
  }

  async getPipelineAnalytics(tenantId: string, dateRange?: string) {
    const where: any = { tenantId };
    if (dateRange) where.createdAt = { gte: new Date(dateRange) };
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { lead: { select: { firstName: true, lastName: true } } },
    });
    const stages = [
      ...new Set(opportunities.map((o) => o.stage || "PROSPECTING")),
    ];
    const byStage = stages.map((stage) => {
      const stageOpps = opportunities.filter(
        (o) => (o.stage || "PROSPECTING") === stage,
      );
      return {
        stage,
        count: stageOpps.length,
        totalValue: stageOpps.reduce((s, o) => s + Number(o.amount || 0), 0),
        avgDealSize:
          stageOpps.length > 0
            ? stageOpps.reduce((s, o) => s + Number(o.amount || 0), 0) /
              stageOpps.length
            : 0,
      };
    });
    const won = opportunities.filter((o) => o.stage === "CLOSED_WON");
    const lost = opportunities.filter((o) => o.stage === "CLOSED_LOST");
    return {
      totalOpportunities: opportunities.length,
      totalPipeline: opportunities.reduce(
        (s, o) => s + Number(o.amount || 0),
        0,
      ),
      winRate:
        opportunities.length > 0
          ? +((won.length / (won.length + lost.length || 1)) * 100).toFixed(1)
          : 0,
      byStage,
    };
  }

  async getCustomerLifetimeValue(tenantId: string, customerId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId },
    });
    const totalRevenue = invoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    const customerAge =
      invoices.length > 0
        ? Math.floor(
            (Date.now() - new Date(invoices[0]!.createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          )
        : 1;
    return {
      customerId,
      totalRevenue,
      averageOrderValue:
        invoices.length > 0 ? totalRevenue / invoices.length : 0,
      purchaseFrequency: invoices.length / Math.max(customerAge, 1),
      customerLifetimeMonths: customerAge,
      clv: +((totalRevenue / Math.max(customerAge, 1)) * 12).toFixed(2),
    };
  }

  async getChurnPrediction(tenantId: string, customerId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: "desc" },
    });
    const tickets = await prisma.helpdeskTicket.count({
      where: { tenantId, customerId },
    });
    const daysSinceLastPurchase =
      invoices.length > 0
        ? Math.floor(
            (Date.now() - new Date(invoices[0]!.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;
    const activityScore = Math.max(0, 100 - daysSinceLastPurchase * 2);
    const ticketScore = Math.min(50, tickets * 10);
    const paymentHistory = invoices.filter(
      (i) => i.status === "OVERDUE",
    ).length;
    const paymentScore = Math.min(50, paymentHistory * 15);
    const churnScore = Math.min(
      100,
      100 - activityScore + ticketScore + paymentScore,
    );
    return {
      customerId,
      churnScore,
      riskLevel: churnScore > 70 ? "HIGH" : churnScore > 40 ? "MEDIUM" : "LOW",
      daysSinceLastPurchase,
      openTickets: tickets,
      factors: { activityScore, ticketScore, paymentScore },
    };
  }

  async getCustomerHealthScore(tenantId: string, customerId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId },
    });
    const tickets = await prisma.helpdeskTicket.findMany({
      where: { tenantId, customerId },
    });
    const recentActivity = invoices.filter(
      (i) =>
        new Date(i.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    ).length;
    const paymentHistory =
      invoices.filter((i) => i.status === "PAID").length /
      Math.max(invoices.length, 1);
    const openTickets = tickets.filter(
      (t) => t.status !== "RESOLVED" && t.status !== "CLOSED",
    ).length;
    const engagementScore = Math.min(30, recentActivity * 10);
    const paymentScore = paymentHistory * 40;
    const supportScore = Math.max(0, 30 - openTickets * 10);
    const healthScore = Math.min(
      100,
      engagementScore + paymentScore + supportScore,
    );
    return {
      customerId,
      healthScore,
      status:
        healthScore > 70
          ? "HEALTHY"
          : healthScore > 40
            ? "AT_RISK"
            : "CRITICAL",
      engagementScore,
      paymentScore,
      supportScore,
      openTickets,
      recentPurchases: recentActivity,
    };
  }

  async getCrmExecutiveDashboard(tenantId: string) {
    const [leads, opportunities, customers] = await Promise.all([
      prisma.lead.findMany({ where: { tenantId } }),
      prisma.opportunity.findMany({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId } }),
    ]);
    const won = opportunities.filter((o) => o.stage === "CLOSED_WON");
    return {
      totalLeads: leads.length,
      totalOpportunities: opportunities.length,
      totalCustomers: customers.length,
      totalPipeline: opportunities.reduce(
        (s, o) => s + Number(o.amount || 0),
        0,
      ),
      winRate:
        opportunities.length > 0
          ? +((won.length / opportunities.length) * 100).toFixed(1)
          : 0,
      newLeadsThisMonth: leads.filter(
        (l) =>
          new Date(l.createdAt) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      ).length,
    };
  }

  async getLeadScoringMatrix(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId },
      take: 100,
    });
    const emailRate =
      leads.filter((l) => l.email).length / Math.max(leads.length, 1);
    const phoneRate =
      leads.filter((l) => l.phone).length / Math.max(leads.length, 1);
    return {
      totalLeadsScored: leads.length,
      emailCaptureRate: +(emailRate * 100).toFixed(1),
      phoneCaptureRate: +(phoneRate * 100).toFixed(1),
      averageScore:
        leads.length > 0
          ? +(
              leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length
            ).toFixed(1)
          : 0,
    };
  }

  async getTerritoryCoverage(tenantId: string, territoryId: string) {
    // Customer/Lead/Opportunity have no direct territoryId in the schema —
    // territory membership is tracked per-rep via SalesTeamMember, so leads
    // and opportunities are scoped through their assigned rep. Customer has
    // no rep-assignment field at all, so its count can't be territory-scoped
    // and is reported tenant-wide.
    const repIds = (
      await prisma.salesTeamMember.findMany({
        where: { tenantId, territoryId },
        select: { userId: true },
      })
    ).map((m) => m.userId);
    const [customers, leads, opportunities] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, assignedToId: { in: repIds } } }),
      prisma.opportunity.count({
        where: { tenantId, assignedToId: { in: repIds } },
      }),
    ]);
    return {
      territoryId,
      customerCount: customers,
      leadCount: leads,
      opportunityCount: opportunities,
      coverageScore: customers > 0 ? 85 : 0,
    };
  }

  async getWinLossAnalysis(tenantId: string, dateRange?: string) {
    const where: any = {
      tenantId,
      stage: { in: ["CLOSED_WON", "CLOSED_LOST"] },
    };
    if (dateRange) where.updatedAt = { gte: new Date(dateRange) };
    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { lead: { select: { firstName: true, lastName: true } } },
    });
    const won = opportunities.filter((o) => o.stage === "CLOSED_WON");
    const lost = opportunities.filter((o) => o.stage === "CLOSED_LOST");
    return {
      total: opportunities.length,
      won: won.length,
      lost: lost.length,
      winRate:
        opportunities.length > 0
          ? +((won.length / opportunities.length) * 100).toFixed(1)
          : 0,
      wonRevenue: won.reduce((s, o) => s + Number(o.amount || 0), 0),
      lostRevenue: lost.reduce((s, o) => s + Number(o.amount || 0), 0),
    };
  }

  async getActivityEffectiveness(
    tenantId: string,
    activityType?: string,
    dateRange?: string,
  ) {
    const where: any = { tenantId };
    if (activityType) where.type = activityType;
    if (dateRange) where.createdAt = { gte: new Date(dateRange) };
    const activities = await prisma.activity.findMany({ where });
    const byType = [...new Set(activities.map((a) => a.type || "OTHER"))].map(
      (type) => {
        const typed = activities.filter((a) => (a.type || "OTHER") === type);
        return {
          type,
          count: typed.length,
          outcomeRate:
            typed.length > 0
              ? +(
                  (typed.filter((a) => a.completedAt !== null).length /
                    typed.length) *
                  100
                ).toFixed(1)
              : 0,
        };
      },
    );
    return {
      totalActivities: activities.length,
      byType,
      averagePerDay:
        activities.length > 30
          ? +(activities.length / 30).toFixed(1)
          : activities.length,
    };
  }

  async exportCrmReport(
    tenantId: string,
    reportType: string,
    format: string,
    params?: any,
  ) {
    let data: any;
    switch (reportType) {
      case "pipeline":
        data = await this.getPipelineAnalytics(tenantId, params?.dateRange);
        break;
      case "forecast":
        data = await this.getSalesForecast(tenantId, params?.period);
        break;
      case "clv":
        data = await this.getCustomerLifetimeValue(
          tenantId,
          params?.customerId,
        );
        break;
      case "health":
        data = await this.getCustomerHealthScore(tenantId, params?.customerId);
        break;
      case "executive":
        data = await this.getCrmExecutiveDashboard(tenantId);
        break;
      default:
        data = await this.getCrmExecutiveDashboard(tenantId);
    }
    return { reportType, format, exportedAt: new Date().toISOString(), data };
  }
}
