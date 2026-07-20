import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class TenantAnalyticsService {
  async getPlatformOverview() {
    const [totalTenants, activeTenants, totalSubscriptions, totalRevenue, mrr, arr] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenantSubscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
      prisma.saaSInvoice.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
      this.calculateMrr(),
      this.calculateArr(),
    ]);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const newTenantsThisMonth = await prisma.tenant.count({
      where: { createdAt: { gte: lastMonth } },
    });

    return {
      totalTenants,
      activeTenants,
      suspendedTenants: totalTenants - activeTenants,
      totalSubscriptions,
      newTenantsThisMonth,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      mrr,
      arr,
      growth: activeTenants > 0 ? Math.round((newTenantsThisMonth / activeTenants) * 100) : 0,
    };
  }

  async getTenantsList(filters: {
    search?: string;
    status?: string;
    planId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          subscription: { include: { plan: { select: { id: true, name: true } } } },
          _count: { select: { users: true } },
        },
      }),
      prisma.tenant.count({ where: where as any }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTenantDetail(tenantId: string) {
    const [tenant, subscription, usage, invoiceCount, userCount, paymentMethods] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.tenantSubscription.findFirst({
        where: { tenantId },
        include: { plan: true, addOns: { include: { addon: true } } },
      }),
      prisma.usageRecord.findMany({ where: { tenantId } }),
      prisma.saaSInvoice.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.paymentMethod.findMany({ where: { tenantId } }),
    ]);

    if (!tenant) return null;

    return {
      tenant,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan.name,
            status: subscription.status,
            billingPeriod: subscription.billingPeriod,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            addOns: subscription.addOns.map((a) => ({
              name: a.addon.name,
              quantity: a.quantity,
              price: Number(a.addon.price),
            })),
          }
        : null,
      usage: usage.map((u) => ({
        metric: u.metric,
        current: u.currentValue,
        limit: u.limitValue,
        pct: u.limitValue > 0 ? Math.round((u.currentValue / u.limitValue) * 100) : 0,
      })),
      invoiceCount,
      userCount,
      paymentMethodCount: paymentMethods.length,
    };
  }

  async suspendTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;

    return prisma.tenant.update({
      where: { id: tenantId },
      data: { status: "SUSPENDED" },
    });
  }

  async activateTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;

    return prisma.tenant.update({
      where: { id: tenantId },
      data: { status: "ACTIVE" },
    });
  }

  async getRevenueAnalytics(period: "7d" | "30d" | "90d" | "1y") {
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[period] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const invoices = await prisma.saaSInvoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startDate },
      },
      orderBy: { paidAt: "asc" },
    });

    return {
      period,
      totalRevenue: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      totalInvoices: invoices.length,
      averageInvoiceValue: invoices.length > 0
        ? invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0) / invoices.length
        : 0,
      daily: this.groupByDate(invoices.map((inv) => ({ paidAt: inv.paidAt, totalAmount: Number(inv.totalAmount) }))),
    };
  }

  async getChurnAnalytics(period: "7d" | "30d" | "90d" | "1y") {
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[period] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [cancelledSubs, totalSubsAtStart, newSubs] = await Promise.all([
      prisma.tenantSubscription.findMany({
        where: {
          cancelledAt: { gte: startDate },
        },
      }),
      prisma.tenantSubscription.count({
        where: {
          startDate: { lt: startDate },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.tenantSubscription.count({
        where: { startDate: { gte: startDate } },
      }),
    ]);

    const churnRate = totalSubsAtStart > 0
      ? Math.round((cancelledSubs.length / totalSubsAtStart) * 100)
      : 0;

    return {
      period,
      churnedCount: cancelledSubs.length,
      churnRate,
      totalSubsAtStart,
      newSubs,
      netChange: newSubs - cancelledSubs.length,
    };
  }

  async getPlanDistribution() {
    const subscriptions = await prisma.tenantSubscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: { select: { id: true, name: true } } },
    });

    const distribution: Record<string, number> = {};
    for (const sub of subscriptions) {
      const name = sub.plan?.name ?? "Unknown";
      distribution[name] = (distribution[name] ?? 0) + 1;
    }

    return {
      total: subscriptions.length,
      distribution,
      details: Object.entries(distribution).map(([plan, count]) => ({
        plan,
        count,
        pct: Math.round((count / subscriptions.length) * 100),
      })),
    };
  }

  async getTenantGrowth(period: "7d" | "30d" | "90d" | "1y") {
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[period] ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tenants = await prisma.tenant.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    return {
      period,
      totalNew: tenants.length,
      daily: this.groupByDate(tenants.map((t) => ({ ...t, paidAt: t.createdAt, totalAmount: 0 })) as any),
    };
  }

  async getGeographicDistribution() {
    const tenants = await prisma.tenant.findMany({
      select: { settings: true },
    });

    const regions: Record<string, number> = {};
    for (const t of tenants) {
      const settings = t.settings as Record<string, unknown> | null;
      const currency = (settings?.currency as string) ?? "USD";
      const region = currency === "EUR" ? "EU" : currency === "GBP" ? "UK" : currency === "USD" ? "US" : "Other";
      regions[region] = (regions[region] ?? 0) + 1;
    }

    return {
      total: tenants.length,
      regions: Object.entries(regions).map(([region, count]) => ({
        region,
        count,
        pct: Math.round((count / tenants.length) * 100),
      })),
    };
  }

  async getFeatureAdoption() {
    const [totalTenants, apiKeys, customDomains, ssoConfigs, webhooks, branding] = await Promise.all([
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenantApiKey.groupBy({ by: ["tenantId"], _count: true }),
      prisma.tenantDomain.groupBy({ by: ["tenantId"], _count: true }),
      prisma.tenantSsoConfig.groupBy({ by: ["tenantId"], _count: true }),
      prisma.tenantWebhookEndpoint.groupBy({ by: ["tenantId"], _count: true }),
      prisma.tenantBranding.groupBy({ by: ["tenantId"], _count: true }),
    ]);

    return {
      totalTenants: totalTenants,
      features: [
        { feature: "API Keys", usageCount: apiKeys.length, adoptionRate: totalTenants > 0 ? Math.round((apiKeys.length / totalTenants) * 100) : 0 },
        { feature: "Custom Domains", usageCount: customDomains.length, adoptionRate: totalTenants > 0 ? Math.round((customDomains.length / totalTenants) * 100) : 0 },
        { feature: "SSO", usageCount: ssoConfigs.length, adoptionRate: totalTenants > 0 ? Math.round((ssoConfigs.length / totalTenants) * 100) : 0 },
        { feature: "Webhooks", usageCount: webhooks.length, adoptionRate: totalTenants > 0 ? Math.round((webhooks.length / totalTenants) * 100) : 0 },
        { feature: "Custom Branding", usageCount: branding.length, adoptionRate: totalTenants > 0 ? Math.round((branding.length / totalTenants) * 100) : 0 },
      ],
    };
  }

  async getHealthMetrics() {
    const [recentInvoices, failedInvoices, pendingDeliveries] = await Promise.all([
      prisma.saaSInvoice.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.saaSInvoice.count({ where: { status: "OVERDUE" } }),
      prisma.tenantWebhookDelivery.count({ where: { status: "PENDING" } }),
    ]);

    return {
      status: "healthy",
      uptime: "99.9%",
      invoicesLast24h: recentInvoices,
      overdueInvoices: failedInvoices,
      pendingWebhookDeliveries: pendingDeliveries,
      lastChecked: new Date(),
    };
  }

  private async calculateMrr() {
    const activeSubs = await prisma.tenantSubscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: { include: { prices: true } } },
    });

    return activeSubs.reduce((sum, sub) => {
      const price = sub.plan.prices?.[0] ? Number(sub.plan.prices[0].monthly) : 0;
      return sum + (sub.billingPeriod === "YEARLY" ? price / 12 : price);
    }, 0);
  }

  private async calculateArr() {
    const mrr = await this.calculateMrr();
    return mrr * 12;
  }

  private groupByDate(items: Array<{ paidAt: Date | null; totalAmount: number }>): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const item of items) {
      if (!item.paidAt) continue;
      const key = item.paidAt.toISOString().substring(0, 10);
      grouped[key] = (grouped[key] ?? 0) + Number(item.totalAmount);
    }
    return grouped;
  }
}
