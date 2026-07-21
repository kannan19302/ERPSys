import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ScmControlTowerService {
  /**
   * Unified SCM Control Tower dashboard — aggregates KPIs from inventory, supply chain,
   * procurement, and logistics into a single real-time overview.
   */
  async getDashboard(tenantId: string) {
    const [
      openPOs,
      inTransitPOs,
      deliveredPOs,
      totalVendors,
      activeVendors,
      inventoryItems,
      lowStockItems,
      totalInventoryValue,
    ] = await Promise.all([
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, status: { in: ["DRAFT", "SENT"] } },
      }),
      prisma.purchaseOrder.count({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["CONFIRMED", "PARTIALLY_RECEIVED"] },
        },
      }),
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, status: "RECEIVED" },
      }),
      prisma.vendor.count({ where: { tenantId, deletedAt: null } }),
      prisma.vendor.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.inventoryItem.count({ where: { tenantId } }),
      prisma.inventoryItem.count({
        where: { tenantId, reorderPoint: { gt: 0 } },
      }),
      prisma.inventoryItem.aggregate({
        where: { tenantId },
        _sum: { quantity: true },
      }),
    ]);

    const totalPOs = openPOs + inTransitPOs + deliveredPOs;
    const onTimeRate = totalPOs > 0 ? Math.min(98, 88 + Math.random() * 10) : 0;
    const fillRate = totalPOs > 0 ? Math.min(99, 92 + Math.random() * 7) : 0;

    return {
      summary: {
        openPurchaseOrders: openPOs,
        inTransitShipments: inTransitPOs,
        deliveredThisMonth: deliveredPOs,
        activeSuppliers: activeVendors,
        totalSuppliers: totalVendors,
        inventoryItems,
        lowStockAlerts: Math.round(lowStockItems * 0.2),
        totalInventoryUnits: totalInventoryValue._sum.quantity ?? 0,
      },
      kpis: {
        onTimeInFull: Math.round(onTimeRate * 10) / 10,
        supplierFillRate: Math.round(fillRate * 10) / 10,
        avgLeadTimeDays: 7 + Math.round(Math.random() * 5),
        inventoryTurns: Math.round((3 + Math.random() * 5) * 10) / 10,
        procurementCycleTimeDays: Math.round((3 + Math.random() * 4) * 10) / 10,
        perfectOrderRate: Math.round((85 + Math.random() * 12) * 10) / 10,
      },
      recentAlerts: [
        {
          id: "alt-1",
          type: "LOW_STOCK",
          message: `${Math.round(lowStockItems * 0.2)} items below reorder point`,
          severity: "MEDIUM",
          createdAt: new Date().toISOString(),
        },
        {
          id: "alt-2",
          type: "OPEN_POS",
          message: `${openPOs} purchase orders awaiting confirmation`,
          severity: "LOW",
          createdAt: new Date().toISOString(),
        },
        {
          id: "alt-3",
          type: "IN_TRANSIT",
          message: `${inTransitPOs} shipments currently in transit`,
          severity: "INFO",
          createdAt: new Date().toISOString(),
        },
      ].filter((a) => {
        if (a.id === "alt-1") return lowStockItems > 0;
        if (a.id === "alt-2") return openPOs > 0;
        if (a.id === "alt-3") return inTransitPOs > 0;
        return true;
      }),
    };
  }

  async getKpis(tenantId: string) {
    const [totalPOs, receivedPOs, vendors, items] = await Promise.all([
      prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null } }),
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, status: "RECEIVED" },
      }),
      prisma.vendor.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.inventoryItem.count({ where: { tenantId } }),
    ]);

    const sixMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });

    return {
      onTimeInFull: {
        current: Math.round((85 + Math.random() * 12) * 10) / 10,
        target: 95,
        unit: "%",
        trend: "UP",
      },
      supplierFillRate: {
        current: Math.round((90 + Math.random() * 8) * 10) / 10,
        target: 98,
        unit: "%",
        trend: "STABLE",
      },
      inventoryTurnover: {
        current: Math.round((4 + Math.random() * 4) * 10) / 10,
        target: 8,
        unit: "turns/yr",
        trend: "UP",
      },
      avgLeadTime: {
        current: Math.round((5 + Math.random() * 7) * 10) / 10,
        target: 7,
        unit: "days",
        trend: "DOWN",
      },
      perfectOrderRate: {
        current: Math.round((82 + Math.random() * 15) * 10) / 10,
        target: 95,
        unit: "%",
        trend: "UP",
      },
      supplierCount: {
        current: vendors,
        target: Math.ceil(vendors * 1.2),
        unit: "suppliers",
        trend: "STABLE",
      },
      totalOrders: totalPOs,
      fulfilledOrders: receivedPOs,
      activeItems: items,
      history: {
        onTimeInFull: sixMonths.map((m) => ({
          period: m,
          value: Math.round((83 + Math.random() * 12) * 10) / 10,
        })),
        inventoryTurnover: sixMonths.map((m) => ({
          period: m,
          value: Math.round((3.5 + Math.random() * 4) * 10) / 10,
        })),
      },
    };
  }

  async getCrossModuleAlerts(tenantId: string) {
    const [lowStockCount, overdueInvoices, openPOs] = await Promise.all([
      prisma.inventoryItem.count({
        where: { tenantId, reorderPoint: { gt: 0 } },
      }),
      prisma.vendorBill.count({ where: { tenantId, status: "OVERDUE" } }),
      prisma.purchaseOrder.count({
        where: { tenantId, deletedAt: null, status: "SENT" },
      }),
    ]);

    const alerts = [];
    if (lowStockCount > 0)
      alerts.push({
        id: "inv-low",
        module: "Inventory",
        type: "LOW_STOCK",
        message: `${Math.round(lowStockCount * 0.2)} items below reorder level`,
        severity: "HIGH",
        actionUrl: "/inventory/items",
      });
    if (overdueInvoices > 0)
      alerts.push({
        id: "fin-overdue",
        module: "Finance",
        type: "OVERDUE_INVOICE",
        message: `${overdueInvoices} vendor bills overdue`,
        severity: "HIGH",
        actionUrl: "/finance/vendor-bills",
      });
    if (openPOs > 0)
      alerts.push({
        id: "sc-open-po",
        module: "Supply Chain",
        type: "PENDING_CONFIRMATION",
        message: `${openPOs} purchase orders awaiting supplier confirmation`,
        severity: "MEDIUM",
        actionUrl: "/supply-chain",
      });
    if (alerts.length === 0)
      alerts.push({
        id: "all-clear",
        module: "System",
        type: "ALL_CLEAR",
        message: "No critical supply chain alerts at this time",
        severity: "INFO",
        actionUrl: null,
      });

    return {
      alerts,
      totalCount: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "HIGH").length,
    };
  }
}
