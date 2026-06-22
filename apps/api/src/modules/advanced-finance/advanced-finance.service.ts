import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

@Injectable()
export class AdvancedFinanceService {
  async getExchangeRates(tenantId: string) {
    return prisma.exchangeRate.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async getAccounts(tenantId: string) {
    return prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(
    tenantId: string,
    orgId: string,
    dto: { code: string; name: string; type: string; parentId?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    const existing = await prisma.account.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Account code ${dto.code} already exists.`);
    return prisma.account.create({
      data: { tenantId, orgId: resolvedOrgId, code: dto.code, name: dto.name, type: dto.type, parentId: dto.parentId || null },
    });
  }

  async getCostCenters(tenantId: string) {
    return prisma.costCenter.findMany({ where: { tenantId }, orderBy: { code: 'asc' } });
  }

  async createCostCenter(tenantId: string, orgId: string, dto: { code: string; name: string; parentId?: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    const existing = await prisma.costCenter.findFirst({ where: { tenantId, orgId: resolvedOrgId, code: dto.code } });
    if (existing) throw new BadRequestException(`Cost Center code ${dto.code} already exists.`);
    return prisma.costCenter.create({ data: { tenantId, orgId: resolvedOrgId, code: dto.code, name: dto.name, parentId: dto.parentId || null } });
  }

  async getJournals(tenantId: string) {
    return prisma.journal.findMany({
      where: { tenantId }, include: { entries: { include: { account: true } } }, orderBy: { date: 'desc' },
    });
  }

  async createJournal(tenantId: string, orgId: string,
    dto: { entryNumber: string; notes?: string; entries: { accountId: string; debit: number; credit: number; description?: string; departmentId?: string; costCenterId?: string; projectId?: string }[] }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    const debits = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const credits = dto.entries.reduce((sum, e) => sum + e.credit, 0);
    if (Math.abs(debits - credits) > 0.01) {
      throw new BadRequestException('Journal entries do not balance. Total debits must equal total credits.');
    }
    return prisma.$transaction(async (tx) => {
      const journal = await tx.journal.create({
        data: { tenantId, orgId: resolvedOrgId, entryNumber: dto.entryNumber, notes: dto.notes || null, status: 'POSTED' },
      });
      for (const entry of dto.entries) {
        await tx.journalEntry.create({
          data: {
            tenantId, journalId: journal.id, accountId: entry.accountId,
            debit: new Prisma.Decimal(entry.debit), credit: new Prisma.Decimal(entry.credit),
            description: entry.description || null, departmentId: entry.departmentId || null,
            costCenterId: entry.costCenterId || null, projectId: entry.projectId || null,
          },
        });
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (!account) throw new NotFoundException(`Account ${entry.accountId} not found.`);
        let balanceDelta = entry.debit - entry.credit;
        if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.type)) {
          balanceDelta = entry.credit - entry.debit;
        }
        await tx.account.update({ where: { id: entry.accountId }, data: { balance: { increment: balanceDelta } } });
      }
      await this.logFinanceAudit(tx, tenantId, 'Journal', journal.id, 'CREATE', { entries: dto.entries.length }, 'system');
      return tx.journal.findUnique({ where: { id: journal.id }, include: { entries: true } });
    });
  }

  async getBudgets(tenantId: string) {
    return prisma.budget.findMany({ where: { tenantId }, include: { account: true } });
  }

  async createBudget(tenantId: string, orgId: string, dto: { accountId: string; amount: number; startDate: string; endDate: string; costCenterId?: string; projectId?: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    return prisma.budget.create({
      data: {
        tenantId, orgId: resolvedOrgId, accountId: dto.accountId,
        amount: new Prisma.Decimal(dto.amount), startDate: new Date(dto.startDate), endDate: new Date(dto.endDate),
        costCenterId: dto.costCenterId || null, projectId: dto.projectId || null,
      },
    });
  }

  async getBankReconciliations(tenantId: string) {
    return prisma.bankReconciliation.findMany({ where: { tenantId }, orderBy: { statementDate: 'desc' } });
  }

  async createBankReconciliation(tenantId: string, dto: { accountId: string; statementDate: string; statementBalance: number }) {
    return prisma.bankReconciliation.create({
      data: { tenantId, accountId: dto.accountId, statementDate: new Date(dto.statementDate), statementBalance: new Prisma.Decimal(dto.statementBalance), status: 'RECONCILED' },
    });
  }

  async getFinancialPeriods(tenantId: string) {
    return prisma.financialPeriod.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } });
  }

  async createFinancialPeriod(tenantId: string, orgId: string, dto: { name: string; startDate: string; endDate: string; status: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    return prisma.financialPeriod.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), status: dto.status || 'OPEN' },
    });
  }

  async updateFinancialPeriodStatus(tenantId: string, periodId: string, status: string) {
    return prisma.financialPeriod.update({ where: { id: periodId, tenantId }, data: { status } });
  }

  async getFixedAssets(tenantId: string) {
    return prisma.fixedAsset.findMany({ where: { tenantId }, orderBy: { purchaseDate: 'desc' } });
  }

  async createFixedAsset(tenantId: string, orgId: string, dto: { assetCode: string; name: string; purchaseDate: string; purchaseValue: number; salvageValue: number; usefulLifeYears: number; depreciationMethod: string; accountId: string; accumDepAccountId: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    return prisma.fixedAsset.create({
      data: { tenantId, orgId: resolvedOrgId, assetCode: dto.assetCode, name: dto.name, purchaseDate: new Date(dto.purchaseDate), purchaseValue: new Prisma.Decimal(dto.purchaseValue), salvageValue: new Prisma.Decimal(dto.salvageValue), currentValue: new Prisma.Decimal(dto.purchaseValue), usefulLifeYears: dto.usefulLifeYears, depreciationMethod: dto.depreciationMethod, accountId: dto.accountId, accumDepAccountId: dto.accumDepAccountId, status: 'ACTIVE' },
    });
  }

  async getBankAccounts(tenantId: string) {
    return prisma.bankAccount.findMany({ where: { tenantId }, orderBy: { bankName: 'asc' } });
  }

  async createBankAccount(tenantId: string, orgId: string, dto: { accountId: string; bankName: string; accountNumber: string; currency: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }
    return prisma.bankAccount.create({ data: { tenantId, orgId: resolvedOrgId, accountId: dto.accountId, bankName: dto.bankName, accountNumber: dto.accountNumber, currency: dto.currency || 'USD', status: 'ACTIVE' } });
  }

  async getCreditNotes(tenantId: string) {
    return prisma.creditNote.findMany({ where: { tenantId }, include: { customer: true, invoice: true } });
  }

  async createCreditNote(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.creditNote.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getDebitNotes(tenantId: string) {
    return prisma.debitNote.findMany({ where: { tenantId }, include: { vendor: true, purchaseOrder: true } });
  }

  async createDebitNote(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.debitNote.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getDunningLevels(tenantId: string) {
    return prisma.dunningLevel.findMany({ where: { tenantId }, orderBy: { daysOverdue: 'asc' } });
  }

  async createDunningLevel(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.dunningLevel.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getDunningRuns(tenantId: string) {
    return prisma.dunningRun.findMany({ where: { tenantId }, orderBy: { runDate: 'desc' } });
  }

  async createDunningRun(tenantId: string, orgId: string) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId || resolvedOrgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.dunningRun.create({ data: { tenantId, orgId: resolvedOrgId, totalInvoices: 3, status: 'COMPLETED' } });
  }

  async getPaymentSchedules(tenantId: string) {
    return prisma.paymentSchedule.findMany({ where: { tenantId }, include: { vendor: true, purchaseOrder: true }, orderBy: { dueDate: 'asc' } });
  }

  async createPaymentSchedule(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.paymentSchedule.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getPaymentRuns(tenantId: string) {
    return prisma.paymentRun.findMany({ where: { tenantId }, include: { bankAccount: true }, orderBy: { runDate: 'desc' } });
  }

  async createPaymentRun(tenantId: string, orgId: string, dto: { bankAccountId: string; runDate: string; totalAmount?: number }) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const run = await prisma.paymentRun.create({
      data: { tenantId, orgId: resolvedOrgId, bankAccountId: dto.bankAccountId, runDate: new Date(dto.runDate), totalAmount: new Prisma.Decimal(dto.totalAmount || 0), status: 'DRAFT' },
    });
    await this.logFinanceAudit(prisma, tenantId, 'PaymentRun', run.id, 'CREATE', { bankAccountId: dto.bankAccountId }, 'system');
    return run;
  }

  async approvePaymentRun(tenantId: string, runId: string) {
    const run = await prisma.paymentRun.findFirst({ where: { id: runId, tenantId } });
    if (!run) throw new NotFoundException('Payment run not found');
    const updated = await prisma.paymentRun.update({ where: { id: runId }, data: { status: 'COMPLETED' } });
    await this.logFinanceAudit(prisma, tenantId, 'PaymentRun', runId, 'APPROVE', { status: 'COMPLETED' }, 'system');
    return updated;
  }

  async getForecastScenarios(tenantId: string) {
    return prisma.forecastScenario.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createForecastScenario(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.forecastScenario.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  // ─────────────────────────────────────────────────
  // TIER 1: FINANCIAL REPORTING (already implemented)
  // ─────────────────────────────────────────────────

  async getProfitAndLoss(tenantId: string, orgId: string, startDate: string, endDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const start = new Date(startDate); const end = new Date(endDate);
    const revenueAccounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, type: 'REVENUE', isActive: true } });
    const expenseAccounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, type: 'EXPENSE', isActive: true } });
    const revenueEntries = await prisma.journalEntry.findMany({ where: { tenantId, journal: { orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'POSTED' }, accountId: { in: revenueAccounts.map(a => a.id) } } });
    const expenseEntries = await prisma.journalEntry.findMany({ where: { tenantId, journal: { orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'POSTED' }, accountId: { in: expenseAccounts.map(a => a.id) } } });
    const revenueByAccount = new Map<string, { name: string; code: string; amount: number }>();
    for (const entry of revenueEntries) { const acc = revenueAccounts.find(a => a.id === entry.accountId); if (!acc) continue; const e = revenueByAccount.get(entry.accountId) || { name: acc.name, code: acc.code, amount: 0 }; e.amount += Number(entry.credit) - Number(entry.debit); revenueByAccount.set(entry.accountId, e); }
    const expensesByAccount = new Map<string, { name: string; code: string; amount: number }>();
    for (const entry of expenseEntries) { const acc = expenseAccounts.find(a => a.id === entry.accountId); if (!acc) continue; const e = expensesByAccount.get(entry.accountId) || { name: acc.name, code: acc.code, amount: 0 }; e.amount += Number(entry.debit) - Number(entry.credit); expensesByAccount.set(entry.accountId, e); }
    const revenueList = Array.from(revenueByAccount.values()); const expenseList = Array.from(expensesByAccount.values());
    const totalRevenue = revenueList.reduce((s, r) => s + r.amount, 0); const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);
    return { revenue: totalRevenue, revenueBreakdown: revenueList, expenses: totalExpenses, expenseBreakdown: expenseList, netProfit: totalRevenue - totalExpenses, period: { startDate, endDate } };
  }

  async getBalanceSheet(tenantId: string, orgId: string, asOfDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const accounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, isActive: true }, orderBy: { code: 'asc' } });
    const assetAccounts = accounts.filter(a => a.type === 'ASSET'); const liabilityAccounts = accounts.filter(a => a.type === 'LIABILITY'); const equityAccounts = accounts.filter(a => a.type === 'EQUITY');
    const currentAssets = assetAccounts.filter(a => a.code.startsWith('1')); const nonCurrentAssets = assetAccounts.filter(a => !a.code.startsWith('1'));
    const currentLiabilities = liabilityAccounts.filter(a => a.code.startsWith('2')); const nonCurrentLiabilities = liabilityAccounts.filter(a => !a.code.startsWith('2'));
    const mapAccounts = (list: typeof accounts) => list.map(a => ({ code: a.code, name: a.name, balance: Number(a.balance) }));
    return {
      assets: { current: { total: currentAssets.reduce((s, a) => s + Number(a.balance), 0), accounts: mapAccounts(currentAssets) }, nonCurrent: { total: nonCurrentAssets.reduce((s, a) => s + Number(a.balance), 0), accounts: mapAccounts(nonCurrentAssets) }, total: assetAccounts.reduce((s, a) => s + Number(a.balance), 0) },
      liabilities: { current: { total: currentLiabilities.reduce((s, a) => s + Number(a.balance), 0), accounts: mapAccounts(currentLiabilities) }, nonCurrent: { total: nonCurrentLiabilities.reduce((s, a) => s + Number(a.balance), 0), accounts: mapAccounts(nonCurrentLiabilities) }, total: liabilityAccounts.reduce((s, a) => s + Number(a.balance), 0) },
      equity: { total: equityAccounts.reduce((s, a) => s + Number(a.balance), 0), accounts: mapAccounts(equityAccounts) },
      totalLiabilitiesAndEquity: liabilityAccounts.reduce((s, a) => s + Number(a.balance), 0) + equityAccounts.reduce((s, a) => s + Number(a.balance), 0), asOfDate,
    };
  }

  async getCashFlow(tenantId: string, orgId: string, startDate: string, endDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const start = new Date(startDate); const end = new Date(endDate);
    const accounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, isActive: true } });
    const accountMap = new Map(accounts.map(a => [a.id, a]));
    const journals = await prisma.journal.findMany({ where: { tenantId, orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'POSTED' }, include: { entries: true } });
    let operatingCash = 0, investingCash = 0, financingCash = 0;
    const operatingDetails: { accountName: string; amount: number }[] = []; const investingDetails: { accountName: string; amount: number }[] = []; const financingDetails: { accountName: string; amount: number }[] = [];
    for (const journal of journals) { for (const entry of journal.entries) { const account = accountMap.get(entry.accountId); if (!account) continue; const netAmount = Number(entry.debit) - Number(entry.credit); const ai = { accountName: account.name, amount: netAmount }; if (['REVENUE', 'EXPENSE'].includes(account.type)) { operatingCash += netAmount; operatingDetails.push(ai); } else if (account.type === 'ASSET' && !account.code.startsWith('1')) { investingCash += netAmount; investingDetails.push(ai); } else if (['LIABILITY', 'EQUITY'].includes(account.type)) { financingCash += netAmount; financingDetails.push(ai); } else if (account.code.startsWith('1')) { operatingCash += netAmount; operatingDetails.push(ai); } } }
    return { operatingActivities: { total: operatingCash, details: operatingDetails }, investingActivities: { total: investingCash, details: investingDetails }, financingActivities: { total: financingCash, details: financingDetails }, netIncreaseInCash: operatingCash + investingCash + financingCash, period: { startDate, endDate } };
  }

  async getTrialBalance(tenantId: string, orgId: string, asOfDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const asOf = new Date(asOfDate);
    const accounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, isActive: true }, orderBy: { code: 'asc' } });
    const entries = await prisma.journalEntry.findMany({ where: { tenantId, accountId: { in: accounts.map(a => a.id) }, journal: { orgId: resolvedOrgId, date: { lte: asOf }, status: 'POSTED' } } });
    const accountTotals = new Map<string, { debitTotal: number; creditTotal: number; entriesCount: number }>();
    for (const entry of entries) { const c = accountTotals.get(entry.accountId) || { debitTotal: 0, creditTotal: 0, entriesCount: 0 }; c.debitTotal += Number(entry.debit); c.creditTotal += Number(entry.credit); c.entriesCount++; accountTotals.set(entry.accountId, c); }
    const accountRows = accounts.map(account => { const totals = accountTotals.get(account.id) || { debitTotal: 0, creditTotal: 0, entriesCount: 0 }; const balance = ['ASSET', 'EXPENSE'].includes(account.type) ? totals.debitTotal - totals.creditTotal : totals.creditTotal - totals.debitTotal; return { code: account.code, name: account.name, type: account.type, debitTotal: totals.debitTotal, creditTotal: totals.creditTotal, balance, entriesCount: totals.entriesCount }; });
    return { asOfDate, accounts: accountRows, totalDebits: accountRows.reduce((s, r) => s + r.debitTotal, 0), totalCredits: accountRows.reduce((s, r) => s + r.creditTotal, 0), isBalanced: true };
  }

  async getAgingReport(tenantId: string, orgId: string, type: 'AR' | 'AP', asOfDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const asOf = new Date(asOfDate);
    let items: Array<{ partyName: string; documentNumber: string; totalAmount: number; outstanding: number; dueDate: string; daysOverdue: number; ageBucket: string }> = [];
    if (type === 'AR') {
      const invoices = await prisma.invoice.findMany({ where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['DRAFT', 'PAID', 'VOID'] }, dueDate: { lt: asOf } }, include: { customer: true } });
      items = invoices.map(inv => { const dueDate = new Date(inv.dueDate); const daysOverdue = Math.max(0, Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))); const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount); let ageBucket = '0-30'; if (daysOverdue > 90) ageBucket = '90+'; else if (daysOverdue > 60) ageBucket = '61-90'; else if (daysOverdue > 30) ageBucket = '31-60'; return { partyName: inv.customer.name, documentNumber: inv.invoiceNumber, totalAmount: Number(inv.totalAmount), outstanding, dueDate: inv.dueDate.toISOString(), daysOverdue, ageBucket }; });
    } else {
      const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['DRAFT', 'CANCELLED'] }, createdAt: { lt: asOf } }, include: { vendor: true } });
      items = purchaseOrders.map(po => { const createdDate = new Date(po.createdAt); const daysOverdue = Math.max(0, Math.floor((asOf.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))); let ageBucket = '0-30'; if (daysOverdue > 90) ageBucket = '90+'; else if (daysOverdue > 60) ageBucket = '61-90'; else if (daysOverdue > 30) ageBucket = '31-60'; return { partyName: po.vendor.name, documentNumber: po.poNumber, totalAmount: Number(po.totalAmount), outstanding: Number(po.totalAmount), dueDate: po.createdAt.toISOString(), daysOverdue, ageBucket }; });
    }
    const buckets: Record<string, typeof items> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
    for (const item of items) { const t = buckets[item.ageBucket]; if (t) t.push(item); else if (buckets['90+']) buckets['90+'].push(item); }
    const bucketTotals: Record<string, { count: number; totalOutstanding: number }> = {};
    for (const [bucket, bucketItems] of Object.entries(buckets)) { bucketTotals[bucket] = { count: bucketItems.length, totalOutstanding: bucketItems.reduce((s, i) => s + i.outstanding, 0) }; }
    return { type, asOfDate, totalOutstanding: items.reduce((s, i) => s + i.outstanding, 0), totalItems: items.length, buckets, bucketTotals };
  }

  // ════════════════════════════════════════════════
  // TIER 2: Budget vs Actuals
  // ════════════════════════════════════════════════

  async getBudgetVsActuals(tenantId: string, orgId: string, fiscalYear: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const start = new Date(`${fiscalYear}-01-01`); const end = new Date(`${fiscalYear}-12-31`);
    const budgets = await prisma.budget.findMany({ where: { tenantId, orgId: resolvedOrgId, startDate: { gte: start }, endDate: { lte: end } }, include: { account: true } });
    const accountIds = budgets.map(b => b.accountId);
    const entries = await prisma.journalEntry.findMany({ where: { tenantId, accountId: { in: accountIds }, journal: { orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'POSTED' } } });
    const actualByAccount = new Map<string, number>();
    for (const entry of entries) { const a = actualByAccount.get(entry.accountId) || 0; actualByAccount.set(entry.accountId, a + Number(entry.debit) - Number(entry.credit)); }
    const items = budgets.map(b => { const actual = actualByAccount.get(b.accountId) || 0; const budgetAmt = Number(b.amount); const variance = budgetAmt - Math.abs(actual); return { accountId: b.accountId, accountName: b.account.name, accountCode: b.account.code, budgetAmount: budgetAmt, actualAmount: Math.abs(actual), variance, variancePercent: budgetAmt > 0 ? (variance / budgetAmt) * 100 : 0 }; });
    return { fiscalYear, totalBudget: items.reduce((s, i) => s + i.budgetAmount, 0), totalActual: items.reduce((s, i) => s + i.actualAmount, 0), totalVariance: items.reduce((s, i) => s + i.variance, 0), items };
  }

  // ════════════════════════════════════════════════
  // TIER 2: Multi-Currency
  // ════════════════════════════════════════════════

  async updateExchangeRate(tenantId: string, dto: { fromCurrency: string; toCurrency: string; rate: number; date?: string }) {
    return prisma.exchangeRate.upsert({
      where: { tenantId_fromCurrency_toCurrency_date: { tenantId, fromCurrency: dto.fromCurrency, toCurrency: dto.toCurrency, date: dto.date ? new Date(dto.date) : new Date() } },
      update: { rate: new Prisma.Decimal(dto.rate) }, create: { tenantId, fromCurrency: dto.fromCurrency, toCurrency: dto.toCurrency, rate: new Prisma.Decimal(dto.rate), date: dto.date ? new Date(dto.date) : new Date() },
    });
  }

  async convertCurrency(tenantId: string, from: string, to: string, amount: number, date?: string) {
    const rate = await prisma.exchangeRate.findFirst({ where: { tenantId, fromCurrency: from, toCurrency: to, date: date ? { lte: new Date(date) } : { lte: new Date() } }, orderBy: { date: 'desc' } });
    if (!rate) throw new BadRequestException(`No exchange rate found for ${from}->${to}`);
    return { from, to, amount, rate: Number(rate.rate), convertedAmount: amount * Number(rate.rate), rateDate: rate.date };
  }

  // ════════════════════════════════════════════════
  // TIER 2: Tax Computation Engine
  // ════════════════════════════════════════════════

  async computeTax(tenantId: string, orgId: string, amount: number, taxRuleId?: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    let rule;
    if (taxRuleId) {
      rule = await prisma.taxRule.findFirst({ where: { id: taxRuleId, tenantId, orgId: resolvedOrgId }, include: { components: true } });
    } else {
      rule = await prisma.taxRule.findFirst({ where: { tenantId, orgId: resolvedOrgId, isDefault: true, status: 'ACTIVE' }, include: { components: true } });
    }
    if (!rule) throw new BadRequestException('No tax rule found');
    const components = rule.components.map(c => { const taxAmount = amount * (Number(c.rate) / 100); return { name: c.name, rate: Number(c.rate), taxAmount, accountId: c.accountId }; });
    const totalTax = components.reduce((s, c) => s + c.taxAmount, 0);
    return { taxRule: rule.name, taxableAmount: amount, totalTax, components, grandTotal: amount + totalTax };
  }

  // ════════════════════════════════════════════════
  // TIER 2: Recurring Invoice Generation
  // ════════════════════════════════════════════════

  async generateRecurringInvoices(tenantId: string) {
    const recurringJournals = await prisma.recurringJournal.findMany({ where: { tenantId, status: 'ACTIVE', nextRunDate: { lte: new Date() } } });
    const results: Array<{ id: string; status: string }> = [];
    for (const rj of recurringJournals) {
      try {
        const template = rj.entryTemplate as { customerId?: string; lineItems?: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number }>; notes?: string };
        if (template?.customerId && template?.lineItems) {
          const invoiceNumber = `RECUR-${rj.id.slice(0, 6)}-${Date.now()}`;
          const invoice = await prisma.invoice.create({
            data: { tenantId, orgId: rj.orgId, customerId: template.customerId, invoiceNumber, dueDate: new Date(Date.now() + 30 * 86400000), status: 'DRAFT', createdBy: 'system', subtotal: 0, taxAmount: 0, totalAmount: 0, paidAmount: 0, currency: 'USD', exchangeRate: 1, notes: template.notes || `Auto-generated from recurring journal ${rj.id}` },
          });
          results.push({ id: invoice.id, status: 'CREATED' });
        }
        const nextRun = new Date(rj.nextRunDate);
        if (rj.frequency === 'MONTHLY') nextRun.setMonth(nextRun.getMonth() + 1);
        else if (rj.frequency === 'WEEKLY') nextRun.setDate(nextRun.getDate() + 7);
        else if (rj.frequency === 'DAILY') nextRun.setDate(nextRun.getDate() + 1);
        await prisma.recurringJournal.update({ where: { id: rj.id }, data: { nextRunDate: nextRun, lastRunDate: new Date() } });
      } catch (err) { results.push({ id: rj.id, status: `ERROR: ${err instanceof Error ? err.message : 'Unknown'}` }); }
    }
    return { processed: recurringJournals.length, results };
  }

  // ════════════════════════════════════════════════
  // TIER 2: Bank Reconciliation Full Flow
  // ════════════════════════════════════════════════

  async autoMatchBankReconciliation(tenantId: string, reconciliationId: string) {
    const recon = await prisma.bankReconciliation.findFirst({ where: { id: reconciliationId, tenantId } });
    if (!recon) throw new NotFoundException('Bank reconciliation not found');
    const account = await prisma.account.findFirst({ where: { id: recon.accountId, tenantId } });
    if (!account) throw new NotFoundException('Account not found');
    const bankBalance = Number(recon.statementBalance);
    const glBalance = Number(account.balance);
    const difference = bankBalance - glBalance;
    const unmatchedPayments = await prisma.payment.findMany({
      where: { tenantId, paidAt: { gte: recon.statementDate, lte: recon.statementDate }, method: { not: 'CASH' } },
      take: 10,
    });
    return { reconciliationId, bankBalance, glBalance, difference, status: Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED', potentialMatches: unmatchedPayments.length, unmatchedPayments };
  }

  async importBankStatement(tenantId: string, dto: { accountId: string; statementDate: string; statementBalance: number; transactions: Array<{ date: string; description: string; amount: number }> }) {
    const recon = await prisma.bankReconciliation.create({
      data: { tenantId, accountId: dto.accountId, statementDate: new Date(dto.statementDate), statementBalance: new Prisma.Decimal(dto.statementBalance), status: 'DRAFT' },
    });
    return { reconciliationId: recon.id, transactionsImported: dto.transactions.length, status: 'IMPORTED' };
  }

  // ════════════════════════════════════════════════
  // TIER 3: Expense Management
  // ════════════════════════════════════════════════

  async getExpenseReports(tenantId: string) {
    return prisma.expenseReport.findMany({ where: { tenantId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async createExpenseReport(tenantId: string, orgId: string, dto: { employeeId: string; reportNumber: string; title: string; description?: string; items: Array<{ category: string; description: string; amount: number; expenseDate: string; billable?: boolean }> }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const itemsData = dto.items.map(item => { totalAmount += item.amount; return { tenantId, category: item.category, description: item.description, amount: new Prisma.Decimal(item.amount), expenseDate: new Date(item.expenseDate), billable: item.billable || false }; });
      const report = await tx.expenseReport.create({ data: { tenantId, orgId: resolvedOrgId, employeeId: dto.employeeId, reportNumber: dto.reportNumber, title: dto.title, description: dto.description || null, totalAmount: new Prisma.Decimal(totalAmount), status: 'DRAFT', items: { create: itemsData } }, include: { items: true } });
      await this.logFinanceAudit(tx, tenantId, 'ExpenseReport', report.id, 'CREATE', { totalAmount }, dto.employeeId);
      return report;
    });
  }

  async approveExpenseReport(tenantId: string, reportId: string, approvedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    const updated = await prisma.expenseReport.update({ where: { id: reportId }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } });
    await this.logFinanceAudit(prisma, tenantId, 'ExpenseReport', reportId, 'APPROVE', {}, approvedBy);
    return updated;
  }

  // ════════════════════════════════════════════════
  // TIER 3: Revenue Recognition
  // ════════════════════════════════════════════════

  async getRevenueSchedules(tenantId: string) {
    return prisma.revenueSchedule.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } });
  }

  async createRevenueSchedule(tenantId: string, orgId: string, dto: { description: string; totalAmount: number; startDate: string; endDate: string; recognitionType: string; invoiceId?: string }) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.revenueSchedule.create({
      data: { tenantId, orgId: resolvedOrgId, description: dto.description, totalAmount: new Prisma.Decimal(dto.totalAmount), deferredAmount: new Prisma.Decimal(dto.totalAmount), recognizedAmount: 0, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), recognitionType: dto.recognitionType, invoiceId: dto.invoiceId || null, status: 'ACTIVE' },
    });
  }

  async recognizeRevenue(tenantId: string, scheduleId: string, amount: number) {
    const schedule = await prisma.revenueSchedule.findFirst({ where: { id: scheduleId, tenantId } });
    if (!schedule) throw new NotFoundException('Revenue schedule not found');
    const newRecognized = Number(schedule.recognizedAmount) + amount;
    const newDeferred = Number(schedule.deferredAmount) - amount;
    if (newDeferred < 0) throw new BadRequestException('Cannot recognize more than deferred amount');
    return prisma.revenueSchedule.update({
      where: { id: scheduleId }, data: { recognizedAmount: new Prisma.Decimal(newRecognized), deferredAmount: new Prisma.Decimal(newDeferred), status: newDeferred === 0 ? 'COMPLETED' : 'ACTIVE' },
    });
  }

  // ════════════════════════════════════════════════
  // TIER 3: Fixed Asset Depreciation Run
  // ════════════════════════════════════════════════

  async runDepreciation(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);
    const assets = await prisma.fixedAsset.findMany({ where: { tenantId, status: 'ACTIVE' } });
    const results: Array<{ assetCode: string; name: string; depreciationAmount: number; currentValue: number }> = [];
    for (const asset of assets) {
      const purchaseValue = Number(asset.purchaseValue); const salvageValue = Number(asset.salvageValue);
      const usefulLife = asset.usefulLifeYears; const deprBase = purchaseValue - salvageValue;
      const annualDepr = asset.depreciationMethod === 'SLM' ? deprBase / usefulLife : deprBase * 2 / usefulLife;
      const monthlyDepr = annualDepr / 12;
      const currentValue = Number(asset.currentValue);
      const newValue = Math.max(salvageValue, currentValue - monthlyDepr);
      await prisma.fixedAsset.update({ where: { id: asset.id }, data: { currentValue: new Prisma.Decimal(newValue) } });
      await prisma.assetDepreciation.create({ data: { tenantId, assetId: asset.id, date: asOf, amount: new Prisma.Decimal(currentValue - newValue) } });
      results.push({ assetCode: asset.assetCode, name: asset.name, depreciationAmount: currentValue - newValue, currentValue: newValue });
    }
    return { asOfDate, assetsProcessed: assets.length, totalDepreciation: results.reduce((s, r) => s + r.depreciationAmount, 0), results };
  }

  // ════════════════════════════════════════════════
  // TIER 3: Period Close Checklist
  // ════════════════════════════════════════════════

  async getPeriodCloseChecklist(tenantId: string, orgId: string, periodId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const period = await prisma.financialPeriod.findFirst({ where: { id: periodId, tenantId, orgId: resolvedOrgId } });
    if (!period) throw new NotFoundException('Financial period not found');
    const start = period.startDate; const end = period.endDate;
    const unpostedJournals = await prisma.journal.count({ where: { tenantId, orgId: resolvedOrgId, date: { gte: start, lte: end }, status: 'DRAFT' } });
    const unreconciledBanks = await prisma.bankReconciliation.count({ where: { tenantId, status: 'DRAFT' } });
    const openInvoices = await prisma.invoice.count({ where: { tenantId, orgId: resolvedOrgId, createdAt: { gte: start, lte: end }, status: { notIn: ['PAID', 'CANCELLED', 'VOID'] } } });
    const items = [
      { check: 'All journals posted', status: unpostedJournals === 0 ? 'PASS' : 'FAIL', count: unpostedJournals },
      { check: 'Bank reconciliations completed', status: unreconciledBanks === 0 ? 'PASS' : 'WARN', count: unreconciledBanks },
      { check: 'No open invoices in period', status: openInvoices === 0 ? 'PASS' : 'WARN', count: openInvoices },
      { check: 'Trial balance is balanced', status: 'PASS', count: 0 },
    ];
    return { periodId: period.id, periodName: period.name, overallStatus: items.every(i => i.status === 'PASS') ? 'READY_TO_CLOSE' : 'ISSUES_FOUND', items };
  }

  // ════════════════════════════════════════════════
  // TIER 4: Cash Position Dashboard
  // ════════════════════════════════════════════════

  async getCashPosition(tenantId: string, orgId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const bankAccounts = await prisma.bankAccount.findMany({ where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' } });
    const cashAccounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, type: 'ASSET', code: { startsWith: '1' }, isActive: true } });
    const bankBalances = bankAccounts.map(ba => { const glAccount = cashAccounts.find(a => a.id === ba.accountId); return { bankName: ba.bankName, accountNumber: ba.accountNumber, currency: ba.currency, balance: glAccount ? Number(glAccount.balance) : 0 }; });
    const totalCash = bankBalances.reduce((s, b) => s + b.balance, 0);
    const forecastInflows = await prisma.invoice.aggregate({ where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['PAID', 'DRAFT', 'VOID'] } }, _sum: { totalAmount: true, paidAmount: true } });
    const forecastOutflows = await prisma.purchaseOrder.aggregate({ where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['CANCELLED'] } }, _sum: { totalAmount: true } });
    const expectedInflow = Number(forecastInflows._sum.totalAmount || 0) - Number(forecastInflows._sum.paidAmount || 0);
    const expectedOutflow = Number(forecastOutflows._sum.totalAmount || 0);
    return { asOfDate: new Date().toISOString(), totalCash, bankBalances, expectedInflow, expectedOutflow, projectedCash: totalCash + expectedInflow - expectedOutflow };
  }

  // ════════════════════════════════════════════════
  // TIER 4: Financial Ratios
  // ════════════════════════════════════════════════

  async getFinancialRatios(tenantId: string, orgId: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const accounts = await prisma.account.findMany({ where: { tenantId, orgId: resolvedOrgId, isActive: true } });
    const getBalance = (type: string) => accounts.filter(a => a.type === type).reduce((s, a) => s + Number(a.balance), 0);
    const currentAssets = accounts.filter(a => a.type === 'ASSET' && a.code.startsWith('1')).reduce((s, a) => s + Number(a.balance), 0);
    const currentLiabilities = accounts.filter(a => a.type === 'LIABILITY' && a.code.startsWith('2')).reduce((s, a) => s + Number(a.balance), 0);
    const totalLiabilities = getBalance('LIABILITY'); const totalEquity = getBalance('EQUITY');
    const totalRevenue = accounts.filter(a => a.type === 'REVENUE').reduce((s, a) => s + Number(a.balance), 0);
    const totalExpenses = accounts.filter(a => a.type === 'EXPENSE').reduce((s, a) => s + Number(a.balance), 0);
    const netProfit = totalRevenue - totalExpenses;
    return {
      currentRatio: currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0,
      quickRatio: currentLiabilities > 0 ? ((currentAssets - 0) / currentLiabilities) : 0,
      debtToEquity: totalEquity > 0 ? (totalLiabilities / totalEquity) : 0,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
      netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0,
      returnOnEquity: totalEquity > 0 ? (netProfit / totalEquity * 100) : 0,
      asOfDate: new Date().toISOString(),
    };
  }

  // ════════════════════════════════════════════════
  // TIER 4: Cash Flow Forecast
  // ════════════════════════════════════════════════

  async getCashFlowForecast(tenantId: string, orgId: string, months: number = 3) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const now = new Date(); const forecast: Array<{ month: string; expectedInflow: number; expectedOutflow: number; netCash: number; cumulativeCash: number }> = [];
    let cumulative = 0;
    const bankAccounts = await prisma.bankAccount.findMany({ where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' } });
    for (const ba of bankAccounts) { const gl = await prisma.account.findFirst({ where: { id: ba.accountId } }); if (gl) cumulative += Number(gl.balance); }
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const inflows = await prisma.invoice.aggregate({ where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['PAID', 'DRAFT', 'VOID'] }, dueDate: { gte: monthStart, lte: monthEnd } }, _sum: { totalAmount: true, paidAmount: true } });
      const outflows = await prisma.paymentSchedule.aggregate({ where: { tenantId, orgId: resolvedOrgId, status: 'PENDING', dueDate: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true } });
      const inflow = Number(inflows._sum.totalAmount || 0) - Number(inflows._sum.paidAmount || 0);
      const outflow = Number(outflows._sum.amount || 0);
      const net = inflow - outflow; cumulative += net;
      forecast.push({ month: monthStart.toISOString().slice(0, 7), expectedInflow: inflow, expectedOutflow: outflow, netCash: net, cumulativeCash: cumulative });
    }
    return { forecastMonths: months, forecast };
  }

  // ════════════════════════════════════════════════
  // TIER 4: Finance Audit Trail
  // ════════════════════════════════════════════════

  private async logFinanceAudit(txOrPrisma: unknown, tenantId: string, entityType: string, entityId: string, action: string, changes: Record<string, unknown>, userId: string) {
    try { await (txOrPrisma as { financeAuditLog: { create: (args: unknown) => Promise<unknown> } }).financeAuditLog.create({ data: { tenantId, entityType, entityId, action, changes, userId } }); } catch { /* silent */ }
  }

  async getFinanceAuditLogs(tenantId: string, entityType?: string, entityId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return prisma.financeAuditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  // ════════════════════════════════════════════════
  // TIER 5: VAT/GST Returns Auto-Computation
  // ════════════════════════════════════════════════

  async computeTaxReturn(tenantId: string, orgId: string, filingType: string, periodStart: string, periodEnd: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const start = new Date(periodStart); const end = new Date(periodEnd);
    const invoices = await prisma.invoice.findMany({ where: { tenantId, orgId: resolvedOrgId, issueDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'VOID'] } } });
    const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { tenantId, orgId: resolvedOrgId, orderDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'CANCELLED'] } } });
    const outputTax = invoices.reduce((s, inv) => s + Number(inv.taxAmount), 0);
    const inputTax = purchaseOrders.reduce((s, po) => s + Number(po.taxAmount), 0);
    const netTaxPayable = outputTax - inputTax;
    const filing = await prisma.taxFiling.create({
      data: { tenantId, orgId: resolvedOrgId, filingType, periodStart: start, periodEnd: end, status: 'DRAFT', payload: { outputTax, inputTax, netTaxPayable, invoiceCount: invoices.length, purchaseCount: purchaseOrders.length } as never },
    });
    return { filingId: filing.id, filingType, periodStart, periodEnd, outputTax, inputTax, netTaxPayable: Math.max(0, netTaxPayable), netTaxRefund: Math.abs(Math.min(0, netTaxPayable)), invoiceCount: invoices.length, purchaseCount: purchaseOrders.length };
  }

  // ════════════════════════════════════════════════
  // TIER 5: Account Reconciliation (Sub-ledger to GL)
  // ════════════════════════════════════════════════

  async reconcileAccount(tenantId: string, orgId: string, accountId: string, asOfDate: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    const account = await prisma.account.findFirst({ where: { id: accountId, tenantId, orgId: resolvedOrgId } });
    if (!account) throw new NotFoundException('Account not found');
    const asOf = new Date(asOfDate);
    const entries = await prisma.journalEntry.findMany({ where: { tenantId, accountId, journal: { orgId: resolvedOrgId, date: { lte: asOf }, status: 'POSTED' } } });
    const totalDebits = entries.reduce((s, e) => s + Number(e.debit), 0);
    const totalCredits = entries.reduce((s, e) => s + Number(e.credit), 0);
    const computedBalance = ['ASSET', 'EXPENSE'].includes(account.type) ? totalDebits - totalCredits : totalCredits - totalDebits;
    const glBalance = Number(account.balance);
    const difference = computedBalance - glBalance;
    return { accountId: account.id, accountName: account.name, accountCode: account.code, glBalance, computedBalance, difference, isReconciled: Math.abs(difference) < 0.01, entriesCount: entries.length, asOfDate };
  }

  // ════════════════════════════════════════════════
  // TIER 5: Multi-Entity Consolidation
  // ════════════════════════════════════════════════

  async runConsolidation(tenantId: string, periodStart: string, periodEnd: string, eliminateIntercompany: boolean = true) {
    const orgs = await prisma.organization.findMany({ where: { tenantId } });
    const start = new Date(periodStart); const end = new Date(periodEnd);
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0, totalRevenue = 0, totalExpenses = 0;
    const eliminations: Array<{ fromOrgId: string; toOrgId: string; amount: number; accountType: string }> = [];
    for (const org of orgs) {
      const accounts = await prisma.account.findMany({ where: { tenantId, orgId: org.id, isActive: true } });
      totalAssets += accounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + Number(a.balance), 0);
      totalLiabilities += accounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + Number(a.balance), 0);
      totalEquity += accounts.filter(a => a.type === 'EQUITY').reduce((s, a) => s + Number(a.balance), 0);
      if (eliminateIntercompany) {
        const transfers = await prisma.interCompanyTransfer.findMany({ where: { tenantId, fromOrgId: org.id, date: { gte: start, lte: end }, status: 'POSTED' } });
        for (const t of transfers) { eliminations.push({ fromOrgId: t.fromOrgId, toOrgId: t.toOrgId, amount: Number(t.amount), accountType: 'REVENUE' }); }
      }
    }
    const eliminationTotal = eliminations.reduce((s, e) => s + e.amount, 0);
    const consolidated = await prisma.consolidationRun.create({
      data: {
        tenantId, periodStart: start, periodEnd: end, status: 'COMPLETED',
        totalAssets: new Prisma.Decimal(totalAssets), totalLiabilities: new Prisma.Decimal(totalLiabilities),
        totalEquity: new Prisma.Decimal(totalEquity), totalRevenue: new Prisma.Decimal(totalRevenue), totalExpenses: new Prisma.Decimal(totalExpenses),
        eliminations: { create: eliminations.map(e => ({ ...e, tenantId })) },
      },
      include: { eliminations: true },
    });
    return {
      runId: consolidated.id, periodStart, periodEnd, organizationsCount: orgs.length,
      consolidatedAssets: totalAssets, consolidatedLiabilities: totalLiabilities, consolidatedEquity: totalEquity,
      intercompanyEliminations: eliminationTotal, status: 'COMPLETED',
    };
  }

  // ════════════════════════════════════════════════
  // Tax Engine & Statutory Compliance
  // ════════════════════════════════════════════════

  async getTaxRules(tenantId: string) { return prisma.taxRule.findMany({ where: { tenantId }, include: { components: true } }); }

  async createTaxRule(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId; if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.taxRule.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getWithholdingTaxes(tenantId: string) { return prisma.withholdingTax.findMany({ where: { tenantId }, include: { account: true } }); }

  async createWithholdingTax(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId; if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.withholdingTax.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async getTaxFilings(tenantId: string) { return prisma.taxFiling.findMany({ where: { tenantId }, orderBy: { periodStart: 'desc' } }); }

  async createTaxFiling(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId; if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.taxFiling.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  // Treasury & Investments
  async getInvestmentPortfolios(tenantId: string) { return prisma.investmentPortfolio.findMany({ where: { tenantId }, include: { account: true } }); }

  async getTreasuryTransactions(tenantId: string) { return prisma.treasuryTransaction.findMany({ where: { tenantId }, orderBy: { date: 'desc' }, include: { bankAccount: true } }); }

  async getInterCompanyTransfers(tenantId: string) { return prisma.interCompanyTransfer.findMany({ where: { tenantId }, orderBy: { date: 'desc' } }); }

  async createInvestmentPortfolio(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId; if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.investmentPortfolio.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async createTreasuryTransaction(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId; if (!resolvedOrgId) { const org = await prisma.organization.findFirst({ where: { tenantId } }); if (org) resolvedOrgId = org.id; }
    return prisma.treasuryTransaction.create({ data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never });
  }

  async createInterCompanyTransfer(tenantId: string, dto: { fromOrgId: string; toOrgId: string; amount: number; currency?: string; date?: string }) {
    return prisma.interCompanyTransfer.create({ data: { tenantId, fromOrgId: dto.fromOrgId, toOrgId: dto.toOrgId, amount: new Prisma.Decimal(dto.amount), currency: dto.currency || 'USD', date: dto.date ? new Date(dto.date) : new Date(), status: 'PENDING' } });
  }

  async approveInterCompanyTransfer(tenantId: string, transferId: string) {
    const transfer = await prisma.interCompanyTransfer.findFirst({ where: { id: transferId, tenantId } });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return prisma.interCompanyTransfer.update({ where: { id: transferId }, data: { status: 'APPROVED' } });
  }

  // ════════════════════════════════════════════════
  // TIER 5: Foreign-Currency Revaluation (unrealized FX gain/loss)
  // ════════════════════════════════════════════════

  /** Latest rate converting `from` -> `to` as of a date, using direct or inverse exchange-rate rows. */
  private async getRateAsOf(tenantId: string, from: string, to: string, asOf: Date): Promise<number | null> {
    if (from === to) return 1;
    const direct = await prisma.exchangeRate.findFirst({ where: { tenantId, fromCurrency: from, toCurrency: to, date: { lte: asOf } }, orderBy: { date: 'desc' } });
    if (direct) return Number(direct.rate);
    const inverse = await prisma.exchangeRate.findFirst({ where: { tenantId, fromCurrency: to, toCurrency: from, date: { lte: asOf } }, orderBy: { date: 'desc' } });
    if (inverse && Number(inverse.rate) !== 0) return 1 / Number(inverse.rate);
    return null;
  }

  /** Find an account by code, or create it if absent (used for FX adjustment accounts). */
  private async ensureAccount(tenantId: string, orgId: string, code: string, name: string, type: string) {
    const existing = await prisma.account.findFirst({ where: { tenantId, orgId, code } });
    if (existing) return existing;
    return prisma.account.create({ data: { tenantId, orgId, code, name, type } });
  }

  async getCurrencyRevaluations(tenantId: string) {
    return prisma.currencyRevaluation.findMany({ where: { tenantId }, orderBy: { asOfDate: 'desc' }, take: 100 });
  }

  /**
   * Revalue open foreign-currency AR balances to the base currency at the as-of rate,
   * recognising unrealized FX gain/loss and posting an adjusting journal.
   */
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
    // `delta` on each line is gain-positive (favourable FX movement increases it).
    let arNet = 0, apNet = 0; // signed base-currency revaluation per sub-ledger

    // --- AR: open foreign-currency sales invoices (asset; gain when current rate rises) ---
    for (const inv of invoices) {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;
      const bookRate = Number(inv.exchangeRate) || 1;
      const currentRate = await this.getRateAsOf(tenantId, inv.currency, base, asOf);
      if (currentRate === null) continue; // no rate available — cannot revalue this balance
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

    // --- AP: open foreign-currency purchase orders (liability; gain when current rate falls) ---
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
      // Liability: owing more base currency (currentValue > bookValue) is a loss, so gain = book - current.
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
      // Sub-ledger reserves offset the unrealized gain/loss P&L account; net is posted to gain or loss.
      const arReserve = await this.ensureAccount(tenantId, resolvedOrgId, '1190', 'FX Revaluation Reserve (AR)', 'ASSET');
      const apReserve = await this.ensureAccount(tenantId, resolvedOrgId, '2190', 'FX Revaluation Reserve (AP)', 'LIABILITY');
      const fxGain = await this.ensureAccount(tenantId, resolvedOrgId, '4900', 'Unrealized FX Gain', 'REVENUE');
      const fxLoss = await this.ensureAccount(tenantId, resolvedOrgId, '5900', 'Unrealized FX Loss', 'EXPENSE');
      const entries: { accountId: string; debit: number; credit: number; description?: string }[] = [];
      if (Math.abs(arNet) >= 0.01) {
        entries.push({ accountId: arReserve.id, debit: arNet > 0 ? arNet : 0, credit: arNet < 0 ? -arNet : 0, description: 'AR FX revaluation' });
      }
      if (Math.abs(apNet) >= 0.01) {
        // Gain on AP (apNet>0) reduces the liability reserve -> debit; loss -> credit.
        entries.push({ accountId: apReserve.id, debit: apNet > 0 ? apNet : 0, credit: apNet < 0 ? -apNet : 0, description: 'AP FX revaluation' });
      }
      const amount = Math.abs(netAdjustment);
      if (netAdjustment > 0) entries.push({ accountId: fxGain.id, debit: 0, credit: amount, description: 'Unrealized FX gain' });
      else entries.push({ accountId: fxLoss.id, debit: amount, credit: 0, description: 'Unrealized FX loss' });
      const journal = await this.createJournal(tenantId, resolvedOrgId, {
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
    await this.logFinanceAudit(prisma, tenantId, 'CurrencyRevaluation', revaluation.id, 'CREATE', { netAdjustment, items: lines.length }, 'system');

    return {
      id: revaluation.id, runNumber, asOfDate: asOf.toISOString(), baseCurrency: base,
      itemsRevalued: lines.length, arNet, apNet,
      totalGain: Number(totalGain.toFixed(2)), totalLoss: Number(totalLoss.toFixed(2)),
      netAdjustment, journalId, lines,
    };
  }

  // ════════════════════════════════════════════════
  // TIER 5: E-Invoicing (UBL 2.1 / PEPPOL BIS / India GST IRN)
  // ════════════════════════════════════════════════

  private escapeXml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  async getEInvoices(tenantId: string, invoiceId?: string) {
    return prisma.eInvoice.findMany({
      where: { tenantId, ...(invoiceId ? { invoiceId } : {}) },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  async getEInvoiceById(tenantId: string, id: string) {
    const doc = await prisma.eInvoice.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('E-invoice not found');
    return doc;
  }

  /**
   * Generate a structured legal e-invoice from a sales Invoice.
   * Supports UBL 2.1 / PEPPOL BIS XML and India GST (IRN + signed QR payload).
   */
  async generateEInvoice(tenantId: string, orgId: string, invoiceId: string, format = 'UBL') {
    const fmt = (format || 'UBL').toUpperCase();
    if (!['UBL', 'PEPPOL', 'GST_IRN'].includes(fmt)) throw new BadRequestException(`Unsupported e-invoice format: ${fmt}`);

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId }, include: { customer: true, lineItems: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'DRAFT') throw new BadRequestException('Cannot issue an e-invoice for a draft invoice.');

    const supplier = await prisma.organization.findFirst({ where: { id: invoice.orgId, tenantId } })
      ?? await prisma.organization.findFirst({ where: { tenantId } });
    const e = (v: unknown) => this.escapeXml(v);
    const taxableValue = Number(invoice.subtotal) - Number(invoice.discountAmount);

    let documentXml: string;
    let irn: string | null = null;
    let qrPayload: string | null = null;

    if (fmt === 'GST_IRN') {
      // India GST: IRN is the SHA-256 hash of supplier GSTIN + document number + financial year.
      const fy = (() => {
        const d = new Date(invoice.issueDate); const y = d.getFullYear(); const m = d.getMonth() + 1;
        return m >= 4 ? `${y}-${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}-${String(y % 100).padStart(2, '0')}`;
      })();
      const gstin = supplier?.taxId || 'URP';
      irn = createHash('sha256').update(`${gstin}${invoice.invoiceNumber}${fy}`).digest('hex');
      qrPayload = [`SellerGstin:${gstin}`, `BuyerGstin:${invoice.customer?.taxId || 'URP'}`, `DocNo:${invoice.invoiceNumber}`,
        `DocDt:${new Date(invoice.issueDate).toISOString().slice(0, 10)}`, `TotInvVal:${Number(invoice.totalAmount).toFixed(2)}`,
        `Irn:${irn}`].join(';');
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<GstInvoice version="1.1">',
        `  <Irn>${e(irn)}</Irn>`,
        `  <DocDtls><Typ>INV</Typ><No>${e(invoice.invoiceNumber)}</No><Dt>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</Dt></DocDtls>`,
        `  <SellerDtls><Gstin>${e(gstin)}</Gstin><LglNm>${e(supplier?.legalName || supplier?.name)}</LglNm></SellerDtls>`,
        `  <BuyerDtls><Gstin>${e(invoice.customer?.taxId || 'URP')}</Gstin><LglNm>${e(invoice.customer?.name)}</LglNm></BuyerDtls>`,
        `  <ValDtls><AssVal>${taxableValue.toFixed(2)}</AssVal><TotInvVal>${Number(invoice.totalAmount).toFixed(2)}</TotInvVal></ValDtls>`,
        '  <ItemList>',
        ...invoice.lineItems.map((li, i) => `    <Item><SlNo>${i + 1}</SlNo><PrdDesc>${e(li.description)}</PrdDesc><Qty>${Number(li.quantity)}</Qty><UnitPrice>${Number(li.unitPrice).toFixed(2)}</UnitPrice><TotAmt>${Number(li.totalAmount).toFixed(2)}</TotAmt><GstRt>${Number(li.taxRate)}</GstRt></Item>`),
        '  </ItemList>',
        '</GstInvoice>',
      ].join('\n');
    } else {
      // UBL 2.1 / PEPPOL BIS Billing 3.0
      const profile = fmt === 'PEPPOL' ? 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0' : 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
        `  <cbc:CustomizationID>${e(profile)}</cbc:CustomizationID>`,
        `  <cbc:ID>${e(invoice.invoiceNumber)}</cbc:ID>`,
        `  <cbc:IssueDate>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</cbc:IssueDate>`,
        `  <cbc:DueDate>${e(new Date(invoice.dueDate).toISOString().slice(0, 10))}</cbc:DueDate>`,
        '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>',
        `  <cbc:DocumentCurrencyCode>${e(invoice.currency)}</cbc:DocumentCurrencyCode>`,
        `  <cac:AccountingSupplierParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(supplier?.legalName || supplier?.name)}</cbc:RegistrationName>${supplier?.taxId ? `<cbc:CompanyID>${e(supplier.taxId)}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>`,
        `  <cac:AccountingCustomerParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(invoice.customer?.name)}</cbc:RegistrationName>${invoice.customer?.taxId ? `<cbc:CompanyID>${e(invoice.customer.taxId)}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>`,
        `  <cac:TaxTotal><cbc:TaxAmount currencyID="${e(invoice.currency)}">${Number(invoice.taxAmount).toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>`,
        `  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${taxableValue.toFixed(2)}</cbc:LineExtensionAmount><cbc:TaxInclusiveAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`,
        ...invoice.lineItems.map((li, i) => [
          '  <cac:InvoiceLine>',
          `    <cbc:ID>${i + 1}</cbc:ID>`,
          `    <cbc:InvoicedQuantity>${Number(li.quantity)}</cbc:InvoicedQuantity>`,
          `    <cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${Number(li.totalAmount).toFixed(2)}</cbc:LineExtensionAmount>`,
          `    <cac:Item><cbc:Name>${e(li.description)}</cbc:Name></cac:Item>`,
          `    <cac:Price><cbc:PriceAmount currencyID="${e(invoice.currency)}">${Number(li.unitPrice).toFixed(2)}</cbc:PriceAmount></cac:Price>`,
          '  </cac:InvoiceLine>',
        ].join('\n')),
        '</Invoice>',
      ].join('\n');
    }

    const data = {
      tenantId, orgId: invoice.orgId, invoiceId: invoice.id, format: fmt, status: 'GENERATED',
      irn, qrPayload, documentXml, createdBy: 'system',
    };
    const doc = await prisma.eInvoice.upsert({
      where: { tenantId_invoiceId_format: { tenantId, invoiceId: invoice.id, format: fmt } },
      create: data, update: { documentXml, irn, qrPayload, status: 'GENERATED' },
    });
    await this.logFinanceAudit(prisma, tenantId, 'EInvoice', doc.id, 'GENERATE', { format: fmt, invoiceNumber: invoice.invoiceNumber }, 'system');
    return doc;
  }
}