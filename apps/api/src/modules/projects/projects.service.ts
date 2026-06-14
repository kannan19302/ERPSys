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

  async saveBaseline(tenantId: string, projectId: string, dto: { baselineSchedule: string }) {
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found');

    return prisma.project.update({
      where: { id: projectId },
      data: { baselineSchedule: dto.baselineSchedule },
    });
  }

  async computeCriticalPath(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: { tasks: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const tasks = [...project.tasks].sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });

    const criticalPathTasks = tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
    const pathIds = criticalPathTasks.map(t => t.id);

    await prisma.project.update({
      where: { id: projectId },
      data: { criticalPath: JSON.stringify(pathIds), overallHealth: pathIds.length > 3 ? 'AT_RISK' : 'HEALTHY' },
    });

    return {
      projectId,
      criticalPathTaskIds: pathIds,
      overallHealth: pathIds.length > 3 ? 'AT_RISK' : 'HEALTHY',
    };
  }

  async getResourceWorkload(tenantId: string) {
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } },
    });

    const timesheets = await prisma.timesheet.findMany({
      where: { tenantId },
      select: { employeeId: true, hours: true, date: true },
    });

    return employees.map(emp => {
      const empTimesheets = timesheets.filter(ts => ts.employeeId === emp.id);
      const totalHours = empTimesheets.reduce((sum, ts) => sum + Number(ts.hours), 0);
      return {
        employeeId: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name || 'Unassigned',
        capacityHours: 40,
        allocatedHours: totalHours,
        utilizationRate: (totalHours / 40) * 100,
      };
    });
  }

  // --- Portfolio Management ---
  async getPortfolios(tenantId: string) {
    const portfolios = await prisma.projectPortfolio.findMany({
      where: { tenantId },
      include: { projects: { include: { tasks: true, risks: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return portfolios.map((portfolio) => {
      const totalProjects = portfolio.projects.length;
      const totalBudget = portfolio.projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
      const activeProjects = portfolio.projects.filter((p) => p.status === 'ACTIVE').length;
      const totalRisks = portfolio.projects.reduce((sum, p) => sum + p.risks.length, 0);
      const openRisks = portfolio.projects.reduce(
        (sum, p) => sum + p.risks.filter((r) => r.status === 'OPEN').length,
        0
      );
      
      return {
        ...portfolio,
        totalProjects,
        totalBudget,
        activeProjects,
        totalRisks,
        openRisks,
      };
    });
  }

  async createPortfolio(
    tenantId: string,
    orgId: string,
    dto: { name: string; description?: string; strategicAlignment?: string; budget?: number }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    return prisma.projectPortfolio.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        strategicAlignment: dto.strategicAlignment || 'MEDIUM',
        budget: dto.budget ? new Prisma.Decimal(dto.budget) : null,
      },
    });
  }

  // --- Project Risk Register ---
  async getRisks(tenantId: string, projectId: string) {
    return prisma.projectRisk.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRisk(
    tenantId: string,
    projectId: string,
    dto: { title: string; description?: string; probability: string; impact: string; mitigationPlan?: string }
  ) {
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found');

    return prisma.projectRisk.create({
      data: {
        tenantId,
        projectId,
        title: dto.title,
        description: dto.description || null,
        probability: dto.probability,
        impact: dto.impact,
        mitigationPlan: dto.mitigationPlan || null,
        status: 'OPEN',
      },
    });
  }

  async updateRisk(
    tenantId: string,
    riskId: string,
    dto: { title?: string; description?: string; probability?: string; impact?: string; mitigationPlan?: string; status?: string }
  ) {
    const risk = await prisma.projectRisk.findFirst({ where: { id: riskId, tenantId } });
    if (!risk) throw new NotFoundException('Risk item not found');

    return prisma.projectRisk.update({
      where: { id: riskId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        probability: dto.probability !== undefined ? dto.probability : undefined,
        impact: dto.impact !== undefined ? dto.impact : undefined,
        mitigationPlan: dto.mitigationPlan !== undefined ? dto.mitigationPlan : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
      },
    });
  }

  // --- Change Request Tracking ---
  async getChangeRequests(tenantId: string, projectId: string) {
    return prisma.changeRequest.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChangeRequest(
    tenantId: string,
    projectId: string,
    dto: { title: string; description?: string; requestedAmount: number; requestedScheduleDays: number }
  ) {
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found');

    return prisma.changeRequest.create({
      data: {
        tenantId,
        projectId,
        title: dto.title,
        description: dto.description || null,
        requestedAmount: new Prisma.Decimal(dto.requestedAmount),
        requestedScheduleDays: dto.requestedScheduleDays,
        status: 'PENDING',
      },
    });
  }

  async approveChangeRequest(tenantId: string, changeRequestId: string, userId: string) {
    const cr = await prisma.changeRequest.findFirst({
      where: { id: changeRequestId, tenantId },
    });
    if (!cr) throw new NotFoundException('Change request not found');
    if (cr.status !== 'PENDING') throw new BadRequestException('Change request has already been processed');

    const updatedCr = await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    const project = await prisma.project.findFirst({
      where: { id: cr.projectId, tenantId },
    });

    if (project) {
      const currentBudget = Number(project.budget || 0);
      const newBudget = currentBudget + Number(cr.requestedAmount);
      
      let newEndDate: Date | null = null;
      if (project.endDate) {
        newEndDate = new Date(project.endDate);
        newEndDate.setDate(newEndDate.getDate() + cr.requestedScheduleDays);
      }

      await prisma.project.update({
        where: { id: project.id },
        data: {
          budget: new Prisma.Decimal(newBudget),
          endDate: newEndDate,
        },
      });
    }

    return updatedCr;
  }

  // --- Earned Value Management (EVM) & Forecasting ---
  async getProjectEVM(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        tasks: {
          include: { timesheets: true }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    const totalTasksCount = project.tasks.length;
    const projectBudget = Number(project.budget || 0);
    const today = new Date();

    let plannedValue = 0;
    if (totalTasksCount > 0) {
      const taskBudgetShare = projectBudget / totalTasksCount;
      const plannedTasksCount = project.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) <= today
      ).length;
      plannedValue = plannedTasksCount * taskBudgetShare;
    } else {
      plannedValue = projectBudget;
    }

    let actualCost = 0;
    const defaultHourlyRate = 50;
    project.tasks.forEach((t) => {
      const totalHours = t.timesheets.reduce((sum, ts) => sum + Number(ts.hours), 0);
      actualCost += totalHours * defaultHourlyRate;
    });

    let earnedValue = 0;
    if (totalTasksCount > 0) {
      const taskBudgetShare = projectBudget / totalTasksCount;
      const completedTasksCount = project.tasks.filter((t) => t.status === 'DONE').length;
      earnedValue = completedTasksCount * taskBudgetShare;
    }

    const SV = earnedValue - plannedValue;
    const CV = earnedValue - actualCost;

    const CPI = actualCost > 0 ? earnedValue / actualCost : 1.0;
    const SPI = plannedValue > 0 ? earnedValue / plannedValue : 1.0;

    const EAC = CPI > 0 ? projectBudget / CPI : projectBudget;
    const ETC = EAC - actualCost;

    let predictiveEndDate = project.endDate;
    if (project.endDate && project.startDate && SPI > 0 && SPI < 1) {
      const totalDuration = new Date(project.endDate).getTime() - new Date(project.startDate).getTime();
      const stretchedDuration = totalDuration / SPI;
      predictiveEndDate = new Date(new Date(project.startDate).getTime() + stretchedDuration);
    }

    return {
      plannedValue,
      actualCost,
      earnedValue,
      scheduleVariance: SV,
      costVariance: CV,
      cpi: CPI,
      spi: SPI,
      estimateAtCompletion: EAC,
      estimateToComplete: ETC,
      predictiveEndDate,
    };
  }

  // --- Finance Integration (Invoice Auto-Generation) ---
  async generateProjectInvoice(tenantId: string, projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        tasks: {
          include: { timesheets: true }
        },
        milestones: true,
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    let customerId = project.customerId;
    if (!customerId) {
      const firstCustomer = await prisma.customer.findFirst({ where: { tenantId } });
      if (!firstCustomer) throw new BadRequestException('No CRM Customer found to bill this project. Please create a customer first.');
      customerId = firstCustomer.id;
    }

    const orgId = project.orgId;
    const lineItemsData: { description: string; quantity: number; unitPrice: number; totalAmount: number }[] = [];

    const completedMilestones = project.milestones.filter((m) => m.isCompleted);
    completedMilestones.forEach((m) => {
      lineItemsData.push({
        description: `Project Milestone Completed: ${m.name}`,
        quantity: 1,
        unitPrice: 1000.00,
        totalAmount: 1000.00,
      });
    });

    let billableHours = 0;
    project.tasks.forEach((t) => {
      const hours = t.timesheets.reduce((sum, ts) => sum + Number(ts.hours), 0);
      billableHours += hours;
    });

    if (billableHours > 0) {
      lineItemsData.push({
        description: `Project Timesheet Logged Hours (Tasks: ${project.tasks.map(t => t.name).slice(0,2).join(', ')}...)`,
        quantity: billableHours,
        unitPrice: 100.00,
        totalAmount: billableHours * 100.00,
      });
    }

    if (lineItemsData.length === 0) {
      throw new BadRequestException('No completed milestones or timesheet hours found to bill on this project.');
    }

    const subtotal = lineItemsData.reduce((sum, li) => sum + li.totalAmount, 0);
    const taxAmount = subtotal * 0.10;
    const totalAmount = subtotal + taxAmount;

    const count = await prisma.invoice.count({ where: { tenantId, orgId } });
    const invoiceNumber = `INV-PRJ-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orgId,
        customerId,
        invoiceNumber,
        status: 'DRAFT',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        discountAmount: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(totalAmount),
        paidAmount: new Prisma.Decimal(0),
        currency: 'USD',
        notes: `Automatically generated billing for Project: ${project.name} (${project.code})`,
        createdBy: userId,
        lineItems: {
          create: lineItemsData.map((li) => ({
            tenantId,
            description: li.description,
            quantity: new Prisma.Decimal(li.quantity),
            unitPrice: new Prisma.Decimal(li.unitPrice),
            taxRate: new Prisma.Decimal(10.00),
            taxAmount: new Prisma.Decimal(li.totalAmount * 0.10),
            totalAmount: new Prisma.Decimal(li.totalAmount * 1.10),
          }))
        }
      },
      include: {
        lineItems: true,
      }
    });

    return invoice;
  }
}
