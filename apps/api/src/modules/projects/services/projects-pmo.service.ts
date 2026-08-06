import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import type {
  CreateScorecardDto,
  AssessStageGateDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsPmoService {
  async getHealthScorecard(tenantId: string, projectId: string) {
    const scorecards = await prisma.pmoScorecard.findMany({
      where: { tenantId, projectId },
      include: { dimensions: true },
      orderBy: { scorecardDate: "desc" },
      take: 10,
    });
    return scorecards;
  }

  async createScorecard(tenantId: string, dto: CreateScorecardDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.pmoScorecard.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        scorecardDate: new Date(),
        overallScore: dto.overallScore
          ? new Prisma.Decimal(dto.overallScore)
          : null,
        healthColor: dto.healthColor || "GREEN",
        assessedBy: dto.assessedBy || null,
        notes: dto.notes || null,
        dimensions: dto.dimensions
          ? {
              create: dto.dimensions.map((dim) => ({
                tenantId,
                dimension: dim.dimension,
                score: dim.score ? new Prisma.Decimal(dim.score) : null,
                weight: dim.weight
                  ? new Prisma.Decimal(dim.weight)
                  : new Prisma.Decimal(1.0),
                status: dim.status || "ON_TRACK",
                comments: dim.comments || null,
              })),
            }
          : undefined,
      },
      include: { dimensions: true },
    });
  }

  async assessStageGate(tenantId: string, dto: AssessStageGateDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.stageGate.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        gateName: dto.gateName,
        gateNumber: dto.gateNumber,
        status: dto.status,
        reviewDate: new Date(),
        reviewerId: dto.reviewerId || null,
        decision: dto.decision || null,
        comments: dto.comments || null,
        score: dto.score || null,
        checklist: dto.checklist || undefined,
        gateChecklists: dto.checklist
          ? {
              create: dto.checklist.map((item) => ({
                tenantId,
                item: item.item,
                isRequired:
                  item.isRequired !== undefined ? item.isRequired : true,
                isCompleted: item.isCompleted,
                notes: item.notes || null,
              })),
            }
          : undefined,
      },
      include: { gateChecklists: true },
    });
  }

  async getStageGates(tenantId: string, projectId: string) {
    return prisma.stageGate.findMany({
      where: { tenantId, projectId },
      include: { gateChecklists: true },
      orderBy: { gateNumber: "asc" },
    });
  }

  async getPortfolioHeatmap(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        risks: true,
        tasks: true,
        milestones: true,
        costEntries: true,
      },
    });
    const scorecards = await prisma.pmoScorecard.findMany({
      where: { tenantId },
      include: { dimensions: true },
      orderBy: { scorecardDate: "desc" },
    });
    const latestScorecards = new Map<string, (typeof scorecards)[0]>();
    for (const sc of scorecards) {
      if (!latestScorecards.has(sc.projectId)) {
        latestScorecards.set(sc.projectId, sc);
      }
    }
    return projects.map((project) => {
      const sc = latestScorecards.get(project.id);
      const budget = Number(project.budget || 0);
      const totalCost = project.costEntries.reduce(
        (s, ce) => s + Number(ce.amount),
        0,
      );
      const costVariance =
        budget > 0 ? ((budget - totalCost) / budget) * 100 : 0;
      const tasksTotal = project.tasks.length;
      const tasksDone = project.tasks.filter((t) => t.status === "DONE").length;
      const scheduleProgress =
        tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;
      return {
        projectId: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        healthColor: sc?.healthColor || "GREEN",
        healthScore: sc?.overallScore ? Number(sc.overallScore) : null,
        budget,
        costVariance: Math.round(costVariance * 10) / 10,
        scheduleProgress: Math.round(scheduleProgress * 10) / 10,
        openRisks: project.risks.filter((r) => r.status === "OPEN").length,
        milestoneProgress:
          project.milestones.filter((m) => m.isCompleted).length +
          "/" +
          project.milestones.length,
      };
    });
  }

  async trackCompliance(
    tenantId: string,
    projectId: string,
    dto: { complianceType: string; status: string; notes?: string },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const stageGates = await prisma.stageGate.findMany({
      where: { tenantId, projectId },
      orderBy: { gateNumber: "desc" },
      take: 1,
    });
    const lastGate = stageGates[0];
    return {
      projectId,
      complianceType: dto.complianceType,
      status: dto.status,
      lastGateStatus: lastGate?.status || "NOT_REACHED",
      lastGateName: lastGate?.gateName || "N/A",
      notes: dto.notes || null,
    };
  }

  async getPMODashboard(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId, deletedAt: null },
      include: { risks: true, tasks: true, costEntries: true },
    });
    const scorecards = await prisma.pmoScorecard.findMany({
      where: { tenantId },
      include: { dimensions: true },
      orderBy: { scorecardDate: "desc" },
    });
    const stageGates = await prisma.stageGate.findMany({ where: { tenantId } });
    const latestScores = new Map<string, (typeof scorecards)[0]>();
    for (const sc of scorecards) {
      if (!latestScores.has(sc.projectId)) latestScores.set(sc.projectId, sc);
    }
    const green = projects.filter((p) => {
      const sc = latestScores.get(p.id);
      return sc?.healthColor === "GREEN" || !sc;
    }).length;
    const yellow = projects.filter((p) => {
      const sc = latestScores.get(p.id);
      return sc?.healthColor === "YELLOW";
    }).length;
    const red = projects.filter((p) => {
      const sc = latestScores.get(p.id);
      return sc?.healthColor === "RED";
    }).length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
    const totalCost = projects.reduce(
      (s, p) => s + p.costEntries.reduce((ss, ce) => ss + Number(ce.amount), 0),
      0,
    );
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      completedProjects: projects.filter((p) => p.status === "COMPLETED")
        .length,
      onHold: projects.filter((p) => p.status === "ON_HOLD").length,
      healthScore: { green, yellow, red },
      totalBudget,
      totalCost,
      costPerformance:
        totalBudget > 0 ? Math.round((1 - totalCost / totalBudget) * 100) : 0,
      totalRisks: projects.reduce((s, p) => s + p.risks.length, 0),
      openRisks: projects.reduce(
        (s, p) => s + p.risks.filter((r) => r.status === "OPEN").length,
        0,
      ),
      stageGatesPassed: stageGates.filter((sg) => sg.status === "PASSED")
        .length,
      stageGatesFailed: stageGates.filter((sg) => sg.status === "FAILED")
        .length,
      totalScorecards: scorecards.length,
    };
  }
}
