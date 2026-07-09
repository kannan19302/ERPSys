import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class FpaDeepService {
  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── ROLLING FORECAST ──────────────────────────────────

  async listRollingForecast(tenantId: string, period?: string) {
    return prisma.rollingForecast.findMany({
      where: { tenantId, ...(period && { period }) },
      orderBy: [{ period: 'asc' }, { accountId: 'asc' }],
    });
  }

  async upsertRollingForecastLine(tenantId: string, dto: {
    period: string; accountId: string; costCenterId?: string;
    amount: number; source?: string; notes?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.rollingForecast.upsert({
      where: {
        tenantId_orgId_period_accountId_costCenterId_source: {
          tenantId, orgId,
          period: dto.period,
          accountId: dto.accountId,
          costCenterId: dto.costCenterId ?? null,
          source: dto.source ?? 'FORECAST',
        },
      },
      create: {
        tenantId, orgId,
        period: dto.period, accountId: dto.accountId,
        costCenterId: dto.costCenterId,
        amount: dto.amount,
        source: dto.source ?? 'FORECAST',
        notes: dto.notes,
      },
      update: { amount: dto.amount, notes: dto.notes },
    });
  }

  async syncActualsToRollingForecast(tenantId: string, period: string) {
    const orgId = await this.resolveOrgId(tenantId);
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    // Pull journal entry lines grouped by account
    const journalLines = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: { tenantId, journal: { date: { gte: start, lte: end }, status: 'POSTED' } },
      _sum: { debit: true, credit: true },
    });
    const synced = [];
    for (const line of journalLines) {
      const amount = Number(line._sum.debit ?? 0) - Number(line._sum.credit ?? 0);
      const rec = await prisma.rollingForecast.upsert({
        where: {
          tenantId_orgId_period_accountId_costCenterId_source: {
            tenantId, orgId, period,
            accountId: line.accountId,
            costCenterId: null,
            source: 'ACTUAL',
          },
        },
        create: { tenantId, orgId, period, accountId: line.accountId, amount, source: 'ACTUAL' },
        update: { amount },
      });
      synced.push(rec);
    }
    return { synced: synced.length };
  }

  // ── HEADCOUNT PLANNING ──────────────────────────────────

  async listHeadcountPlans(tenantId: string, period?: string) {
    return prisma.headcountPlan.findMany({
      where: { tenantId, ...(period && { period }) },
      orderBy: [{ period: 'asc' }, { roleName: 'asc' }],
    });
  }

  async createHeadcountPlan(tenantId: string, dto: {
    departmentId?: string; roleName: string; period: string;
    plannedHc: number; loadedCostRate: number;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    const projectedCost = dto.plannedHc * dto.loadedCostRate;
    return prisma.headcountPlan.create({
      data: { tenantId, orgId, ...dto, projectedCost },
    });
  }

  async updateHeadcountPlan(tenantId: string, id: string, dto: Partial<{
    plannedHc: number; loadedCostRate: number; notes: string;
  }>) {
    const plan = await prisma.headcountPlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Headcount plan not found');
    const plannedHc = dto.plannedHc ?? plan.plannedHc;
    const loadedCostRate = dto.loadedCostRate ?? Number(plan.loadedCostRate);
    const projectedCost = plannedHc * loadedCostRate;
    return prisma.headcountPlan.update({ where: { id }, data: { ...dto, projectedCost } });
  }

  async getHeadcountCostProjection(tenantId: string, periods: string[]) {
    const plans = await prisma.headcountPlan.findMany({ where: { tenantId, period: { in: periods } } });
    const byPeriod: Record<string, { period: string; totalHc: number; totalCost: number }> = {};
    for (const p of plans) {
      if (!byPeriod[p.period]) byPeriod[p.period] = { period: p.period, totalHc: 0, totalCost: 0 };
      byPeriod[p.period].totalHc += p.plannedHc;
      byPeriod[p.period].totalCost += Number(p.projectedCost);
    }
    return Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  }

  // ── BUDGET COMMENTS ──────────────────────────────────

  async listBudgetComments(tenantId: string, budgetId: string, period?: string) {
    return prisma.budgetComment.findMany({
      where: { tenantId, budgetId, ...(period && { period }), parentId: null },
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addBudgetComment(tenantId: string, dto: {
    budgetId: string; accountId?: string; period?: string;
    authorId: string; text: string; parentId?: string;
  }) {
    return prisma.budgetComment.create({ data: { tenantId, ...dto } });
  }

  async updateBudgetComment(tenantId: string, id: string, text: string) {
    const comment = await prisma.budgetComment.findFirst({ where: { id, tenantId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return prisma.budgetComment.update({ where: { id }, data: { text } });
  }

  async deleteBudgetComment(tenantId: string, id: string) {
    const comment = await prisma.budgetComment.findFirst({ where: { id, tenantId } });
    if (!comment) throw new NotFoundException('Comment not found');
    return prisma.budgetComment.delete({ where: { id } });
  }

  // ── MANAGEMENT REPORTS ──────────────────────────────────

  async listManagementReports(tenantId: string) {
    return prisma.managementReport.findMany({ where: { tenantId }, orderBy: { period: 'desc' } });
  }

  async getManagementReport(tenantId: string, id: string) {
    const r = await prisma.managementReport.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException('Management report not found');
    return r;
  }

  async createManagementReport(tenantId: string, dto: {
    name: string; period: string; sections?: object[]; createdBy?: string;
  }) {
    const orgId = await this.resolveOrgId(tenantId);
    return prisma.managementReport.create({
      data: {
        tenantId, orgId,
        name: dto.name, period: dto.period,
        sections: (dto.sections ?? []) as never,
        createdBy: dto.createdBy,
        status: 'DRAFT',
      },
    });
  }

  async updateManagementReport(tenantId: string, id: string, dto: Partial<{
    name: string; sections: object[]; status: string;
  }>) {
    await this.getManagementReport(tenantId, id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === 'PUBLISHED') data.publishedAt = new Date();
    return prisma.managementReport.update({ where: { id }, data: data as never });
  }

  async deleteManagementReport(tenantId: string, id: string) {
    await this.getManagementReport(tenantId, id);
    return prisma.managementReport.delete({ where: { id } });
  }

  // ── WATERFALL CHART DATA ──────────────────────────────────

  async getWaterfallChartData(tenantId: string, budgetId: string, period: string) {
    const budget = await prisma.budget.findFirst({ where: { id: budgetId, tenantId } });
    if (!budget) throw new NotFoundException('Budget not found');
    const [year, month] = period.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const actualAgg = await prisma.journalEntry.aggregate({
      where: { tenantId, journal: { date: { gte: start, lte: end }, status: 'POSTED' } },
      _sum: { debit: true },
    });
    const budgetAmount = Number(budget.amount);
    const actualAmount = Number(actualAgg._sum.debit ?? 0);
    const forecast = (budgetAmount + actualAmount) / 2; // simplified mid-point
    return {
      period,
      budget: budgetAmount,
      forecast,
      actual: actualAmount,
      budgetToForecastVariance: forecast - budgetAmount,
      forecastToActualVariance: actualAmount - forecast,
      totalVariance: actualAmount - budgetAmount,
    };
  }

  // ── SENSITIVITY ANALYSIS ──────────────────────────────────

  async runWhatIfSensitivity(tenantId: string, dto: {
    revenueChangePct: number; costChangePct: number; period?: string;
  }) {
    const [year, month] = (dto.period ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`).split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const revAgg = await prisma.invoice.aggregate({
      where: { tenantId, issueDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      _sum: { totalAmount: true },
    });
    const costAgg = await prisma.purchaseOrder.aggregate({
      where: { tenantId, orderDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      _sum: { totalAmount: true },
    });

    const baseRevenue = Number(revAgg._sum.totalAmount ?? 0);
    const baseCost = Number(costAgg._sum.totalAmount ?? 0);
    const baseProfit = baseRevenue - baseCost;

    const newRevenue = baseRevenue * (1 + dto.revenueChangePct / 100);
    const newCost = baseCost * (1 + dto.costChangePct / 100);
    const newProfit = newRevenue - newCost;

    return {
      base: { revenue: baseRevenue, cost: baseCost, profit: baseProfit },
      scenario: { revenue: newRevenue, cost: newCost, profit: newProfit },
      impact: { revenueDelta: newRevenue - baseRevenue, costDelta: newCost - baseCost, profitDelta: newProfit - baseProfit },
    };
  }
}
