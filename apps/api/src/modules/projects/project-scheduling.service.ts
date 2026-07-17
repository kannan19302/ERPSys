import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
  assigneeId?: string;
  milestoneId?: string;
}

interface ResourceAllocation {
  resourceId: string;
  resourceName: string;
  totalHours: number;
  allocatedHours: number;
  utilization: number;
  tasks: Array<{ taskId: string; taskName: string; hours: number }>;
}

@Injectable()
export class ProjectSchedulingService {

  async getGanttData(tenantId: string, projectId: string): Promise<GanttTask[]> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
      include: {
        tasks: { orderBy: { createdAt: 'asc' } },
        milestones: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const ganttTasks: GanttTask[] = [];

    for (const task of project.tasks) {
      const startDate = (task as any).startDate || task.createdAt;
      const endDate = (task as any).dueDate || (task as any).endDate || new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000);
      const progress = task.status === 'COMPLETED' ? 100 : task.status === 'IN_PROGRESS' ? 50 : 0;

      const deps = (task as any).dependencies;
      const dependencyIds: string[] = Array.isArray(deps) ? deps : (typeof deps === 'string' ? JSON.parse(deps || '[]') : []);

      ganttTasks.push({
        id: task.id,
        name: task.name,
        start: new Date(startDate).toISOString().slice(0, 10),
        end: new Date(endDate).toISOString().slice(0, 10),
        progress,
        dependencies: dependencyIds,
        assigneeId: (task as any).assigneeId || undefined,
        milestoneId: (task as any).milestoneId || undefined,
      });
    }

    for (const ms of project.milestones) {
      ganttTasks.push({
        id: ms.id,
        name: `🔷 ${ms.name}`,
        start: new Date(ms.dueDate).toISOString().slice(0, 10),
        end: new Date(ms.dueDate).toISOString().slice(0, 10),
        progress: ms.isCompleted ? 100 : 0,
        dependencies: [],
      });
    }

    return ganttTasks;
  }

  async addTaskDependency(tenantId: string, taskId: string, dependsOnTaskId: string, type: 'FS' | 'FF' | 'SS' | 'SF' = 'FS') {
    const task = await prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    const depTask = await prisma.task.findFirst({ where: { id: dependsOnTaskId, tenantId } });
    if (!depTask) throw new NotFoundException('Dependency task not found');

    const existing = (task as any).dependencies;
    const deps: string[] = Array.isArray(existing) ? existing : (typeof existing === 'string' ? JSON.parse(existing || '[]') : []);

    if (!deps.includes(dependsOnTaskId)) {
      deps.push(dependsOnTaskId);
      await prisma.task.update({
        where: { id: taskId },
        data: { description: JSON.stringify(deps) },
      });
    }

    return { taskId, dependsOnTaskId, type, dependencies: deps };
  }

  async getResourceAllocations(tenantId: string, projectId: string): Promise<ResourceAllocation[]> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId, deletedAt: null },
      include: { tasks: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const resourceMap = new Map<string, ResourceAllocation>();

    for (const task of project.tasks) {
      const assigneeId = (task as any).assigneeId;
      if (!assigneeId) continue;

      const hours = Number((task as any).estimatedHours || 8);

      if (!resourceMap.has(assigneeId)) {
        const employee = await prisma.employee.findFirst({ where: { id: assigneeId, tenantId } });
        resourceMap.set(assigneeId, {
          resourceId: assigneeId,
          resourceName: employee ? `${employee.firstName} ${employee.lastName}` : assigneeId,
          totalHours: 160,
          allocatedHours: 0,
          utilization: 0,
          tasks: [],
        });
      }

      const alloc = resourceMap.get(assigneeId)!;
      alloc.allocatedHours += hours;
      alloc.tasks.push({ taskId: task.id, taskName: task.name, hours });
      alloc.utilization = Math.round((alloc.allocatedHours / alloc.totalHours) * 1000) / 10;
    }

    return [...resourceMap.values()];
  }

  async levelResources(tenantId: string, projectId: string) {
    const allocations = await this.getResourceAllocations(tenantId, projectId);
    const overallocated = allocations.filter((a) => a.utilization > 100);

    const adjustments: Array<{ resourceId: string; taskId: string; action: string }> = [];

    for (const resource of overallocated) {
      const excess = resource.allocatedHours - resource.totalHours;
      let remaining = excess;

      const sortedTasks = [...resource.tasks].sort((a, b) => b.hours - a.hours);

      for (const task of sortedTasks) {
        if (remaining <= 0) break;

        adjustments.push({
          resourceId: resource.resourceId,
          taskId: task.taskId,
          action: `Recommend deferring or splitting (${task.hours}h task, ${remaining.toFixed(1)}h excess remaining)`,
        });

        remaining -= task.hours * 0.3;
      }
    }

    return {
      projectId,
      totalResources: allocations.length,
      overallocated: overallocated.length,
      adjustments,
    };
  }

  async generateMilestoneInvoice(tenantId: string, projectId: string, milestoneId: string) {
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found');

    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId, tenantId } });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const budget = Number((project as any).budget || 0);
    const milestones = await prisma.milestone.findMany({ where: { tenantId, projectId } });
    const milestoneShare = milestones.length > 0 ? budget / milestones.length : budget;

    return {
      projectId,
      milestoneId,
      milestoneName: milestone.name,
      invoiceAmount: Math.round(milestoneShare * 100) / 100,
      status: 'DRAFT',
      description: `Milestone billing: ${milestone.name} — Project: ${project.name}`,
    };
  }
}
