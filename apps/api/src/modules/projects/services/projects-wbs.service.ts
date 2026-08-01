import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ProjectsWbsService {
  async getWbsTree(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
      include: { timesheets: true },
      orderBy: { createdAt: "asc" },
    });
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
      orderBy: { dueDate: "asc" },
    });
    const wbsItems = tasks.map((t) => ({
      id: t.id,
      type: "TASK" as const,
      name: t.name,
      description: t.description || "",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assignedToId: t.assignedToId,
      totalHours: t.timesheets.reduce((s, ts) => s + Number(ts.hours), 0),
    }));
    const milestoneItems = milestones.map((m) => ({
      id: m.id,
      type: "MILESTONE" as const,
      name: m.name,
      description: "",
      status: m.isCompleted ? "COMPLETED" : "PENDING",
      priority: "HIGH",
      dueDate: m.dueDate,
      assignedToId: null,
      totalHours: 0,
    }));
    return {
      projectId,
      tasks: wbsItems,
      milestones: milestoneItems,
      totalTasks: wbsItems.length,
      completedTasks: wbsItems.filter((t) => t.status === "DONE").length,
      totalMilestones: milestoneItems.length,
      completedMilestones: milestoneItems.filter(
        (m) => m.status === "COMPLETED",
      ).length,
    };
  }

  async getWbsGanttData(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "asc" },
    });
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
      orderBy: { dueDate: "asc" },
    });
    const startDates: Date[] = [];
    const endDates: Date[] = [];
    const ganttTasks = tasks.map((t) => {
      if (t.createdAt) startDates.push(t.createdAt);
      if (t.dueDate) endDates.push(t.dueDate);
      return {
        id: t.id,
        type: "task",
        name: t.name,
        status: t.status,
        start: t.createdAt?.toISOString().split("T")[0] || null,
        end: t.dueDate?.toISOString().split("T")[0] || null,
        progress:
          t.status === "DONE" ? 100 : t.status === "IN_PROGRESS" ? 50 : 0,
        assignedTo: t.assignedToId,
        dependsOn: [] as string[],
      };
    });
    const ganttMilestones = milestones.map((m) => ({
      id: m.id,
      type: "milestone" as const,
      name: m.name,
      date: m.dueDate?.toISOString().split("T")[0] || null,
      status: m.isCompleted ? "COMPLETED" : "PENDING",
    }));
    return {
      projectId,
      projectName: project.name,
      startDate:
        startDates.length > 0
          ? new Date(Math.min(...startDates.map((d) => d.getTime())))
              .toISOString()
              .split("T")[0]
          : null,
      endDate:
        endDates.length > 0
          ? new Date(Math.max(...endDates.map((d) => d.getTime())))
              .toISOString()
              .split("T")[0]
          : null,
      tasks: ganttTasks,
      milestones: ganttMilestones,
    };
  }

  async createWbsTask(
    tenantId: string,
    dto: {
      projectId: string;
      name: string;
      description?: string;
      status?: string;
      dueDate?: string;
      assignedToId?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.task.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description || null,
        status: dto.status || "BACKLOG",
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedToId: dto.assignedToId || null,
      },
    });
  }

  async updateWbsTask(
    tenantId: string,
    taskId: string,
    dto: {
      name?: string;
      description?: string;
      status?: string;
      dueDate?: string;
      assignedToId?: string;
    },
  ) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new NotFoundException("Task not found");
    return prisma.task.update({
      where: { id: taskId },
      data: {
        name: dto.name ?? undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
        status: dto.status ?? undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assignedToId:
          dto.assignedToId !== undefined ? dto.assignedToId : undefined,
      },
    });
  }

  async deleteWbsTask(tenantId: string, taskId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new NotFoundException("Task not found");
    return prisma.task.delete({ where: { id: taskId } });
  }

  async getWbsDashboard(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const tasks = await prisma.task.findMany({
      where: { tenantId, projectId },
    });
    const milestones = await prisma.milestone.findMany({
      where: { tenantId, projectId },
    });
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "DONE").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "IN_PROGRESS",
    ).length;
    const totalMilestones = milestones.length;
    const completedMs = milestones.filter((m) => m.isCompleted).length;
    return {
      projectId,
      projectName: project.name,
      taskSummary: {
        total: totalTasks,
        done: doneTasks,
        inProgress: inProgressTasks,
        pending: totalTasks - doneTasks - inProgressTasks,
        completionRate:
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      milestoneSummary: {
        total: totalMilestones,
        completed: completedMs,
        pending: totalMilestones - completedMs,
        completionRate:
          totalMilestones > 0
            ? Math.round((completedMs / totalMilestones) * 100)
            : 0,
      },
    };
  }
}
