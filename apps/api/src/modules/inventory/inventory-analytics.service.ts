import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryAnalyticsService {

  // ─── Inventory Health Score ───────────────────────────────────────────────

  async getInventoryHealthScore(tenantId: string, warehouseId?: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const binWhere: Prisma.InventoryItemBinWhereInput = { tenantId };
    if (warehouseId) binWhere.warehouseId = warehouseId;

    const ledgerWhere: Prisma.StockLedgerEntryWhereInput = { tenantId, createdAt: { gte: thirtyDaysAgo } };
    if (warehouseId) ledgerWhere.warehouseId = warehouseId;

    const [totalProducts, activeProductIds, lowStockBins, holdCount] = await Promise.all([
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.stockLedgerEntry.groupBy({
        by: ['productId'],
        where: { ...ledgerWhere, qtyOut: { gt: 0 } },
        _count: { _all: true },
      }),
      prisma.inventoryItemBin.findMany({
        where: { ...binWhere, quantity: { lt: 10 } },
        select: { productId: true },
      }),
      prisma.inventoryHold.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    const activeProducts = activeProductIds.length;
    const lowStockProducts = new Set(lowStockBins.map((b) => b.productId)).size;
    const movingProductRate = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0;
    const holdPenalty = Math.min(holdCount * 2, 20);
    const lowStockPenalty = Math.min(lowStockProducts, 15);
    const healthScore = Math.max(0, movingProductRate - holdPenalty - lowStockPenalty);

    return { healthScore, totalProducts, activeProducts, movingProductRate, lowStockProducts, activeHolds: holdCount };
  }

  // ─── Slow-Moving Inventory ────────────────────────────────────────────────

  async getSlowMovingInventory(tenantId: string, warehouseId?: string, days = 90) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const ledgerWhere: Prisma.StockLedgerEntryWhereInput = {
      tenantId,
      qtyOut: { gt: 0 },
      createdAt: { gte: sinceDate },
    };
    if (warehouseId) ledgerWhere.warehouseId = warehouseId;

    const binWhere: Prisma.InventoryItemBinWhereInput = { tenantId, quantity: { gt: 0 } };
    if (warehouseId) binWhere.warehouseId = warehouseId;

    const [moved, bins] = await Promise.all([
      prisma.stockLedgerEntry.groupBy({ by: ['productId'], where: ledgerWhere, _sum: { qtyOut: true } }),
      prisma.inventoryItemBin.groupBy({ by: ['productId', 'warehouseId'], where: binWhere, _sum: { quantity: true } }),
    ]);

    const movedIds = new Set(moved.map((m) => m.productId));
    const slowMovers = bins
      .filter((b) => !movedIds.has(b.productId) && Number(b._sum.quantity ?? 0) > 0)
      .map((b) => ({ productId: b.productId, warehouseId: b.warehouseId, onHandQty: Number(b._sum.quantity ?? 0) }));

    return { period: `${days}d`, slowMoverCount: slowMovers.length, items: slowMovers };
  }

  // ─── Days Inventory Outstanding ───────────────────────────────────────────

  async getDaysInventoryOutstanding(tenantId: string, warehouseId?: string) {
    const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const ledgerWhere: Prisma.StockLedgerEntryWhereInput = { tenantId, qtyOut: { gt: 0 }, createdAt: { gte: ninety } };
    if (warehouseId) ledgerWhere.warehouseId = warehouseId;

    const binWhere: Prisma.InventoryItemBinWhereInput = { tenantId, quantity: { gt: 0 } };
    if (warehouseId) binWhere.warehouseId = warehouseId;

    const [avgDaily, onHandTotals] = await Promise.all([
      prisma.stockLedgerEntry.groupBy({ by: ['productId'], where: ledgerWhere, _sum: { qtyOut: true } }),
      prisma.inventoryItemBin.groupBy({ by: ['productId'], where: binWhere, _sum: { quantity: true } }),
    ]);

    const dailyMap = new Map(avgDaily.map((r) => [r.productId, Number(r._sum.qtyOut ?? 0) / 90]));
    const results = onHandTotals.map((b) => {
      const daily = dailyMap.get(b.productId) ?? 0;
      const onHand = Number(b._sum.quantity ?? 0);
      return { productId: b.productId, onHand, avgDailySales: daily, daysInventoryOutstanding: daily > 0 ? onHand / daily : null };
    });

    const withDio = results.filter((r) => r.daysInventoryOutstanding !== null);
    const avgDio = withDio.length > 0
      ? withDio.reduce((acc, r) => acc + r.daysInventoryOutstanding!, 0) / withDio.length
      : 0;

    return { averageDio: Math.round(avgDio), products: results };
  }

  // ─── Fill Rate Analytics ──────────────────────────────────────────────────

  async getFillRateReport(tenantId: string, days = 30) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const waves = await prisma.pickWave.findMany({
      where: { tenantId, createdAt: { gte: sinceDate } },
      include: { items: true, orders: true },
    });

    const completed = waves.filter((w) => w.status === 'COMPLETED');
    const partial = waves.filter((w) => w.status === 'PARTIAL');
    const pending = waves.filter((w) => !['COMPLETED', 'PARTIAL', 'CANCELLED'].includes(w.status));
    const totalOrders = waves.reduce((a, w) => a + w.orders.length, 0);
    const fulfilledOrders = completed.reduce((a, w) => a + w.orders.length, 0);

    return {
      period: `${days}d`,
      fillRate: totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 100,
      totalPickWaves: waves.length,
      completedWaves: completed.length,
      partialWaves: partial.length,
      pendingWaves: pending.length,
      totalOrderLines: totalOrders,
      fulfilledOrderLines: fulfilledOrders,
    };
  }

  // ─── Inbound / Outbound Volume Trends ────────────────────────────────────

  async getVolumeTrends(tenantId: string, warehouseId?: string, days = 30) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: Prisma.StockLedgerEntryWhereInput = { tenantId, createdAt: { gte: sinceDate } };
    if (warehouseId) where.warehouseId = warehouseId;

    const entries = await prisma.stockLedgerEntry.findMany({
      where,
      select: { qtyIn: true, qtyOut: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDate: Record<string, { inbound: number; outbound: number }> = {};
    for (const e of entries) {
      const date = e.createdAt.toISOString().slice(0, 10);
      if (!byDate[date]) byDate[date] = { inbound: 0, outbound: 0 };
      byDate[date].inbound += Number(e.qtyIn ?? 0);
      byDate[date].outbound += Number(e.qtyOut ?? 0);
    }

    const totalIn = entries.reduce((a, e) => a + Number(e.qtyIn ?? 0), 0);
    const totalOut = entries.reduce((a, e) => a + Number(e.qtyOut ?? 0), 0);

    return {
      period: `${days}d`,
      totalInbound: totalIn,
      totalOutbound: totalOut,
      netMovement: totalIn - totalOut,
      daily: Object.entries(byDate).map(([date, v]) => ({ date, ...v })),
    };
  }

  // ─── Shrinkage / Loss Analytics ───────────────────────────────────────────

  async getShrinkageReport(tenantId: string, warehouseId?: string, days = 90) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: Prisma.StockLedgerEntryWhereInput = {
      tenantId,
      voucherType: 'CYCLE_COUNT',
      createdAt: { gte: sinceDate },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const adjustments = await prisma.stockLedgerEntry.findMany({
      where,
      select: { productId: true, qtyIn: true, qtyOut: true, remarks: true },
    });

    const negative = adjustments.filter((a) => Number(a.qtyOut ?? 0) > Number(a.qtyIn ?? 0));
    const totalShrinkage = negative.reduce((acc, a) => acc + (Number(a.qtyOut ?? 0) - Number(a.qtyIn ?? 0)), 0);

    const byProduct: Record<string, number> = {};
    for (const a of negative) {
      byProduct[a.productId] = (byProduct[a.productId] ?? 0) + (Number(a.qtyOut ?? 0) - Number(a.qtyIn ?? 0));
    }

    return {
      period: `${days}d`,
      totalAdjustments: adjustments.length,
      negativeAdjustments: negative.length,
      totalShrinkage,
      byProduct: Object.entries(byProduct)
        .map(([productId, shrinkage]) => ({ productId, shrinkage }))
        .sort((a, b) => b.shrinkage - a.shrinkage),
    };
  }

  // ─── Warehouse Capacity Utilization ──────────────────────────────────────

  async getCapacityUtilization(tenantId: string, warehouseId?: string) {
    const where: Prisma.InventoryItemBinWhereInput = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;

    const [bins, warehouses] = await Promise.all([
      prisma.inventoryItemBin.groupBy({
        by: ['warehouseId'],
        where,
        _count: { _all: true },
        _sum: { quantity: true },
      }),
      prisma.warehouse.findMany({
        where: { tenantId, ...(warehouseId ? { id: warehouseId } : {}) },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
    return bins.map((b) => ({
      warehouseId: b.warehouseId,
      warehouse: warehouseMap.get(b.warehouseId) ?? null,
      occupiedBins: b._count._all,
      totalQuantity: Number(b._sum.quantity ?? 0),
    }));
  }

  // ─── Multi-Warehouse Comparison Dashboard ────────────────────────────────

  async getMultiWarehouseComparison(tenantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [warehouseStocks, warehouseMovements, warehouses] = await Promise.all([
      prisma.inventoryItemBin.groupBy({
        by: ['warehouseId'],
        where: { tenantId },
        _sum: { quantity: true },
        _count: { _all: true },
      }),
      prisma.stockLedgerEntry.groupBy({
        by: ['warehouseId'],
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        _sum: { qtyIn: true, qtyOut: true },
        _count: { _all: true },
      }),
      prisma.warehouse.findMany({ where: { tenantId }, select: { id: true, name: true, code: true } }),
    ]);

    const stockMap = new Map(warehouseStocks.map((s) => [s.warehouseId, s]));
    const movementMap = new Map(warehouseMovements.map((m) => [m.warehouseId, m]));
    const warehouseInfoMap = new Map(warehouses.map((w) => [w.id, w]));
    const allIds = new Set([...stockMap.keys(), ...movementMap.keys()]);

    return Array.from(allIds).map((wId) => ({
      warehouseId: wId,
      warehouse: warehouseInfoMap.get(wId) ?? null,
      onHandQty: Number(stockMap.get(wId)?._sum.quantity ?? 0),
      occupiedBins: stockMap.get(wId)?._count._all ?? 0,
      inbound30d: Number(movementMap.get(wId)?._sum.qtyIn ?? 0),
      outbound30d: Number(movementMap.get(wId)?._sum.qtyOut ?? 0),
      transactions30d: movementMap.get(wId)?._count._all ?? 0,
    }));
  }

  // ─── Aggregate Dashboard ─────────────────────────────────────────────────

  async getAnalyticsDashboard(tenantId: string) {
    const [healthScore, slowMovers, trends] = await Promise.all([
      this.getInventoryHealthScore(tenantId),
      this.getSlowMovingInventory(tenantId),
      this.getVolumeTrends(tenantId),
    ]);
    return {
      healthScore: healthScore.healthScore,
      slowMoverCount: slowMovers.slowMoverCount,
      netMovement30d: trends.netMovement,
      totalInbound30d: trends.totalInbound,
      totalOutbound30d: trends.totalOutbound,
    };
  }
}
