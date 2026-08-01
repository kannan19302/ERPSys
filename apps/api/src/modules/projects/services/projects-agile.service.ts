import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  CreateSprintDto,
  CreateBacklogItemDto,
  MoveToSprintDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsAgileService {
  async getSprints(tenantId: string, projectId: string) {
    return prisma.agileSprint.findMany({
      where: { tenantId, projectId },
      include: {
        sprintItems: {
          include: { backlogItem: true },
        },
        retrospectives: true,
      },
      orderBy: { startDate: "desc" },
    });
  }

  async getSprintById(tenantId: string, sprintId: string) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
      include: {
        sprintItems: {
          include: { backlogItem: true },
        },
        retrospectives: true,
      },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    return sprint;
  }

  async createSprint(tenantId: string, dto: CreateSprintDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const overlapping = await prisma.agileSprint.findFirst({
      where: { tenantId, projectId: dto.projectId, status: "ACTIVE" },
    });
    if (overlapping)
      throw new BadRequestException(
        "An active sprint already exists for this project.",
      );
    return prisma.agileSprint.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        goal: dto.goal || null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        capacity: dto.capacity || null,
      },
    });
  }

  async startSprint(tenantId: string, sprintId: string) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    if (sprint.status !== "PLANNED")
      throw new BadRequestException(
        "Sprint must be in PLANNED status to start.",
      );
    return prisma.agileSprint.update({
      where: { id: sprintId },
      data: { status: "ACTIVE" },
    });
  }

  async completeSprint(tenantId: string, sprintId: string) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
      include: { sprintItems: { include: { backlogItem: true } } },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    if (sprint.status !== "ACTIVE")
      throw new BadRequestException("Only active sprints can be completed.");
    const completedItems = sprint.sprintItems.filter(
      (si) => si.status === "DONE",
    ).length;
    const velocity = sprint.sprintItems.reduce(
      (sum, si) => sum + (si.backlogItem.storyPoints || 0),
      0,
    );
    return prisma.agileSprint.update({
      where: { id: sprintId },
      data: {
        status: "COMPLETED",
        velocity:
          completedItems > 0
            ? Math.round(
                (velocity / sprint.sprintItems.length) * completedItems,
              )
            : 0,
      },
    });
  }

  async getBacklog(tenantId: string, projectId: string) {
    return prisma.agileBacklogItem.findMany({
      where: { tenantId, projectId },
      orderBy: [{ priority: "asc" }, { order: "asc" }],
    });
  }

  async addBacklogItem(tenantId: string, dto: CreateBacklogItemDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const maxOrder = await prisma.agileBacklogItem.findFirst({
      where: { tenantId, projectId: dto.projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return prisma.agileBacklogItem.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        type: dto.type || "STORY",
        title: dto.title,
        description: dto.description || null,
        priority: dto.priority || "MEDIUM",
        storyPoints: dto.storyPoints || null,
        assigneeId: dto.assigneeId || null,
        epicId: dto.epicId || null,
        acceptanceCriteria: dto.acceptanceCriteria || null,
        labels: dto.labels || null,
        order: (maxOrder?.order || 0) + 1,
      },
    });
  }

  async moveToSprint(tenantId: string, sprintId: string, dto: MoveToSprintDto) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    const items = await prisma.agileBacklogItem.findMany({
      where: { id: { in: dto.backlogItemIds }, tenantId },
    });
    if (items.length !== dto.backlogItemIds.length)
      throw new NotFoundException("One or more backlog items not found");
    const results: any[] = [];
    for (const itemId of dto.backlogItemIds) {
      const existing = await prisma.agileSprintItem.findFirst({
        where: { tenantId, sprintId, backlogItemId: itemId },
      });
      if (!existing) {
        const si = await prisma.agileSprintItem.create({
          data: { tenantId, sprintId, backlogItemId: itemId },
        });
        results.push(si);
        await prisma.agileBacklogItem.update({
          where: { id: itemId },
          data: { status: "READY", sprintId },
        });
      }
    }
    return results;
  }

  async getBurndownData(tenantId: string, sprintId: string) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
      include: {
        sprintItems: {
          include: { backlogItem: true },
        },
      },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    const totalDays = Math.ceil(
      (sprint.endDate.getTime() - sprint.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const totalPoints = sprint.sprintItems.reduce(
      (sum, si) => sum + (si.backlogItem.storyPoints || 0),
      0,
    );
    const idealLine = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      ideal: totalPoints - (totalPoints / totalDays) * (i + 1),
    }));
    const completedItems = sprint.sprintItems.filter(
      (si) => si.status === "DONE",
    );
    const completedPoints = completedItems.reduce(
      (sum, si) => sum + (si.backlogItem.storyPoints || 0),
      0,
    );
    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      totalDays,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      idealLine,
      actualLine: [
        { day: 0, remaining: totalPoints },
        { day: totalDays, remaining: totalPoints - completedPoints },
      ],
    };
  }

  async getScrumDashboard(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const sprints = await prisma.agileSprint.findMany({
      where: { tenantId, projectId },
      include: {
        sprintItems: { include: { backlogItem: true } },
      },
      orderBy: { startDate: "desc" },
    });
    const activeSprint = sprints.find((s) => s.status === "ACTIVE");
    const backlogItems = await prisma.agileBacklogItem.count({
      where: { tenantId, projectId, status: { in: ["BACKLOG", "READY"] } },
    });
    const totalStoryPoints = sprints.reduce(
      (sum, s) =>
        sum +
        s.sprintItems.reduce(
          (ss, si) => ss + (si.backlogItem.storyPoints || 0),
          0,
        ),
      0,
    );
    const avgVelocity =
      sprints.length > 0 ? Math.round(totalStoryPoints / sprints.length) : 0;
    return {
      projectId,
      totalSprints: sprints.length,
      activeSprint,
      backlogItems,
      avgVelocity,
      totalStoryPoints,
      completedSprints: sprints.filter((s) => s.status === "COMPLETED").length,
    };
  }

  async addRetrospective(
    tenantId: string,
    sprintId: string,
    dto: {
      wentWell?: string;
      toImprove?: string;
      actionItems?: string;
      teamMood?: string;
    },
  ) {
    const sprint = await prisma.agileSprint.findFirst({
      where: { id: sprintId, tenantId },
    });
    if (!sprint) throw new NotFoundException("Sprint not found");
    return prisma.agileRetrospective.create({
      data: {
        tenantId,
        sprintId,
        wentWell: dto.wentWell || null,
        toImprove: dto.toImprove || null,
        actionItems: dto.actionItems || null,
        teamMood: dto.teamMood || null,
      },
    });
  }
}
