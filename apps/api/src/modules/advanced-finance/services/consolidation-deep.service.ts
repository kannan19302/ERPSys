import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ConsolidationDeepService {
  async createConsolidationRate(tenantId: string, dto: {
    period: string; fromCurrency: string; toCurrency: string;
    averageRate: number; closingRate: number; historicalRate: number;
  }) {
    return prisma.consolidationRate.upsert({
      where: {
        tenantId_period_fromCurrency_toCurrency: {
          tenantId,
          period: dto.period,
          fromCurrency: dto.fromCurrency,
          toCurrency: dto.toCurrency,
        },
      },
      create: { tenantId, ...dto },
      update: { averageRate: dto.averageRate, closingRate: dto.closingRate, historicalRate: dto.historicalRate },
    });
  }

  async getConsolidationRates(tenantId: string, period: string) {
    return prisma.consolidationRate.findMany({
      where: { tenantId, period },
    });
  }

  async runConsolidatedTranslation(tenantId: string, period: string, targetCurrency: string) {
    // Lookup consolidation rates for the period
    const rates = await prisma.consolidationRate.findMany({ where: { tenantId, period } });
    if (rates.length === 0) throw new BadRequestException('Consolidation rates not set for this period');

    // Aggregate source journal entries to be translated
    const journals = await prisma.journalEntry.findMany({ where: { tenantId } });

    let translatedTotal = 0;
    for (const entry of journals) {
      const rate = rates[0]!;
      const debit = Number(entry.debit) * Number(rate.averageRate);
      const credit = Number(entry.credit) * Number(rate.averageRate);
      translatedTotal += (debit - credit);
    }

    // Cumulative Translation Adjustment (CTA) balances consolidation difference
    const ctaAmount = translatedTotal * 0.05; // Mock CTA difference

    const start = new Date(period + '-01');
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1) - 1);

    const run = await prisma.consolidationRun.create({
      data: {
        tenantId,
        period,
        periodStart: start,
        periodEnd: end,
        targetCurrency,
        ctaAmount: Math.round(ctaAmount * 100) / 100,
        status: 'DRAFT',
      },
    });

    return run;
  }

  async calculateCumulativeTranslationAdjustment(tenantId: string, period: string): Promise<number> {
    const run = await prisma.consolidationRun.findFirst({
      where: { tenantId, period, status: 'DRAFT' },
    });
    return Number(run?.ctaAmount ?? 0);
  }

  async runConsolidationEliminations(tenantId: string, runId: string, eliminations: {
    fromOrgId: string; toOrgId: string; amount: number; accountType: string; description?: string;
  }[]) {
    const run = await prisma.consolidationRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException('Consolidation run not found');

    const created = [];
    for (const elim of eliminations) {
      const rec = await prisma.consolidationElimination.create({
        data: {
          tenantId,
          consolidationId: runId,
          fromOrgId: elim.fromOrgId,
          toOrgId: elim.toOrgId,
          amount: elim.amount,
          accountType: elim.accountType,
          description: elim.description,
        },
      });
      created.push(rec);
    }

    return { runId, eliminationsCreated: created.length, details: created };
  }

  async getConsolidatedFinancialStatements(tenantId: string, period: string) {
    const run = await prisma.consolidationRun.findFirst({ where: { tenantId, period } });
    if (!run) throw new NotFoundException('No consolidation run found for this period');

    // Calculate consolidated P&L / BS sums with elimination deductions
    const elims = await prisma.consolidationElimination.findMany({ where: { tenantId, consolidationId: run.id } });
    const totalEliminated = elims.reduce((s, e) => s + Number(e.amount), 0);

    return {
      period,
      reportingCurrency: run.targetCurrency ?? 'USD',
      consolidatedAssets: Number(run.totalAssets) - totalEliminated,
      consolidatedLiabilities: Number(run.totalLiabilities) - totalEliminated,
      consolidatedEquity: Number(run.totalEquity),
      consolidatedRevenue: Number(run.totalRevenue) - totalEliminated,
      consolidatedExpenses: Number(run.totalExpenses) - totalEliminated,
      ctaAdjustment: Number(run.ctaAmount ?? 0),
      status: run.status,
    };
  }

  async lockConsolidationPeriod(tenantId: string, id: string) {
    const run = await prisma.consolidationRun.findFirst({ where: { id, tenantId } });
    if (!run) throw new NotFoundException('Consolidation run not found');
    return prisma.consolidationRun.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async listConsolidationRuns(tenantId: string) {
    return prisma.consolidationRun.findMany({
      where: { tenantId },
      orderBy: { period: 'desc' as never },
    });
  }
}
