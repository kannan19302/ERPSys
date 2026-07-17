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
      spreadMethod?: 'EVEN' | 'HISTORICAL_PROPORTIONAL';
    },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    
    return prisma.$transaction(async (tx) => {
      const budget = await tx.budget.create({
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

      // Handle monthly period amounts based on spread method
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      const periods: Array<{ date: Date; periodStr: string; monthVal: number }> = [];
      
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (curr <= endLimit) {
        const yr = curr.getFullYear();
        const mo = String(curr.getMonth() + 1).padStart(2, '0');
        periods.push({
          date: new Date(curr),
          periodStr: `${yr}-${mo}`,
          monthVal: curr.getMonth() + 1,
        });
        curr.setMonth(curr.getMonth() + 1);
      }

      const totalPeriods = periods.length > 0 ? periods.length : 1;
      const method = dto.spreadMethod || 'EVEN';

      if (method === 'EVEN') {
        const monthlyAmount = dto.amount / totalPeriods;
        for (const p of periods) {
          await tx.budgetPeriodAmount.create({
            data: {
              tenantId,
              budgetId: budget.id,
              period: p.periodStr,
              amount: new Prisma.Decimal(monthlyAmount),
            },
          });
        }
      } else if (method === 'HISTORICAL_PROPORTIONAL') {
        // Query previous year actuals for the same account
        const prevYear = start.getFullYear() - 1;
        const prevStart = new Date(`${prevYear}-01-01`);
        const prevEnd = new Date(`${prevYear}-12-31T23:59:59.999Z`);

        const actualEntries = await tx.journalEntry.findMany({
          where: {
            tenantId,
            accountId: dto.accountId,
            journal: {
              orgId: resolvedOrgId,
              date: { gte: prevStart, lte: prevEnd },
              status: 'POSTED',
            },
          },
          include: { journal: true },
        });

        const monthlyActuals = new Array(12).fill(0);
        let totalActuals = 0;

        for (const entry of actualEntries) {
          const m = entry.journal.date.getMonth(); // 0-11
          const netDebit = Number(entry.debit) - Number(entry.credit);
          monthlyActuals[m] += Math.abs(netDebit);
          totalActuals += Math.abs(netDebit);
        }

        if (totalActuals === 0) {
          // Fall back to EVEN if no historical actuals exist
          const monthlyAmount = dto.amount / totalPeriods;
          for (const p of periods) {
            await tx.budgetPeriodAmount.create({
              data: {
                tenantId,
                budgetId: budget.id,
                period: p.periodStr,
                amount: new Prisma.Decimal(monthlyAmount),
              },
            });
          }
        } else {
          for (const p of periods) {
            const histMonthIndex = p.monthVal - 1; // 0-11
            const ratio = monthlyActuals[histMonthIndex] / totalActuals;
            const periodAmt = dto.amount * ratio;
            
            await tx.budgetPeriodAmount.create({
              data: {
                tenantId,
                budgetId: budget.id,
                period: p.periodStr,
                amount: new Prisma.Decimal(periodAmt),
              },
            });
          }
        }
      }

      return budget;
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
