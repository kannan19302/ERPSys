import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class BudgetingService {
  constructor(private readonly glService: GlAccountingService) {}

  async getBudgets(tenantId: string) {
    return prisma.budget.findMany({
      where: { tenantId },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBudgetById(tenantId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, tenantId },
      include: { account: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async createBudget(
    tenantId: string,
    orgId: string,
    dto: {
      accountId: string;
      amount: number;
      startDate: string;
      endDate: string;
      costCenterId?: string;
      projectId?: string;
    },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.budget.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        accountId: dto.accountId,
        amount: new Prisma.Decimal(dto.amount),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        costCenterId: dto.costCenterId || null,
        projectId: dto.projectId || null,
      },
      include: { account: true },
    });
  }

  async updateBudget(
    tenantId: string,
    budgetId: string,
    dto: {
      accountId?: string;
      amount?: number;
      startDate?: string;
      endDate?: string;
      costCenterId?: string | null;
      projectId?: string | null;
    },
  ) {
    const budget = await prisma.budget.findFirst({ where: { id: budgetId, tenantId } });
    if (!budget) throw new NotFoundException('Budget not found');

    const data: Record<string, unknown> = {};
    if (dto.accountId !== undefined) data.accountId = dto.accountId;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.costCenterId !== undefined) data.costCenterId = dto.costCenterId;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;

    return prisma.budget.update({
      where: { id: budgetId },
      data,
      include: { account: true },
    });
  }

  async deleteBudget(tenantId: string, budgetId: string) {
    const budget = await prisma.budget.findFirst({ where: { id: budgetId, tenantId } });
    if (!budget) throw new NotFoundException('Budget not found');

    await prisma.budget.delete({ where: { id: budgetId } });
    return { success: true };
  }

  async getBudgetVsActuals(tenantId: string, orgId: string, fiscalYear: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const start = new Date(`${fiscalYear}-01-01`);
    const end = new Date(`${fiscalYear}-12-31`);

    const budgets = await prisma.budget.findMany({
      where: { tenantId, orgId: resolvedOrgId, startDate: { gte: start }, endDate: { lte: end } },
      include: { account: true },
    });

    const accountIds = budgets.map((b) => b.accountId);
    const entries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId: { in: accountIds },
        journal: { orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'POSTED' },
      },
    });

    const actualByAccount = new Map<string, number>();
    for (const entry of entries) {
      const current = actualByAccount.get(entry.accountId) || 0;
      actualByAccount.set(entry.accountId, current + Number(entry.debit) - Number(entry.credit));
    }

    const items = budgets.map((b) => {
      const actual = actualByAccount.get(b.accountId) || 0;
      const budgetAmt = Number(b.amount);
      const variance = budgetAmt - Math.abs(actual);
      return {
        accountId: b.accountId,
        accountName: b.account.name,
        accountCode: b.account.code,
        budgetAmount: budgetAmt,
        actualAmount: Math.abs(actual),
        variance,
        variancePercent: budgetAmt > 0 ? (variance / budgetAmt) * 100 : 0,
      };
    });

    return {
      fiscalYear,
      totalBudget: items.reduce((s, i) => s + i.budgetAmount, 0),
      totalActual: items.reduce((s, i) => s + i.actualAmount, 0),
      totalVariance: items.reduce((s, i) => s + i.variance, 0),
      items,
    };
  }
}
