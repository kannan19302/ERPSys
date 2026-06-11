import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectsService {
  async getProjects(tenantId: string) {
    return prisma.project.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        tasks: true,
        milestones: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(tenantId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        milestones: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(
    tenantId: string,
    orgId: string,
    dto: { name: string; code: string; description?: string; budget?: number; startDate?: string; endDate?: string },
    _createdBy: string
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.project.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Project code ${dto.code} already exists.`);

    return prisma.project.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'PLANNED',
      },
    });
  }

  async getTasks(tenantId: string, projectId: string) {
    return prisma.task.findMany({
      where: { tenantId, projectId },
      include: { timesheets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(
    tenantId: string,
    projectId: string,
    dto: { name: string; description?: string; priority?: string; dueDate?: string; assignedToId?: string }
  ) {
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found');

    return prisma.task.create({
      data: {
        tenantId,
        projectId,
        name: dto.name,
        description: dto.description || null,
        priority: dto.priority || 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assignedToId: dto.assignedToId || null,
        status: 'TODO',
      },
    });
  }

  async logTime(
    tenantId: string,
    taskId: string,
    dto: { employeeId: string; date: string; hours: number; notes?: string }
  ) {
    const task = await prisma.task.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    return prisma.timesheet.create({
      data: {
        tenantId,
        taskId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        hours: new Prisma.Decimal(dto.hours),
        notes: dto.notes || null,
      },
    });
  }
}
