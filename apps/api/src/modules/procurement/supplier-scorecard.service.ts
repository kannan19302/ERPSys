import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class SupplierScorecardService {
  async list(tenantId: string, params: PaginationParams & { vendorId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.vendorId) where.vendorId = params.vendorId;

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.supplierScorecard.findMany({ where, skip, take, orderBy: orderBy as any, include: { vendor: { select: { name: true } } } }),
      prisma.supplierScorecard.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getById(tenantId: string, id: string) {
    const scorecard = await prisma.supplierScorecard.findFirst({ where: { id, tenantId }, include: { vendor: true } });
    if (!scorecard) throw new NotFoundException('Scorecard not found');
    return scorecard;
  }

  async computeAndSave(tenantId: string, vendorId: string, periodStart: string, periodEnd: string, notes?: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const receipts = await prisma.purchaseReceipt.findMany({
      where: {
        tenantId,
        purchaseOrder: { vendorId },
        receivedDate: { gte: startDate, lte: endDate },
      },
      include: { lineItems: true, purchaseOrder: { select: { orderDate: true, poNumber: true } } },
    });

    const totalReceipts = receipts.length;
    let onTimeCount = 0;
    let totalUnitsReceived = 0;
    let defectiveUnits = 0;

    for (const receipt of receipts) {
      if (receipt.purchaseOrder?.orderDate) {
        const deliveryDiff = (receipt.receivedDate.getTime() - receipt.purchaseOrder.orderDate.getTime()) / (1000 * 60 * 60 * 24);
        if (deliveryDiff <= 0) onTimeCount++;
      }
      for (const item of receipt.lineItems) {
        totalUnitsReceived += Number(item.acceptedQty || 0) + Number(item.rejectedQty || 0);
        defectiveUnits += Number(item.rejectedQty || 0);
      }
    }

    const qualityScore = totalUnitsReceived > 0 ? Math.round(((totalUnitsReceived - defectiveUnits) / totalUnitsReceived) * 100 * 100) / 100 : 100;
    const deliveryScore = totalReceipts > 0 ? Math.round((onTimeCount / totalReceipts) * 100 * 100) / 100 : 100;

    const items = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { tenantId, vendorId } },
      include: { purchaseOrder: { select: { status: true } } },
    });
    const orderedQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);
    const receivedQty = items.reduce((sum, i) => sum + Number(i.receivedQty), 0);
    const fillRateScore = orderedQty > 0 ? Math.round((receivedQty / orderedQty) * 100 * 100) / 100 : 100;

    const overallScore = Math.round((qualityScore * 0.4 + deliveryScore * 0.35 + fillRateScore * 0.25) * 100) / 100;

    return prisma.supplierScorecard.create({
      data: {
        tenantId, vendorId,
        periodStart: startDate,
        periodEnd: endDate,
        qualityScore, deliveryScore, fillRateScore, overallScore,
        onTimeDeliveries: onTimeCount,
        lateDeliveries: totalReceipts - onTimeCount,
        defectiveUnits,
        totalUnitsReceived,
        notes,
      },
      include: { vendor: { select: { name: true } } },
    });
  }

  async getVendorTrend(tenantId: string, vendorId: string, lastN: number = 6) {
    const scorecards = await prisma.supplierScorecard.findMany({
      where: { tenantId, vendorId },
      orderBy: { periodStart: 'desc' },
      take: lastN,
    });

    return {
      vendorId,
      scorecards: scorecards.reverse(),
      trend: {
        quality: scorecards.map(s => Number(s.qualityScore || 0)),
        delivery: scorecards.map(s => Number(s.deliveryScore || 0)),
        fillRate: scorecards.map(s => Number(s.fillRateScore || 0)),
        overall: scorecards.map(s => Number(s.overallScore || 0)),
        labels: scorecards.map(s => `${s.periodStart.toISOString().substring(0, 7)}`).reverse(),
      },
    };
  }

  async getStats(tenantId: string) {
    const scorecards = await prisma.supplierScorecard.findMany({ where: { tenantId } });
    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    const latestScores = Array.from(latestByVendor.values());
    const avgOverall = latestScores.length > 0 ? Math.round(latestScores.reduce((s, sc) => s + Number(sc.overallScore || 0), 0) / latestScores.length * 100) / 100 : 0;

    return {
      totalScorecards: scorecards.length,
      vendorsScored: latestByVendor.size,
      averageOverallScore: avgOverall,
      qualityAvg: Math.round(latestScores.reduce((s, sc) => s + Number(sc.qualityScore || 0), 0) / (latestScores.length || 1) * 100) / 100,
      deliveryAvg: Math.round(latestScores.reduce((s, sc) => s + Number(sc.deliveryScore || 0), 0) / (latestScores.length || 1) * 100) / 100,
      fillRateAvg: Math.round(latestScores.reduce((s, sc) => s + Number(sc.fillRateScore || 0), 0) / (latestScores.length || 1) * 100) / 100,
    };
  }
}
