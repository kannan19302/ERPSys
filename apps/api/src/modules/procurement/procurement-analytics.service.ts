import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ProcurementAnalyticsService {
  async getSpendByVendor(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantId, status: { not: 'CANCELLED' } };
    if (startDate || endDate) where.orderDate = {};
    if (startDate) where.orderDate.gte = new Date(startDate);
    if (endDate) where.orderDate.lte = new Date(endDate);

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { vendor: { select: { name: true } } },
    });

    const byVendor: Record<string, { vendorName: string; total: number; count: number }> = {};
    for (const po of orders) {
      const key = po.vendorId;
      if (!byVendor[key]) byVendor[key] = { vendorName: po.vendor.name, total: 0, count: 0 };
      byVendor[key].total += Number(po.totalAmount);
      byVendor[key].count += 1;
    }

    return Object.entries(byVendor).map(([vendorId, data]) => ({ vendorId, ...data, percentage: 0 })).sort((a, b) => b.total - a.total);
  }

  async getSpendByStatus(tenantId: string) {
    const orders = await prisma.purchaseOrder.findMany({ where: { tenantId } });
    const byStatus: Record<string, { total: number; count: number }> = {};
    for (const po of orders) {
      const entry = byStatus[po.status] || { total: 0, count: 0 };
      entry.total += Number(po.totalAmount);
      entry.count += 1;
      byStatus[po.status] = entry;
    }
    return byStatus;
  }

  async getMonthlySpendTrend(tenantId: string, months: number = 12) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId, orderDate: { gte: cutoff }, status: { not: 'CANCELLED' } },
    });

    const monthly: Record<string, { total: number; count: number }> = {};
    for (const po of orders) {
      const key = `${po.orderDate.getFullYear()}-${String(po.orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { total: 0, count: 0 };
      monthly[key].total += Number(po.totalAmount);
      monthly[key].count += 1;
    }

    return Object.entries(monthly).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getSpendByCategory(tenantId: string) {
    const items = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { tenantId, status: { not: 'CANCELLED' } } },
      include: { product: { select: { name: true, productCategory: { select: { name: true } } } } },
    });

    const byCategory: Record<string, { total: number; count: number }> = {};
    for (const item of items) {
      const cat = item.product?.productCategory?.name || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
      byCategory[cat].total += Number(item.totalAmount);
      byCategory[cat].count += 1;
    }

    return Object.entries(byCategory).map(([category, data]) => ({ category, ...data })).sort((a, b) => b.total - a.total);
  }

  async getBudgetOverview(tenantId: string) {
    const orders = await prisma.purchaseOrder.findMany({ where: { tenantId, status: { not: 'CANCELLED' } } });
    const totalBudgeted = orders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    const totalSpent = orders.filter(po => po.status !== 'DRAFT' && po.status !== 'SUBMITTED').reduce((sum, po) => sum + Number(po.totalAmount), 0);
    const draftAmount = orders.filter(po => po.status === 'DRAFT').reduce((sum, po) => sum + Number(po.totalAmount), 0);

    return { totalBudgeted, totalSpent, draftAmount, remaining: totalBudgeted - totalSpent, utilizationRate: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100 * 100) / 100 : 0 };
  }

  async getSpendForecast(tenantId: string, months: number = 3) {
    const now = new Date();
    const pastMonths = 6;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1);

    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId, orderDate: { gte: cutoff }, status: { not: 'CANCELLED' } },
    });

    const monthly: Record<string, { total: number; count: number }> = {};
    for (const po of orders) {
      const key = `${po.orderDate.getFullYear()}-${String(po.orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) monthly[key] = { total: 0, count: 0 };
      monthly[key].total += Number(po.totalAmount);
      monthly[key].count += 1;
    }

    const monthsArr = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
    const avgMonthlySpend = monthsArr.length > 0
      ? Math.round(monthsArr.reduce((s, [, d]) => s + d.total, 0) / monthsArr.length * 100) / 100
      : 0;

    const forecast: Array<{ month: string; projected: number }> = [];
    for (let i = 1; i <= months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      forecast.push({ month: key, projected: avgMonthlySpend });
    }

    return {
      historicalAverage: avgMonthlySpend,
      forecastMonths: months,
      forecast,
      projectedTotal: Math.round(avgMonthlySpend * months * 100) / 100,
    };
  }

  async getVendorComparison(tenantId: string, vendorIds?: string[]) {
    const where: any = { tenantId, status: { not: 'CANCELLED' } };
    if (vendorIds && vendorIds.length > 0) where.vendorId = { in: vendorIds };

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { vendor: { select: { name: true } } },
    });

    const byVendor: Record<string, { vendorName: string; totalSpend: number; orderCount: number; avgOrderValue: number }> = {};
    for (const po of orders) {
      const key = po.vendorId;
      if (!byVendor[key]) byVendor[key] = { vendorName: po.vendor.name, totalSpend: 0, orderCount: 0, avgOrderValue: 0 };
      byVendor[key].totalSpend += Number(po.totalAmount);
      byVendor[key].orderCount += 1;
    }

    for (const v of Object.values(byVendor)) {
      v.avgOrderValue = v.orderCount > 0 ? Math.round((v.totalSpend / v.orderCount) * 100) / 100 : 0;
    }

    return Object.entries(byVendor).map(([vendorId, data]) => ({ vendorId, ...data })).sort((a, b) => b.totalSpend - a.totalSpend);
  }

  async getCategoryBreakdown(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { purchaseOrder: { tenantId, status: { not: 'CANCELLED' } } };
    if (startDate) where.purchaseOrder.orderDate = { ...where.purchaseOrder.orderDate, gte: new Date(startDate) };
    if (endDate) where.purchaseOrder.orderDate = { ...where.purchaseOrder.orderDate, lte: new Date(endDate) };

    const items = await prisma.purchaseOrderItem.findMany({
      where,
      include: { product: { select: { name: true, productCategory: { select: { name: true } } } } },
    });

    const byCategory: Record<string, { total: number; count: number; items: number }> = {};
    for (const item of items) {
      const cat = item.product?.productCategory?.name || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0, items: 0 };
      byCategory[cat].total += Number(item.totalAmount);
      byCategory[cat].count += 1;
      byCategory[cat].items += Number(item.quantity);
    }

    const grandTotal = Object.values(byCategory).reduce((s, c) => s + c.total, 0);

    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
      percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 10000) / 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }

  async getPurchaseOrderCycleTime(tenantId: string, vendorId?: string) {
    const where: any = { tenantId, status: { not: 'DRAFT' }, orderDate: { not: null }, createdAt: { not: null } };
    if (vendorId) where.vendorId = vendorId;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      select: { id: true, poNumber: true, createdAt: true, orderDate: true, status: true, vendor: { select: { name: true } } },
    });

    const cycleTimes = orders
      .map(po => ({
        id: po.id,
        poNumber: po.poNumber,
        vendorName: po.vendor.name,
        status: po.status,
        createdAt: po.createdAt.toISOString(),
        orderDate: po.orderDate.toISOString(),
        cycleDays: Math.round((po.orderDate.getTime() - po.createdAt.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10,
      }))
      .sort((a, b) => b.cycleDays - a.cycleDays);

    const avgCycleTime = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((s, c) => s + c.cycleDays, 0) / cycleTimes.length * 10) / 10
      : 0;

    return {
      averageCycleDays: avgCycleTime,
      totalOrders: cycleTimes.length,
      minCycleDays: cycleTimes.length > 0 ? Math.min(...cycleTimes.map(c => c.cycleDays)) : 0,
      maxCycleDays: cycleTimes.length > 0 ? Math.max(...cycleTimes.map(c => c.cycleDays)) : 0,
      orders: cycleTimes,
    };
  }

  async getSavingsOpportunities(tenantId: string) {
    const vendors = await prisma.vendor.findMany({ where: { tenantId } });
    const scorecards = await prisma.supplierScorecard.findMany({ where: { tenantId } });
    const orders = await prisma.purchaseOrder.findMany({
      where: { tenantId, status: { not: 'CANCELLED' } },
      include: { vendor: { select: { name: true } } },
    });

    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) latestByVendor.set(sc.vendorId, sc);
    }

    const vendorSpend: Record<string, { vendorName: string; totalSpend: number; orderCount: number }> = {};
    for (const po of orders) {
      const key = po.vendorId;
      if (!vendorSpend[key]) vendorSpend[key] = { vendorName: po.vendor.name, totalSpend: 0, orderCount: 0 };
      vendorSpend[key].totalSpend += Number(po.totalAmount);
      vendorSpend[key].orderCount += 1;
    }

    const opportunities = vendors
      .map(v => {
        const score = latestByVendor.get(v.id);
        const spend = vendorSpend[v.id];
        return {
          vendorId: v.id,
          vendorName: v.name,
          totalSpend: spend?.totalSpend || 0,
          orderCount: spend?.orderCount || 0,
          overallScore: Number(score?.overallScore || 0),
          qualityScore: Number(score?.qualityScore || 0),
          deliveryScore: Number(score?.deliveryScore || 0),
          needsImprovement: Number(score?.overallScore || 100) < 70,
          consolidationCandidate: (spend?.totalSpend || 0) < 10000 && Number(score?.overallScore || 100) < 80,
          potentialSavings: spend ? Math.round(spend.totalSpend * 0.05 * 100) / 100 : 0,
        };
      })
      .filter(v => v.totalSpend > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    return {
      opportunities,
      totalPotentialSavings: opportunities.reduce((s, o) => s + o.potentialSavings, 0),
      vendorsNeedingImprovement: opportunities.filter(o => o.needsImprovement).length,
      consolidationCandidates: opportunities.filter(o => o.consolidationCandidate).length,
    };
  }

  async getVendorPerformanceSummary(tenantId: string) {
    const vendors = await prisma.vendor.findMany({ where: { tenantId } });
    const scorecards = await prisma.supplierScorecard.findMany({ where: { tenantId } });

    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) latestByVendor.set(sc.vendorId, sc);
    }

    const orders = await prisma.purchaseOrder.groupBy({ by: ['vendorId'], where: { tenantId, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true }, _count: { id: true } });

    return vendors.map(v => {
      const sc = latestByVendor.get(v.id);
      const po = orders.find(o => o.vendorId === v.id);
      return {
        vendorId: v.id, vendorName: v.name,
        totalSpend: Number(po?._sum?.totalAmount || 0),
        orderCount: po?._count?.id || 0,
        overallScore: Number(sc?.overallScore || 0),
        qualityScore: Number(sc?.qualityScore || 0),
        deliveryScore: Number(sc?.deliveryScore || 0),
        lastScorecardPeriod: sc ? `${sc.periodStart.toISOString().substring(0, 10)}` : null,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }

  async getDashboard(tenantId: string) {
    const [spendByVendor, spendByStatus, monthlyTrend, budgetOverview, vendorPerformance, scorecardStats, spendForecast, cycleTime] = await Promise.all([
      this.getSpendByVendor(tenantId),
      this.getSpendByStatus(tenantId),
      this.getMonthlySpendTrend(tenantId),
      this.getBudgetOverview(tenantId),
      this.getVendorPerformanceSummary(tenantId),
      this._getScorecardStats(tenantId),
      this.getSpendForecast(tenantId, 3),
      this.getPurchaseOrderCycleTime(tenantId),
    ]);

    return { spendByVendor, spendByStatus, monthlyTrend, budgetOverview, vendorPerformance, scorecardStats, spendForecast, cycleTime };
  }

  private async _getScorecardStats(tenantId: string) {
    const scorecards = await prisma.supplierScorecard.findMany({ where: { tenantId } });
    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) latestByVendor.set(sc.vendorId, sc);
    }
    const latest = Array.from(latestByVendor.values());
    return {
      totalScorecards: scorecards.length,
      vendorsScored: latestByVendor.size,
      avgOverall: latest.length > 0 ? Math.round(latest.reduce((s, sc) => s + Number(sc.overallScore || 0), 0) / latest.length * 100) / 100 : 0,
      avgQuality: latest.length > 0 ? Math.round(latest.reduce((s, sc) => s + Number(sc.qualityScore || 0), 0) / latest.length * 100) / 100 : 0,
      avgDelivery: latest.length > 0 ? Math.round(latest.reduce((s, sc) => s + Number(sc.deliveryScore || 0), 0) / latest.length * 100) / 100 : 0,
    };
  }
}
