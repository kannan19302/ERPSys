import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplyChainBudgetService {
  async list(tenantId: string, opts: { page?: number; limit?: number; fiscalYear?: number; status?: string }) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.SupplyChainBudgetWhereInput = { tenantId, ...(opts.fiscalYear ? { fiscalYear: opts.fiscalYear } : {}), ...(opts.status ? { status: opts.status } : {}) };
    const [data, total] = await Promise.all([
      prisma.supplyChainBudget.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { lineItems: true } }),
      prisma.supplyChainBudget.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const budget = await prisma.supplyChainBudget.findFirst({ where: { id, tenantId }, include: { lineItems: true } });
    if (!budget) throw new NotFoundException(`Budget not found: ${id}`);
    return budget;
  }

  async create(tenantId: string, dto: Prisma.SupplyChainBudgetCreateInput & { lineItems?: Prisma.SupplyChainBudgetLineCreateWithoutBudgetInput[] }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.supplyChainBudget.findFirst({ where: { tenantId, budgetNumber: dto.budgetNumber } });
      if (existing) throw new BadRequestException(`Budget number already exists: ${dto.budgetNumber}`);
      const { lineItems, ...budgetData } = dto;
      return tx.supplyChainBudget.create({ data: { ...budgetData, tenantId, lineItems: lineItems ? { create: lineItems.map((li) => ({ ...li, tenantId })) } : undefined }, include: { lineItems: true } });
    });
  }

  async update(tenantId: string, id: string, dto: Prisma.SupplyChainBudgetUpdateInput) {
    await this.getById(tenantId, id);
    return prisma.supplyChainBudget.update({ where: { id }, data: dto, include: { lineItems: true } });
  }

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.supplyChainBudget.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  async approve(tenantId: string, id: string, userId: string) {
    await this.getById(tenantId, id);
    return prisma.supplyChainBudget.update({ where: { id }, data: { status: "ACTIVE", approvedBy: userId, approvedAt: new Date() } });
  }

  async addLineItem(tenantId: string, budgetId: string, dto: Prisma.SupplyChainBudgetLineCreateWithoutBudgetInput) {
    await this.getById(tenantId, budgetId);
    return prisma.supplyChainBudgetLine.create({ data: { ...dto, tenantId, budgetId } });
  }

  async updateLineItem(tenantId: string, lineItemId: string, dto: Prisma.SupplyChainBudgetLineUpdateInput) {
    const li = await prisma.supplyChainBudgetLine.findFirst({ where: { id: lineItemId, tenantId } });
    if (!li) throw new NotFoundException(`Budget line item not found: ${lineItemId}`);
    return prisma.supplyChainBudgetLine.update({ where: { id: lineItemId }, data: dto });
  }

  async getBudgetVsActual(tenantId: string, fiscalYear: number) {
    const budgets = await prisma.supplyChainBudget.findMany({ where: { tenantId, fiscalYear }, include: { lineItems: true } });
    const totalBudget = budgets.reduce((s, b) => s + Number(b.totalAmount), 0);
    const totalSpent = budgets.reduce((s, b) => s + Number(b.spentAmount), 0);
    const lineItems = budgets.flatMap((b) => b.lineItems);
    const totalAllocated = lineItems.reduce((s, li) => s + Number(li.allocated), 0);
    const totalLineSpent = lineItems.reduce((s, li) => s + Number(li.spent), 0);
    return {
      fiscalYear,
      totalBudgets: budgets.length,
      totalBudgetAmount: totalBudget,
      totalSpentAmount: totalSpent,
      utilizationPct: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 10000) / 100 : 0,
      remainingBudget: totalBudget - totalSpent,
      lineItems: { totalAllocated, totalSpent: totalLineSpent, utilizationPct: totalAllocated > 0 ? Math.round((totalLineSpent / totalAllocated) * 10000) / 100 : 0 },
      budgetDetails: budgets.map((b) => ({ id: b.id, name: b.name, budgetNumber: b.budgetNumber, totalAmount: Number(b.totalAmount), spentAmount: Number(b.spentAmount), remaining: Number(b.totalAmount) - Number(b.spentAmount), utilizationPct: Number(b.totalAmount) > 0 ? Math.round((Number(b.spentAmount) / Number(b.totalAmount)) * 10000) / 100 : 0, status: b.status })),
    };
  }
}
