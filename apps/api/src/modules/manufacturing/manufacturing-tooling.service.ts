// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingToolingService {
  async registerTool(
    tenantId: string,
    data: {
      code: string;
      name: string;
      type?: string;
      maxLifeCycles?: number;
      calibrationFrequencyDays?: number;
      supplierId?: string;
      purchaseCost?: number;
      notes?: string;
    },
  ) {
    return prisma.toolingMaster.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        type: data.type || "TOOL",
        maxLifeCycles: data.maxLifeCycles,
        calibrationFrequencyDays: data.calibrationFrequencyDays,
        supplierId: data.supplierId,
        purchaseCost: data.purchaseCost,
        notes: data.notes,
      },
    });
  }

  async getTools(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.toolingMaster.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async scheduleCalibration(
    tenantId: string,
    toolId: string,
    data: { calibrationDate: string; calibratedBy?: string; standard?: string },
  ) {
    const tool = await prisma.toolingMaster.findFirst({
      where: { id: toolId, tenantId },
    });
    if (!tool) throw new NotFoundException("Tool not found");
    const cal = await prisma.toolingCalibration.create({
      data: {
        tenantId,
        toolId,
        calibrationNo: `CAL-${Date.now()}`,
        calibrationDate: new Date(data.calibrationDate),
        calibratedBy: data.calibratedBy,
        standard: data.standard,
      },
    });
    const freqDays = tool.calibrationFrequencyDays;
    const nextDue = freqDays
      ? new Date(cal.calibrationDate.getTime() + freqDays * 86400000)
      : null;
    await prisma.toolingMaster.update({
      where: { id: toolId },
      data: {
        lastCalibrationDate: cal.calibrationDate,
        nextCalibrationDate: nextDue,
        status: "AVAILABLE",
      },
    });
    return cal;
  }

  async logToolUsage(
    tenantId: string,
    data: {
      toolId: string;
      workOrderId?: string;
      operationId?: string;
      startTime: string;
      endTime?: string;
      cyclesUsed?: number;
      operatorId?: string;
    },
  ) {
    const tool = await prisma.toolingMaster.findFirst({
      where: { id: data.toolId, tenantId },
    });
    if (!tool) throw new NotFoundException("Tool not found");
    const usage = await prisma.toolingUsageLog.create({
      data: {
        tenantId,
        toolId: data.toolId,
        workOrderId: data.workOrderId,
        operationId: data.operationId,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        cyclesUsed: data.cyclesUsed || 0,
        operatorId: data.operatorId,
      },
    });
    const totalCycles = tool.currentCycles + (data.cyclesUsed || 0);
    const needsRetire = tool.maxLifeCycles && totalCycles >= tool.maxLifeCycles;
    await prisma.toolingMaster.update({
      where: { id: data.toolId },
      data: {
        currentCycles: totalCycles,
        status: needsRetire ? "RETIRED" : "IN_USE",
      },
    });
    return usage;
  }

  async getToolStatus(tenantId: string, toolId: string) {
    const tool = await prisma.toolingMaster.findFirst({
      where: { id: toolId, tenantId },
      include: {
        calibrations: { orderBy: { calibrationDate: "desc" }, take: 5 },
        usageLogs: { orderBy: { startTime: "desc" }, take: 10 },
      },
    });
    if (!tool) throw new NotFoundException("Tool not found");
    const lifePct = tool.maxLifeCycles
      ? Math.round((tool.currentCycles / tool.maxLifeCycles) * 100)
      : null;
    return {
      ...tool,
      lifecyclePercent: lifePct,
      calibrationCount: tool.calibrations.length,
      usageCount: tool.usageLogs.length,
    };
  }

  async getCalibrationSchedule(tenantId: string, daysAhead: number = 30) {
    const deadline = new Date(Date.now() + daysAhead * 86400000);
    return prisma.toolingMaster.findMany({
      where: {
        tenantId,
        isActive: true,
        nextCalibrationDate: { lte: deadline },
      },
      include: {
        calibrations: { orderBy: { calibrationDate: "desc" }, take: 1 },
      },
      orderBy: { nextCalibrationDate: "asc" },
    });
  }

  async calculateGageRR(tenantId: string, studyId: string) {
    const study = await prisma.gageRrStudy.findFirst({
      where: { id: studyId, tenantId },
      include: { samples: true },
    });
    if (!study) throw new NotFoundException("Gage R&R Study not found");
    const samples = study.samples;
    if (samples.length < 2)
      return { message: "Insufficient samples", study: study.id };
    const values = samples.map((s) => Number(s.value));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const totalVar =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
    const totalStdDev = Math.sqrt(totalVar);
    const gageRR = totalStdDev;
    const tolerance = Number(study.tolerance || 1);
    const gageRrPct = tolerance > 0 ? (gageRR / tolerance) * 100 : null;
    const ndc =
      gageRR > 0 && gageRrPct
        ? Math.floor(Math.sqrt(2) * (tolerance / gageRR))
        : null;
    let verdict = "ACCEPTABLE";
    if (gageRrPct && gageRrPct > 30) verdict = "UNACCEPTABLE";
    else if (gageRrPct && gageRrPct > 10) verdict = "CONDITIONAL";
    await prisma.gageRrStudy.update({
      where: { id: studyId },
      data: {
        totalGageRR: gageRR,
        gageRrPct: gageRrPct ? Math.round(gageRrPct * 100) / 100 : null,
        ndc,
        verdict,
        status: "COMPLETED",
      },
    });
    return {
      studyId,
      totalGageRR: gageRR,
      gageRrPct: gageRrPct ? Math.round(gageRrPct * 100) / 100 : null,
      ndc,
      verdict,
      sampleCount: samples.length,
    };
  }

  async getToolingDashboard(tenantId: string) {
    const [
      totalTools,
      available,
      inUse,
      inCalibration,
      retired,
      dueCalibration,
    ] = await Promise.all([
      prisma.toolingMaster.count({ where: { tenantId, isActive: true } }),
      prisma.toolingMaster.count({ where: { tenantId, status: "AVAILABLE" } }),
      prisma.toolingMaster.count({ where: { tenantId, status: "IN_USE" } }),
      prisma.toolingMaster.count({
        where: { tenantId, status: "IN_CALIBRATION" },
      }),
      prisma.toolingMaster.count({ where: { tenantId, status: "RETIRED" } }),
      this.getCalibrationSchedule(tenantId, 30),
    ]);
    return {
      totalTools,
      available,
      inUse,
      inCalibration,
      retired,
      dueCalibrationCount: dueCalibration.length,
      dueCalibration,
    };
  }
}
