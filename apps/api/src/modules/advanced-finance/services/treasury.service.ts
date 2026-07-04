import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class TreasuryService {
  constructor(private readonly glService: GlAccountingService) {}

  async getInvestmentPortfolios(tenantId: string) {
    return prisma.investmentPortfolio.findMany({
      where: { tenantId },
      include: { account: true },
    });
  }

  async createInvestmentPortfolio(tenantId: string, orgId: string, dto: { name: string; type: string; accountId: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.investmentPortfolio.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  async getTreasuryTransactions(tenantId: string) {
    return prisma.treasuryTransaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      include: { bankAccount: true },
    });
  }

  async createTreasuryTransaction(tenantId: string, orgId: string, dto: { type: string; amount: number; bankAccountId: string; date?: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.treasuryTransaction.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  async getInterCompanyTransfers(tenantId: string) {
    return prisma.interCompanyTransfer.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async createInterCompanyTransfer(
    tenantId: string,
    dto: { fromOrgId: string; toOrgId: string; amount: number; currency?: string; date?: string },
  ) {
    return prisma.interCompanyTransfer.create({
      data: {
        tenantId,
        fromOrgId: dto.fromOrgId,
        toOrgId: dto.toOrgId,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency || 'USD',
        date: dto.date ? new Date(dto.date) : new Date(),
        status: 'PENDING',
      },
    });
  }

  async approveInterCompanyTransfer(tenantId: string, transferId: string) {
    const transfer = await prisma.interCompanyTransfer.findFirst({ where: { id: transferId, tenantId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return prisma.interCompanyTransfer.update({
      where: { id: transferId },
      data: { status: 'APPROVED' },
    });
  }

  // ── EXCHANGE RATES & CURRENCY CONVERSION ──────────────────

  async getExchangeRates(tenantId: string) {
    return prisma.exchangeRate.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async updateExchangeRate(tenantId: string, dto: { fromCurrency: string; toCurrency: string; rate: number; date?: string }) {
    return prisma.exchangeRate.create({
      data: {
        tenantId,
        fromCurrency: dto.fromCurrency,
        toCurrency: dto.toCurrency,
        rate: new Prisma.Decimal(dto.rate),
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async convertCurrency(tenantId: string, from: string, to: string, amount: number, date?: string) {
    if (from === to) return { originalAmount: amount, convertedAmount: amount, rate: 1 };
    const dateFilter = date ? { lte: new Date(date) } : undefined;
    const rateRow = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency: from, toCurrency: to, ...(dateFilter ? { date: dateFilter } : {}) },
      orderBy: { date: 'desc' },
    });
    if (!rateRow) {
      const revRateRow = await prisma.exchangeRate.findFirst({
        where: { tenantId, fromCurrency: to, toCurrency: from, ...(dateFilter ? { date: dateFilter } : {}) },
        orderBy: { date: 'desc' },
      });
      if (!revRateRow) throw new NotFoundException(`No exchange rate found from ${from} to ${to}`);
      const rate = 1 / Number(revRateRow.rate);
      return { originalAmount: amount, convertedAmount: Math.round(amount * rate * 100) / 100, rate };
    }
    const rate = Number(rateRow.rate);
    return { originalAmount: amount, convertedAmount: Math.round(amount * rate * 100) / 100, rate };
  }

  async getCurrencyRevaluations(tenantId: string) {
    return prisma.currencyRevaluation.findMany({
      where: { tenantId },
      orderBy: { asOfDate: 'desc' },
    });
  }

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

  private async ensureAccount(tenantId: string, orgId: string, code: string, name: string, type: string) {
    const existing = await prisma.account.findFirst({ where: { tenantId, orgId, code } });
    if (existing) return existing;
    return prisma.account.create({ data: { tenantId, orgId, code, name, type } });
  }

  async runCurrencyRevaluation(tenantId: string, orgId: string, asOfDate: string, baseCurrency = 'USD') {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    const asOf = new Date(asOfDate);
    const base = (baseCurrency || 'USD').toUpperCase();

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId, orgId: resolvedOrgId,
        status: { notIn: ['PAID', 'VOID', 'CANCELLED', 'DRAFT'] },
        currency: { not: base },
      },
    });

    const lines: Array<Record<string, unknown>> = [];
    let totalGain = 0, totalLoss = 0;
    let arNet = 0, apNet = 0;

    for (const inv of invoices) {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;
      const bookRate = Number(inv.exchangeRate) || 1;
      const currentRate = await this.getRateAsOf(tenantId, inv.currency, base, asOf);
      if (currentRate === null) continue;
      const bookValue = outstanding * bookRate;
      const currentValue = outstanding * currentRate;
      const delta = Number((currentValue - bookValue).toFixed(2));
      if (Math.abs(delta) < 0.01) continue;
      arNet += delta;
      if (delta > 0) totalGain += delta; else totalLoss += Math.abs(delta);
      lines.push({
        source: 'AR_INVOICE', ref: inv.invoiceNumber, invoiceId: inv.id, currency: inv.currency,
        foreignAmount: outstanding, bookRate, currentRate,
        bookValue: Number(bookValue.toFixed(2)), currentValue: Number(currentValue.toFixed(2)), delta,
      });
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId, orgId: resolvedOrgId,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
        currency: { not: base },
      },
    });
    for (const po of purchaseOrders) {
      const outstanding = Number(po.totalAmount) - Number(po.paidAmount);
      if (outstanding <= 0) continue;
      const bookRate = Number(po.exchangeRate) || 1;
      const currentRate = await this.getRateAsOf(tenantId, po.currency, base, asOf);
      if (currentRate === null) continue;
      const bookValue = outstanding * bookRate;
      const currentValue = outstanding * currentRate;
      const delta = Number((bookValue - currentValue).toFixed(2));
      if (Math.abs(delta) < 0.01) continue;
      apNet += delta;
      if (delta > 0) totalGain += delta; else totalLoss += Math.abs(delta);
      lines.push({
        source: 'AP_PO', ref: po.poNumber, purchaseOrderId: po.id, currency: po.currency,
        foreignAmount: outstanding, bookRate, currentRate,
        bookValue: Number(bookValue.toFixed(2)), currentValue: Number(currentValue.toFixed(2)), delta,
      });
    }

    arNet = Number(arNet.toFixed(2));
    apNet = Number(apNet.toFixed(2));
    const netAdjustment = Number((totalGain - totalLoss).toFixed(2));
    const runNumber = `REVAL-${asOf.toISOString().slice(0, 10)}-${Date.now().toString().slice(-6)}`;

    let journalId: string | null = null;
    if (Math.abs(netAdjustment) >= 0.01) {
      const arReserve = await this.ensureAccount(tenantId, resolvedOrgId, '1190', 'FX Revaluation Reserve (AR)', 'ASSET');
      const apReserve = await this.ensureAccount(tenantId, resolvedOrgId, '2190', 'FX Revaluation Reserve (AP)', 'LIABILITY');
      const fxGain = await this.ensureAccount(tenantId, resolvedOrgId, '4900', 'Unrealized FX Gain', 'REVENUE');
      const fxLoss = await this.ensureAccount(tenantId, resolvedOrgId, '5900', 'Unrealized FX Loss', 'EXPENSE');
      const entries: { accountId: string; debit: number; credit: number; description?: string }[] = [];
      if (Math.abs(arNet) >= 0.01) {
        entries.push({ accountId: arReserve.id, debit: arNet > 0 ? arNet : 0, credit: arNet < 0 ? -arNet : 0, description: 'AR FX revaluation' });
      }
      if (Math.abs(apNet) >= 0.01) {
        entries.push({ accountId: apReserve.id, debit: apNet > 0 ? apNet : 0, credit: apNet < 0 ? -apNet : 0, description: 'AP FX revaluation' });
      }
      const amount = Math.abs(netAdjustment);
      if (netAdjustment > 0) entries.push({ accountId: fxGain.id, debit: 0, credit: amount, description: 'Unrealized FX gain' });
      else entries.push({ accountId: fxLoss.id, debit: amount, credit: 0, description: 'Unrealized FX loss' });
      const journal = await this.glService.createJournal(tenantId, resolvedOrgId, {
        entryNumber: runNumber, notes: `FX revaluation as of ${asOf.toISOString().slice(0, 10)}`, entries,
      });
      journalId = journal?.id ?? null;
    }

    const revaluation = await prisma.currencyRevaluation.create({
      data: {
        tenantId, orgId: resolvedOrgId, runNumber, asOfDate: asOf, baseCurrency: base, status: 'POSTED',
        totalGain: new Prisma.Decimal(totalGain), totalLoss: new Prisma.Decimal(totalLoss),
        netAdjustment: new Prisma.Decimal(netAdjustment), journalId, lines: lines as never, createdBy: 'system',
      },
    });
    await this.glService.logAudit(prisma, tenantId, 'CurrencyRevaluation', revaluation.id, 'CREATE', { netAdjustment, items: lines.length }, 'system');

    return {
      id: revaluation.id, runNumber, asOfDate: asOf.toISOString(), baseCurrency: base,
      itemsRevalued: lines.length, arNet, apNet,
      totalGain: Number(totalGain.toFixed(2)), totalLoss: Number(totalLoss.toFixed(2)),
      netAdjustment, journalId, lines,
    };
  }

  // ── PAYMENT SCHEDULES & RUNS ──────────────────────────────

  async getPaymentSchedules(tenantId: string) {
    return prisma.paymentSchedule.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async createPaymentSchedule(tenantId: string, orgId: string, dto: { vendorId: string; purchaseOrderId?: string; dueDate: string; amount: number }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.paymentSchedule.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId || null,
        dueDate: new Date(dto.dueDate),
        amount: new Prisma.Decimal(dto.amount),
        status: 'PENDING',
      },
    });
  }

  async getPaymentRuns(tenantId: string) {
    return prisma.paymentRun.findMany({
      where: { tenantId },
      include: { bankAccount: true },
      orderBy: { runDate: 'desc' },
    });
  }

  async createPaymentRun(tenantId: string, orgId: string, dto: { bankAccountId: string; runDate: string; totalAmount?: number }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const run = await prisma.paymentRun.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        bankAccountId: dto.bankAccountId,
        runDate: new Date(dto.runDate),
        totalAmount: new Prisma.Decimal(dto.totalAmount || 0),
        status: 'DRAFT',
      },
    });
    await this.glService.logAudit(prisma, tenantId, 'PaymentRun', run.id, 'CREATE', { bankAccountId: dto.bankAccountId }, 'system');
    return run;
  }

  async approvePaymentRun(tenantId: string, runId: string) {
    const run = await prisma.paymentRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException('Payment run not found');
    const updated = await prisma.paymentRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED' },
    });
    await this.glService.logAudit(prisma, tenantId, 'PaymentRun', runId, 'APPROVE', { status: 'COMPLETED' }, 'system');
    return updated;
  }

  // ── FORECAST SCENARIOS ─────────────────────────────────────

  async getForecastScenarios(tenantId: string) {
    return prisma.forecastScenario.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForecastScenario(tenantId: string, orgId: string, dto: { name: string; description?: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.forecastScenario.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        status: 'DRAFT',
      },
    });
  }
}
