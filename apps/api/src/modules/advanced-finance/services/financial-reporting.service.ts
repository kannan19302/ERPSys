import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class FinancialReportingService {
  constructor(private readonly glService: GlAccountingService) {}

  async getProfitAndLoss(tenantId: string, orgId: string, startDate: string, endDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const revenueAccounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, type: 'REVENUE', isActive: true },
    });
    const expenseAccounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, type: 'EXPENSE', isActive: true },
    });

    const revenueEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        journal: {
          orgId: resolvedOrgId,
          date: { gte: start, lte: end },
          status: 'POSTED',
        },
        accountId: { in: revenueAccounts.map((a) => a.id) },
      },
    });

    const expenseEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        journal: {
          orgId: resolvedOrgId,
          date: { gte: start, lte: end },
          status: 'POSTED',
        },
        accountId: { in: expenseAccounts.map((a) => a.id) },
      },
    });

    const revenueByAccount = new Map<string, { name: string; code: string; amount: number }>();
    for (const entry of revenueEntries) {
      const acc = revenueAccounts.find((a) => a.id === entry.accountId);
      if (!acc) continue;
      const e = revenueByAccount.get(entry.accountId) || { name: acc.name, code: acc.code, amount: 0 };
      e.amount += Number(entry.credit) - Number(entry.debit);
      revenueByAccount.set(entry.accountId, e);
    }

    const expensesByAccount = new Map<string, { name: string; code: string; amount: number }>();
    for (const entry of expenseEntries) {
      const acc = expenseAccounts.find((a) => a.id === entry.accountId);
      if (!acc) continue;
      const e = expensesByAccount.get(entry.accountId) || { name: acc.name, code: acc.code, amount: 0 };
      e.amount += Number(entry.debit) - Number(entry.credit);
      expensesByAccount.set(entry.accountId, e);
    }

    const revenueList = Array.from(revenueByAccount.values());
    const expenseList = Array.from(expensesByAccount.values());
    const totalRevenue = revenueList.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);

    return {
      revenue: totalRevenue,
      revenueBreakdown: revenueList,
      expenses: totalExpenses,
      expenseBreakdown: expenseList,
      netProfit: totalRevenue - totalExpenses,
      period: { startDate, endDate },
    };
  }

  // ── BALANCE SHEET ──────────────────────────────────

  async getBalanceSheet(tenantId: string, orgId: string, asOfDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const accounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, isActive: true },
    });

    const currentAssets = accounts.filter((a) => a.type === 'ASSET' && a.code.startsWith('1'));
    const nonCurrentAssets = accounts.filter((a) => a.type === 'ASSET' && !a.code.startsWith('1'));
    const currentLiabilities = accounts.filter((a) => a.type === 'LIABILITY' && a.code.startsWith('2'));
    const nonCurrentLiabilities = accounts.filter((a) => a.type === 'LIABILITY' && !a.code.startsWith('2'));
    const equityAccounts = accounts.filter((a) => a.type === 'EQUITY');

    const sum = (accs: typeof accounts) => accs.reduce((s, a) => s + Number(a.balance), 0);
    const fmt = (accs: typeof accounts) => accs.map((a) => ({ code: a.code, name: a.name, balance: Number(a.balance) }));

    const totalAssets = sum(currentAssets) + sum(nonCurrentAssets);
    const totalLiabilities = sum(currentLiabilities) + sum(nonCurrentLiabilities);
    const totalEquity = sum(equityAccounts);

    return {
      assets: {
        current: { total: sum(currentAssets), accounts: fmt(currentAssets) },
        nonCurrent: { total: sum(nonCurrentAssets), accounts: fmt(nonCurrentAssets) },
        total: totalAssets,
      },
      liabilities: {
        current: { total: sum(currentLiabilities), accounts: fmt(currentLiabilities) },
        nonCurrent: { total: sum(nonCurrentLiabilities), accounts: fmt(nonCurrentLiabilities) },
        total: totalLiabilities,
      },
      equity: { total: totalEquity, accounts: fmt(equityAccounts) },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      asOfDate,
    };
  }

  // ── CASH FLOW ──────────────────────────────────

  async getCashFlowStatement(tenantId: string, orgId: string, startDate: string, endDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const accounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, isActive: true },
    });

    const operatingAccounts = accounts.filter(
      (a) => a.type === 'REVENUE' || (a.type === 'EXPENSE' && !a.code.startsWith('8')),
    );
    const investingAccounts = accounts.filter(
      (a) => a.type === 'ASSET' && (a.code.startsWith('15') || a.code.startsWith('16')),
    );
    const financingAccounts = accounts.filter(
      (a) => a.type === 'LIABILITY' || a.type === 'EQUITY',
    );

    const mapAccts = (accs: typeof accounts) =>
      accs.map((a) => ({ accountName: a.name, amount: Number(a.balance) }));

    return {
      operatingActivities: {
        total: operatingAccounts.reduce((s, a) => s + Number(a.balance), 0),
        details: mapAccts(operatingAccounts),
      },
      investingActivities: {
        total: investingAccounts.reduce((s, a) => s + Number(a.balance), 0),
        details: mapAccts(investingAccounts),
      },
      financingActivities: {
        total: financingAccounts.reduce((s, a) => s + Number(a.balance), 0),
        details: mapAccts(financingAccounts),
      },
      netIncreaseInCash:
        operatingAccounts.reduce((s, a) => s + Number(a.balance), 0) +
        investingAccounts.reduce((s, a) => s + Number(a.balance), 0) +
        financingAccounts.reduce((s, a) => s + Number(a.balance), 0),
      period: { startDate, endDate },
    };
  }

  // ── TRIAL BALANCE ──────────────────────────────────

  async getTrialBalance(tenantId: string, orgId: string, asOfDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const asOf = new Date(asOfDate);

    const accounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const entries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId: { in: accounts.map((a) => a.id) },
        journal: { orgId: resolvedOrgId, date: { lte: asOf }, status: 'POSTED' },
      },
    });

    const accountTotals = new Map<string, { debitTotal: number; creditTotal: number; entriesCount: number }>();
    for (const entry of entries) {
      const c = accountTotals.get(entry.accountId) || { debitTotal: 0, creditTotal: 0, entriesCount: 0 };
      c.debitTotal += Number(entry.debit);
      c.creditTotal += Number(entry.credit);
      c.entriesCount++;
      accountTotals.set(entry.accountId, c);
    }

    const accountRows = accounts.map((account) => {
      const totals = accountTotals.get(account.id) || { debitTotal: 0, creditTotal: 0, entriesCount: 0 };
      const balance = ['ASSET', 'EXPENSE'].includes(account.type)
        ? totals.debitTotal - totals.creditTotal
        : totals.creditTotal - totals.debitTotal;
      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debitTotal: totals.debitTotal,
        creditTotal: totals.creditTotal,
        balance,
        entriesCount: totals.entriesCount,
      };
    });

    return {
      asOfDate,
      accounts: accountRows,
      totalDebits: accountRows.reduce((s, r) => s + r.debitTotal, 0),
      totalCredits: accountRows.reduce((s, r) => s + r.creditTotal, 0),
      isBalanced: true,
    };
  }

  // ── AGING REPORT ──────────────────────────────────

  async getAgingReport(tenantId: string, orgId: string, type: 'AR' | 'AP', asOfDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const asOf = new Date(asOfDate);
    let items: Array<{
      partyName: string;
      documentNumber: string;
      totalAmount: number;
      outstanding: number;
      dueDate: string;
      daysOverdue: number;
      ageBucket: string;
    }> = [];

    if (type === 'AR') {
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          orgId: resolvedOrgId,
          status: { notIn: ['DRAFT', 'PAID', 'VOID'] },
          dueDate: { lt: asOf },
        },
        include: { customer: true },
      });
      items = invoices.map((inv) => {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.max(0, Math.floor((asOf.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
        const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
        let ageBucket = '0-30';
        if (daysOverdue > 90) ageBucket = '90+';
        else if (daysOverdue > 60) ageBucket = '61-90';
        else if (daysOverdue > 30) ageBucket = '31-60';
        return {
          partyName: inv.customer?.name || 'Unknown',
          documentNumber: inv.invoiceNumber,
          totalAmount: Number(inv.totalAmount),
          outstanding,
          dueDate: inv.dueDate.toISOString(),
          daysOverdue,
          ageBucket,
        };
      });
    } else {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          orgId: resolvedOrgId,
          status: { notIn: ['DRAFT', 'CANCELLED'] },
          createdAt: { lt: asOf },
        },
        include: { vendor: true },
      });
      items = purchaseOrders.map((po) => {
        const createdDate = new Date(po.createdAt);
        const daysOverdue = Math.max(0, Math.floor((asOf.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
        let ageBucket = '0-30';
        if (daysOverdue > 90) ageBucket = '90+';
        else if (daysOverdue > 60) ageBucket = '61-90';
        else if (daysOverdue > 30) ageBucket = '31-60';
        return {
          partyName: po.vendor?.name || 'Unknown',
          documentNumber: po.poNumber,
          totalAmount: Number(po.totalAmount),
          outstanding: Number(po.totalAmount),
          dueDate: po.createdAt.toISOString(),
          daysOverdue,
          ageBucket,
        };
      });
    }

    const buckets: Record<string, typeof items> = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
    for (const item of items) {
      const t = buckets[item.ageBucket];
      if (t) t.push(item);
      else if (buckets['90+']) buckets['90+'].push(item);
    }

    const allItems = Object.values(buckets).flat();
    return {
      type,
      asOfDate,
      totalOutstanding: allItems.reduce((s, i) => s + i.outstanding, 0),
      totalItems: allItems.length,
      buckets,
      bucketTotals: Object.fromEntries(
        Object.entries(buckets).map(([k, list]) => [
          k,
          { count: list.length, totalOutstanding: list.reduce((s, i) => s + i.outstanding, 0) },
        ]),
      ),
    };
  }

  // ── FINANCIAL RATIOS ──────────────────────────────────

  async getFinancialRatios(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const accounts = await prisma.account.findMany({
      where: { tenantId, orgId: resolvedOrgId, isActive: true },
    });
    const getBalance = (type: string) => accounts.filter((a) => a.type === type).reduce((s, a) => s + Number(a.balance), 0);
    const currentAssets = accounts
      .filter((a) => a.type === 'ASSET' && a.code.startsWith('1'))
      .reduce((s, a) => s + Number(a.balance), 0);
    const currentLiabilities = accounts
      .filter((a) => a.type === 'LIABILITY' && a.code.startsWith('2'))
      .reduce((s, a) => s + Number(a.balance), 0);
    const totalLiabilities = getBalance('LIABILITY');
    const totalEquity = getBalance('EQUITY');
    const totalRevenue = getBalance('REVENUE');
    const totalExpenses = getBalance('EXPENSE');
    const netProfit = totalRevenue - totalExpenses;

    return {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? (currentAssets - 0) / currentLiabilities : 0,
      debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      netProfitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      returnOnEquity: totalEquity > 0 ? (netProfit / totalEquity) * 100 : 0,
      asOfDate: new Date().toISOString(),
    };
  }

  // ── CASH FLOW FORECAST ──────────────────────────────────

  async getCashFlowForecast(tenantId: string, orgId: string, months = 3) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const now = new Date();
    const forecast: Array<{ month: string; expectedInflow: number; expectedOutflow: number; netCash: number; cumulativeCash: number }> = [];
    let cumulative = 0;

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' },
    });
    const accountIds = bankAccounts.map((ba) => ba.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, tenantId },
    });
    for (const acc of accounts) {
      cumulative += Number(acc.balance);
    }

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const inflows = await prisma.invoice.aggregate({
        where: {
          tenantId,
          orgId: resolvedOrgId,
          status: { notIn: ['PAID', 'DRAFT', 'VOID'] },
          dueDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalAmount: true, paidAmount: true },
      });
      const outflows = await prisma.paymentSchedule.aggregate({
        where: {
          tenantId,
          orgId: resolvedOrgId,
          status: 'PENDING',
          dueDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      const inflow = Number(inflows._sum.totalAmount || 0) - Number(inflows._sum.paidAmount || 0);
      const outflow = Number(outflows._sum.amount || 0);
      const net = inflow - outflow;
      cumulative += net;

      forecast.push({
        month: monthStart.toISOString().slice(0, 7),
        expectedInflow: inflow,
        expectedOutflow: outflow,
        netCash: net,
        cumulativeCash: cumulative,
      });
    }

    return { forecastMonths: months, forecast };
  }

  // ── CASH POSITION ──────────────────────────────────

  async getCashPosition(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' },
    });
    const accountIds = bankAccounts.map((ba) => ba.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, tenantId },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const totalCash = bankAccounts.reduce((s, ba) => {
      const acc = accountMap.get(ba.accountId);
      return s + Number(acc?.balance || 0);
    }, 0);

    const pendingInflows = await prisma.invoice.aggregate({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        status: { in: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] },
      },
      _sum: { totalAmount: true, paidAmount: true },
    });
    const pendingOutflows = await prisma.paymentSchedule.aggregate({
      where: { tenantId, orgId: resolvedOrgId, status: 'PENDING' },
      _sum: { amount: true },
    });

    const expectedInflows = Number(pendingInflows._sum.totalAmount || 0) - Number(pendingInflows._sum.paidAmount || 0);
    const expectedOutflows = Number(pendingOutflows._sum.amount || 0);

    return {
      totalCash,
      expectedInflows,
      expectedOutflows,
      projectedBalance: totalCash + expectedInflows - expectedOutflows,
      bankAccounts: bankAccounts.map((ba) => {
        const acc = accountMap.get(ba.accountId);
        return {
          id: ba.id,
          bankName: ba.bankName,
          accountNumber: ba.accountNumber,
          balance: Number(acc?.balance || 0),
        };
      }),
    };
  }
}
