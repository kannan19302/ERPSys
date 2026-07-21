import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import {
  buildPaginationValues,
  buildOrderBy,
  paginatedResult,
  PaginatedResult,
  PaginationParams,
} from "../../common/utils/pagination.util";

@Injectable()
export class CloseOpsService {
  async getCloseTasks(
    tenantId: string,
    financialPeriodId: string,
    params: PaginationParams & { status?: string; category?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, financialPeriodId };
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.closeTask.findMany({ where, skip, take, orderBy }),
      prisma.closeTask.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async createCloseTask(
    tenantId: string,
    data: {
      financialPeriodId: string;
      name: string;
      description?: string;
      category?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: string;
      createdBy: string;
    },
  ) {
    return prisma.closeTask.create({
      data: {
        tenantId,
        financialPeriodId: data.financialPeriodId,
        name: data.name,
        description: data.description || null,
        category: data.category || "RECONCILIATION",
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || "MEDIUM",
        status: "OPEN",
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
        isTemplate: false,
      } as any,
    });
  }

  async updateCloseTaskStatus(
    tenantId: string,
    taskId: string,
    status: string,
    completedBy?: string,
    notes?: string,
  ) {
    const task = await prisma.closeTask.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) throw new NotFoundException("Close task not found");
    const updateData: any = {
      status,
      updatedBy: completedBy || task.createdBy,
    };
    if (status === "DONE" || status === "SKIPPED") {
      updateData.completedAt = new Date();
      updateData.completedBy = completedBy || null;
    }
    if (notes) updateData.notes = notes;
    return prisma.closeTask.update({ where: { id: taskId }, data: updateData });
  }

  async getCloseTaskTemplates(tenantId: string): Promise<any[]> {
    return prisma.closeTask.findMany({
      where: { tenantId, isTemplate: true },
      orderBy: { category: "asc" },
    });
  }

  async createCloseTaskTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      category?: string;
      priority?: string;
      createdBy: string;
    },
  ) {
    return prisma.closeTask.create({
      data: {
        tenantId,
        financialPeriodId: "",
        name: data.name,
        description: data.description || null,
        category: data.category || "RECONCILIATION",
        priority: data.priority || "MEDIUM",
        status: "OPEN",
        isTemplate: true,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      } as any,
    });
  }

  async applyTaskTemplates(
    tenantId: string,
    financialPeriodId: string,
    templateIds: string[],
    createdBy: string,
  ) {
    const templates = await prisma.closeTask.findMany({
      where: { id: { in: templateIds }, tenantId, isTemplate: true },
    });
    const created = [];
    for (const tpl of templates) {
      const task = await prisma.closeTask.create({
        data: {
          tenantId,
          financialPeriodId,
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          priority: tpl.priority,
          assigneeId: tpl.assigneeId,
          status: "OPEN",
          createdBy,
          updatedBy: createdBy,
          isTemplate: false,
        } as any,
      });
      created.push(task);
    }
    return created;
  }

  async getCloseStatus(tenantId: string, financialPeriodId: string) {
    const tasks = await prisma.closeTask.findMany({
      where: { tenantId, financialPeriodId },
    });
    const total = tasks.length;
    const done = tasks.filter((t: any) => t.status === "DONE").length;
    const inProgress = tasks.filter(
      (t: any) => t.status === "IN_PROGRESS",
    ).length;
    const open = tasks.filter((t: any) => t.status === "OPEN").length;
    const skipped = tasks.filter((t: any) => t.status === "SKIPPED").length;
    return {
      total,
      done,
      inProgress,
      open,
      skipped,
      progress: total ? Math.round((done / total) * 100) : 0,
    };
  }

  async getFinancialPeriods(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.financialPeriod.findMany({ where, skip, take, orderBy }),
      prisma.financialPeriod.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async createFinancialPeriod(
    tenantId: string,
    data: { orgId: string; name: string; startDate: string; endDate: string },
  ) {
    return prisma.financialPeriod.create({
      data: {
        tenantId,
        orgId: data.orgId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: "OPEN",
      } as any,
    });
  }

  async closeFinancialPeriod(tenantId: string, periodId: string) {
    const period = await prisma.financialPeriod.findFirst({
      where: { id: periodId, tenantId },
    });
    if (!period) throw new NotFoundException("Financial period not found");
    return prisma.financialPeriod.update({
      where: { id: periodId },
      data: { status: "CLOSED" },
    });
  }

  async reopenFinancialPeriod(tenantId: string, periodId: string) {
    const period = await prisma.financialPeriod.findFirst({
      where: { id: periodId, tenantId },
    });
    if (!period) throw new NotFoundException("Financial period not found");
    return prisma.financialPeriod.update({
      where: { id: periodId },
      data: { status: "OPEN" },
    });
  }
}
