import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesAnalyticsService {
  async getRevenueAnalytics(tenantId: string, filters?: any) {
    const where: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
      status: { not: "CANCELLED" },
    };
    if (filters?.channel) where.salesChannel = filters.channel;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.startDate || filters?.endDate) {
      where.orderDate = {};
      if (filters.startDate) where.orderDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.orderDate.lte = new Date(filters.endDate);
    }

    const [channelBreakdown, totalAgg, currentMonthAgg, previousMonthAgg] =
      await Promise.all([
        prisma.salesOrder.groupBy({
          by: ["salesChannel"],
          where,
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.salesOrder.aggregate({
          where,
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        this.getMonthRevenue(tenantId, 0, filters),
        this.getMonthRevenue(tenantId, -1, filters),
      ]);

    const totalRevenue = Number(totalAgg._sum.totalAmount || 0);
    const currentMonthRevenue = Number(currentMonthAgg || 0);
    const previousMonthRevenue = Number(previousMonthAgg || 0);
    const growthPercent =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100
        : currentMonthRevenue > 0
          ? 100
          : 0;

    return {
      totalRevenue,
      byChannel: channelBreakdown.map((c) => ({
        channel: c.salesChannel,
        revenue: Number(c._sum.totalAmount || 0),
        orderCount: c._count.id,
      })),
      currentMonthRevenue,
      previousMonthRevenue,
      growthPercent: Math.round(growthPercent * 100) / 100,
    };
  }

  async getWinLossAnalytics(tenantId: string, filters?: any) {
    const where: Prisma.QuotationWhereInput = { tenantId, deletedAt: null };
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.startDate || filters?.endDate) {
      where.issueDate = {};
      if (filters.startDate) where.issueDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.issueDate.lte = new Date(filters.endDate);
    }

    const statusBreakdown = await prisma.quotation.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    });
    const won = statusBreakdown.filter(
      (s) => s.status === "ACCEPTED" || s.status === "CONVERTED",
    );
    const wonCount = won.reduce((a, s) => a + s._count.id, 0);
    const lostCount =
      statusBreakdown.find((s) => s.status === "REJECTED")?._count.id || 0;
    const totalDecided = wonCount + lostCount;
    const winRate = totalDecided > 0 ? (wonCount / totalDecided) * 100 : 0;
    const wonValue = won.reduce(
      (sum, s) => sum + Number(s._sum.totalAmount || 0),
      0,
    );

    return {
      totalQuotations: statusBreakdown.reduce((sum, s) => sum + s._count.id, 0),
      won: wonCount,
      lost: lostCount,
      expired:
        statusBreakdown.find((s) => s.status === "EXPIRED")?._count.id || 0,
      draftSent: statusBreakdown
        .filter((s) => s.status === "DRAFT" || s.status === "SENT")
        .reduce((sum, s) => sum + s._count.id, 0),
      winRate: Math.round(winRate * 100) / 100,
      totalWonValue: wonValue,
    };
  }

  async getSalesFunnel(tenantId: string, filters?: any) {
    const dateFilter: Record<string, unknown> = {};
    if (filters?.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters?.endDate) dateFilter.lte = new Date(filters.endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const customerWhere: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };
    const quoteWhere: Prisma.QuotationWhereInput = {
      tenantId,
      deletedAt: null,
    };
    const orderWhere: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
    };
    if (hasDateFilter) {
      customerWhere.createdAt = dateFilter as Prisma.DateTimeFilter;
      quoteWhere.issueDate = dateFilter as Prisma.DateTimeFilter;
      orderWhere.orderDate = dateFilter as Prisma.DateTimeFilter;
    }
    if (filters?.customerId) {
      customerWhere.id = filters.customerId;
      quoteWhere.customerId = filters.customerId;
      orderWhere.customerId = filters.customerId;
    }

    const [leads, quotations, orders, delivered] = await Promise.all([
      prisma.customer.count({ where: customerWhere }),
      prisma.quotation.count({
        where: { ...quoteWhere, status: { notIn: ["DRAFT"] } },
      }),
      prisma.salesOrder.count({
        where: { ...orderWhere, status: { notIn: ["DRAFT", "CANCELLED"] } },
      }),
      prisma.salesOrder.count({
        where: { ...orderWhere, status: "DELIVERED" },
      }),
    ]);
    return {
      leads,
      quotations,
      orders,
      delivered,
      quoteToOrderRate:
        quotations > 0 ? Math.round((orders / quotations) * 10000) / 100 : 0,
      orderToDeliveryRate:
        orders > 0 ? Math.round((delivered / orders) * 10000) / 100 : 0,
    };
  }

  async getOrderCycleTime(tenantId: string, filters?: any) {
    const orderWhere: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
      status: "DELIVERED",
    };
    if (filters?.customerId) orderWhere.customerId = filters.customerId;
    if (filters?.startDate || filters?.endDate) {
      orderWhere.orderDate = {};
      if (filters.startDate)
        orderWhere.orderDate.gte = new Date(filters.startDate);
      if (filters.endDate) orderWhere.orderDate.lte = new Date(filters.endDate);
    }

    const deliveredOrders = await prisma.salesOrder.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderDate: true,
        deliveryNotes: {
          where: { status: "DELIVERED", deliveredDate: { not: null } },
          select: { deliveredDate: true },
          orderBy: { deliveredDate: "desc" },
          take: 1,
        },
      },
    });
    const cycleDays: number[] = [];
    for (const order of deliveredOrders) {
      const dn = order.deliveryNotes[0];
      if (dn?.deliveredDate) {
        const diffDays =
          (dn.deliveredDate.getTime() - order.orderDate.getTime()) /
          (1000 * 60 * 60 * 24);
        if (diffDays >= 0) cycleDays.push(diffDays);
      }
    }
    if (cycleDays.length === 0)
      return { averageDays: 0, minDays: 0, maxDays: 0, sampleSize: 0 };
    return {
      averageDays:
        Math.round(
          (cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 100,
        ) / 100,
      minDays: Math.round(Math.min(...cycleDays) * 100) / 100,
      maxDays: Math.round(Math.max(...cycleDays) * 100) / 100,
      sampleSize: cycleDays.length,
    };
  }

  async getTopCustomers(tenantId: string, limit = 10, filters?: any) {
    const orderWhere: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
      status: { not: "CANCELLED" },
    };
    if (filters?.channel) orderWhere.salesChannel = filters.channel;
    if (filters?.startDate || filters?.endDate) {
      orderWhere.orderDate = {};
      if (filters.startDate)
        orderWhere.orderDate.gte = new Date(filters.startDate);
      if (filters.endDate) orderWhere.orderDate.lte = new Date(filters.endDate);
    }
    const groups = await prisma.salesOrder.groupBy({
      by: ["customerId"],
      where: orderWhere,
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: limit,
    });
    if (groups.length === 0) return [];
    const customers = await prisma.customer.findMany({
      where: { id: { in: groups.map((g) => g.customerId) } },
      select: { id: true, name: true },
    });
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));
    return groups.map((g) => ({
      customerId: g.customerId,
      customerName: customerMap.get(g.customerId) || "Unknown",
      revenue: Number(g._sum.totalAmount || 0),
      orderCount: g._count.id,
    }));
  }

  async getTopProducts(tenantId: string, limit = 10, filters?: any) {
    const orderWhere: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
      status: { not: "CANCELLED" },
    };
    if (filters?.channel) orderWhere.salesChannel = filters.channel;
    if (filters?.customerId) orderWhere.customerId = filters.customerId;
    if (filters?.startDate || filters?.endDate) {
      orderWhere.orderDate = {};
      if (filters.startDate)
        orderWhere.orderDate.gte = new Date(filters.startDate);
      if (filters.endDate) orderWhere.orderDate.lte = new Date(filters.endDate);
    }
    const orders = await prisma.salesOrder.findMany({
      where: orderWhere,
      select: { id: true },
    });
    if (orders.length === 0) return [];
    const groups = await prisma.salesOrderItem.groupBy({
      by: ["productId"],
      where: {
        tenantId,
        salesOrderId: { in: orders.map((o) => o.id) },
        productId: { not: null },
      } as any,
      _sum: { quantity: true, totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: limit,
    });
    if (groups.length === 0) return [];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: groups
            .filter((g) => g.productId)
            .map((g) => g.productId as string),
        },
      },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    return groups
      .filter((g) => g.productId)
      .map((g) => ({
        productId: g.productId,
        productName: productMap.get(g.productId!)?.name || "Unknown",
        sku: productMap.get(g.productId!)?.sku || "",
        quantity: Number(g._sum.quantity || 0),
        revenue: Number(g._sum.totalAmount || 0),
        orderCount: g._count.id,
      }));
  }

  async getKpiSummary(tenantId: string) {
    const [
      revenueAgg,
      ordersCount,
      quotationsCount,
      winLoss,
      contractsCount,
      pendingReturns,
    ] = await Promise.all([
      prisma.salesOrder.aggregate({
        where: { tenantId, deletedAt: null, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.salesOrder.count({ where: { tenantId, deletedAt: null } }),
      prisma.quotation.count({ where: { tenantId, deletedAt: null } }),
      this.getWinLossAnalytics(tenantId),
      prisma.contract.count({
        where: { tenantId, status: "ACTIVE", deletedAt: null },
      }),
      prisma.salesReturn.count({
        where: { tenantId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
    ]);
    const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);
    const totalOrders = revenueAgg._count.id || 0;
    return {
      totalRevenue,
      totalOrders: ordersCount,
      totalQuotations: quotationsCount,
      averageOrderValue:
        totalOrders > 0
          ? Math.round((totalRevenue / totalOrders) * 100) / 100
          : 0,
      winRate: winLoss.winRate,
      activeContracts: contractsCount,
      pendingReturns,
    };
  }

  async getSalesAnalyticsDashboard(tenantId: string, filters?: any) {
    const [revenue, winLoss, funnel, cycleTime, kpi] = await Promise.all([
      this.getRevenueAnalytics(tenantId, filters),
      this.getWinLossAnalytics(tenantId, filters),
      this.getSalesFunnel(tenantId, filters),
      this.getOrderCycleTime(tenantId, filters),
      this.getKpiSummary(tenantId),
    ]);
    return { revenue, winLoss, funnel, cycleTime, kpi };
  }

  private async getMonthRevenue(
    tenantId: string,
    monthOffset: number,
    filters?: any,
  ): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + monthOffset;
    const targetMonth = new Date(year, month, 1);
    const nextMonth = new Date(year, month + 1, 1);
    const where: Prisma.SalesOrderWhereInput = {
      tenantId,
      deletedAt: null,
      status: { not: "CANCELLED" },
      orderDate: { gte: targetMonth, lt: nextMonth },
    };
    if (filters?.channel) where.salesChannel = filters.channel;
    if (filters?.customerId) where.customerId = filters.customerId;
    const result = await prisma.salesOrder.aggregate({
      where,
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount || 0);
  }
}
