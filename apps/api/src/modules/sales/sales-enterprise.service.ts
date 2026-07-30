// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesEnterpriseService {
  async getRevenueAnalytics(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
    groupBy?: string,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        lineItems: {
          include: {
            product: {
              select: { id: true, name: true, category: true, sellPrice: true },
            },
          },
        },
      },
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const totalOrders = orders.length;

    const byProduct: Record<
      string,
      { name: string; revenue: number; qty: number; percentage: number }
    > = {};
    const byRegion: Record<
      string,
      { revenue: number; count: number; percentage: number }
    > = {};
    const byChannel: Record<
      string,
      { revenue: number; count: number; percentage: number }
    > = {};
    const byMonth: Record<string, { revenue: number; orders: number }> = {};

    for (const so of orders) {
      const soTotal = Number(so.totalAmount);
      const channel = so.salesChannel || "OTHER";
      if (!byChannel[channel])
        byChannel[channel] = { revenue: 0, count: 0, percentage: 0 };
      byChannel[channel].revenue += soTotal;
      byChannel[channel].count++;

      const monthKey = `${so.orderDate.getFullYear()}-${String(so.orderDate.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[monthKey]) byMonth[monthKey] = { revenue: 0, orders: 0 };
      byMonth[monthKey].revenue += soTotal;
      byMonth[monthKey].orders++;

      const addr = so.shippingAddress as any;
      const region = addr?.country || "Unknown";
      if (!byRegion[region])
        byRegion[region] = { revenue: 0, count: 0, percentage: 0 };
      byRegion[region].revenue += soTotal;
      byRegion[region].count++;

      for (const li of so.lineItems) {
        if (li.product) {
          const pName = li.product.name;
          if (!byProduct[pName])
            byProduct[pName] = {
              name: pName,
              revenue: 0,
              qty: 0,
              percentage: 0,
            };
          byProduct[pName].revenue += Number(li.totalAmount);
          byProduct[pName].qty += Number(li.quantity);
        }
      }
    }

    for (const k of Object.keys(byChannel)) {
      byChannel[k]!.percentage =
        totalRevenue > 0
          ? Math.round((byChannel[k]!.revenue / totalRevenue) * 10000) / 100
          : 0;
    }
    for (const k of Object.keys(byRegion)) {
      byRegion[k]!.percentage =
        totalRevenue > 0
          ? Math.round((byRegion[k]!.revenue / totalRevenue) * 10000) / 100
          : 0;
    }

    const sortedProducts = Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
    const productTotal = sortedProducts.reduce((s, p) => s + p.revenue, 0);
    for (const p of sortedProducts) {
      p.percentage =
        totalRevenue > 0
          ? Math.round((p.revenue / totalRevenue) * 10000) / 100
          : 0;
    }

    const prevWhere: any = { ...where };
    if (periodEnd) {
      const endDate = new Date(periodEnd);
      const startDate = periodStart ? new Date(periodStart) : new Date(0);
      const periodMs = endDate.getTime() - startDate.getTime();
      prevWhere.orderDate = {
        gte: new Date(startDate.getTime() - periodMs),
        lte: new Date(startDate.getTime() - 1),
      };
    }
    const prevOrders = await prisma.salesOrder.findMany({ where: prevWhere });
    const prevRevenue = prevOrders.reduce(
      (s, o) => s + Number(o.totalAmount),
      0,
    );
    const growthRate =
      prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 10000) / 100
        : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue:
        totalOrders > 0
          ? Math.round((totalRevenue / totalOrders) * 100) / 100
          : 0,
      revenueGrowth: growthRate,
      byProduct: sortedProducts,
      byRegion,
      byChannel,
      byMonth: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          ...data,
          revenue: Math.round(data.revenue * 100) / 100,
        })),
    };
  }

  async getOrderFulfillment(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        lineItems: true,
        deliveryNotes: { include: { lineItems: true } },
        returns: true,
      },
    });

    let totalOrders = 0;
    let onTimeDeliveries = 0;
    let deliveryCount = 0;
    let perfectOrders = 0;
    let totalOrderedQty = 0;
    let totalDeliveredQty = 0;
    let totalReturnQty = 0;
    let returnedOrders = 0;

    for (const so of orders) {
      totalOrders++;
      totalOrderedQty += so.lineItems.reduce(
        (s, li) => s + Number(li.quantity),
        0,
      );

      const deliveredQty = so.deliveryNotes.reduce(
        (s, dn) =>
          s + dn.lineItems.reduce((s2, li) => s2 + Number(li.deliveredQty), 0),
        0,
      );
      totalDeliveredQty += deliveredQty;
      const returnQty = so.returns.reduce(
        (s, r) => s + Number(r.totalAmount),
        0,
      );
      if (returnQty > 0) returnedOrders++;

      if (so.deliveryDate && so.deliveryNotes.length > 0) {
        const latestDelivery = new Date(
          Math.max(
            ...so.deliveryNotes
              .filter((dn) => dn.deliveredDate)
              .map((dn) => dn.deliveredDate!.getTime()),
          ),
        );
        if (latestDelivery <= new Date(so.deliveryDate)) onTimeDeliveries++;
        deliveryCount++;
      }

      const hasReturns = returnQty > 0;
      const isOnTime =
        so.deliveryDate && so.deliveryNotes.length > 0
          ? new Date(
              Math.max(
                ...so.deliveryNotes
                  .filter((dn) => dn.deliveredDate)
                  .map((dn) => dn.deliveredDate!.getTime()),
              ),
            ) <= new Date(so.deliveryDate)
          : false;
      const hasDamage = returnQty > 0;
      if (isOnTime && !hasReturns && !hasDamage) perfectOrders++;
    }

    const fillRate =
      totalOrderedQty > 0
        ? Math.round((totalDeliveredQty / totalOrderedQty) * 10000) / 100
        : 0;
    const onTimeRate =
      deliveryCount > 0
        ? Math.round((onTimeDeliveries / deliveryCount) * 10000) / 100
        : 0;
    const perfectOrderRate =
      totalOrders > 0
        ? Math.round((perfectOrders / totalOrders) * 10000) / 100
        : 0;
    const returnRate =
      totalOrders > 0
        ? Math.round((returnedOrders / totalOrders) * 10000) / 100
        : 0;

    return {
      totalOrders,
      totalDeliveredQty,
      totalOrderedQty,
      fillRate,
      onTimeDeliveryRate: onTimeRate,
      perfectOrderRate,
      returnRate,
      onTimeDeliveries,
      perfectOrders,
      returnedOrders,
      deliveryCount,
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getCustomerProfitability(
    tenantId: string,
    customerId: string,
    period?: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const dateFilter: any = {};
    if (period === "YTD")
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    else if (period === "QTD") {
      const now = new Date();
      dateFilter.gte = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
    }

    const orders = await prisma.salesOrder.findMany({
      where: {
        tenantId,
        customerId,
        deletedAt: null,
        status: { notIn: ["DRAFT", "CANCELLED"] },
        ...(dateFilter.gte ? { orderDate: dateFilter } : {}),
      },
      include: {
        lineItems: {
          include: { product: { select: { costPrice: true, name: true } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalDiscount = 0;
    let totalReturns = 0;
    let orderCount = 0;

    for (const so of orders) {
      totalRevenue += Number(so.totalAmount);
      totalDiscount += Number(so.discountAmount);
      orderCount++;
      for (const li of so.lineItems) {
        const costPrice = li.product
          ? Number(li.product.costPrice)
          : Number(li.unitPrice) * 0.7;
        totalCOGS += costPrice * Number(li.quantity);
      }
    }

    const returns = await prisma.salesReturn.findMany({
      where: { tenantId, customerId },
    });
    totalReturns = returns.reduce((s, r) => s + Number(r.totalAmount), 0);

    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin =
      totalRevenue > 0
        ? Math.round((grossProfit / totalRevenue) * 10000) / 100
        : 0;
    const estimatedCostToServe = totalRevenue * 0.12;
    const netProfit = grossProfit - estimatedCostToServe - totalReturns;
    const netMargin =
      totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 10000) / 100
        : 0;
    const customerLifetimeValue = totalRevenue;
    const averageRevenuePerOrder =
      orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      customerId,
      customerName: customer.name,
      period: period || "ALL",
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMargin,
      totalDiscounts: Math.round(totalDiscount * 100) / 100,
      totalReturns: Math.round(totalReturns * 100) / 100,
      estimatedCostToServe: Math.round(estimatedCostToServe * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      netMargin,
      orderCount,
      averageRevenuePerOrder: Math.round(averageRevenuePerOrder * 100) / 100,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
      profitabilityTier:
        netMargin >= 20
          ? "HIGH"
          : netMargin >= 10
            ? "MEDIUM"
            : netMargin >= 0
              ? "LOW"
              : "NEGATIVE",
    };
  }

  async getPricingAnalysis(
    tenantId: string,
    productId: string,
    period?: string,
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException("Product not found");

    const dateFilter: any = {};
    if (period === "YTD")
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    else if (period === "QTD") {
      const now = new Date();
      dateFilter.gte = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
    }

    const where: any = { tenantId, productId };
    if (dateFilter.gte) where.salesOrder = { orderDate: dateFilter };

    const orderItems = await prisma.salesOrderItem.findMany({
      where,
      include: {
        salesOrder: {
          select: {
            orderDate: true,
            orderNumber: true,
            discountAmount: true,
            totalAmount: true,
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: { salesOrder: { orderDate: "desc" } },
    });

    const listPrice = Number(product.sellPrice);
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalQty = 0;
    let totalActualRevenue = 0;
    let weightedDiscount = 0;
    const transactions: any[] = [];

    for (const item of orderItems) {
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const lineTotal = Number(item.totalAmount);
      const lineDiscount = unitPrice * qty - lineTotal;
      const discountDepth =
        unitPrice > 0 ? ((listPrice - unitPrice) / listPrice) * 100 : 0;

      totalRevenue += listPrice * qty;
      totalActualRevenue += lineTotal;
      totalDiscount += lineDiscount;
      totalQty += qty;

      transactions.push({
        orderNumber: item.salesOrder.orderNumber,
        orderDate: item.salesOrder.orderDate,
        customerName: item.salesOrder.customer.name,
        quantity: qty,
        unitPrice: Math.round(unitPrice * 100) / 100,
        listPrice: Math.round(listPrice * 100) / 100,
        discountDepth: Math.round(discountDepth * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100,
      });
    }

    const priceRealization =
      totalRevenue > 0
        ? Math.round((totalActualRevenue / totalRevenue) * 10000) / 100
        : 0;
    const avgDiscountDepth =
      transactions.length > 0
        ? Math.round(
            (transactions.reduce((s, t) => s + t.discountDepth, 0) /
              transactions.length) *
              100,
          ) / 100
        : 0;

    return {
      productId,
      productName: product.name,
      productSku: product.sku,
      listPrice: Math.round(listPrice * 100) / 100,
      totalQuantitySold: totalQty,
      totalRevenueAtList: Math.round(totalRevenue * 100) / 100,
      totalActualRevenue: Math.round(totalActualRevenue * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      priceRealization,
      averageDiscountDepth: avgDiscountDepth,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 50),
    };
  }

  async getSalesChannelPerformance(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: { customer: true },
    });
    const channelMap: Record<
      string,
      {
        revenue: number;
        orders: number;
        customers: Set<string>;
        avgOrderValue: number;
      }
    > = {};

    for (const so of orders) {
      const channel = so.salesChannel || "OTHER";
      if (!channelMap[channel])
        channelMap[channel] = {
          revenue: 0,
          orders: 0,
          customers: new Set(),
          avgOrderValue: 0,
        };
      channelMap[channel].revenue += Number(so.totalAmount);
      channelMap[channel].orders++;
      channelMap[channel].customers.add(so.customerId);
    }

    const channels = Object.entries(channelMap).map(([channel, data]) => ({
      channel,
      revenue: Math.round(data.revenue * 100) / 100,
      orderCount: data.orders,
      customerCount: data.customers.size,
      averageOrderValue:
        data.orders > 0
          ? Math.round((data.revenue / data.orders) * 100) / 100
          : 0,
      revenuePerCustomer:
        data.customers.size > 0
          ? Math.round((data.revenue / data.customers.size) * 100) / 100
          : 0,
      conversionRate:
        data.orders > 0
          ? Math.round((data.orders / (data.customers.size || 1)) * 100) / 100
          : 0,
      percentage: 0,
    }));

    const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
    for (const c of channels) {
      c.percentage =
        totalRevenue > 0
          ? Math.round((c.revenue / totalRevenue) * 10000) / 100
          : 0;
    }

    return {
      channels,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getProductMixAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sellPrice: true,
                costPrice: true,
              },
            },
          },
        },
      },
    });

    const productMap: Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        revenue: number;
        qty: number;
        cost: number;
        orderCount: Set<string>;
      }
    > = {};

    for (const so of orders) {
      for (const li of so.lineItems) {
        if (!li.product) continue;
        const p = li.product;
        if (!productMap[p.id]) {
          productMap[p.id] = {
            id: p.id,
            name: p.name,
            category: p.category || "Uncategorized",
            revenue: 0,
            qty: 0,
            cost: 0,
            orderCount: new Set(),
          };
        }
        productMap[p.id]!.revenue += Number(li.totalAmount);
        productMap[p.id]!.qty += Number(li.quantity);
        productMap[p.id]!.cost +=
          Number(li.quantity) * Number(p.costPrice || 0);
        productMap[p.id]!.orderCount.add(so.id);
      }
    }

    const totalRevenue = Object.values(productMap).reduce(
      (s, p) => s + p.revenue,
      0,
    );
    const products = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
        cost: Math.round(p.cost * 100) / 100,
        grossProfit: Math.round((p.revenue - p.cost) * 100) / 100,
        grossMargin:
          p.revenue > 0
            ? Math.round(((p.revenue - p.cost) / p.revenue) * 10000) / 100
            : 0,
        percentage:
          totalRevenue > 0
            ? Math.round((p.revenue / totalRevenue) * 10000) / 100
            : 0,
        orderCount: p.orderCount.size,
        averageUnitPrice:
          p.qty > 0 ? Math.round((p.revenue / p.qty) * 100) / 100 : 0,
      }));

    const categoryMap: Record<
      string,
      { revenue: number; qty: number; productCount: number }
    > = {};
    for (const p of Object.values(productMap)) {
      if (!categoryMap[p.category])
        categoryMap[p.category] = { revenue: 0, qty: 0, productCount: 0 };
      categoryMap[p.category]!.revenue += p.revenue;
      categoryMap[p.category]!.qty += p.qty;
      categoryMap[p.category]!.productCount++;
    }

    const categories = Object.entries(categoryMap).map(([cat, data]) => ({
      category: cat,
      revenue: Math.round(data.revenue * 100) / 100,
      percentage:
        totalRevenue > 0
          ? Math.round((data.revenue / totalRevenue) * 10000) / 100
          : 0,
      productCount: data.productCount,
      totalQty: data.qty,
    }));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProducts: products.length,
      products: products.slice(0, 50),
      categories,
      averageRevenuePerProduct:
        products.length > 0
          ? Math.round((totalRevenue / products.length) * 100) / 100
          : 0,
    };
  }

  async getGeographicSalesAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (periodStart || periodEnd) {
      where.orderDate = {};
      if (periodStart) where.orderDate.gte = new Date(periodStart);
      if (periodEnd) where.orderDate.lte = new Date(periodEnd);
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: { customer: true, lineItems: true },
    });

    const regionMap: Record<
      string,
      { revenue: number; orders: number; customers: Set<string>; qty: number }
    > = {};

    for (const so of orders) {
      const addr = so.shippingAddress as any;
      const country = addr?.country || "Unknown";
      const region = addr?.state || addr?.region || country;
      if (!regionMap[region])
        regionMap[region] = {
          revenue: 0,
          orders: 0,
          customers: new Set(),
          qty: 0,
        };
      regionMap[region].revenue += Number(so.totalAmount);
      regionMap[region].orders++;
      regionMap[region].customers.add(so.customerId);
      regionMap[region].qty += so.lineItems.reduce(
        (s, li) => s + Number(li.quantity),
        0,
      );
    }

    const totalRevenue = Object.values(regionMap).reduce(
      (s, r) => s + r.revenue,
      0,
    );
    const regions = Object.entries(regionMap)
      .map(([region, data]) => ({
        region,
        revenue: Math.round(data.revenue * 100) / 100,
        percentage:
          totalRevenue > 0
            ? Math.round((data.revenue / totalRevenue) * 10000) / 100
            : 0,
        orderCount: data.orders,
        customerCount: data.customers.size,
        totalQty: data.qty,
        averageOrderValue:
          data.orders > 0
            ? Math.round((data.revenue / data.orders) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      regions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getSalesTrendForecast(
    tenantId: string,
    productId: string,
    horizon?: string,
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException("Product not found");

    const horizonMonths = horizon ? parseInt(horizon, 10) : 3;
    const monthsBack = Math.max(12, horizonMonths * 3);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const orderItems = await prisma.salesOrderItem.findMany({
      where: {
        tenantId,
        productId,
        salesOrder: {
          orderDate: { gte: startDate },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
      },
      include: { salesOrder: { select: { orderDate: true } } },
    });

    const monthlyData: Record<
      string,
      { revenue: number; qty: number; count: number }
    > = {};
    for (const item of orderItems) {
      const monthKey = `${item.salesOrder.orderDate.getFullYear()}-${String(item.salesOrder.orderDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey])
        monthlyData[monthKey] = { revenue: 0, qty: 0, count: 0 };
      monthlyData[monthKey].revenue += Number(item.totalAmount);
      monthlyData[monthKey].qty += Number(item.quantity);
      monthlyData[monthKey].count++;
    }

    const sortedMonths = Object.entries(monthlyData).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const historicalData = sortedMonths.map(([month, data]) => ({
      month,
      revenue: Math.round(data.revenue * 100) / 100,
      quantity: data.qty,
      orderCount: data.count,
    }));

    const recentQty = historicalData
      .slice(-6)
      .reduce((s, m) => s + m.quantity, 0);
    const avgMonthlyQty =
      historicalData.length > 0
        ? recentQty / Math.min(6, historicalData.length)
        : 0;
    const recentRevenue = historicalData
      .slice(-6)
      .reduce((s, m) => s + m.revenue, 0);
    const avgMonthlyRevenue =
      historicalData.length > 0
        ? recentRevenue / Math.min(6, historicalData.length)
        : 0;

    const trends: any[] = [];
    let prevQty = avgMonthlyQty;
    let prevRevenue = avgMonthlyRevenue;
    for (let i = 1; i <= horizonMonths; i++) {
      const forecastMonth = new Date();
      forecastMonth.setMonth(forecastMonth.getMonth() + i);
      const key = `${forecastMonth.getFullYear()}-${String(forecastMonth.getMonth() + 1).padStart(2, "0")}`;
      const growth = 1 + i * 0.02;
      trends.push({
        month: key,
        forecastedQuantity: Math.round(prevQty * growth),
        forecastedRevenue: Math.round(prevRevenue * growth * 100) / 100,
        confidenceScore: Math.round(Math.max(0.3, 0.9 - i * 0.1) * 100) / 100,
      });
      prevQty *= growth;
      prevRevenue *= growth;
    }

    return {
      productId,
      productName: product.name,
      productSku: product.sku,
      currentPrice: Number(product.sellPrice),
      horizon: `${horizonMonths} months`,
      historicalData,
      forecast: trends,
      seasonalityDetected: historicalData.length >= 12,
      trend: avgMonthlyQty > 0 ? "UPWARD" : "STABLE",
    };
  }

  async getCustomerSegmentation(tenantId: string, criteria?: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        salesOrders: {
          where: { deletedAt: null, status: { notIn: ["DRAFT", "CANCELLED"] } },
          include: { lineItems: true },
        },
      },
    });

    const segments: Record<
      string,
      {
        customers: any[];
        totalRevenue: number;
        count: number;
        avgRevenue: number;
      }
    > = {
      HIGH_VALUE: { customers: [], totalRevenue: 0, count: 0, avgRevenue: 0 },
      MEDIUM_VALUE: { customers: [], totalRevenue: 0, count: 0, avgRevenue: 0 },
      LOW_VALUE: { customers: [], totalRevenue: 0, count: 0, avgRevenue: 0 },
      AT_RISK: { customers: [], totalRevenue: 0, count: 0, avgRevenue: 0 },
      NEW: { customers: [], totalRevenue: 0, count: 0, avgRevenue: 0 },
    };

    const now = new Date();
    for (const c of customers) {
      const totalRevenue = c.salesOrders.reduce(
        (s, so) => s + Number(so.totalAmount),
        0,
      );
      const orderCount = c.salesOrders.length;
      const lastOrderDate =
        c.salesOrders.length > 0
          ? new Date(
              Math.max(...c.salesOrders.map((so) => so.orderDate.getTime())),
            )
          : null;
      const daysSinceLastOrder = lastOrderDate
        ? Math.floor((now.getTime() - lastOrderDate.getTime()) / 86400000)
        : 999;
      const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

      let segment = "LOW_VALUE";
      if (orderCount === 0) segment = "NEW";
      else if (totalRevenue >= 100000) segment = "HIGH_VALUE";
      else if (totalRevenue >= 25000) segment = "MEDIUM_VALUE";
      else segment = "LOW_VALUE";

      if (daysSinceLastOrder > 180 && totalRevenue > 0) segment = "AT_RISK";

      const bucket = segments[segment];
      if (bucket) {
        bucket.customers.push({
          id: c.id,
          name: c.name,
          email: c.email,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          orderCount,
          averageOrderValue: Math.round(avgOrderValue * 100) / 100,
          daysSinceLastOrder,
          riskRating: c.riskRating,
          creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
        });
        bucket.totalRevenue += totalRevenue;
        bucket.count++;
      }
    }

    for (const seg of Object.keys(segments)) {
      const bucket = segments[seg]!;
      bucket.avgRevenue =
        bucket.count > 0
          ? Math.round((bucket.totalRevenue / bucket.count) * 100) / 100
          : 0;
      bucket.totalRevenue = Math.round(bucket.totalRevenue * 100) / 100;
      bucket.customers.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    return {
      segments,
      totalCustomers: customers.length,
      totalRevenue: Object.values(segments).reduce(
        (s, seg) => s + seg.totalRevenue,
        0,
      ),
    };
  }

  async getSalesRepPerformance(
    tenantId: string,
    repId: string,
    period?: string,
  ) {
    const dateFilter: any = {};
    if (period === "YTD")
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
    else if (period === "QTD") {
      const now = new Date();
      dateFilter.gte = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );
    }

    const where: any = {
      tenantId,
      createdBy: repId,
      deletedAt: null,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    };
    if (dateFilter.gte) where.orderDate = dateFilter;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: { lineItems: true, customer: true },
    });
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const orderCount = orders.length;

    const wonStatuses = ["DELIVERED", "PROCESSING", "CONFIRMED"];
    const wonOrders = orders.filter((o) => wonStatuses.includes(o.status));
    const wonRevenue = wonOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const winRate =
      orderCount > 0
        ? Math.round((wonOrders.length / orderCount) * 10000) / 100
        : 0;

    const opportunities = await prisma.opportunity.findMany({
      where: {
        tenantId,
        assignedToId: repId,
        ...(dateFilter.gte ? { createdAt: dateFilter } : {}),
      },
    });

    const pipelineValue = opportunities.reduce(
      (s, opp) => s + Number(opp.amount || 0),
      0,
    );
    const pipelineCount = opportunities.length;

    const monthlyRevenue: Record<string, number> = {};
    for (const so of orders) {
      const key = `${so.orderDate.getFullYear()}-${String(so.orderDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(so.totalAmount);
    }

    const avgDealSize = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      repId,
      period: period || "ALL",
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      orderCount,
      winRate,
      wonOrders: wonOrders.length,
      wonRevenue: Math.round(wonRevenue * 100) / 100,
      averageDealSize: Math.round(avgDealSize * 100) / 100,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      pipelineCount,
      pipelineCoverage:
        totalRevenue > 0
          ? Math.round((pipelineValue / totalRevenue) * 100) / 100
          : 0,
      monthlyRevenue: Object.entries(monthlyRevenue)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, rev]) => ({
          month,
          revenue: Math.round(rev * 100) / 100,
        })),
    };
  }

  async getChurnAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const dateFilter: any = {};
    if (periodStart) dateFilter.gte = new Date(periodStart);
    if (periodEnd) dateFilter.lte = new Date(periodEnd);

    const customers = await prisma.customer.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        salesOrders: {
          where: { deletedAt: null },
          orderBy: { orderDate: "desc" },
          take: 1,
        },
      },
    });

    const now = new Date();
    const churnedCustomers: any[] = [];
    let activeCustomers = 0;
    let churnedCount = 0;
    let churnedRevenue = 0;
    let totalRevenueLastPeriod = 0;

    for (const c of customers) {
      const lastOrder = c.salesOrders[0];
      if (!lastOrder) {
        churnedCount++;
        churnedCustomers.push({
          id: c.id,
          name: c.name,
          lastOrderDate: null,
          reason: "No orders ever",
        });
        continue;
      }

      const daysSinceLastOrder = Math.floor(
        (now.getTime() - lastOrder.orderDate.getTime()) / 86400000,
      );
      if (daysSinceLastOrder > 180) {
        churnedCount++;
        churnedRevenue += Number(lastOrder.totalAmount);
        churnedCustomers.push({
          id: c.id,
          name: c.name,
          email: c.email,
          lastOrderDate: lastOrder.orderDate,
          daysSinceLastOrder,
          lastOrderAmount:
            Math.round(Number(lastOrder.totalAmount) * 100) / 100,
          reason: "No purchase in 180+ days",
        });
      } else {
        activeCustomers++;
        if (lastOrder.orderDate >= (dateFilter.gte || new Date(0))) {
          totalRevenueLastPeriod += Number(lastOrder.totalAmount);
        }
      }
    }

    const totalCustomers = customers.length;
    const churnRate =
      totalCustomers > 0
        ? Math.round((churnedCount / totalCustomers) * 10000) / 100
        : 0;

    return {
      totalCustomers,
      activeCustomers,
      churnedCustomers: churnedCount,
      churnRate,
      churnedRevenue: Math.round(churnedRevenue * 100) / 100,
      atRiskCustomers: churnedCustomers.filter(
        (c) =>
          c.daysSinceLastOrder &&
          c.daysSinceLastOrder > 90 &&
          c.daysSinceLastOrder <= 180,
      ).length,
      churnedDetails: churnedCustomers.slice(0, 50),
      retentionRate: Math.round((100 - churnRate) * 100) / 100,
    };
  }

  async exportSalesReport(
    tenantId: string,
    reportType: string,
    format: string,
    params: any,
  ) {
    let data: any;
    const { periodStart, periodEnd, customerId, productId, repId } =
      params || {};

    switch (reportType) {
      case "revenue-analytics":
        data = await this.getRevenueAnalytics(
          tenantId,
          periodStart,
          periodEnd,
          params?.groupBy,
        );
        break;
      case "order-fulfillment":
        data = await this.getOrderFulfillment(tenantId, periodStart, periodEnd);
        break;
      case "customer-profitability":
        if (!customerId) throw new BadRequestException("customerId required");
        data = await this.getCustomerProfitability(
          tenantId,
          customerId,
          params?.period,
        );
        break;
      case "pricing-analysis":
        if (!productId) throw new BadRequestException("productId required");
        data = await this.getPricingAnalysis(
          tenantId,
          productId,
          params?.period,
        );
        break;
      case "channel-performance":
        data = await this.getSalesChannelPerformance(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "product-mix":
        data = await this.getProductMixAnalysis(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "geographic-analysis":
        data = await this.getGeographicSalesAnalysis(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "churn-analysis":
        data = await this.getChurnAnalysis(tenantId, periodStart, periodEnd);
        break;
      case "rep-performance":
        if (!repId) throw new BadRequestException("repId required");
        data = await this.getSalesRepPerformance(
          tenantId,
          repId,
          params?.period,
        );
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }

    if (format === "csv") {
      return {
        format: "csv",
        filename: `${reportType}-${Date.now()}.csv`,
        data: JSON.stringify(data),
      };
    }

    return { format: "json", reportType, generatedAt: new Date(), data };
  }

  async getSalesExecutiveDashboard(tenantId: string) {
    const now = new Date();
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );

    const [totalOrders, totalCustomers, totalInvoices] = await Promise.all([
      prisma.salesOrder.count({ where: { tenantId, deletedAt: null } }),
      prisma.customer.count({ where: { tenantId, deletedAt: null } }),
      prisma.invoice.count({ where: { tenantId, type: "SALE" } }),
    ]);

    const ytdRevenue = await prisma.salesOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        orderDate: { gte: ytdStart },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      _sum: { totalAmount: true },
    });

    const mtdRevenue = await prisma.salesOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        orderDate: { gte: mtdStart },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      _sum: { totalAmount: true },
    });

    const qtdRevenue = await prisma.salesOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        orderDate: { gte: quarterStart },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      _sum: { totalAmount: true },
    });

    const openInvoices = await prisma.invoice.count({
      where: {
        tenantId,
        type: "SALE",
        status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
      },
    });

    const allItems = await prisma.inventoryItem.findMany({
      where: { tenantId },
    });
    const lowStockItems = allItems.filter(
      (i) =>
        Number(i.quantity) <= Number(i.reorderPoint || 0) &&
        Number(i.reorderPoint) > 0,
    ).length;

    return {
      totalOrders,
      totalCustomers,
      totalInvoices,
      openInvoices,
      lowStockItems,
      ytdRevenue:
        Math.round(Number(ytdRevenue._sum.totalAmount || 0) * 100) / 100,
      mtdRevenue:
        Math.round(Number(mtdRevenue._sum.totalAmount || 0) * 100) / 100,
      qtdRevenue:
        Math.round(Number(qtdRevenue._sum.totalAmount || 0) * 100) / 100,
      averageRevenuePerCustomer:
        totalCustomers > 0
          ? Math.round(
              (Number(ytdRevenue._sum.totalAmount || 0) / totalCustomers) * 100,
            ) / 100
          : 0,
    };
  }
}
