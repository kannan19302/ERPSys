import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ManufacturingAdvancedQualityService {
  async getSPCData(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const charts = await prisma.spcChart.findMany({
      where,
      include: { samples: { orderBy: { sampleNo: "asc" }, take: 100 } },
      orderBy: { createdAt: "desc" },
    });
    return charts.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      chartType: c.chartType,
      productId: c.productId,
      targetMean: c.targetMean,
      usl: c.usl,
      lsl: c.lsl,
      sampleCount: c.samples.length,
      samples: c.samples.map((s) => ({
        sampleNo: s.sampleNo,
        mean: s.mean,
        range: s.range,
        stdDev: s.stdDev,
        defective: s.defective,
        values: s.values,
      })),
    }));
  }

  async calculateCpCpk(
    tenantId: string,
    data: { chartId: string; usl: number; lsl: number },
  ) {
    const chart = await prisma.spcChart.findFirst({
      where: { id: data.chartId, tenantId },
      include: { samples: true },
    });
    if (!chart) throw new NotFoundException("SPC Chart not found");
    const means = chart.samples
      .map((s) => Number(s.mean || 0))
      .filter((v) => v > 0);
    if (means.length < 2)
      return {
        cp: null,
        cpk: null,
        mean: null,
        stdDev: null,
        message: "Insufficient samples",
      };
    const mean = means.reduce((a, b) => a + b, 0) / means.length;
    const stdDev = Math.sqrt(
      means.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (means.length - 1),
    );
    const usl = data.usl;
    const lsl = data.lsl;
    const cp = stdDev > 0 ? (usl - lsl) / (6 * stdDev) : null;
    const cpk =
      stdDev > 0
        ? Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev))
        : null;
    return {
      cp: cp ? Math.round(cp * 100) / 100 : null,
      cpk: cpk ? Math.round(cpk * 100) / 100 : null,
      mean: Math.round(mean * 1000000) / 1000000,
      stdDev: Math.round(stdDev * 1000000) / 1000000,
      sampleCount: means.length,
      usl,
      lsl,
    };
  }

  async createFMEA(
    tenantId: string,
    data: {
      productId: string;
      code: string;
      title: string;
      type?: string;
      items?: Array<{
        processStep: string;
        failureMode: string;
        effect: string;
        cause: string;
        severity: number;
        occurrence: number;
        detection: number;
      }>;
    },
  ) {
    const worksheet = await prisma.fmeaWorksheet.create({
      data: {
        tenantId,
        productId: data.productId,
        code: data.code,
        title: data.title,
        type: data.type || "DESIGN",
      },
    });
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await prisma.fmeaItem.create({
          data: {
            tenantId,
            worksheetId: worksheet.id,
            processStep: item.processStep,
            failureMode: item.failureMode,
            effect: item.effect,
            cause: item.cause,
            severity: item.severity,
            occurrence: item.occurrence,
            detection: item.detection,
            rpn: item.severity * item.occurrence * item.detection,
          } as any,
        });
      }
    }
    return prisma.fmeaWorksheet.findUnique({
      where: { id: worksheet.id },
      include: { items: true },
    });
  }

  async getFMEARiskPriority(tenantId: string, worksheetId: string) {
    const ws = await prisma.fmeaWorksheet.findFirst({
      where: { id: worksheetId, tenantId },
      include: { items: { orderBy: { rpn: "desc" } } },
    });
    if (!ws) throw new NotFoundException("FMEA Worksheet not found");
    const totalRpn = ws.items.reduce((sum, i) => sum + i.rpn, 0);
    return {
      worksheetId: ws.id,
      title: ws.title,
      totalItems: ws.items.length,
      averageRpn:
        ws.items.length > 0 ? Math.round(totalRpn / ws.items.length) : 0,
      highRiskItems: ws.items.filter((i) => i.rpn >= 100).length,
      items: ws.items.map((i) => ({
        id: i.id,
        processStep: i.processStep,
        failureMode: i.failureMode,
        severity: i.severity,
        occurrence: i.occurrence,
        detection: i.detection,
        rpn: i.rpn,
        status: i.status,
      })),
    };
  }

  async createAPQP(
    tenantId: string,
    data: {
      productId: string;
      code: string;
      name: string;
      startDate?: string;
      targetDate?: string;
    },
  ) {
    return prisma.apqpProject.create({
      data: {
        tenantId,
        productId: data.productId,
        code: data.code,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        phases: {
          create: [
            { tenantId, phaseNo: 1, name: "Plan & Define Scope" },
            { tenantId, phaseNo: 2, name: "Product Design & Development" },
            { tenantId, phaseNo: 3, name: "Process Design & Development" },
            { tenantId, phaseNo: 4, name: "Product & Process Validation" },
            { tenantId, phaseNo: 5, name: "Launch, Feedback & Assessment" },
          ],
        },
      },
      include: { phases: { orderBy: { phaseNo: "asc" } } },
    });
  }

  async getAPQPStatus(tenantId: string, projectId: string) {
    const project = await prisma.apqpProject.findFirst({
      where: { id: projectId, tenantId },
      include: { phases: { orderBy: { phaseNo: "asc" } } },
    });
    if (!project) throw new NotFoundException("APQP Project not found");
    const completedPhases = project.phases.filter(
      (p) => p.status === "COMPLETED",
    ).length;
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      totalPhases: project.phases.length,
      completedPhases,
      progress:
        project.phases.length > 0
          ? Math.round((completedPhases / project.phases.length) * 100)
          : 0,
      phases: project.phases,
    };
  }

  async createPPAPSubmission(
    tenantId: string,
    data: {
      productId: string;
      level?: string;
      customerId?: string;
      notes?: string;
    },
  ) {
    return prisma.ppapSubmission.create({
      data: {
        tenantId,
        productId: data.productId,
        level: data.level || "LEVEL_3",
        customerId: data.customerId,
        notes: data.notes,
      },
    });
  }

  async getPPAPStatus(tenantId: string, submissionId: string) {
    const submission = await prisma.ppapSubmission.findFirst({
      where: { id: submissionId, tenantId },
    });
    if (!submission) throw new NotFoundException("PPAP Submission not found");
    return submission;
  }

  async getQualityDashboard(tenantId: string) {
    const [spcCount, fmeaCount, apqpCount, ppapCount] = await Promise.all([
      prisma.spcChart.count({ where: { tenantId } }),
      prisma.fmeaWorksheet.count({ where: { tenantId } }),
      prisma.apqpProject.count({ where: { tenantId } }),
      prisma.ppapSubmission.count({ where: { tenantId } }),
    ]);
    const activeFmeas = await prisma.fmeaWorksheet.findMany({
      where: { tenantId },
      include: { items: true },
    });
    const totalRpn = activeFmeas.reduce(
      (sum, ws) => sum + ws.items.reduce((s, i) => s + i.rpn, 0),
      0,
    );
    const totalItems = activeFmeas.reduce(
      (sum, ws) => sum + ws.items.length,
      0,
    );
    return {
      spcCharts: spcCount,
      fmeaWorksheets: fmeaCount,
      apqpProjects: apqpCount,
      ppapSubmissions: ppapCount,
      averageRpn: totalItems > 0 ? Math.round(totalRpn / totalItems) : 0,
      highRiskItems: activeFmeas.reduce(
        (sum, ws) => sum + ws.items.filter((i) => i.rpn >= 100).length,
        0,
      ),
    };
  }
}
