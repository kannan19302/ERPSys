import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingTpmService {
  async createTPMPillar(
    tenantId: string,
    data: {
      name: string;
      code: string;
      pillarType?: string;
      description?: string;
      targetScore?: number;
    },
  ) {
    return prisma.tpmPillar.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        pillarType: data.pillarType || "AUTONOMOUS",
        description: data.description,
        targetScore: data.targetScore || 100,
      },
    });
  }

  async getTPMPillars(tenantId: string) {
    return prisma.tpmPillar.findMany({
      where: { tenantId },
      include: { activities: { orderBy: { performedAt: "desc" }, take: 10 } },
      orderBy: { createdAt: "asc" },
    });
  }

  async logPillarActivity(
    tenantId: string,
    data: {
      pillarId: string;
      title: string;
      description?: string;
      activityType?: string;
      stepNo?: number;
      score?: number;
      performedBy?: string;
      notes?: string;
    },
  ) {
    const pillar = await prisma.tpmPillar.findFirst({
      where: { id: data.pillarId, tenantId },
    });
    if (!pillar) throw new NotFoundException("TPM Pillar not found");
    const activity = await prisma.tpmPillarActivity.create({
      data: {
        tenantId,
        pillarId: data.pillarId,
        title: data.title,
        description: data.description,
        activityType: data.activityType || "STEP_COMPLETION",
        stepNo: data.stepNo,
        score: data.score,
        performedBy: data.performedBy,
        notes: data.notes,
      },
    });
    if (data.score) {
      const avg = await prisma.tpmPillarActivity.aggregate({
        where: { pillarId: data.pillarId },
        _avg: { score: true },
      });
      await prisma.tpmPillar.update({
        where: { id: data.pillarId },
        data: { score: avg._avg.score || 0 },
      });
    }
    return activity;
  }

  async perform5SAudit(
    tenantId: string,
    data: {
      workstationId: string;
      auditorId?: string;
      sortScore: number;
      setInOrderScore: number;
      shineScore: number;
      standardizeScore: number;
      sustainScore: number;
      findings?: string;
      actionItems?: Array<{ action: string; dueDate?: string }>;
    },
  ) {
    const workstation = await prisma.workstation.findFirst({
      where: { id: data.workstationId, tenantId },
    });
    if (!workstation) throw new NotFoundException("Workstation not found");
    const totalScore =
      data.sortScore +
      data.setInOrderScore +
      data.shineScore +
      data.standardizeScore +
      data.sustainScore;
    const maxScore = 25;
    const pct = (totalScore / maxScore) * 100;
    let status = "FAILED";
    if (pct >= 80) status = "PASSED";
    else if (pct >= 60) status = "CONDITIONAL";
    await prisma.tpmAudit5S.create({
      data: {
        tenantId,
        workstationId: data.workstationId,
        auditorId: data.auditorId,
        sortScore: data.sortScore,
        setInOrderScore: data.setInOrderScore,
        shineScore: data.shineScore,
        standardizeScore: data.standardizeScore,
        sustainScore: data.sustainScore,
        totalScore,
        maxScore,
        status,
        findings: data.findings,
        actionItems: data.actionItems || [],
      },
    });
    return {
      workstationId: data.workstationId,
      totalScore,
      maxScore,
      percentage: pct,
      status,
    };
  }

  async get5SAudits(tenantId: string, workstationId?: string) {
    const where: any = { tenantId };
    if (workstationId) where.workstationId = workstationId;
    return prisma.tpmAudit5S.findMany({
      where,
      orderBy: { auditedAt: "desc" },
    });
  }

  async getOeeDeepData(
    tenantId: string,
    workstationId?: string,
    period: string = "DAILY",
  ) {
    const where: any = { tenantId };
    if (workstationId) where.workstationId = workstationId;
    const kpis = await prisma.tpmKpi.findMany({
      where: { ...where, period },
      orderBy: { recordedAt: "desc" },
      take: 100,
    });
    const oeekpis = kpis.filter((k) => k.kpiType === "OEE");
    const avgOee =
      oeekpis.length > 0
        ? oeekpis.reduce((sum, k) => sum + Number(k.value), 0) / oeekpis.length
        : 0;
    const byWorkstation: Record<
      string,
      {
        oee: number;
        availability: number;
        performance: number;
        quality: number;
      }
    > = {};
    for (const kpi of kpis) {
      const wsId = kpi.workstationId || "unknown";
      if (!byWorkstation[wsId])
        byWorkstation[wsId] = {
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 0,
        };
      if (kpi.kpiType === "OEE") byWorkstation[wsId].oee = Number(kpi.value);
      if (kpi.kpiType === "AVAILABILITY")
        byWorkstation[wsId].availability = Number(kpi.value);
      if (kpi.kpiType === "PERFORMANCE")
        byWorkstation[wsId].performance = Number(kpi.value);
      if (kpi.kpiType === "QUALITY")
        byWorkstation[wsId].quality = Number(kpi.value);
    }
    return {
      period,
      averageOee: Math.round(avgOee * 100) / 100,
      totalRecords: kpis.length,
      byWorkstation,
      recentKpis: kpis.slice(0, 20),
    };
  }

  async recordTpmKpi(
    tenantId: string,
    data: {
      pillarId?: string;
      workstationId?: string;
      kpiType: string;
      value: number;
      target?: number;
      period?: string;
    },
  ) {
    return prisma.tpmKpi.create({
      data: {
        tenantId,
        pillarId: data.pillarId,
        workstationId: data.workstationId,
        kpiType: data.kpiType,
        value: data.value,
        target: data.target,
        period: data.period || "DAILY",
      },
    });
  }

  async getTPMDashboard(tenantId: string) {
    const [pillars, audits, recentKpis] = await Promise.all([
      prisma.tpmPillar.findMany({
        where: { tenantId },
        include: { activities: { orderBy: { performedAt: "desc" }, take: 5 } },
      }),
      prisma.tpmAudit5S.findMany({
        where: { tenantId },
        orderBy: { auditedAt: "desc" },
        take: 10,
      }),
      prisma.tpmKpi.findMany({
        where: { tenantId, period: "DAILY" },
        orderBy: { recordedAt: "desc" },
        take: 20,
      }),
    ]);
    const avgScore =
      pillars.length > 0
        ? pillars.reduce((sum, p) => sum + Number(p.score || 0), 0) /
          pillars.length
        : 0;
    const passedAudits = audits.filter((a) => a.status === "PASSED").length;
    return {
      pillarCount: pillars.length,
      averagePillarScore: Math.round(avgScore * 100) / 100,
      totalAudits: audits.length,
      passedAudits,
      pillars,
      recentAudits: audits,
      recentKpis,
    };
  }
}
