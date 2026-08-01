import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProjectsBaselineService {
  async getBaselines(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.evmBaseline.findMany({
      where: { tenantId, projectId },
      include: { evmMeasurements: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBaselineById(tenantId: string, id: string) {
    const baseline = await prisma.evmBaseline.findFirst({
      where: { id, tenantId },
      include: { evmMeasurements: true },
    });
    if (!baseline) throw new NotFoundException("Baseline not found");
    return baseline;
  }

  async createBaseline(
    tenantId: string,
    dto: {
      projectId: string;
      name: string;
      baselineType?: string;
      budgetAtCompletion?: number;
      scheduleBaselineStart?: string;
      scheduleBaselineEnd?: string;
      notes?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.evmBaseline.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        baselineType: dto.baselineType || "ORIGINAL",
        budgetAtCompletion: dto.budgetAtCompletion || 0,
        scheduleBaselineStart: dto.scheduleBaselineStart
          ? new Date(dto.scheduleBaselineStart)
          : null,
        scheduleBaselineEnd: dto.scheduleBaselineEnd
          ? new Date(dto.scheduleBaselineEnd)
          : null,
      },
    });
  }

  async getMilestoneVariance(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
      orderBy: { dueDate: "asc" },
    });
    const baselines = await prisma.evmBaseline.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    const currentBaseline = baselines[0] || null;
    const now = new Date();
    const milestonesWithVariance = milestones.map((m) => {
      const plannedDate = m.dueDate;
      const actualDate = m.isCompleted ? now : null;
      const daysVariance =
        plannedDate && actualDate
          ? Math.round(
              (actualDate.getTime() - plannedDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;
      const status =
        daysVariance === null
          ? "PENDING"
          : daysVariance <= 0
            ? "ON_TRACK"
            : daysVariance <= 7
              ? "AT_RISK"
              : "DELAYED";
      return {
        id: m.id,
        name: m.name,
        plannedDate: m.dueDate?.toISOString().split("T")[0] || null,
        actualDate: actualDate?.toISOString().split("T")[0] || null,
        isCompleted: m.isCompleted,
        daysVariance,
        status,
      };
    });
    const onTrack = milestonesWithVariance.filter(
      (m) => m.status === "ON_TRACK",
    ).length;
    const atRisk = milestonesWithVariance.filter(
      (m) => m.status === "AT_RISK",
    ).length;
    const delayed = milestonesWithVariance.filter(
      (m) => m.status === "DELAYED",
    ).length;
    return {
      projectId,
      projectName: project.name,
      currentBaseline: currentBaseline
        ? {
            id: currentBaseline.id,
            baselineType: currentBaseline.baselineType,
            budgetAtCompletion: Number(currentBaseline.budgetAtCompletion),
            scheduleBaselineStart:
              currentBaseline.scheduleBaselineStart
                ?.toISOString()
                .split("T")[0] || null,
            scheduleBaselineEnd:
              currentBaseline.scheduleBaselineEnd
                ?.toISOString()
                .split("T")[0] || null,
          }
        : null,
      milestones: milestonesWithVariance,
      summary: {
        total: milestones.length,
        onTrack,
        atRisk,
        delayed,
      },
    };
  }

  async createMilestone(
    tenantId: string,
    dto: {
      projectId: string;
      name: string;
      dueDate: string;
      description?: string;
      assigneeId?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.milestone.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        dueDate: new Date(dto.dueDate),
        isCompleted: false,
      },
    });
  }

  async completeMilestone(tenantId: string, milestoneId: string) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, tenantId },
    });
    if (!milestone) throw new NotFoundException("Milestone not found");
    return prisma.milestone.update({
      where: { id: milestoneId },
      data: { isCompleted: true },
    });
  }

  async getBaselineDashboard(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
    });
    const baselines = await prisma.evmBaseline.findMany({
      where: { tenantId, projectId },
      include: { evmMeasurements: true },
      orderBy: { createdAt: "desc" },
    });
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
    });
    const completedTasks = tasks.filter((t) => t.status === "DONE").length;
    const totalBudget = baselines.reduce(
      (s, b) => s + Number(b.budgetAtCompletion),
      0,
    );
    const latestBaseline = baselines[0] || null;
    return {
      projectId,
      projectName: project.name,
      baselines: baselines.length,
      milestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.isCompleted).length,
      tasks: tasks.length,
      completedTasks,
      scheduleProgress:
        tasks.length > 0
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0,
      budgetAtCompletion: totalBudget,
      latestBaseline: latestBaseline
        ? {
            id: latestBaseline.id,
            baselineType: latestBaseline.baselineType,
            budgetAtCompletion: Number(latestBaseline.budgetAtCompletion),
            scheduleBaselineStart:
              latestBaseline.scheduleBaselineStart
                ?.toISOString()
                .split("T")[0] || null,
            scheduleBaselineEnd:
              latestBaseline.scheduleBaselineEnd?.toISOString().split("T")[0] ||
              null,
          }
        : null,
    };
  }
}
