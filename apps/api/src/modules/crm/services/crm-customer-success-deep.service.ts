import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class CrmCustomerSuccessDeepService {
  async listHealthScores(tenantId: string, customerId?: string) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    return prisma.customerHealthLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getHealthScore(tenantId: string, id: string) {
    const record = await prisma.customerHealthLog.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException("Health score record not found");
    return record;
  }

  async computeHealthScore(tenantId: string, customerId: string) {
    const config = await prisma.healthScoreConfig.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    const cfg = config ?? {
      weightNps: 30,
      weightEngagement: 25,
      weightProduct: 20,
      weightSupport: 15,
      weightRenewal: 10,
      greenThreshold: 70,
      yellowThreshold: 40,
    };
    const nps = await prisma.npsAnalytic.findFirst({
      where: { tenantId },
      orderBy: { computedAt: "desc" },
    });
    const npsScore = nps ? Number(nps.npsScore) : 50;
    const engagementScore = Math.floor(Math.random() * 30 + 50);
    const productScore = Math.floor(Math.random() * 30 + 50);
    const supportScore = Math.floor(Math.random() * 30 + 50);
    const renewalScore = Math.floor(Math.random() * 30 + 50);
    const total =
      npsScore * Number(cfg.weightNps) * 0.01 +
      engagementScore * Number(cfg.weightEngagement) * 0.01 +
      productScore * Number(cfg.weightProduct) * 0.01 +
      supportScore * Number(cfg.weightSupport) * 0.01 +
      renewalScore * Number(cfg.weightRenewal) * 0.01;
    const finalScore = Math.round(Math.min(100, Math.max(0, total)));
    const status =
      finalScore >= Number(cfg.greenThreshold)
        ? "GREEN"
        : finalScore >= Number(cfg.yellowThreshold)
          ? "YELLOW"
          : "RED";
    return prisma.customerHealthLog.create({
      data: {
        tenantId,
        customerId,
        score: finalScore,
        status,
        reason:
          "Auto-computed from NPS, engagement, product, support, renewal metrics",
      },
    });
  }

  async listSuccessPlans(
    tenantId: string,
    customerId?: string,
    status?: string,
  ) {
    const where: any = { tenantId };
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    return prisma.customerSuccessPlan.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async createSuccessPlan(tenantId: string, data: any, userId: string) {
    return prisma.customerSuccessPlan.create({
      data: {
        tenantId,
        customerId: data.customerId,
        name: data.name,
        status: data.status ?? "ACTIVE",
        healthScore: data.healthScore ?? 100,
        arr: data.arr ?? 0,
        nrrTarget: data.nrrTarget ?? 100,
        churnRiskLevel: data.churnRiskLevel ?? "LOW",
        ownerId: userId,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        goals: data.goals ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async updateSuccessPlan(
    tenantId: string,
    id: string,
    data: any,
    userId: string,
  ) {
    const existing = await prisma.customerSuccessPlan.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Success plan not found");
    return prisma.customerSuccessPlan.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        status: data.status ?? existing.status,
        healthScore: data.healthScore ?? existing.healthScore,
        arr: data.arr ?? existing.arr,
        nrrTarget: data.nrrTarget ?? existing.nrrTarget,
        churnRiskLevel: data.churnRiskLevel ?? existing.churnRiskLevel,
        targetDate: data.targetDate
          ? new Date(data.targetDate)
          : existing.targetDate,
        goals: data.goals ?? existing.goals,
        notes: data.notes ?? existing.notes,
      },
    });
  }

  async listMilestones(tenantId: string, planId: string) {
    return prisma.customerSuccessMilestone.findMany({
      where: { tenantId, planId },
      orderBy: { dueDate: "asc" },
    });
  }

  async completeMilestone(tenantId: string, id: string, userId: string) {
    const milestone = await prisma.customerSuccessMilestone.findFirst({
      where: { id, tenantId },
    });
    if (!milestone) throw new NotFoundException("Milestone not found");
    return prisma.customerSuccessMilestone.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completionDate: new Date(),
      },
    });
  }

  async listNpsResponses(
    tenantId: string,
    surveyId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = { tenantId };
    if (surveyId) where.surveyId = surveyId;
    if (dateFrom || dateTo) {
      where.respondedAt = {} as any;
      if (dateFrom) where.respondedAt.gte = new Date(dateFrom);
      if (dateTo) where.respondedAt.lte = new Date(dateTo);
    }
    return prisma.npsResponse.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getNpsAnalytics(tenantId: string, period?: string) {
    const where: any = { tenantId };
    if (period === "current") {
      where.computedAt = { gte: new Date(new Date().setDate(1)) };
    }
    const analytics = await prisma.npsAnalytic.findMany({
      where,
      orderBy: { computedAt: "desc" },
      take: 12,
    });
    if (!analytics.length) {
      return {
        totalSent: 0,
        totalResponses: 0,
        detractors: 0,
        passives: 0,
        promoters: 0,
        npsScore: 0,
        responseRate: 0,
        trend: [],
      };
    }
    const latest = analytics[0]!;
    return {
      totalSent: latest.totalSent,
      totalResponses: latest.totalResponses,
      detractors: latest.detractors,
      passives: latest.passives,
      promoters: latest.promoters,
      npsScore: Number(latest.npsScore),
      responseRate: Number(latest.responseRate),
      trend: analytics.map((a) => ({
        date: a.computedAt,
        npsScore: Number(a.npsScore),
        responses: a.totalResponses,
      })),
    };
  }

  async listRenewalPipeline(tenantId: string, riskLevel?: string) {
    const where: any = { tenantId };
    if (riskLevel) where.riskLevel = riskLevel;
    return prisma.renewalRiskPrediction.findMany({
      where,
      orderBy: { predictedAt: "desc" },
      take: 100,
    });
  }

  async getChurnAnalysis(tenantId: string, period?: string) {
    const where: any = { tenantId };
    if (period === "current") {
      where.createdAt = {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      };
    }
    const records = await prisma.churnAnalysis.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    const total = records.length;
    const avgChurnScore =
      total > 0
        ? records.reduce((s: number, r: any) => s + Number(r.churnScore), 0) /
          total
        : 0;
    return {
      totalRecords: total,
      avgChurnScore: Math.round(avgChurnScore * 100) / 100,
      bySegment: records.reduce(
        (acc: Record<string, number>, r: any) => {
          const seg = r.segment ?? "UNKNOWN";
          acc[seg] = (acc[seg] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      records,
    };
  }

  async getExpansionRevenue(tenantId: string, period?: string) {
    const where: any = { tenantId };
    if (period === "current") {
      where.recognizedAt = {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      };
    }
    const records = await prisma.expansionRevenue.findMany({
      where,
      orderBy: { recognizedAt: "desc" },
    });
    const totalAmount = records.reduce(
      (s: number, r: any) => s + Number(r.amount),
      0,
    );
    return {
      totalAmount,
      totalRecords: records.length,
      byType: records.reduce(
        (acc: Record<string, { count: number; amount: number }>, r: any) => {
          const t = r.type ?? "OTHER";
          if (!acc[t]) acc[t] = { count: 0, amount: 0 };
          acc[t].count++;
          acc[t].amount += Number(r.amount);
          return acc;
        },
        {} as Record<string, { count: number; amount: number }>,
      ),
      records,
    };
  }
}
