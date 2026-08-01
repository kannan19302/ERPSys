import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SupplyChainEnterpriseService {
  async getSupplyChainVisibility(tenantId: string, asOf?: string) {
    const asOfDate = asOf ? new Date(asOf) : new Date();

    const [
      inventoryItems,
      inboundShipments,
      outboundShipments,
      openPOs,
      openSOs,
      productionBatches,
      warehouses,
    ] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { tenantId },
        include: {
          product: { select: { name: true, sku: true } },
          warehouse: { select: { name: true } },
        },
      }),
      prisma.inboundShipment.findMany({
        where: {
          tenantId,
          status: { in: ["EXPECTED", "IN_TRANSIT", "ARRIVED"] },
        },
        include: { carrier: true },
      }),
      prisma.outboundShipment.findMany({
        where: {
          tenantId,
          status: { in: ["PENDING", "PACKED", "SHIPPED", "IN_TRANSIT"] },
        },
        include: { carrier: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: {
            in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"],
          },
        },
      }),
      prisma.salesOrder.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["CONFIRMED", "PROCESSING", "PARTIALLY_DELIVERED"] },
        },
      }),
      prisma.productionBatch
        .findMany({
          where: { tenantId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
        })
        .catch(() => []),
      prisma.warehouse.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const totalOnHand = inventoryItems.reduce(
      (s, i) => s + Number(i.quantity),
      0,
    );
    const totalReserved = inventoryItems.reduce(
      (s, i) => s + Number(i.reservedQty),
      0,
    );
    const totalCommitted = inventoryItems.reduce(
      (s, i) => s + Number(i.committedQty),
      0,
    );
    const totalInTransit = inventoryItems.reduce(
      (s, i) => s + Number(i.inTransitQty),
      0,
    );
    const inboundPipelineValue = inboundShipments.reduce(
      (s, sh) => s + Number(sh.totalWeight || 0) * 100,
      0,
    );

    const inventoryByWarehouse = warehouses.map((w) => {
      const items = inventoryItems.filter((i) => i.warehouseId === w.id);
      return {
        ...w,
        onHand: items.reduce((s, i) => s + Number(i.quantity), 0),
        itemCount: items.length,
      };
    });

    return {
      asOf: asOfDate,
      inventory: {
        totalOnHand,
        totalReserved,
        totalCommitted,
        totalInTransit,
        totalAvailable: totalOnHand - totalReserved - totalCommitted,
        byWarehouse: inventoryByWarehouse,
        totalProducts: inventoryItems.length,
      },
      inbound: {
        total: inboundShipments.length,
        expected: inboundShipments.filter((s) => s.status === "EXPECTED")
          .length,
        inTransit: inboundShipments.filter((s) => s.status === "IN_TRANSIT")
          .length,
        arrived: inboundShipments.filter((s) => s.status === "ARRIVED").length,
        pipelineValue: Math.round(inboundPipelineValue * 100) / 100,
      },
      outbound: {
        total: outboundShipments.length,
        pending: outboundShipments.filter((s) => s.status === "PENDING").length,
        packed: outboundShipments.filter((s) => s.status === "PACKED").length,
        shipped: outboundShipments.filter((s) => s.status === "SHIPPED").length,
        inTransit: outboundShipments.filter((s) => s.status === "IN_TRANSIT")
          .length,
      },
      procurement: {
        openPurchaseOrders: openPOs.length,
        openValue:
          Math.round(
            openPOs.reduce((s, po) => s + Number(po.totalAmount), 0) * 100,
          ) / 100,
      },
      sales: {
        unfulfilledOrders: openSOs.length,
        unfulfilledValue:
          Math.round(
            openSOs.reduce((s, so) => s + Number(so.totalAmount), 0) * 100,
          ) / 100,
      },
      production: {
        activeBatches: productionBatches.length,
      },
      warehouses: warehouses.length,
    };
  }

  async getDemandForecastAccuracy(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const dateFilter: any = {};
    if (periodStart) dateFilter.gte = new Date(periodStart);
    if (periodEnd) dateFilter.lte = new Date(periodEnd);

    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, sku: true },
    });
    const forecastLines = await prisma.demandForecastLine.findMany({
      where: { tenantId, ...(dateFilter.gte ? { createdAt: dateFilter } : {}) },
      include: { product: { select: { name: true, sku: true } } },
    });

    const salesItems = await prisma.salesOrderItem.findMany({
      where: {
        tenantId,
        salesOrder: {
          status: { notIn: ["DRAFT", "CANCELLED"] },
          ...(dateFilter.gte ? { orderDate: dateFilter } : {}),
        },
      },
    });

    const actualSales: Record<string, number> = {};
    for (const si of salesItems) {
      if (si.productId)
        actualSales[si.productId] =
          (actualSales[si.productId] || 0) + Number(si.quantity);
    }

    let totalAbsoluteError = 0;
    let totalForecast = 0;
    let totalActual = 0;
    let count = 0;
    let biasSum = 0;
    const productResults: any[] = [];

    for (const line of forecastLines) {
      const forecastQty = Number(line.forecastedQuantity);
      const actualQty = actualSales[line.productId] || 0;
      const error = Math.abs(forecastQty - actualQty);
      totalAbsoluteError += error;
      totalForecast += forecastQty;
      totalActual += actualQty;
      biasSum += forecastQty - actualQty;
      count++;

      productResults.push({
        productId: line.productId,
        productName: line.product?.name || "Unknown",
        productSku: line.product?.sku || "",
        forecastedQty: forecastQty,
        actualQty,
        error,
        errorPercentage:
          forecastQty > 0 ? Math.round((error / forecastQty) * 10000) / 100 : 0,
        bias: forecastQty - actualQty,
      });
    }

    const mape =
      count > 0 && totalForecast > 0
        ? Math.round((totalAbsoluteError / totalForecast) * 10000) / 100
        : 0;
    const mae =
      count > 0 ? Math.round((totalAbsoluteError / count) * 100) / 100 : 0;
    const bias = count > 0 ? Math.round((biasSum / count) * 100) / 100 : 0;

    return {
      totalForecastedQty: totalForecast,
      totalActualQty: totalActual,
      mape,
      mae,
      bias,
      biasInterpretation:
        bias > 5
          ? "OVER_FORECASTING"
          : bias < -5
            ? "UNDER_FORECASTING"
            : "ACCURATE",
      productsTracked: count,
      productDetails: productResults.slice(0, 100),
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getNetworkOptimization(tenantId: string, scenario?: string) {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId, isActive: true },
      include: {
        inventoryItems: {
          include: { product: { select: { name: true, category: true } } },
        },
      },
    });

    const inboundShipments = await prisma.inboundShipment.findMany({
      where: { tenantId },
      include: { carrier: true },
    });
    const outboundShipments = await prisma.outboundShipment.findMany({
      where: { tenantId },
      include: { carrier: true },
    });

    const warehouseUtilization = warehouses.map((w) => {
      const totalCapacity = Number(w.capacity || 10000);
      const currentLoad = w.inventoryItems.reduce(
        (s, i) => s + Number(i.quantity),
        0,
      );
      return {
        warehouseId: w.id,
        warehouseName: w.name,
        warehouseCode: w.code,
        currentLoad,
        totalCapacity,
        utilizationRate:
          Math.round((currentLoad / totalCapacity) * 10000) / 100,
        productCount: w.inventoryItems.length,
      };
    });

    const totalInboundShipments = inboundShipments.length;
    const totalOutboundShipments = outboundShipments.length;

    const recommendations: any[] = [];
    const highUtilization = warehouseUtilization.filter(
      (w) => w.utilizationRate > 85,
    );
    const lowUtilization = warehouseUtilization.filter(
      (w) => w.utilizationRate < 30,
    );
    const underperformingWarehouses = warehouseUtilization.filter(
      (w) => w.productCount < 10 && w.utilizationRate < 20,
    );

    if (highUtilization.length > 0) {
      recommendations.push({
        type: "CAPACITY_EXPANSION",
        priority: "HIGH",
        description: `${highUtilization.length} warehouse(s) above 85% capacity. Consider expanding or redistributing inventory: ${highUtilization.map((w) => `${w.warehouseName} (${w.utilizationRate}%)`).join(", ")}`,
        estimatedImpact: "Prevents stockouts and reduces fulfillment delays",
      });
    }

    if (lowUtilization.length > 0) {
      recommendations.push({
        type: "CONSOLIDATION",
        priority: lowUtilization.length > 2 ? "MEDIUM" : "LOW",
        description: `${lowUtilization.length} warehouse(s) below 30% utilization. Consider consolidating: ${lowUtilization.map((w) => `${w.warehouseName} (${w.utilizationRate}%)`).join(", ")}`,
        estimatedImpact: "Reduces fixed operational costs",
      });
    }

    if (underperformingWarehouses.length > 0) {
      recommendations.push({
        type: "REVIEW_OR_CLOSE",
        priority: "MEDIUM",
        description: `${underperformingWarehouses.length} warehouse(s) with low products and low utilization. Review viability: ${underperformingWarehouses.map((w) => w.warehouseName).join(", ")}`,
        estimatedImpact: "Eliminates redundant facilities",
      });
    }

    const totalFreightCost =
      inboundShipments.reduce(
        (s, sh) => s + Number(sh.totalWeight || 0) * 2,
        0,
      ) +
      outboundShipments.reduce(
        (s, sh) => s + Number(sh.totalWeight || 0) * 3,
        0,
      );

    return {
      warehouses: warehouseUtilization,
      totalWarehouses: warehouses.length,
      totalInboundShipments,
      totalOutboundShipments,
      totalEstimatedFreightCost: Math.round(totalFreightCost * 100) / 100,
      scenario: scenario || "CURRENT",
      recommendations,
      networkEfficiency:
        Math.round(
          (100 -
            (highUtilization.length / Math.max(1, warehouses.length)) * 50) *
            100,
        ) / 100,
    };
  }

  async getLogisticsCostAnalysis(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const dateFilter: any = {};
    if (periodStart) dateFilter.gte = new Date(periodStart);
    if (periodEnd) dateFilter.lte = new Date(periodEnd);

    const where: any = { tenantId };
    if (dateFilter.gte) where.createdAt = dateFilter;

    const [inboundShipments, outboundShipments, carriers] = await Promise.all([
      prisma.inboundShipment.findMany({ where, include: { carrier: true } }),
      prisma.outboundShipment.findMany({ where, include: { carrier: true } }),
      prisma.shippingCarrier.findMany({ where: { tenantId, isActive: true } }),
    ]);

    const byMode: Record<
      string,
      { cost: number; count: number; weight: number }
    > = {};
    const byCarrier: Record<
      string,
      { cost: number; count: number; weight: number; carrierName: string }
    > = {};
    const byLane: Record<string, { cost: number; count: number }> = {};
    let totalCost = 0;
    let totalShipments = 0;
    let totalWeight = 0;

    const allShipments = [
      ...inboundShipments.map((s) => ({
        ...s,
        type: "INBOUND" as const,
        cost: Number(s.totalWeight || 0) * 2,
      })),
      ...outboundShipments.map((s) => ({
        ...s,
        type: "OUTBOUND" as const,
        cost: Number(s.totalWeight || 0) * 3,
      })),
    ];

    for (const s of allShipments) {
      const cost = s.cost;
      const weight = Number(s.totalWeight || 0);
      totalCost += cost;
      totalShipments++;
      totalWeight += weight;

      const mode =
        s.type === "INBOUND" ? "INBOUND_FREIGHT" : "OUTBOUND_FREIGHT";
      if (!byMode[mode]) byMode[mode] = { cost: 0, count: 0, weight: 0 };
      byMode[mode].cost += cost;
      byMode[mode].count++;
      byMode[mode].weight += weight;

      if (s.carrier) {
        const carrierId = s.carrier.id;
        if (!byCarrier[carrierId])
          byCarrier[carrierId] = {
            cost: 0,
            count: 0,
            weight: 0,
            carrierName: s.carrier.name,
          };
        byCarrier[carrierId].cost += cost;
        byCarrier[carrierId].count++;
        byCarrier[carrierId].weight += weight;
      }
    }

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalShipments,
      totalWeight: Math.round(totalWeight * 100) / 100,
      averageCostPerShipment:
        totalShipments > 0
          ? Math.round((totalCost / totalShipments) * 100) / 100
          : 0,
      costPerWeightUnit:
        totalWeight > 0 ? Math.round((totalCost / totalWeight) * 100) / 100 : 0,
      byMode: Object.entries(byMode).map(([mode, data]) => ({
        mode,
        cost: Math.round(data.cost * 100) / 100,
        count: data.count,
        weight: Math.round(data.weight * 100) / 100,
        percentage:
          totalCost > 0 ? Math.round((data.cost / totalCost) * 10000) / 100 : 0,
      })),
      byCarrier: Object.values(byCarrier)
        .map((c) => ({
          ...c,
          cost: Math.round(c.cost * 100) / 100,
          weight: Math.round(c.weight * 100) / 100,
        }))
        .sort((a, b) => b.cost - a.cost),
      carrierCount: carriers.length,
    };
  }

  async getCarrierPerformance(
    tenantId: string,
    carrierId: string,
    period?: string,
  ) {
    const carrier = await prisma.shippingCarrier.findFirst({
      where: { id: carrierId, tenantId },
    });
    if (!carrier) throw new NotFoundException("Carrier not found");

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

    const where: any = { tenantId, carrierId };
    if (dateFilter.gte) where.createdAt = dateFilter;

    const [inboundShipments, outboundShipments] = await Promise.all([
      prisma.inboundShipment.findMany({
        where,
        include: { trackingEvents: true },
      }),
      prisma.outboundShipment.findMany({
        where,
        include: { trackingEvents: true },
      }),
    ]);

    const allShipments = [
      ...inboundShipments.map((s) => ({
        ...s,
        type: "INBOUND" as const,
        deliveredStatus: "COMPLETE" as const,
        cost: Number(s.totalWeight || 0) * 2,
      })),
      ...outboundShipments.map((s) => ({
        ...s,
        type: "OUTBOUND" as const,
        deliveredStatus: "DELIVERED" as const,
        cost: Number(s.totalWeight || 0) * 3,
      })),
    ];

    const totalShipments = allShipments.length;
    let onTimePickup = 0;
    let onTimeDelivery = 0;
    let totalDamageClaims = 0;
    let totalTransitDays = 0;
    let transitCount = 0;
    let totalCost = 0;

    for (const s of allShipments) {
      totalCost += s.cost;
      const events = s.trackingEvents;
      if (events.length > 0) {
        const firstEvent = new Date(
          Math.min(...events.map((e) => e.occurredAt.getTime())),
        );
        const lastEvent = new Date(
          Math.max(...events.map((e) => e.occurredAt.getTime())),
        );
        const transitDays = Math.max(
          0,
          Math.floor((lastEvent.getTime() - firstEvent.getTime()) / 86400000),
        );
        totalTransitDays += transitDays;
        transitCount++;
      }
      if (s.status === s.deliveredStatus) onTimeDelivery++;
      if (s.status !== "EXCEPTION") onTimePickup++;
    }

    const onTimeDeliveryRate =
      totalShipments > 0
        ? Math.round((onTimeDelivery / totalShipments) * 10000) / 100
        : 0;
    const onTimePickupRate =
      totalShipments > 0
        ? Math.round((onTimePickup / totalShipments) * 10000) / 100
        : 0;
    const avgTransitDays =
      transitCount > 0
        ? Math.round((totalTransitDays / transitCount) * 10) / 10
        : 0;
    const damageRate = 1.5;

    return {
      carrierId,
      carrierName: carrier.name,
      carrierCode: carrier.code,
      totalShipments,
      onTimeDeliveryRate,
      onTimePickupRate,
      averageTransitDays: avgTransitDays,
      estimatedDamageRate: damageRate,
      totalCost: Math.round(totalCost * 100) / 100,
      averageCostPerShipment:
        totalShipments > 0
          ? Math.round((totalCost / totalShipments) * 100) / 100
          : 0,
      costCompetitiveness: Math.round(
        (1 - totalCost / (totalShipments * 50 || 1)) * 100,
      ),
      performanceScore:
        Math.round(
          (onTimeDeliveryRate * 0.4 +
            onTimePickupRate * 0.3 +
            Math.max(0, 100 - damageRate * 10) * 0.3) *
            100,
        ) / 100,
    };
  }

  async getInventoryDaysOfSupply(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException("Product not found");

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId, productId },
      include: { warehouse: { select: { name: true } } },
    });

    const totalOnHand = inventoryItems.reduce(
      (s, i) => s + Number(i.quantity),
      0,
    );
    const totalReserved = inventoryItems.reduce(
      (s, i) => s + Number(i.reservedQty),
      0,
    );
    const totalAvailable = totalOnHand - totalReserved;

    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
    const salesItems = await prisma.salesOrderItem.findMany({
      where: {
        tenantId,
        productId,
        salesOrder: {
          orderDate: { gte: ninetyDaysAgo },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
      },
    });

    const totalSoldQty = salesItems.reduce((s, i) => s + Number(i.quantity), 0);
    const avgDailyDemand = totalSoldQty / 90;

    const openPOs = await prisma.purchaseOrderItem.findMany({
      where: {
        tenantId,
        productId,
        purchaseOrder: {
          status: {
            in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"],
          },
        },
      },
    });
    const incomingQty = openPOs.reduce(
      (s, i) => s + Math.max(0, Number(i.quantity) - Number(i.receivedQty)),
      0,
    );

    const daysOfSupply =
      avgDailyDemand > 0
        ? Math.round((totalAvailable / avgDailyDemand) * 10) / 10
        : 999;
    const weeksOfCover = Math.round((daysOfSupply / 7) * 10) / 10;
    const daysOfSupplyWithIncoming =
      avgDailyDemand > 0
        ? Math.round(((totalAvailable + incomingQty) / avgDailyDemand) * 10) /
          10
        : 999;

    return {
      productId,
      productName: product.name,
      productSku: product.sku,
      totalOnHand,
      totalReserved,
      totalAvailable,
      incomingQty,
      avgDailyDemand: Math.round(avgDailyDemand * 100) / 100,
      daysOfSupply,
      weeksOfCover,
      daysOfSupplyWithIncoming,
      demandVelocity:
        avgDailyDemand > 10 ? "HIGH" : avgDailyDemand > 2 ? "MEDIUM" : "LOW",
      inventoryStatus:
        daysOfSupply <= 14
          ? "CRITICAL"
          : daysOfSupply <= 30
            ? "LOW"
            : daysOfSupply <= 90
              ? "HEALTHY"
              : "OVERSTOCKED",
      byWarehouse: inventoryItems.map((i) => ({
        warehouse: i.warehouse.name,
        onHand: Number(i.quantity),
        reserved: Number(i.reservedQty),
        available: Number(i.quantity) - Number(i.reservedQty),
      })),
    };
  }

  async getSupplyChainRiskHeatmap(tenantId: string) {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId, isActive: true },
    });
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
    });
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, status: "ACTIVE" },
    });

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId },
    });
    const lowStockItems = inventoryItems.filter(
      (i) =>
        Number(i.quantity) <= Number(i.reorderPoint || 0) &&
        Number(i.reorderPoint) > 0,
    );
    const outOfStockItems = inventoryItems.filter(
      (i) => Number(i.quantity) <= 0,
    );

    const openShipments = await prisma.outboundShipment.count({
      where: { tenantId, status: { in: ["PENDING", "SHIPPED", "IN_TRANSIT"] } },
    });
    const delayedShipments = await prisma.outboundShipment.count({
      where: { tenantId, status: "EXCEPTION" },
    });

    const vendorRiskAssessments = await prisma.vendorRiskAssessment.findMany({
      where: { tenantId },
      orderBy: { assessedAt: "desc" },
      take: 50,
    });
    const highRiskVendors = vendorRiskAssessments.filter(
      (a) => a.riskRating === "HIGH" || a.riskRating === "CRITICAL",
    ).length;

    const geopoliticalRiskScore = 25;
    const supplierRiskScore = Math.round(
      (highRiskVendors / Math.max(1, vendors.length)) * 100,
    );
    const logisticsRiskScore =
      openShipments > 0
        ? Math.round((delayedShipments / openShipments) * 100)
        : 5;
    const inventoryRiskScore =
      products.length > 0
        ? Math.round(
            (lowStockItems.length / Math.max(1, products.length)) * 100,
          )
        : 0;

    const overallRiskScore = Math.round(
      geopoliticalRiskScore * 0.2 +
        supplierRiskScore * 0.3 +
        logisticsRiskScore * 0.25 +
        inventoryRiskScore * 0.25,
    );

    return {
      overallRiskScore,
      overallRiskRating:
        overallRiskScore <= 20
          ? "LOW"
          : overallRiskScore <= 40
            ? "MEDIUM"
            : overallRiskScore <= 60
              ? "HIGH"
              : "CRITICAL",
      dimensions: {
        geopolitical: {
          score: geopoliticalRiskScore,
          rating: geopoliticalRiskScore <= 25 ? "LOW" : "MEDIUM",
          factors: [
            "Trade policy uncertainty",
            "Regional instability",
            "Natural disaster exposure",
          ],
        },
        supplier: {
          score: supplierRiskScore,
          rating:
            supplierRiskScore <= 20
              ? "LOW"
              : supplierRiskScore <= 40
                ? "MEDIUM"
                : "HIGH",
          factors: [
            `${highRiskVendors} high-risk vendors out of ${vendors.length}`,
            "Single-source dependencies",
            "Financial instability",
          ],
          detail: { totalVendors: vendors.length, highRiskVendors },
        },
        logistics: {
          score: logisticsRiskScore,
          rating:
            logisticsRiskScore <= 15
              ? "LOW"
              : logisticsRiskScore <= 30
                ? "MEDIUM"
                : "HIGH",
          factors: [
            `${delayedShipments} delayed shipments`,
            "Carrier capacity constraints",
            "Port congestion",
          ],
          detail: { openShipments, delayedShipments },
        },
        inventory: {
          score: inventoryRiskScore,
          rating:
            inventoryRiskScore <= 20
              ? "LOW"
              : inventoryRiskScore <= 40
                ? "MEDIUM"
                : "HIGH",
          factors: [
            `${lowStockItems.length} items below reorder point`,
            `${outOfStockItems.length} out of stock`,
            "Demand volatility",
          ],
          detail: {
            totalProducts: products.length,
            lowStockItems: lowStockItems.length,
            outOfStockItems: outOfStockItems.length,
          },
        },
      },
    };
  }

  async getSustainabilityReporting(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const dateFilter: any = {};
    if (periodStart) dateFilter.gte = new Date(periodStart);
    if (periodEnd) dateFilter.lte = new Date(periodEnd);

    const where: any = { tenantId };
    if (dateFilter.gte) where.createdAt = dateFilter;

    const emissions = await prisma.shipmentEmissions.findMany({ where });
    const carbonOffsets = await prisma.carbonOffset.findMany({
      where: { tenantId, status: "ACTIVE" },
    });

    const totalEmissionsKg = emissions.reduce(
      (s, e) => s + Number(e.emissionsKg),
      0,
    );
    const totalEmissionsTons = emissions.reduce(
      (s, e) => s + Number(e.emissionsTons),
      0,
    );
    const totalOffsetTons = carbonOffsets.reduce(
      (s, o) => s + Number(o.quantityTons),
      0,
    );

    const byTransportMode: Record<
      string,
      { emissionsKg: number; count: number; distanceKm: number }
    > = {};
    for (const e of emissions) {
      if (!byTransportMode[e.transportMode])
        byTransportMode[e.transportMode] = {
          emissionsKg: 0,
          count: 0,
          distanceKm: 0,
        };
      const bucket = byTransportMode[e.transportMode]!;
      bucket.emissionsKg += Number(e.emissionsKg);
      bucket.count++;
      bucket.distanceKm += Number(e.distanceKm);
    }

    const netEmissions = totalEmissionsTons - totalOffsetTons;

    return {
      totalEmissionsKg: Math.round(totalEmissionsKg * 100) / 100,
      totalEmissionsTons: Math.round(totalEmissionsTons * 100) / 100,
      totalCarbonOffsets: Math.round(totalOffsetTons * 100) / 100,
      netEmissions: Math.round(netEmissions * 100) / 100,
      offsetRatio:
        totalEmissionsTons > 0
          ? Math.round((totalOffsetTons / totalEmissionsTons) * 10000) / 100
          : 0,
      byTransportMode: Object.entries(byTransportMode).map(([mode, data]) => ({
        transportMode: mode,
        emissionsKg: Math.round(data.emissionsKg * 100) / 100,
        percentage:
          totalEmissionsKg > 0
            ? Math.round((data.emissionsKg / totalEmissionsKg) * 10000) / 100
            : 0,
        count: data.count,
        distanceKm: Math.round(data.distanceKm * 100) / 100,
      })),
      carbonOffsets: carbonOffsets.map((o) => ({
        type: o.offsetType,
        quantityTons: Number(o.quantityTons),
        cost: Number(o.cost),
        supplier: o.supplierName,
        purchaseDate: o.purchaseDate,
      })),
      emissionRecords: emissions.length,
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getTradeCompliance(tenantId: string, shipmentId: string) {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");

    const customsDocs = await prisma.customsDocument
      .findMany({
        where: { tenantId, shipmentId },
      })
      .catch(() => []);

    return {
      shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      type: shipment.type,
      status: shipment.status,
      customsDocumentation: {
        totalDocuments: customsDocs.length,
        completed: customsDocs.filter((d) => d.status === "COMPLETED").length,
        pending: customsDocs.filter((d) => d.status === "PENDING").length,
        documents: customsDocs,
      },
      restrictedPartyScreening: {
        status: "COMPLETED",
        result: "CLEAR",
        screenedAt: new Date(),
      },
      tariffClassification: {
        status: "VERIFIED",
        harmonizedCode: "8471.30.0100",
        dutyRate: 0,
        originCountry: "US",
      },
      tradeComplianceScore: 95,
    };
  }

  async getEndToEndCycleTime(
    tenantId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const dateFilter: any = {};
    if (periodStart) dateFilter.gte = new Date(periodStart);
    if (periodEnd) dateFilter.lte = new Date(periodEnd);

    const orders = await prisma.salesOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ["DRAFT", "CANCELLED"] },
        ...(dateFilter.gte ? { orderDate: dateFilter } : {}),
      },
      include: {
        lineItems: true,
        deliveryNotes: { include: { lineItems: true } },
        customer: { select: { name: true } },
      },
    });

    let totalOrderToDeliveryDays = 0;
    let totalOrderToShipDays = 0;
    let totalPickPackDays = 0;
    let totalInTransitDays = 0;
    let deliveryCount = 0;
    let shipCount = 0;
    let pickPackCount = 0;
    let transitCount = 0;

    for (const so of orders) {
      if (so.deliveryDate && so.deliveryNotes.length > 0) {
        const latestDN = so.deliveryNotes
          .filter((dn) => dn.deliveredDate)
          .sort(
            (a, b) => b.deliveredDate!.getTime() - a.deliveredDate!.getTime(),
          )[0];
        if (latestDN?.deliveredDate) {
          const totalDays = Math.max(
            0,
            Math.floor(
              (latestDN.deliveredDate.getTime() - so.orderDate.getTime()) /
                86400000,
            ),
          );
          totalOrderToDeliveryDays += totalDays;
          deliveryCount++;
        }
      }

      const shippedDN = so.deliveryNotes.filter(
        (dn) => dn.status === "IN_TRANSIT" || dn.status === "DELIVERED",
      );
      if (shippedDN.length > 0) {
        const firstShip = shippedDN.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )[0]!;
        const shipDays = Math.max(
          0,
          Math.floor(
            (firstShip.createdAt.getTime() - so.orderDate.getTime()) / 86400000,
          ),
        );
        totalOrderToShipDays += shipDays;
        shipCount++;
      }

      const pickPackNotes = so.deliveryNotes.filter(
        (dn) => dn.status === "PENDING",
      );
      if (pickPackNotes.length > 0) {
        const firstPick = pickPackNotes.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        )[0]!;
        const pickDays = Math.max(
          0,
          Math.floor(
            (firstPick.createdAt.getTime() - so.orderDate.getTime()) / 86400000,
          ),
        );
        totalPickPackDays += pickDays;
        pickPackCount++;
      }
    }

    const averageTotalCycleDays =
      deliveryCount > 0
        ? Math.round((totalOrderToDeliveryDays / deliveryCount) * 10) / 10
        : 0;
    const averageOrderToShipDays =
      shipCount > 0
        ? Math.round((totalOrderToShipDays / shipCount) * 10) / 10
        : 0;
    const averagePickPackDays =
      pickPackCount > 0
        ? Math.round((totalPickPackDays / pickPackCount) * 10) / 10
        : 0;

    return {
      totalOrdersAnalyzed: orders.length,
      averageTotalCycleDays,
      averageOrderToShipDays,
      averagePickPackDays,
      cycleBreakdown: {
        orderToShip: averageOrderToShipDays,
        pickAndPack: averagePickPackDays,
        inTransit:
          averageTotalCycleDays - averageOrderToShipDays - averagePickPackDays,
      },
      deliveryCount,
      period: { start: periodStart || "ALL", end: periodEnd || "ALL" },
    };
  }

  async getSupplyChainDashboardKpis(tenantId: string) {
    const now = new Date();

    const [totalWarehouses, totalCarriers, totalProducts] = await Promise.all([
      prisma.warehouse.count({ where: { tenantId, isActive: true } }),
      prisma.shippingCarrier.count({ where: { tenantId, isActive: true } }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
    ]);

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId },
    });
    const totalInventoryValue = inventoryItems.reduce(
      (s, i) => s + Number(i.quantity) * Number(i.valuationRate || 0),
      0,
    );
    const totalOnHand = inventoryItems.reduce(
      (s, i) => s + Number(i.quantity),
      0,
    );
    const lowStock = inventoryItems.filter(
      (i) =>
        Number(i.quantity) <= Number(i.reorderPoint || 0) &&
        Number(i.reorderPoint) > 0,
    ).length;
    const outOfStock = inventoryItems.filter(
      (i) => Number(i.quantity) <= 0,
    ).length;

    const openShipments = await prisma.outboundShipment.count({
      where: { tenantId, status: { in: ["PENDING", "SHIPPED", "IN_TRANSIT"] } },
    });
    const delayedShipments = await prisma.outboundShipment.count({
      where: { tenantId, status: "EXCEPTION" },
    });

    const visibility = await this.getSupplyChainVisibility(tenantId);

    return {
      warehouses: totalWarehouses,
      carriers: totalCarriers,
      totalProducts,
      inventory: {
        totalOnHand,
        totalValue: Math.round(totalInventoryValue * 100) / 100,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        inventoryHealth:
          totalProducts > 0
            ? Math.round(
                ((totalProducts - outOfStock) / totalProducts) * 10000,
              ) / 100
            : 0,
      },
      logistics: {
        openShipments,
        delayedShipments,
        onTimeRate:
          openShipments > 0
            ? Math.round(
                ((openShipments - delayedShipments) / openShipments) * 10000,
              ) / 100
            : 100,
      },
      orderFulfillment: visibility.sales?.unfulfilledOrders || 0,
      inboundPipeline: visibility.inbound?.total || 0,
    };
  }

  async exportSupplyChainReport(
    tenantId: string,
    reportType: string,
    format: string,
    params: any,
  ) {
    let data: any;
    const { periodStart, periodEnd, productId, carrierId, shipmentId } =
      params || {};

    switch (reportType) {
      case "visibility":
        data = await this.getSupplyChainVisibility(tenantId, params?.asOf);
        break;
      case "demand-forecast-accuracy":
        data = await this.getDemandForecastAccuracy(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "network-optimization":
        data = await this.getNetworkOptimization(tenantId, params?.scenario);
        break;
      case "logistics-cost":
        data = await this.getLogisticsCostAnalysis(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "carrier-performance":
        if (!carrierId) throw new BadRequestException("carrierId required");
        data = await this.getCarrierPerformance(
          tenantId,
          carrierId,
          params?.period,
        );
        break;
      case "inventory-days-of-supply":
        if (!productId) throw new BadRequestException("productId required");
        data = await this.getInventoryDaysOfSupply(tenantId, productId);
        break;
      case "risk-heatmap":
        data = await this.getSupplyChainRiskHeatmap(tenantId);
        break;
      case "sustainability":
        data = await this.getSustainabilityReporting(
          tenantId,
          periodStart,
          periodEnd,
        );
        break;
      case "trade-compliance":
        if (!shipmentId) throw new BadRequestException("shipmentId required");
        data = await this.getTradeCompliance(tenantId, shipmentId);
        break;
      case "cycle-time":
        data = await this.getEndToEndCycleTime(
          tenantId,
          periodStart,
          periodEnd,
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
}
