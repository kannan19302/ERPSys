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
export class ProjectAccountingService {
  async getProjectBudgets(
    tenantId: string,
    params: PaginationParams & { status?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.search)
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { code: { contains: params.search, mode: "insensitive" } },
      ];
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { costEntries: true, tasks: true } } },
      }),
      prisma.project.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async getProjectCosts(
    tenantId: string,
    projectId: string,
    params: PaginationParams & { type?: string } = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, projectId };
    if (params.type) where.type = params.type;
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.projectCostEntry.findMany({ where, skip, take, orderBy }),
      prisma.projectCostEntry.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }

  async recordProjectCost(
    tenantId: string,
    data: {
      projectId: string;
      type: string;
      amount: number;
      description?: string;
      recordedBy?: string;
    },
  ) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.projectCostEntry.create({
      data: {
        tenantId,
        projectId: data.projectId,
        type: data.type,
        amount: data.amount,
        description: data.description || null,
        recordedBy: data.recordedBy || null,
      } as any,
    });
  }

  async getProjectProfitability(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const costs = await prisma.projectCostEntry.findMany({
      where: { tenantId, projectId },
    });
    const totalCost = costs.reduce(
      (s: number, c: any) => s + Number(c.amount),
      0,
    );
    const costsByType = costs.reduce(
      (acc: Record<string, number>, c: any) => {
        acc[c.type] = (acc[c.type] || 0) + Number(c.amount);
        return acc;
      },
      {} as Record<string, number>,
    );
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, projectId, deletedAt: null },
      select: { totalAmount: true, paidAmount: true, status: true },
    });
    const totalRevenue = invoices.reduce(
      (s: number, i: any) => s + Number(i.totalAmount),
      0,
    );
    const totalCollected = invoices.reduce(
      (s: number, i: any) => s + Number(i.paidAmount || 0),
      0,
    );
    const profitLoss = totalRevenue - totalCost;
    const margin = totalRevenue
      ? ((profitLoss / totalRevenue) * 100).toFixed(1)
      : "0.0";
    const costBreakdown = Object.entries(costsByType).map(([type, amount]) => ({
      type,
      amount,
      percentage: totalCost ? ((amount / totalCost) * 100).toFixed(1) : "0.0",
    }));
    return {
      projectId,
      projectName: project.name,
      projectCode: project.code,
      totalCost,
      totalRevenue,
      totalCollected,
      profitLoss,
      margin: Number(margin),
      costBreakdown,
      invoiceCount: invoices.length,
      costEntryCount: costs.length,
    };
  }

  async getProjectWip(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const costs = await prisma.projectCostEntry.findMany({
      where: { tenantId, projectId },
    });
    const totalCost = costs.reduce(
      (s: number, c: any) => s + Number(c.amount),
      0,
    );
    const invoices = await prisma.invoice.findMany({
      where: { tenantId, projectId, deletedAt: null },
      select: { totalAmount: true, status: true },
    });
    const totalBilled = invoices.reduce(
      (s: number, i: any) => s + Number(i.totalAmount),
      0,
    );
    const wip = Math.max(0, totalCost - totalBilled);
    const poc =
      totalCost > 0 ? Math.min(100, (totalBilled / totalCost) * 100) : 0;
    return {
      projectId,
      projectName: project.name,
      totalCostIncurred: totalCost,
      totalBilled,
      wip,
      percentageOfCompletion: Math.round(poc),
      costsByType: costs.reduce(
        (acc: Record<string, number>, c: any) => {
          acc[c.type] = (acc[c.type] || 0) + Number(c.amount);
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async getProjectAnalytics(tenantId: string) {
    const projects = await prisma.project.findMany({
      where: { tenantId },
      include: {
        _count: { select: { costEntries: true, tasks: true } },
        costEntries: { select: { amount: true, type: true } },
      },
    });
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p: any) => p.status === "ACTIVE" || p.status === "IN_PROGRESS",
    ).length;
    const totalCostAll = projects.reduce(
      (s: number, p: any) =>
        s +
        p.costEntries.reduce(
          (cs: number, ce: any) => cs + Number(ce.amount),
          0,
        ),
      0,
    );
    const projectsWithCost = projects.filter(
      (p: any) => p._count.costEntries > 0,
    ).length;
    return {
      totalProjects,
      activeProjects,
      totalCostAll,
      projectsWithCost,
      avgCostPerProject: projectsWithCost
        ? Math.round(totalCostAll / projectsWithCost)
        : 0,
    };
  }

  async getProjectResourceAllocation(
    tenantId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);
    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { tasks: true, costEntries: true } } },
      }),
      prisma.project.count({ where }),
    ]);
    return paginatedResult(data, total, params);
  }
}
