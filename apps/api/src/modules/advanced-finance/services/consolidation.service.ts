import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConsolidationService {
  constructor() {}

  async getConsolidation(tenantId: string) {
    const organizations = await prisma.organization.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    const entities = await Promise.all(
      organizations.map(async (org) => {
        const accounts = await prisma.account.findMany({
          where: { tenantId, orgId: org.id, isActive: true },
        });
        const revenue = accounts.filter((a) => a.type === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
        const expenses = accounts.filter((a) => a.type === 'EXPENSE').reduce((s, a) => s + Number(a.balance), 0);
        const assets = accounts.filter((a) => a.type === 'ASSET').reduce((s, a) => s + Number(a.balance), 0);
        return {
          id: org.id,
          name: org.name,
          currency: org.currency,
          revenue,
          expenses,
          netIncome: revenue - expenses,
          assets,
          status: 'ACTIVE' as const,
        };
      }),
    );

    const orgIds = organizations.map((o) => o.id);
    const eliminationTransfers = await prisma.interCompanyTransfer.findMany({
      where: {
        tenantId,
        fromOrgId: { in: orgIds },
        toOrgId: { in: orgIds },
        status: { in: ['APPROVED', 'POSTED'] },
      },
      orderBy: { date: 'desc' },
    });
    const eliminationsTotal = eliminationTransfers.reduce((sum, t) => sum + Number(t.amount), 0);

    const grossRevenue = entities.reduce((sum, e) => sum + e.revenue, 0);
    const grossExpenses = entities.reduce((sum, e) => sum + e.expenses, 0);
    const grossAssets = entities.reduce((sum, e) => sum + e.assets, 0);

    const consolidated = {
      revenue: grossRevenue - eliminationsTotal,
      expenses: grossExpenses - eliminationsTotal,
      netIncome: grossRevenue - grossExpenses,
      assets: grossAssets - eliminationsTotal,
      entityCount: entities.length,
    };

    const trend = await this.getConsolidatedQuarterlyTrend(tenantId, orgIds);

    return {
      entities,
      consolidated,
      eliminations: {
        total: eliminationsTotal,
        transfers: eliminationTransfers.map((t) => ({
          id: t.id,
          fromOrgId: t.fromOrgId,
          toOrgId: t.toOrgId,
          amount: Number(t.amount),
          currency: t.currency,
          date: t.date,
          status: t.status,
        })),
      },
      trend,
    };
  }

  async getConsolidationRuns(tenantId: string) {
    return prisma.consolidationRun.findMany({
      where: { tenantId },
      include: { eliminations: true },
      orderBy: { runDate: 'desc' },
    });
  }

  async runConsolidation(tenantId: string, periodStart: string, periodEnd: string, eliminateIntercompany = true) {
    const orgs = await prisma.organization.findMany({ where: { tenantId } });
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    let totalAssets = 0,
      totalLiabilities = 0,
      totalEquity = 0,
      totalRevenue = 0,
      totalExpenses = 0;
    const eliminations: Array<{ fromOrgId: string; toOrgId: string; amount: number; accountType: string }> = [];

    for (const org of orgs) {
      const accounts = await prisma.account.findMany({
        where: { tenantId, orgId: org.id, isActive: true },
      });
      totalAssets += accounts.filter((a) => a.type === 'ASSET').reduce((s, a) => s + Number(a.balance), 0);
      totalLiabilities += accounts.filter((a) => a.type === 'LIABILITY').reduce((s, a) => s + Number(a.balance), 0);
      totalEquity += accounts.filter((a) => a.type === 'EQUITY').reduce((s, a) => s + Number(a.balance), 0);
      totalRevenue += accounts.filter((a) => a.type === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
      totalExpenses += accounts.filter((a) => a.type === 'EXPENSE').reduce((s, a) => s + Number(a.balance), 0);

      if (eliminateIntercompany) {
        const transfers = await prisma.interCompanyTransfer.findMany({
          where: { tenantId, fromOrgId: org.id, date: { gte: start, lte: end }, status: 'POSTED' },
        });
        for (const t of transfers) {
          eliminations.push({ fromOrgId: t.fromOrgId, toOrgId: t.toOrgId, amount: Number(t.amount), accountType: 'REVENUE' });
        }
      }
    }

    const eliminationTotal = eliminations.reduce((s, e) => s + e.amount, 0);
    const consolidated = await prisma.consolidationRun.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        status: 'COMPLETED',
        totalAssets: new Prisma.Decimal(totalAssets),
        totalLiabilities: new Prisma.Decimal(totalLiabilities),
        totalEquity: new Prisma.Decimal(totalEquity),
        totalRevenue: new Prisma.Decimal(totalRevenue),
        totalExpenses: new Prisma.Decimal(totalExpenses),
        eliminations: {
          create: eliminations.map((e) => ({ ...e, tenantId })),
        },
      },
      include: { eliminations: true },
    });

    return {
      runId: consolidated.id,
      periodStart,
      periodEnd,
      organizationsCount: orgs.length,
      consolidatedAssets: totalAssets,
      consolidatedLiabilities: totalLiabilities,
      consolidatedEquity: totalEquity,
      consolidatedRevenue: totalRevenue,
      consolidatedExpenses: totalExpenses,
      consolidatedNetIncome: totalRevenue - totalExpenses,
      intercompanyEliminations: eliminationTotal,
      status: 'COMPLETED',
    };
  }

  async runMultiCurrencyConsolidation(
    tenantId: string,
    periodStart: string,
    periodEnd: string,
    reportingCurrency: string,
    translationMethod: 'CURRENT_RATE' | 'TEMPORAL' = 'CURRENT_RATE',
  ) {
    const orgs = await prisma.organization.findMany({ where: { tenantId } });
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    let totalAssets = 0,
      totalLiabilities = 0,
      totalEquity = 0,
      totalRevenue = 0,
      totalExpenses = 0;
    let translationAdjustment = 0;
    const orgResults: Array<{ orgId: string; orgName: string; currency: string; rate: number; translatedAssets: number }> = [];

    for (const org of orgs) {
      const orgCurrency = org.currency || 'USD';
      const rate =
        orgCurrency === reportingCurrency ? 1 : (await this.getRateAsOf(tenantId, orgCurrency, reportingCurrency, end)) ?? 1;

      const accounts = await prisma.account.findMany({
        where: { tenantId, orgId: org.id, isActive: true },
      });

      const assets = accounts.filter((a) => a.type === 'ASSET').reduce((s, a) => s + Number(a.balance), 0);
      const liabilities = accounts.filter((a) => a.type === 'LIABILITY').reduce((s, a) => s + Number(a.balance), 0);
      const equity = accounts.filter((a) => a.type === 'EQUITY').reduce((s, a) => s + Number(a.balance), 0);
      const revenue = accounts.filter((a) => a.type === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
      const expenses = accounts.filter((a) => a.type === 'EXPENSE').reduce((s, a) => s + Number(a.balance), 0);

      totalAssets += assets * rate;
      totalLiabilities += liabilities * rate;
      totalEquity += equity * rate;
      totalRevenue += revenue * rate;
      totalExpenses += expenses * rate;

      const translatedAssets = assets * rate;
      translationAdjustment += (assets - liabilities) * (rate - 1);

      orgResults.push({ orgId: org.id, orgName: org.name, currency: orgCurrency, rate, translatedAssets });
    }

    // Eliminate intercompany
    const transfers = await prisma.interCompanyTransfer.findMany({
      where: { tenantId, date: { gte: start, lte: end }, status: 'POSTED' },
    });
    const eliminationTotal = transfers.reduce((s, t) => s + Number(t.amount), 0);

    const consolidated = await prisma.consolidationRun.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        status: 'COMPLETED',
        totalAssets: new Prisma.Decimal(totalAssets),
        totalLiabilities: new Prisma.Decimal(totalLiabilities),
        totalEquity: new Prisma.Decimal(totalEquity),
        totalRevenue: new Prisma.Decimal(totalRevenue),
        totalExpenses: new Prisma.Decimal(totalExpenses),
        eliminations: {
          create: transfers.map((t) => ({
            tenantId,
            fromOrgId: t.fromOrgId,
            toOrgId: t.toOrgId,
            amount: Number(t.amount),
            accountType: 'INTERCOMPANY',
          })),
        },
      },
      include: { eliminations: true },
    });

    return {
      runId: consolidated.id,
      reportingCurrency,
      translationMethod,
      organizationsCount: orgs.length,
      consolidatedAssets: totalAssets,
      consolidatedLiabilities: totalLiabilities,
      consolidatedEquity: totalEquity,
      consolidatedRevenue: totalRevenue,
      consolidatedExpenses: totalExpenses,
      intercompanyEliminations: eliminationTotal,
      translationAdjustment,
      organizations: orgResults,
    };
  }

  // ── HELPERS ──────────────────────────────────

  private async getRateAsOf(tenantId: string, from: string, to: string, asOf: Date): Promise<number | null> {
    if (from === to) return 1;
    const direct = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency: from, toCurrency: to, date: { lte: asOf } },
      orderBy: { date: 'desc' },
    });
    if (direct) return Number(direct.rate);
    const inverse = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency: to, toCurrency: from, date: { lte: asOf } },
      orderBy: { date: 'desc' },
    });
    if (inverse && Number(inverse.rate) !== 0) return 1 / Number(inverse.rate);
    return null;
  }

  private async getConsolidatedQuarterlyTrend(tenantId: string, orgIds: string[]) {
    const year = new Date().getFullYear();
    const quarters = [
      { name: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 3, 0) },
      { name: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 6, 0) },
      { name: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 9, 0) },
      { name: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 12, 0) },
    ];

    const accounts = await prisma.account.findMany({
      where: { tenantId, orgId: { in: orgIds }, isActive: true },
    });
    const accountById = new Map(accounts.map((a) => [a.id, a]));
    const revenueAccountIds = accounts.filter((a) => a.type === 'REVENUE').map((a) => a.id);
    const expenseAccountIds = accounts.filter((a) => a.type === 'EXPENSE').map((a) => a.id);

    return Promise.all(
      quarters.map(async (q) => {
        const entries = await prisma.journalEntry.findMany({
          where: {
            tenantId,
            accountId: { in: [...revenueAccountIds, ...expenseAccountIds] },
            journal: { orgId: { in: orgIds }, date: { gte: q.start, lte: q.end }, status: 'POSTED' },
          },
        });
        let revenue = 0;
        let expenses = 0;
        for (const entry of entries) {
          const account = accountById.get(entry.accountId);
          if (!account) continue;
          if (account.type === 'REVENUE') revenue += Number(entry.credit) - Number(entry.debit);
          else if (account.type === 'EXPENSE') expenses += Number(entry.debit) - Number(entry.credit);
        }
        return { name: q.name, revenue, expenses, netIncome: revenue - expenses };
      }),
    );
  }
}
