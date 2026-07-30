// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class MfgDeepExpansionService {
  private get prisma() {
    return prisma as any;
  }

  // 1. Master Production Schedule (MPS)
  async createMps(tenantId: string, data: any) {
    return this.prisma.masterProductionSchedule.create({
      data: {
        ...data,
        tenantId,
        entries: data.entries
          ? {
              createMany: {
                data: data.entries.map((entry: any) => ({
                  ...entry,
                  tenantId,
                })),
              },
            }
          : undefined,
      },
      include: { entries: true },
    });
  }

  async getMpsSchedules(tenantId: string) {
    return this.prisma.masterProductionSchedule.findMany({
      where: { tenantId },
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. FMEA & Quality (Process & Design Risk Analysis)
  async createFmeaRecord(tenantId: string, data: any) {
    return this.prisma.fmeaRecord.create({
      data: {
        ...data,
        tenantId,
        modes: data.modes
          ? {
              createMany: {
                data: data.modes.map((mode: any) => ({
                  ...mode,
                  tenantId,
                  rpn:
                    (mode.severity || 5) *
                    (mode.occurrence || 5) *
                    (mode.detection || 5),
                })),
              },
            }
          : undefined,
      },
      include: { modes: true },
    });
  }

  async getFmeaRecords(tenantId: string) {
    return this.prisma.fmeaRecord.findMany({
      where: { tenantId },
      include: { modes: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 3. SPC Control Charts & Data Points
  async createSpcChart(tenantId: string, data: any) {
    return this.prisma.mfgSpcChart.create({
      data: { ...data, tenantId },
      include: { dataPoints: true },
    });
  }

  async recordSpcDataPoint(tenantId: string, chartId: string, data: any) {
    const chart = await this.prisma.mfgSpcChart.findFirst({
      where: { id: chartId, tenantId },
    });
    if (!chart) throw new NotFoundException(`SPC Chart #${chartId} not found`);

    let outOfControl = false;
    let violationType: string | null = null;

    if (chart.ucl && data.value > chart.ucl) {
      outOfControl = true;
      violationType = "ABOVE_UCL";
    } else if (chart.lcl && data.value < chart.lcl) {
      outOfControl = true;
      violationType = "BELOW_LCL";
    }

    return this.prisma.mfgSpcDataPoint.create({
      data: {
        ...data,
        chartId,
        tenantId,
        outOfControl,
        violationType,
      },
    });
  }

  // 4. Job Costing & Cost Sheets
  async createJobCostSheet(tenantId: string, data: any) {
    return this.prisma.jobCostSheet.create({
      data: {
        ...data,
        tenantId,
        totalPlannedCost:
          (data.plannedMaterialCost || 0) +
          (data.plannedLaborCost || 0) +
          (data.plannedOverheadCost || 0),
        totalActualCost:
          (data.actualMaterialCost || 0) +
          (data.actualLaborCost || 0) +
          (data.actualOverheadCost || 0),
      },
      include: { costEntries: true },
    });
  }

  async addMfgCostEntry(tenantId: string, costSheetId: string, data: any) {
    const entry = await this.prisma.mfgCostEntry.create({
      data: { ...data, costSheetId, tenantId },
    });

    // Update totals on job cost sheet
    const entries = await this.prisma.mfgCostEntry.findMany({
      where: { costSheetId, tenantId },
    });
    const actualMaterialCost = entries
      .filter((e: any) => e.costType === "MATERIAL")
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const actualLaborCost = entries
      .filter((e: any) => e.costType === "LABOR")
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const actualOverheadCost = entries
      .filter((e: any) => e.costType === "OVERHEAD")
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const totalActualCost =
      actualMaterialCost + actualLaborCost + actualOverheadCost;

    await this.prisma.jobCostSheet.update({
      where: { id: costSheetId },
      data: {
        actualMaterialCost,
        actualLaborCost,
        actualOverheadCost,
        totalActualCost,
      },
    });

    return entry;
  }

  // 5. Process Formulas & Co-Products
  async createProductionFormula(tenantId: string, data: any) {
    return this.prisma.productionFormula.create({
      data: {
        ...data,
        tenantId,
        ingredients: data.ingredients
          ? {
              createMany: {
                data: data.ingredients.map((i: any) => ({ ...i, tenantId })),
              },
            }
          : undefined,
        coProducts: data.coProducts
          ? {
              createMany: {
                data: data.coProducts.map((c: any) => ({ ...c, tenantId })),
              },
            }
          : undefined,
      },
      include: { ingredients: true, coProducts: true },
    });
  }

  async getProductionFormulas(tenantId: string) {
    return this.prisma.productionFormula.findMany({
      where: { tenantId },
      include: { ingredients: true, coProducts: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 6. Machines & OEE Tracking
  async createMachine(tenantId: string, data: any) {
    return this.prisma.manufacturingMachine.create({
      data: { ...data, tenantId },
    });
  }

  async recordOee(tenantId: string, machineId: string, data: any) {
    const availability =
      data.plannedRunTime > 0 ? data.actualRunTime / data.plannedRunTime : 0;
    const performance =
      data.plannedUnits > 0 ? data.actualUnits / data.plannedUnits : 0;
    const quality =
      data.actualUnits > 0 ? data.goodUnits / data.actualUnits : 0;
    const oee = availability * performance * quality;

    return this.prisma.machineOeeRecord.create({
      data: {
        ...data,
        machineId,
        tenantId,
        availability,
        performance,
        quality,
        oee,
      },
    });
  }

  async getMachines(tenantId: string) {
    return this.prisma.manufacturingMachine.findMany({
      where: { tenantId },
      include: {
        oeeRecords: { take: 10, orderBy: { recordDate: "desc" } },
        downtime: { take: 10 },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // 7. Maintenance & CMMS Work Orders
  async createMaintenanceSchedule(tenantId: string, data: any) {
    return this.prisma.maintenanceSchedule.create({
      data: { ...data, tenantId },
    });
  }

  async createMaintenanceWorkOrder(tenantId: string, data: any) {
    return this.prisma.mfgMaintenanceWorkOrder.create({
      data: { ...data, tenantId },
    });
  }

  // 8. Six Sigma DMAIC Projects
  async createSixSigmaProject(tenantId: string, data: any) {
    return this.prisma.sixSigmaProject.create({
      data: {
        ...data,
        tenantId,
        ssMetrics: data.ssMetrics
          ? {
              createMany: {
                data: data.ssMetrics.map((m: any) => ({ ...m, tenantId })),
              },
            }
          : undefined,
      },
      include: { ssMetrics: true, ssTools: true },
    });
  }

  // 9. Shop Floor Control & Barcode Scanning
  async recordShopFloorTransaction(tenantId: string, data: any) {
    return this.prisma.shopFloorTransaction.create({
      data: { ...data, tenantId },
    });
  }

  // 10. GMP / HACCP Compliance
  async createGmpBatchRecord(tenantId: string, data: any) {
    return this.prisma.gmpBatchRecord.create({
      data: { ...data, tenantId },
    });
  }

  async createHacppPlan(tenantId: string, data: any) {
    return this.prisma.hacppPlan.create({
      data: { ...data, tenantId },
    });
  }
}
