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
    const [spendByVendor, spendByStatus, monthlyTrend, budgetOverview, vendorPerformance, scorecardStats] = await Promise.all([
      this.getSpendByVendor(tenantId),
      this.getSpendByStatus(tenantId),
      this.getMonthlySpendTrend(tenantId),
      this.getBudgetOverview(tenantId),
      this.getVendorPerformanceSummary(tenantId),
      this._getScorecardStats(tenantId),
    ]);

    return { spendByVendor, spendByStatus, monthlyTrend, budgetOverview, vendorPerformance, scorecardStats };
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
