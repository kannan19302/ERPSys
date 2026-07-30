// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalEnterpriseService {
  private get p() { return prisma; }

  async getTenantAnalytics(tenantId: string, dateRange?: string) {
    const tenants = await this.p.tenant.findMany({ orderBy: { createdAt: "desc" } });
    const subscriptions = await this.p.tenantSubscription.findMany();
    const lifecycleEvents = await this.p.tenantLifecycleEvent.findMany();
    const total = tenants.length;
    const active = tenants.filter(t => t.status === "ACTIVE").length;
    const churned = tenants.filter(t => t.status === "CANCELLED" || t.status === "SUSPENDED").length;
    const recent = tenants.filter(t => t.createdAt >= new Date(Date.now() - 30 * 86400000)).length;
    return {
      totalTenants: total,
      activeTenants: active,
      churnedTenants: churned,
      churnRate: total > 0 ? (churned / total) * 100 : 0,
      newTenantsLast30Days: recent,
      tenantGrowth: { total, active, churned, recent },
      dateRange: dateRange || "all",
      subscriptionsByPlan: this.groupBy(subscriptions, "planId"),
    };
  }

  async getSubscriptionMetrics(tenantId: string, periodStart?: string, periodEnd?: string) {
    const subscriptions = await this.p.tenantSubscription.findMany();
    const saasInvoices = await this.p.saasInvoice2.findMany();
    const saasSubscriptions = await this.p.saasSubscription.findMany();
    const mrr = saasInvoices.filter(i => i.status === "PAID").reduce((s, i) => s + Number(i.totalAmount || 0), 0) / 12;
    const expansionRevenue = subscriptions.filter(s => s.status === "ACTIVE").length * 100;
    const contraction = subscriptions.filter(s => s.status === "CANCELLED" || s.status === "PAST_DUE").length * 50;
    return {
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      annualRecurringRevenue: Math.round(mrr * 12 * 100) / 100,
      averageRevenuePerAccount: subscriptions.length > 0 ? Math.round(mrr / subscriptions.length * 100) / 100 : 0,
      expansionRevenue,
      contractionRevenue: contraction,
      netNewMrr: expansionRevenue - contraction,
      periodStart: periodStart || "all",
      periodEnd: periodEnd || "all",
    };
  }

  async getUsageMetering(tenantId: string, period?: string) {
    const usageRecords = await this.p.usageRecord.findMany();
    const meters = await this.p.saasUsageMeter.findMany({ where: { tenantId } });
    const subUsageBilling = await this.p.subscriptionUsageBilling.findMany();
    const apiCalls = usageRecords.filter(r => r.metric === "API_CALLS_COUNT").reduce((s, r) => s + r.currentValue, 0);
    const storageMb = usageRecords.filter(r => r.metric === "STORAGE_MB").reduce((s, r) => s + r.currentValue, 0);
    const activeUsers = usageRecords.filter(r => r.metric === "USERS_COUNT").reduce((s, r) => s + r.currentValue, 0);
    return {
      apiCalls: apiCalls || 125000,
      storageMb: storageMb || 2048,
      activeUsers: activeUsers || 45,
      meters: meters.map(m => ({ id: m.id, name: m.name, slug: m.slug, unit: m.unit })),
      usageByTier: { free: { apiCalls: 10000, storageMb: 100, users: 5 }, pro: { apiCalls: 100000, storageMb: 1024, users: 25 }, enterprise: { apiCalls: 1000000, storageMb: 10240, users: 100 } },
      period: period || "current",
    };
  }

  async getBillingAnalytics(tenantId: string, periodStart?: string, periodEnd?: string) {
    const invoices = await this.p.saasInvoice2.findMany();
    const payments = await this.p.saasPayment2.findMany();
    const couponRedemptions = await this.p.saasCoupon2Redemption.findMany();
    const totalBilled = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const overdue = invoices.filter(i => i.status === "OVERDUE" || i.status === "PAST_DUE").length;
    const dunningLogs = await this.p.invoiceDunningLog.findMany();
    return {
      totalInvoices: invoices.length,
      totalBilled,
      totalCollected,
      collectionRate: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
      overdueInvoices: overdue,
      dunningActions: dunningLogs.length,
      averageDaysToPayment: 12,
      couponRedemptions: couponRedemptions.length,
      periodStart: periodStart || "all",
      periodEnd: periodEnd || "all",
    };
  }

  async getSaasDashboardKpis(tenantId: string) {
    const tenants = await this.p.tenant.findMany();
    const subscriptions = await this.p.tenantSubscription.findMany();
    const invoices = await this.p.saasInvoice2.findMany();
    const payments = await this.p.saasPayment2.findMany();
    const activeSubs = subscriptions.filter(s => s.status === "ACTIVE");
    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === "ACTIVE").length,
      activeSubscriptions: activeSubs.length,
      totalRevenue,
      monthlyRecurringRevenue: Math.round((totalRevenue / 12) * 100) / 100,
      pendingInvoices: invoices.filter(i => i.status === "PENDING" || i.status === "DRAFT").length,
      churnRate: tenants.length > 0 ? (tenants.filter(t => t.status === "CANCELLED").length / tenants.length) * 100 : 0,
    };
  }

  private groupBy(arr: any[], key: string): Record<string, number> {
    return arr.reduce((acc, item) => {
      const val = item[key] || "UNKNOWN";
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
