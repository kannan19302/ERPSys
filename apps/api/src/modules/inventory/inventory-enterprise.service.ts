import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class InventoryEnterpriseService {
  async getInventoryValuation(
    tenantId: string,
    asOf?: string,
    valuationMethod?: string,
  ) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { inventoryItems: true },
    });
    const totalItems = products.reduce(
      (s, p) =>
        s + p.inventoryItems.reduce((ss, ii) => ss + Number(ii.quantity), 0),
      0,
    );
    const totalValue = products.reduce((s, p) => {
      const qty = p.inventoryItems.reduce(
        (ss, ii) => ss + Number(ii.quantity),
        0,
      );
      const cost = Number(p.costPrice || 0);
      return s + qty * cost;
    }, 0);
    return {
      asOf: asOf || new Date().toISOString(),
      valuationMethod: valuationMethod || "STANDARD",
      totalProducts: products.length,
      totalItems,
      totalValue,
      averageUnitCost:
        totalItems > 0 ? +(totalValue / totalItems).toFixed(2) : 0,
    };
  }

  async getStockAgingAnalysis(
    tenantId: string,
    asOf?: string,
    agingBuckets?: string,
  ) {
    const items = await prisma.stockLedgerEntry.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });
    const buckets = {
      "0-30": 0,
      "31-60": 0,
      "61-90": 0,
      "91-180": 0,
      "180+": 0,
    };
    for (const item of items) {
      const age = Math.floor(
        (Date.now() - new Date(item.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const qty = Number(item.quantity) || 0;
      if (age <= 30) buckets["0-30"] += qty;
      else if (age <= 60) buckets["31-60"] += qty;
      else if (age <= 90) buckets["61-90"] += qty;
      else if (age <= 180) buckets["91-180"] += qty;
      else buckets["180+"] += qty;
    }
    return {
      asOf: asOf || new Date().toISOString(),
      totalItems: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      buckets,
    };
  }

  async getInventoryTurnover(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId };
    if (periodStart)
      where.createdAt = { ...where.createdAt, gte: new Date(periodStart) };
    if (periodEnd)
      where.createdAt = { ...where.createdAt, lte: new Date(periodEnd) };
    const products = await prisma.product.findMany({ where: { tenantId } });
    const salesOrders = await prisma.salesOrder.findMany({
      where,
      include: { lineItems: true },
    });
    const cogs = salesOrders.reduce(
      (s, so) =>
        s +
        so.lineItems.reduce(
          (ss, item) =>
            ss + Number(item.quantity || 0) * Number(item.unitPrice || 0),
          0,
        ),
      0,
    );
    const avgInventory =
      products.reduce((s, p) => s + Number(p.costPrice || 0), 0) /
      Math.max(products.length, 1);
    return {
      periodStart,
      periodEnd,
      cogs,
      averageInventory: avgInventory,
      turnoverRatio: avgInventory > 0 ? +(cogs / avgInventory).toFixed(2) : 0,
      daysToSell:
        avgInventory > 0 ? +(365 / (cogs / avgInventory)).toFixed(1) : 0,
    };
  }

  async getStockoutAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const where: any = { tenantId, status: "BACKORDERED" };
    if (periodStart)
      where.createdAt = { ...where.createdAt, gte: new Date(periodStart) };
    if (periodEnd)
      where.createdAt = { ...where.createdAt, lte: new Date(periodEnd) };
    const backorders = await prisma.salesOrder.findMany({
      where,
      include: { lineItems: true },
    });
    const stockoutCount = backorders.length;
    const lostRevenue = backorders.reduce(
      (s, bo) =>
        s +
        bo.lineItems.reduce(
          (ss, item) =>
            ss + Number(item.quantity || 0) * Number(item.unitPrice || 0),
          0,
        ),
      0,
    );
    return {
      periodStart,
      periodEnd,
      stockoutCount,
      lostRevenue,
      totalBackorderedItems: backorders.reduce(
        (s, bo) =>
          s +
          bo.lineItems.reduce(
            (ss, item) => ss + (Number(item.quantity) || 0),
            0,
          ),
        0,
      ),
    };
  }

  async getWarehouseCapacityUtilization(
    tenantId: string,
    warehouseId?: string,
  ) {
    const where: any = { tenantId };
    if (warehouseId) where.id = warehouseId;
    const warehouses = await prisma.warehouse.findMany({
      where,
      include: { binLocations: { include: { inventoryBins: true } } },
    });
    return warehouses.map((w) => {
      const totalCapacity = w.binLocations.reduce(
        (s, b) => s + Number(b.capacity || 100),
        0,
      );
      const usedCapacity = w.binLocations.reduce(
        (s, b) =>
          s +
          b.inventoryBins.reduce((ss, i) => ss + Number(i.quantity || 0), 0),
        0,
      );
      return {
        id: w.id,
        name: w.name,
        totalCapacity,
        usedCapacity,
        utilizationRate:
          totalCapacity > 0
            ? +((usedCapacity / totalCapacity) * 100).toFixed(1)
            : 0,
        binCount: w.binLocations.length,
      };
    });
  }

  async getReOrderPointOptimization(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { inventoryItems: true },
    });
    return products.map((p) => {
      const totalStock = p.inventoryItems.reduce(
        (s, ii) => s + Number(ii.quantity),
        0,
      );
      const configuredReorderPoint = p.inventoryItems.reduce(
        (s, ii) => s + Number(ii.reorderPoint || 0),
        0,
      );
      const leadTimeDays = 7;
      const avgDailyDemand = 5;
      const safetyStock = leadTimeDays * avgDailyDemand * 0.5;
      const reorderPoint =
        configuredReorderPoint > 0
          ? configuredReorderPoint
          : Math.ceil(leadTimeDays * avgDailyDemand + safetyStock);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: totalStock,
        reorderPoint,
        safetyStock,
        leadTimeDays,
        status:
          totalStock <= reorderPoint
            ? "BELOW_REORDER"
            : totalStock <= reorderPoint * 1.5
              ? "LOW"
              : "HEALTHY",
      };
    });
  }

  async getABCXYZAnalysis(tenantId: string, asOf?: string) {
    const products = await prisma.product.findMany({
      where: { tenantId },
      include: { inventoryItems: true },
    });
    const withValue = products.map((p) => ({
      ...p,
      totalValue:
        Number(p.costPrice || 0) *
        p.inventoryItems.reduce((s, ii) => s + Number(ii.quantity), 0),
    }));
    const sorted = [...withValue].sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sorted.reduce((s, p) => s + p.totalValue, 0);
    const abcClassification = sorted.map((p) => ({
      ...p,
      cumulativePercentage:
        totalValue > 0
          ? +(
              (sorted
                .filter((x) => x.totalValue >= p.totalValue)
                .reduce((s, x) => s + x.totalValue, 0) /
                totalValue) *
              100
            ).toFixed(1)
          : 0,
    }));
    return {
      asOf: asOf || new Date().toISOString(),
      totalProducts: products.length,
      totalValue,
      aItems: sorted.filter((p) => p.totalValue >= totalValue * 0.2).length,
      bItems: sorted.filter(
        (p) =>
          p.totalValue < totalValue * 0.2 && p.totalValue >= totalValue * 0.05,
      ).length,
      cItems: sorted.filter((p) => p.totalValue < totalValue * 0.05).length,
    };
  }

  async getInventoryDashboardKpis(tenantId: string) {
    const [products, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId },
        include: { inventoryItems: true },
      }),
      prisma.warehouse.findMany({
        where: { tenantId },
        include: { binLocations: true },
      }),
    ]);
    const totalStock = products.reduce(
      (s, p) =>
        s + p.inventoryItems.reduce((ss, ii) => ss + Number(ii.quantity), 0),
      0,
    );
    const totalValue = products.reduce(
      (s, p) =>
        s +
        Number(p.costPrice || 0) *
          p.inventoryItems.reduce((ss, ii) => ss + Number(ii.quantity), 0),
      0,
    );
    return {
      totalProducts: products.length,
      totalWarehouses: warehouses.length,
      totalItemsInStock: totalStock,
      totalInventoryValue: totalValue,
      productsBelowReorder: products.filter(
        (p) =>
          p.inventoryItems.reduce((ss, ii) => ss + Number(ii.quantity), 0) <=
          p.inventoryItems.reduce(
            (ss, ii) => ss + Number(ii.reorderPoint || 0),
            0,
          ),
      ).length,
      warehouseUtilization:
        warehouses.length > 0
          ? +(
              (warehouses.reduce((s, w) => s + w.binLocations.length, 0) /
                Math.max(warehouses.length, 1) /
                10) *
              100
            ).toFixed(1)
          : 0,
    };
  }

  async exportInventoryReport(
    tenantId: string,
    reportType: string,
    format: string,
    params?: any,
  ) {
    let data: any;
    switch (reportType) {
      case "valuation":
        data = await this.getInventoryValuation(tenantId, params?.asOf);
        break;
      case "aging":
        data = await this.getStockAgingAnalysis(tenantId, params?.asOf);
        break;
      case "turnover":
        data = await this.getInventoryTurnover(
          tenantId,
          params?.periodStart,
          params?.periodEnd,
        );
        break;
      case "abc-xyz":
        data = await this.getABCXYZAnalysis(tenantId, params?.asOf);
        break;
      case "kpis":
        data = await this.getInventoryDashboardKpis(tenantId);
        break;
      default:
        data = await this.getInventoryDashboardKpis(tenantId);
    }
    return { reportType, format, exportedAt: new Date().toISOString(), data };
  }
}
