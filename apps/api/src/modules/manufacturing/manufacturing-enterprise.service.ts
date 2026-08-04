import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ManufacturingEnterpriseService {
  async getProductionPerformance(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: {
        operations: true,
        componentConsumptions: true,
      },
    });
    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter(
      (wo) => wo.status === "COMPLETED",
    ).length;
    const inProgressOrders = workOrders.filter(
      (wo) => wo.status === "IN_PROGRESS",
    ).length;
    const plannedOrders = workOrders.filter(
      (wo) => wo.status === "PLANNED",
    ).length;
    const totalQuantity = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const totalScrap = workOrders.reduce(
      (s, wo) => s + Number(wo.scrapQuantity || 0),
      0,
    );
    const yieldPct =
      totalQuantity > 0
        ? Number(
            (((totalQuantity - totalScrap) / totalQuantity) * 100).toFixed(1),
          )
        : 0;
    const machineOeeRecords = await prisma.machineOeeRecord.findMany({
      where: { tenantId, recordDate: { gte: start, lte: end } },
    });
    const avgOee =
      machineOeeRecords.length > 0
        ? Number(
            (
              machineOeeRecords.reduce((s, r) => s + Number(r.oee || 0), 0) /
              machineOeeRecords.length
            ).toFixed(2),
          )
        : 0;
    const avgAvailability =
      machineOeeRecords.length > 0
        ? Number(
            (
              machineOeeRecords.reduce(
                (s, r) => s + Number(r.availability || 0),
                0,
              ) / machineOeeRecords.length
            ).toFixed(2),
          )
        : 0;
    const avgPerformance =
      machineOeeRecords.length > 0
        ? Number(
            (
              machineOeeRecords.reduce(
                (s, r) => s + Number(r.performance || 0),
                0,
              ) / machineOeeRecords.length
            ).toFixed(2),
          )
        : 0;
    const avgQuality =
      machineOeeRecords.length > 0
        ? Number(
            (
              machineOeeRecords.reduce(
                (s, r) => s + Number(r.quality || 0),
                0,
              ) / machineOeeRecords.length
            ).toFixed(2),
          )
        : 0;
    const totalCycleTime = workOrders
      .filter((wo) => wo.startDate && wo.endDate)
      .reduce((s, wo) => {
        const ct =
          (wo.endDate!.getTime() - wo.startDate!.getTime()) / (1000 * 60);
        return s + ct;
      }, 0);
    const avgCycleTimeMin =
      completedOrders > 0
        ? Number((totalCycleTime / completedOrders).toFixed(1))
        : 0;
    const totalChangeoverMinutes = workOrders.reduce(
      (s, wo) =>
        s + wo.operations.reduce((s2, op) => s2 + (op.durationMinutes || 0), 0),
      0,
    );
    const throughput =
      completedOrders > 0
        ? Number((totalQuantity / completedOrders).toFixed(1))
        : 0;
    const snapshots = await prisma.productionAnalyticsSnapshot.findMany({
      where: { tenantId, snapshotDate: { gte: start, lte: end } },
    });
    return {
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalWorkOrders: totalOrders,
        completedOrders,
        inProgressOrders,
        plannedOrders,
        totalQuantity: Number(totalQuantity.toFixed(2)),
        totalScrap: Number(totalScrap.toFixed(2)),
        yieldPct,
        throughput,
      },
      oee: {
        overall: avgOee,
        availability: avgAvailability,
        performance: avgPerformance,
        quality: avgQuality,
        recordCount: machineOeeRecords.length,
      },
      cycleTime: {
        avgCycleTimeMinutes: avgCycleTimeMin,
        totalChangeoverMinutes,
      },
      workOrderBreakdown: workOrders.map((wo) => ({
        id: wo.id,
        number: wo.workOrderNumber,
        status: wo.status,
        quantity: Number(wo.quantity),
        scrap: Number(wo.scrapQuantity || 0),
        oeeScore: wo.oeeScore ? Number(wo.oeeScore) : null,
        startDate: wo.startDate,
        endDate: wo.endDate,
        operationsCompleted: wo.operations.filter(
          (op) => op.status === "COMPLETED",
        ).length,
        totalOperations: wo.operations.length,
      })),
      snapshotTrend: snapshots.map((s) => ({
        date: s.snapshotDate,
        oee: s.oeeAvg,
        efficiency: s.efficiency,
        scrapRate: s.scrapRate,
        firstPassYield: s.firstPassYield,
      })),
    };
  }

  async getQualityAnalysis(
    tenantId: string,
    productId: string,
    period: string,
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const qualityChecks = await prisma.manufacturingQualityCheck.findMany({
      where: {
        tenantId,
        productId,
        checkedAt: { gte: startDate, lte: now },
      },
      include: { template: true },
    });
    const scrapRecords = await prisma.manufacturingScrapRecord.findMany({
      where: { tenantId, productId, createdAt: { gte: startDate, lte: now } },
    });
    const totalChecked = qualityChecks.reduce(
      (s, qc) => s + Number(qc.checkedQty),
      0,
    );
    const totalPassed = qualityChecks.reduce(
      (s, qc) => s + Number(qc.passedQty),
      0,
    );
    const totalFailed = qualityChecks.reduce(
      (s, qc) => s + Number(qc.failedQty),
      0,
    );
    const totalScrapped = scrapRecords.reduce(
      (s, sr) => s + Number(sr.scrappedQty),
      0,
    );
    const totalScrapCost = scrapRecords.reduce(
      (s, sr) => s + Number(sr.costImpact || 0),
      0,
    );
    const defectRate =
      totalChecked > 0
        ? Number(((totalFailed / totalChecked) * 100).toFixed(2))
        : 0;
    const scrapRate =
      totalChecked > 0
        ? Number(((totalScrapped / totalChecked) * 100).toFixed(2))
        : 0;
    const spcCharts = await prisma.spcChart.findMany({
      where: { tenantId, productId },
      include: { samples: { orderBy: { sampledAt: "desc" }, take: 30 } },
    });
    const cpkValues = spcCharts
      .filter((c) => c.samples.length > 1)
      .map((c) => {
        const values = c.samples.flatMap((s) => (s.values as number[]) || []);
        if (values.length < 2) return null;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
          values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
        const stdDev = Math.sqrt(variance);
        const usl = Number(c.usl || 0);
        const lsl = Number(c.lsl || 0);
        const cp =
          usl > lsl && stdDev > 0
            ? Number(((usl - lsl) / (6 * stdDev)).toFixed(4))
            : 0;
        const cpu =
          stdDev > 0 ? Number(((usl - mean) / (3 * stdDev)).toFixed(4)) : 0;
        const cpl =
          stdDev > 0 ? Number(((mean - lsl) / (3 * stdDev)).toFixed(4)) : 0;
        const cpk = Math.min(cpu, cpl);
        return {
          chartId: c.id,
          chartName: c.name,
          chartType: c.chartType,
          mean: Number(mean.toFixed(4)),
          stdDev: Number(stdDev.toFixed(4)),
          cp,
          cpk,
          cpu,
          cpl,
          usl,
          lsl,
          sampleCount: c.samples.length,
        };
      })
      .filter(Boolean);
    const defectCategories: Record<string, number> = {};
    for (const qc of qualityChecks) {
      const result = qc.resultJson as Record<string, any> | null;
      if (result && typeof result === "object") {
        for (const [key, val] of Object.entries(result)) {
          if (typeof val === "number" && val > 0) {
            defectCategories[key] = (defectCategories[key] || 0) + val;
          }
        }
      }
    }
    const paretoData = Object.entries(defectCategories)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));
    return {
      productId,
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalChecks: qualityChecks.length,
        totalCheckedQty: Number(totalChecked.toFixed(2)),
        totalPassedQty: Number(totalPassed.toFixed(2)),
        totalFailedQty: Number(totalFailed.toFixed(2)),
        totalScrappedQty: Number(totalScrapped.toFixed(2)),
        defectRate,
        scrapRate,
        reworkCost: Number(totalScrapCost.toFixed(2)),
      },
      paretoAnalysis: paretoData,
      spcAnalysis: cpkValues,
      qualityTrend: qualityChecks
        .filter((qc) => qc.checkedAt)
        .map((qc) => ({
          date: qc.checkedAt!.toISOString().split("T")[0],
          checked: Number(qc.checkedQty),
          passed: Number(qc.passedQty),
          failed: Number(qc.failedQty),
          defectRate:
            Number(qc.checkedQty) > 0
              ? Number(
                  (
                    (Number(qc.failedQty) / Number(qc.checkedQty)) *
                    100
                  ).toFixed(2),
                )
              : 0,
        })),
      scrapAnalysis: scrapRecords.map((sr) => ({
        id: sr.id,
        reason: sr.reason,
        quantity: Number(sr.scrappedQty),
        costImpact: Number(sr.costImpact || 0),
        date: sr.createdAt,
      })),
    };
  }

  async getProductionPlanning(tenantId: string, horizon: string) {
    const now = new Date();
    const horizonDays =
      horizon === "WEEKLY"
        ? 7
        : horizon === "MONTHLY"
          ? 30
          : horizon === "QUARTERLY"
            ? 90
            : 180;
    const horizonEnd = new Date(now);
    horizonEnd.setDate(horizonEnd.getDate() + horizonDays);
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        startDate: { gte: now, lte: horizonEnd },
      },
      include: {
        workstation: true,
        operations: true,
      },
      orderBy: { startDate: "asc" },
    });
    const workstations = await prisma.workstation.findMany({
      where: { tenantId },
      include: {
        capacityEntries: {
          where: { date: { gte: now, lte: horizonEnd } },
        },
        shifts: true,
      },
    });
    const totalPlannedQuantity = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const loadByWorkstation = workstations.map((ws) => {
      const wsOrders = workOrders.filter((wo) => wo.workstationId === ws.id);
      const plannedHours = wsOrders.reduce((s, wo) => {
        const opHours =
          wo.operations.reduce((s2, op) => s2 + op.durationMinutes, 0) / 60;
        return s + opHours;
      }, 0);
      const availableCapacity = ws.capacityEntries.reduce(
        (s, ce) => s + Number(ce.availableHours),
        0,
      );
      const utilizedCapacity = ws.capacityEntries.reduce(
        (s, ce) => s + Number(ce.utilizedHours),
        0,
      );
      const totalCapacity =
        availableCapacity > 0
          ? availableCapacity
          : Number(ws.capacityHours) * horizonDays;
      const loadPct =
        totalCapacity > 0
          ? Number(((plannedHours / totalCapacity) * 100).toFixed(1))
          : 0;
      return {
        workstationId: ws.id,
        workstationName: ws.name,
        workOrderCount: wsOrders.length,
        plannedHours: Number(plannedHours.toFixed(2)),
        availableCapacity: Number(totalCapacity.toFixed(2)),
        utilizedCapacity: Number(utilizedCapacity.toFixed(2)),
        loadPct,
        isOverloaded: loadPct > 100,
        shifts: ws.shifts.map((s) => ({
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
          daysOfWeek: s.daysOfWeek,
        })),
      };
    });
    const overloadedWorkstations = loadByWorkstation.filter(
      (l) => l.isOverloaded,
    );
    return {
      horizon,
      horizonDays,
      dateRange: {
        start: now.toISOString().split("T")[0],
        end: horizonEnd.toISOString().split("T")[0],
      },
      summary: {
        totalPlannedWorkOrders: workOrders.length,
        totalPlannedQuantity: Number(totalPlannedQuantity.toFixed(2)),
        totalWorkstations: workstations.length,
        overloadedWorkstations: overloadedWorkstations.length,
        averageLoadPct:
          loadByWorkstation.length > 0
            ? Number(
                (
                  loadByWorkstation.reduce((s, l) => s + l.loadPct, 0) /
                  loadByWorkstation.length
                ).toFixed(1),
              )
            : 0,
      },
      workstations: loadByWorkstation,
      overloadAlerts: overloadedWorkstations.map((l) => ({
        workstationId: l.workstationId,
        workstationName: l.workstationName,
        loadPct: l.loadPct,
        message: `${l.workstationName} is at ${l.loadPct}% capacity (exceeds 100%)`,
        plannedWorkOrders: l.workOrderCount,
      })),
      plannedOrders: workOrders.map((wo) => ({
        id: wo.id,
        number: wo.workOrderNumber,
        status: wo.status,
        quantity: Number(wo.quantity),
        workstation: wo.workstation?.name || null,
        startDate: wo.startDate,
        endDate: wo.endDate,
        operations: wo.operations.map((op) => ({
          sequence: op.sequence,
          name: op.name,
          durationMin: op.durationMinutes,
          status: op.status,
        })),
      })),
    };
  }

  async getMaterialRequirements(
    tenantId: string,
    productId: string,
    demand: number,
  ) {
    const bom = await prisma.bOM.findFirst({
      where: { tenantId, productId, isActive: true },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    if (!bom) return null;
    const mrpItems = await prisma.mRPPlannedItem.findMany({
      where: { tenantId, productId, bomId: bom.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    // BOMItem has no direct `product` relation in the schema — resolve the
    // components separately and join in memory.
    const componentProducts = await prisma.product.findMany({
      where: { id: { in: bom.items.map((item) => item.productId) } },
      select: { id: true, sku: true, name: true, unit: true, costPrice: true },
    });
    const componentsById = new Map(componentProducts.map((p) => [p.id, p]));
    const grossRequirements = demand;
    const bomItems = bom.items.map((item) => {
      const component = componentsById.get(item.productId);
      const qtyNeeded = Number(item.quantity) * demand;
      const unitCost = Number(component?.costPrice || 0);
      return {
        componentId: item.productId,
        componentSku: component?.sku,
        componentName: component?.name,
        unit: component?.unit,
        quantityPerUnit: Number(item.quantity),
        grossRequirement: qtyNeeded,
        componentType: item.type,
        unitCost,
        totalCost: Number((qtyNeeded * unitCost).toFixed(2)),
      };
    });
    const totalMaterialCost = bomItems.reduce((s, i) => s + i.totalCost, 0);
    const plannedOrders = mrpItems
      .filter(
        (mi) =>
          mi.actionType === "CREATE_WORK_ORDER" ||
          mi.actionType === "CREATE_PURCHASE_ORDER",
      )
      .map((mi) => ({
        productId: mi.productId,
        quantityNeeded: Number(mi.quantityNeeded),
        quantityInStock: Number(mi.quantityInStock),
        netRequired: Number(mi.netQuantityRequired),
        actionType: mi.actionType,
        status: mi.status,
        demandSource: mi.demandSource,
      }));
    return {
      productId,
      bomId: bom.id,
      bomName: bom.name,
      bomVersion: bom.version,
      demandQuantity: demand,
      summary: {
        totalComponents: bomItems.length,
        grossRequirements: grossRequirements,
        totalMaterialCost: Number(totalMaterialCost.toFixed(2)),
        standardCost: Number(bom.standardCost),
        scheduledReceipts: mrpItems.reduce(
          (s, mi) => s + Number(mi.quantityInStock),
          0,
        ),
        netRequirements: mrpItems.reduce(
          (s, mi) => s + Math.max(0, Number(mi.netQuantityRequired)),
          0,
        ),
      },
      bomExplosion: bomItems,
      plannedOrders,
      mrpHistory: mrpItems.map((mi) => ({
        id: mi.id,
        demandSource: mi.demandSource,
        quantityNeeded: Number(mi.quantityNeeded),
        inStock: Number(mi.quantityInStock),
        netRequired: Number(mi.netQuantityRequired),
        actionType: mi.actionType,
        status: mi.status,
      })),
    };
  }

  async getCostVariance(tenantId: string, workOrderId: string) {
    const wo = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      include: {
        bom: { include: { items: true } },
        operations: true,
        componentConsumptions: true,
      },
    });
    if (!wo) return null;
    // Neither BOMItem nor WorkOrderComponentConsumption relate directly to
    // Product in the schema — resolve costs/names via a separate lookup.
    const componentProductIds = [
      ...(wo.bom?.items.map((item) => item.productId) || []),
      ...wo.componentConsumptions.map((cc) => cc.productId),
    ];
    const componentProducts = await prisma.product.findMany({
      where: { id: { in: componentProductIds } },
      select: { id: true, name: true, costPrice: true },
    });
    const componentsById = new Map(componentProducts.map((p) => [p.id, p]));
    const standardMaterialCost =
      wo.bom?.items.reduce(
        (s, item) =>
          s +
          Number(item.quantity) *
            Number(componentsById.get(item.productId)?.costPrice || 0),
        0,
      ) || 0;
    const actualConsumption = wo.componentConsumptions.reduce(
      (s, cc) =>
        s +
        Number(cc.quantityConsumed) *
          Number(componentsById.get(cc.productId)?.costPrice || 0),
      0,
    );
    const timeEntries = await prisma.manufacturingTimeEntry.findMany({
      where: { tenantId, workOrderId },
    });
    const actualLaborHours = timeEntries.reduce(
      (s, te) => s + (te.durationMin || 0),
      0,
    );
    const standardCost = Number(wo.standardCost || 0);
    const actualCost = Number(wo.actualCost || 0);
    const costVariance = Number(wo.costVariance || standardCost - actualCost);
    const materialVariance = standardMaterialCost - actualConsumption;
    const laborVariance = standardCost * 0.3 - actualLaborHours * 0.5;
    const overheadCost = Number(wo.overheadCost || 0);
    const overheadVariance = standardCost * 0.2 - overheadCost;
    return {
      workOrderId,
      workOrderNumber: wo.workOrderNumber,
      status: wo.status,
      quantity: Number(wo.quantity),
      summary: {
        standardCost: Number(standardCost.toFixed(2)),
        actualCost: Number(actualCost.toFixed(2)),
        costVariance: Number(costVariance.toFixed(2)),
        variancePct:
          standardCost > 0
            ? Number(((costVariance / standardCost) * 100).toFixed(1))
            : 0,
      },
      breakdown: {
        material: {
          standard: Number(standardMaterialCost.toFixed(2)),
          actual: Number(actualConsumption.toFixed(2)),
          variance: Number(materialVariance.toFixed(2)),
        },
        labor: {
          standardHours: 0,
          actualHours: Number((actualLaborHours / 60).toFixed(2)),
          variance: Number(laborVariance.toFixed(2)),
        },
        overhead: {
          standard: Number((standardCost * 0.2).toFixed(2)),
          actual: Number(overheadCost.toFixed(2)),
          variance: Number(overheadVariance.toFixed(2)),
        },
      },
      bomCostComparison:
        wo.bom?.items.map((item) => {
          const unitCost = Number(
            componentsById.get(item.productId)?.costPrice || 0,
          );
          return {
            componentName: componentsById.get(item.productId)?.name,
            qtyPerUnit: Number(item.quantity),
            unitCost,
            extendedCost: Number((Number(item.quantity) * unitCost).toFixed(2)),
          };
        }) || [],
    };
  }

  async getManufacturingYield(
    tenantId: string,
    productId: string,
    period: string,
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId,
        bom: { productId },
        createdAt: { gte: startDate, lte: now },
      },
    });
    const qualityChecks = await prisma.manufacturingQualityCheck.findMany({
      where: {
        tenantId,
        productId,
        checkedAt: { gte: startDate, lte: now },
      },
    });
    const scrapRecords = await prisma.manufacturingScrapRecord.findMany({
      where: { tenantId, productId, createdAt: { gte: startDate, lte: now } },
    });
    const totalProduced = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const totalScrapped = scrapRecords.reduce(
      (s, sr) => s + Number(sr.scrappedQty),
      0,
    );
    const totalChecked = qualityChecks.reduce(
      (s, qc) => s + Number(qc.checkedQty),
      0,
    );
    const totalPassed = qualityChecks.reduce(
      (s, qc) => s + Number(qc.passedQty),
      0,
    );
    const firstPassYield =
      totalChecked > 0
        ? Number(((totalPassed / totalChecked) * 100).toFixed(1))
        : 0;
    const rollThroughYield =
      totalChecked > 0
        ? Number(
            (
              Math.pow(totalPassed / totalChecked, qualityChecks.length || 1) *
              100
            ).toFixed(1),
          )
        : 0;
    const defectDensity =
      totalChecked > 0
        ? Number(((totalChecked - totalPassed) / totalChecked).toFixed(4))
        : 0;
    const scrapRate =
      totalProduced > 0
        ? Number(((totalScrapped / totalProduced) * 100).toFixed(1))
        : 0;
    return {
      productId,
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalProduced: Number(totalProduced.toFixed(2)),
        totalScrapped: Number(totalScrapped.toFixed(2)),
        totalChecked: Number(totalChecked.toFixed(2)),
        totalPassed: Number(totalPassed.toFixed(2)),
      },
      yieldMetrics: {
        firstPassYield,
        rollThroughYield,
        defectDensity,
        scrapRate,
        yieldPct:
          totalProduced > 0
            ? Number(
                (
                  ((totalProduced - totalScrapped) / totalProduced) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      workOrderYield: workOrders.map((wo) => ({
        id: wo.id,
        number: wo.workOrderNumber,
        quantity: Number(wo.quantity),
        scrap: Number(wo.scrapQuantity || 0),
        yieldPct:
          Number(wo.quantity) > 0
            ? Number(
                (
                  ((Number(wo.quantity) - Number(wo.scrapQuantity || 0)) /
                    Number(wo.quantity)) *
                  100
                ).toFixed(1),
              )
            : 0,
        status: wo.status,
      })),
    };
  }

  async getEquipmentEffectiveness(
    tenantId: string,
    workCenterId: string,
    period: string,
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const workstation = await prisma.workstation.findFirst({
      where: { id: workCenterId, tenantId },
    });
    if (!workstation) return null;
    const machines = await prisma.manufacturingMachine.findMany({
      where: { tenantId, workstationId: workCenterId },
    });
    const oeeRecords = await prisma.machineOeeRecord.findMany({
      where: {
        tenantId,
        machineId: { in: machines.map((m) => m.id) },
        recordDate: { gte: startDate, lte: now },
      },
    });
    const downtimeLogs = await prisma.machineDowntime.findMany({
      where: {
        tenantId,
        machineId: { in: machines.map((m) => m.id) },
        startTime: { gte: startDate, lte: now },
      },
    });
    const maintenanceLogs = await prisma.machineMaintenanceLog.findMany({
      where: {
        tenantId,
        machineId: { in: machines.map((m) => m.id) },
        startTime: { gte: startDate, lte: now },
      },
    });
    const machineOee = machines.map((machine) => {
      const machineOeeRecs = oeeRecords.filter(
        (r) => r.machineId === machine.id,
      );
      const machineDowntime = downtimeLogs.filter(
        (d) => d.machineId === machine.id,
      );
      const machineMaint = maintenanceLogs.filter(
        (m) => m.machineId === machine.id,
      );
      const avgOee =
        machineOeeRecs.length > 0
          ? Number(
              (
                machineOeeRecs.reduce((s, r) => s + Number(r.oee || 0), 0) /
                machineOeeRecs.length
              ).toFixed(3),
            )
          : 0;
      const totalDowntimeMin = machineDowntime.reduce(
        (s, d) => s + (d.duration || 0),
        0,
      );
      const totalMaintCost = machineMaint.reduce(
        (s, m) => s + Number(m.cost || 0),
        0,
      );
      const mtbfRecords = machineOeeRecs.filter(
        (r) => Number(r.downtime || 0) > 0,
      );
      const mtbf =
        mtbfRecords.length > 0
          ? Number(
              (
                machineOeeRecs.reduce(
                  (s, r) => s + Number(r.actualRunTime || 0),
                  0,
                ) / mtbfRecords.length
              ).toFixed(2),
            )
          : 0;
      const mttr =
        machineDowntime.length > 0
          ? Number((totalDowntimeMin / machineDowntime.length).toFixed(2))
          : 0;
      return {
        machineId: machine.id,
        machineName: machine.name,
        machineCode: machine.machineCode,
        oee: {
          avg: avgOee,
          availability:
            machineOeeRecs.length > 0
              ? Number(
                  (
                    machineOeeRecs.reduce(
                      (s, r) => s + Number(r.availability || 0),
                      0,
                    ) / machineOeeRecs.length
                  ).toFixed(3),
                )
              : 0,
          performance:
            machineOeeRecs.length > 0
              ? Number(
                  (
                    machineOeeRecs.reduce(
                      (s, r) => s + Number(r.performance || 0),
                      0,
                    ) / machineOeeRecs.length
                  ).toFixed(3),
                )
              : 0,
          quality:
            machineOeeRecs.length > 0
              ? Number(
                  (
                    machineOeeRecs.reduce(
                      (s, r) => s + Number(r.quality || 0),
                      0,
                    ) / machineOeeRecs.length
                  ).toFixed(3),
                )
              : 0,
          oeeTarget: Number(machine.oeeTarget || 0),
        },
        downtime: {
          totalEvents: machineDowntime.length,
          totalMinutes: totalDowntimeMin,
          mtbf,
          mttr,
          byCategory: this.groupDowntimeByCategory(machineDowntime),
        },
        maintenance: {
          totalWorkOrders: machineMaint.length,
          totalCost: Number(totalMaintCost.toFixed(2)),
        },
      };
    });
    const overallOee =
      oeeRecords.length > 0
        ? Number(
            (
              oeeRecords.reduce((s, r) => s + Number(r.oee || 0), 0) /
              oeeRecords.length
            ).toFixed(3),
          )
        : 0;
    return {
      workCenterId,
      workCenterName: workstation.name,
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalMachines: machines.length,
        overallOee,
        totalDowntimeEvents: downtimeLogs.length,
        totalDowntimeMinutes: downtimeLogs.reduce(
          (s, d) => s + (d.duration || 0),
          0,
        ),
        totalMaintenanceOrders: maintenanceLogs.length,
        totalMaintenanceCost: Number(
          maintenanceLogs
            .reduce((s, m) => s + Number(m.cost || 0), 0)
            .toFixed(2),
        ),
      },
      machines: machineOee,
      oeeTrend: oeeRecords.map((r) => ({
        date: r.recordDate,
        oee: r.oee,
        availability: r.availability,
        performance: r.performance,
        quality: r.quality,
      })),
    };
  }

  private groupDowntimeByCategory(
    downtimes: { category: string; duration?: number | null }[],
  ) {
    const byCat: Record<string, number> = {};
    for (const d of downtimes) {
      const cat = d.category || "UNKNOWN";
      byCat[cat] = (byCat[cat] || 0) + (d.duration || 0);
    }
    const total = Object.values(byCat).reduce((s, v) => s + v, 0);
    return Object.entries(byCat).map(([category, minutes]) => ({
      category,
      minutes,
      pct: total > 0 ? Number(((minutes / total) * 100).toFixed(1)) : 0,
    }));
  }

  async getShopFloorControl(tenantId: string, workOrderId: string) {
    const wo = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      include: {
        operations: { orderBy: { sequence: "asc" } },
        componentConsumptions: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
        workstation: true,
        bom: { select: { name: true, code: true } },
      },
    });
    if (!wo) return null;
    const timeEntries = await prisma.manufacturingTimeEntry.findMany({
      where: { tenantId, workOrderId },
      orderBy: { startTime: "desc" },
    });
    const qualityChecks = await prisma.manufacturingQualityCheck.findMany({
      where: { tenantId, workOrderId },
      include: { template: true },
    });
    const scrapRecords = await prisma.manufacturingScrapRecord.findMany({
      where: { tenantId, workOrderId },
    });
    const completedOps = wo.operations.filter(
      (op) => op.status === "COMPLETED",
    ).length;
    const inProgressOps = wo.operations.filter(
      (op) => op.status === "RUNNING",
    ).length;
    const pendingOps = wo.operations.filter(
      (op) => op.status === "PENDING",
    ).length;
    const totalLaborMinutes = timeEntries.reduce(
      (s, te) => s + (te.durationMin || 0),
      0,
    );
    return {
      workOrderId,
      workOrderNumber: wo.workOrderNumber,
      bomName: wo.bom?.name || null,
      status: wo.status,
      quantity: Number(wo.quantity),
      workstation: wo.workstation?.name || null,
      progress: {
        completedOperations: completedOps,
        inProgressOperations: inProgressOps,
        pendingOperations: pendingOps,
        totalOperations: wo.operations.length,
        completionPct:
          wo.operations.length > 0
            ? Number(((completedOps / wo.operations.length) * 100).toFixed(1))
            : 0,
      },
      operations: wo.operations.map((op) => ({
        id: op.id,
        sequence: op.sequence,
        name: op.name,
        workstation: op.workstationCode,
        durationMin: op.durationMinutes,
        status: op.status,
        startedAt: op.startedAt,
        completedAt: op.completedAt,
        operatorId: op.operatorId,
      })),
      materialConsumption: wo.componentConsumptions.map((cc) => ({
        productName: cc.product.name,
        sku: cc.product.sku,
        consumedQty: Number(cc.quantityConsumed),
      })),
      labor: {
        totalEntries: timeEntries.length,
        totalMinutes: totalLaborMinutes,
        totalHours: Number((totalLaborMinutes / 60).toFixed(2)),
        entries: timeEntries.map((te) => ({
          employeeId: te.employeeId,
          activityType: te.activityType,
          startTime: te.startTime,
          endTime: te.endTime,
          durationMin: te.durationMin,
        })),
      },
      quality: {
        totalChecks: qualityChecks.length,
        passed: qualityChecks.filter((qc) => qc.status === "PASSED").length,
        failed: qualityChecks.filter((qc) => qc.status === "FAILED").length,
        checks: qualityChecks.map((qc) => ({
          template: qc.template?.name || null,
          status: qc.status,
          checkedQty: Number(qc.checkedQty),
          passedQty: Number(qc.passedQty),
          failedQty: Number(qc.failedQty),
          checkedAt: qc.checkedAt,
        })),
      },
      scrap: {
        totalRecords: scrapRecords.length,
        totalScrapped: scrapRecords.reduce(
          (s, sr) => s + Number(sr.scrappedQty),
          0,
        ),
        totalCostImpact: Number(
          scrapRecords
            .reduce((s, sr) => s + Number(sr.costImpact || 0), 0)
            .toFixed(2),
        ),
        records: scrapRecords,
      },
      wip: {
        totalProduced:
          Number(wo.quantity) -
          scrapRecords.reduce((s, sr) => s + Number(sr.scrappedQty), 0),
        remainingQty: Math.max(
          0,
          Number(wo.quantity) -
            completedOps *
              (Number(wo.quantity) / Math.max(1, wo.operations.length)),
        ),
      },
    };
  }

  async getManufacturingDashboardKpis(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const workOrders = await prisma.workOrder.findMany({ where: { tenantId } });
    const monthOrders = workOrders.filter((wo) => wo.createdAt >= monthStart);
    const totalOrders = workOrders.length;
    const activeOrders = workOrders.filter(
      (wo) => wo.status === "IN_PROGRESS",
    ).length;
    const completedOrders = workOrders.filter(
      (wo) => wo.status === "COMPLETED",
    ).length;
    const plannedOrders = workOrders.filter(
      (wo) => wo.status === "PLANNED",
    ).length;
    const completionRate =
      totalOrders > 0
        ? Number(((completedOrders / totalOrders) * 100).toFixed(1))
        : 0;
    const totalQuantity = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const totalScrap = workOrders.reduce(
      (s, wo) => s + Number(wo.scrapQuantity || 0),
      0,
    );
    const yieldPct =
      totalQuantity > 0
        ? Number(
            (((totalQuantity - totalScrap) / totalQuantity) * 100).toFixed(1),
          )
        : 0;
    const oeeRecords = await prisma.machineOeeRecord.findMany({
      where: { tenantId, recordDate: { gte: monthStart } },
    });
    const avgOee =
      oeeRecords.length > 0
        ? Number(
            (
              oeeRecords.reduce((s, r) => s + Number(r.oee || 0), 0) /
              oeeRecords.length
            ).toFixed(3),
          )
        : 0;
    const qualityChecks = await prisma.manufacturingQualityCheck.findMany({
      where: { tenantId, checkedAt: { gte: monthStart } },
    });
    const totalChecked = qualityChecks.reduce(
      (s, qc) => s + Number(qc.checkedQty),
      0,
    );
    const totalFailed = qualityChecks.reduce(
      (s, qc) => s + Number(qc.failedQty),
      0,
    );
    const defectRate =
      totalChecked > 0
        ? Number(((totalFailed / totalChecked) * 100).toFixed(2))
        : 0;
    const workstations = await prisma.workstation.findMany({
      where: { tenantId },
    });
    const capacityEntries = await prisma.workCenterCapacity.findMany({
      where: { tenantId, date: { gte: monthStart } },
    });
    const totalAvailable = capacityEntries.reduce(
      (s, ce) => s + Number(ce.availableHours),
      0,
    );
    const totalUtilized = capacityEntries.reduce(
      (s, ce) => s + Number(ce.utilizedHours),
      0,
    );
    const capacityUtilization =
      totalAvailable > 0
        ? Number(((totalUtilized / totalAvailable) * 100).toFixed(1))
        : 0;
    const snapshots = await prisma.productionAnalyticsSnapshot.findMany({
      where: { tenantId },
      orderBy: { snapshotDate: "desc" },
      take: 1,
    });
    return {
      totalWorkOrders: totalOrders,
      activeOrders,
      completedOrders,
      plannedOrders,
      completionRate,
      yieldPct,
      oee: avgOee,
      defectRate,
      capacityUtilization,
      monthly: {
        newOrders: monthOrders.length,
        totalQuantity: Number(totalQuantity.toFixed(2)),
        totalScrap: Number(totalScrap.toFixed(2)),
        qualityChecks: qualityChecks.length,
        defectRate,
      },
      workstations: {
        total: workstations.length,
        capacityUtilization,
      },
      snapshot: snapshots[0]
        ? {
            oeeAvg: snapshots[0].oeeAvg,
            efficiency: snapshots[0].efficiency,
            scrapRate: snapshots[0].scrapRate,
            firstPassYield: snapshots[0].firstPassYield,
            costPerUnit: snapshots[0].costPerUnit,
          }
        : null,
    };
  }

  async getCapacityForecast(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const workstations = await prisma.workstation.findMany({
      where: { tenantId },
      include: {
        capacityEntries: {
          where: { date: { gte: start, lte: end } },
          orderBy: { date: "asc" },
        },
        workOrders: {
          where: {
            status: { in: ["PLANNED", "IN_PROGRESS"] },
            startDate: { gte: start, lte: end },
          },
        },
      },
    });
    const totalCapacity = workstations.reduce(
      (s, ws) =>
        s +
        ws.capacityEntries.reduce(
          (s2, ce) => s2 + Number(ce.availableHours),
          0,
        ),
      0,
    );
    const totalDemand = workstations.reduce(
      (s, ws) =>
        s + ws.workOrders.reduce((s2, wo) => s2 + Number(wo.quantity) * 0.5, 0),
      0,
    );
    const bottleneckCapacity =
      workstations.length > 0
        ? Math.min(
            ...workstations.map(
              (ws) =>
                ws.capacityEntries.reduce(
                  (s, ce) => s + Number(ce.availableHours),
                  0,
                ) || Infinity,
            ),
          )
        : 0;
    const bottleneck = workstations.find(
      (ws) =>
        ws.capacityEntries.reduce(
          (s, ce) => s + Number(ce.availableHours),
          0,
        ) === bottleneckCapacity,
    );
    return {
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalWorkstations: workstations.length,
        totalCapacityHours: Number(totalCapacity.toFixed(2)),
        totalDemandHours: Number(totalDemand.toFixed(2)),
        utilizationPct:
          totalCapacity > 0
            ? Number(((totalDemand / totalCapacity) * 100).toFixed(1))
            : 0,
        bottleneckWorkstation: bottleneck?.name || null,
        bottleneckCapacityHours: Number(bottleneckCapacity.toFixed(2)),
      },
      workstations: workstations.map((ws) => {
        const wsCapacity = ws.capacityEntries.reduce(
          (s, ce) => s + Number(ce.availableHours),
          0,
        );
        const wsDemand = ws.workOrders.reduce(
          (s, wo) => s + Number(wo.quantity) * 0.5,
          0,
        );
        return {
          id: ws.id,
          name: ws.name,
          capacityHours: Number(wsCapacity.toFixed(2)),
          demandHours: Number(wsDemand.toFixed(2)),
          utilizationPct:
            wsCapacity > 0
              ? Number(((wsDemand / wsCapacity) * 100).toFixed(1))
              : 0,
          isBottleneck:
            bottleneckCapacity > 0 && wsCapacity <= bottleneckCapacity * 1.1,
          plannedWorkOrders: ws.workOrders.length,
        };
      }),
      bottlenecks: workstations
        .filter((ws) => {
          const wsCap = ws.capacityEntries.reduce(
            (s, ce) => s + Number(ce.availableHours),
            0,
          );
          const wsDem = ws.workOrders.reduce(
            (s, wo) => s + Number(wo.quantity) * 0.5,
            0,
          );
          return wsCap > 0 && wsDem / wsCap > 0.9;
        })
        .map((ws) => ({
          id: ws.id,
          name: ws.name,
          utilizationPct: Number(
            (
              (ws.workOrders.reduce(
                (s, wo) => s + Number(wo.quantity) * 0.5,
                0,
              ) /
                Math.max(
                  1,
                  ws.capacityEntries.reduce(
                    (s, ce) => s + Number(ce.availableHours),
                    0,
                  ),
                )) *
              100
            ).toFixed(1),
          ),
        })),
    };
  }

  async getManufacturingCost(
    tenantId: string,
    productId: string,
    period: string,
  ) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const boms = await prisma.bOM.findMany({
      where: { tenantId, productId, isActive: true },
      include: { items: true },
    });
    // BOMItem has no direct `product` relation — resolve components separately.
    const bomComponentProducts = await prisma.product.findMany({
      where: {
        id: {
          in: boms.flatMap((bom) => bom.items.map((item) => item.productId)),
        },
      },
      select: { id: true, costPrice: true, name: true, sku: true },
    });
    const bomComponentsById = new Map(
      bomComponentProducts.map((p) => [p.id, p]),
    );
    const workOrders = await prisma.workOrder.findMany({
      where: {
        tenantId,
        bom: { productId },
        createdAt: { gte: startDate, lte: now },
      },
      include: {
        operations: true,
        componentConsumptions: {
          include: { product: { select: { costPrice: true } } },
        },
      },
    });
    const timeEntries = await prisma.manufacturingTimeEntry.findMany({
      where: {
        tenantId,
        workOrderId: { in: workOrders.map((wo) => wo.id) },
      },
    });
    const totalLaborMinutes = timeEntries.reduce(
      (s, te) => s + (te.durationMin || 0),
      0,
    );
    const totalMaterialCost = workOrders.reduce(
      (s, wo) =>
        s +
        wo.componentConsumptions.reduce(
          (s2, cc) =>
            s2 +
            Number(cc.quantityConsumed) * Number(cc.product.costPrice || 0),
          0,
        ),
      0,
    );
    const totalLaborCost = (totalLaborMinutes / 60) * 25;
    const totalOverhead = workOrders.reduce(
      (s, wo) => s + Number(wo.overheadCost || 0),
      0,
    );
    const totalQuantity = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const unitMaterialCost =
      totalQuantity > 0 ? totalMaterialCost / totalQuantity : 0;
    const unitLaborCost =
      totalQuantity > 0 ? totalLaborCost / totalQuantity : 0;
    const unitOverhead = totalQuantity > 0 ? totalOverhead / totalQuantity : 0;
    const unitCost = unitMaterialCost + unitLaborCost + unitOverhead;
    const bomStandardCost = boms[0] ? Number(boms[0].standardCost) : 0;
    return {
      productId,
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalWorkOrders: workOrders.length,
        totalQuantity: Number(totalQuantity.toFixed(2)),
        totalCost: Number(
          (totalMaterialCost + totalLaborCost + totalOverhead).toFixed(2),
        ),
        unitCost: Number(unitCost.toFixed(2)),
        bomStandardCost: Number(bomStandardCost.toFixed(2)),
        costVariance:
          bomStandardCost > 0
            ? Number(
                (
                  ((unitCost - bomStandardCost) / bomStandardCost) *
                  100
                ).toFixed(1),
              )
            : 0,
      },
      breakdown: {
        material: {
          total: Number(totalMaterialCost.toFixed(2)),
          perUnit: Number(unitMaterialCost.toFixed(2)),
          pct:
            unitCost > 0
              ? Number(((unitMaterialCost / unitCost) * 100).toFixed(1))
              : 0,
        },
        labor: {
          total: Number(totalLaborCost.toFixed(2)),
          perUnit: Number(unitLaborCost.toFixed(2)),
          hours: Number((totalLaborMinutes / 60).toFixed(2)),
          pct:
            unitCost > 0
              ? Number(((unitLaborCost / unitCost) * 100).toFixed(1))
              : 0,
        },
        overhead: {
          total: Number(totalOverhead.toFixed(2)),
          perUnit: Number(unitOverhead.toFixed(2)),
          pct:
            unitCost > 0
              ? Number(((unitOverhead / unitCost) * 100).toFixed(1))
              : 0,
        },
      },
      bomCostBreakdown: boms.map((bom) => ({
        bomId: bom.id,
        bomName: bom.name,
        standardCost: Number(bom.standardCost),
        materialCost: Number(bom.materialCost),
        overheadCost: Number(bom.overheadCost),
        items: bom.items.map((item) => {
          const component = bomComponentsById.get(item.productId);
          const unitCost = Number(component?.costPrice || 0);
          return {
            componentName: component?.name,
            sku: component?.sku,
            qtyPerUnit: Number(item.quantity),
            unitCost,
            extendedCost: Number((Number(item.quantity) * unitCost).toFixed(2)),
          };
        }),
      })),
    };
  }

  async getSustainabilityMetrics(tenantId: string, period: string) {
    const now = new Date();
    let startDate: Date;
    if (period === "WEEKLY") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "MONTHLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "QUARTERLY") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId, createdAt: { gte: startDate, lte: now } },
    });
    const snapshots = await prisma.productionAnalyticsSnapshot.findMany({
      where: { tenantId, snapshotDate: { gte: startDate, lte: now } },
    });
    const scrapRecords = await prisma.manufacturingScrapRecord.findMany({
      where: { tenantId, createdAt: { gte: startDate, lte: now } },
    });
    const totalQuantity = workOrders.reduce(
      (s, wo) => s + Number(wo.quantity),
      0,
    );
    const totalScrap = scrapRecords.reduce(
      (s, sr) => s + Number(sr.scrappedQty),
      0,
    );
    const energyConsumption = snapshots.reduce(
      (s, sn) => s + Number(sn.energyConsumption || 0),
      0,
    );
    const wasteGeneration = totalScrap;
    const recyclingRate =
      totalQuantity > 0
        ? Number(
            (((totalQuantity - totalScrap) / totalQuantity) * 100).toFixed(1),
          )
        : 0;
    const energyPerUnit =
      totalQuantity > 0
        ? Number((energyConsumption / totalQuantity).toFixed(4))
        : 0;
    return {
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: now.toISOString().split("T")[0],
      },
      summary: {
        totalProductionQty: Number(totalQuantity.toFixed(2)),
        totalEnergyConsumption: Number(energyConsumption.toFixed(2)),
        totalWasteGeneration: Number(wasteGeneration.toFixed(2)),
        recyclingRate,
        energyPerUnit,
      },
      energy: {
        totalConsumed: Number(energyConsumption.toFixed(2)),
        perUnit: energyPerUnit,
        trend: snapshots.map((s) => ({
          date: s.snapshotDate,
          energy: s.energyConsumption,
        })),
      },
      waste: {
        totalGenerated: Number(wasteGeneration.toFixed(2)),
        byReason: scrapRecords.reduce<Record<string, number>>((acc, sr) => {
          acc[sr.reason] = (acc[sr.reason] || 0) + Number(sr.scrappedQty);
          return acc;
        }, {}),
      },
      recycling: {
        rate: recyclingRate,
        totalRecycled: Number((totalQuantity - totalScrap).toFixed(2)),
      },
      efficiencyMetrics: {
        scrapRate:
          totalQuantity > 0
            ? Number(((totalScrap / totalQuantity) * 100).toFixed(2))
            : 0,
        yieldPct:
          totalQuantity > 0
            ? Number(
                (((totalQuantity - totalScrap) / totalQuantity) * 100).toFixed(
                  1,
                ),
              )
            : 0,
      },
    };
  }
}
