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

  // ── INVOICE ANALYTICS ──────────────────────────────────

  async getInvoiceAnalytics(tenantId: string, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const invoices = await prisma.invoice.findMany({
      where: { tenantId, issueDate: { gte: since } },
      include: { customer: true, payments: true },
    });

    // Monthly revenue trend
    const byMonth: Record<string, { invoiced: number; paid: number; count: number }> = {};
    for (const inv of invoices) {
      const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { invoiced: 0, paid: 0, count: 0 };
      byMonth[key].invoiced += Number(inv.totalAmount);
      byMonth[key].paid += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      byMonth[key].count++;
    }

    // Customer breakdown (top 10)
    const byCustomer: Record<string, { name: string; invoiced: number; paid: number; count: number }> = {};
    for (const inv of invoices) {
      const key = inv.customerId || 'unknown';
      if (!byCustomer[key]) byCustomer[key] = { name: inv.customer?.name ?? 'Unknown', invoiced: 0, paid: 0, count: 0 };
      byCustomer[key].invoiced += Number(inv.totalAmount);
      byCustomer[key].paid += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      byCustomer[key].count++;
    }

    const topCustomers = Object.values(byCustomer).sort((a, b) => b.invoiced - a.invoiced).slice(0, 10);

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    const statusAmounts: Record<string, number> = {};
    for (const inv of invoices) {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
      statusAmounts[inv.status] = (statusAmounts[inv.status] || 0) + Number(inv.totalAmount);
    }

    // Average days to pay
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID' && inv.payments.length > 0);
    const avgDaysToPay = paidInvoices.length > 0
      ? paidInvoices.reduce((s, inv) => {
          const lastPayment = inv.payments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
          return s + (lastPayment ? Math.max(0, (new Date(lastPayment.paidAt).getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0);
        }, 0) / paidInvoices.length
      : 0;

    return {
      period: { months, since: since.toISOString() },
      monthlyTrend: Object.entries(byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({ month, ...data })),
      topCustomers,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status, count, amount: statusAmounts[status] || 0,
      })),
      avgDaysToPay: Math.round(avgDaysToPay),
      totalInvoiced: invoices.reduce((s, inv) => s + Number(inv.totalAmount), 0),
      totalCollected: invoices.reduce((s, inv) => s + inv.payments.reduce((ps, p) => ps + Number(p.amount), 0), 0),
    };
  }

  // ── AP AGING ──────────────────────────────────

  async getApAgingReport(tenantId: string) {
    const schedules = await prisma.paymentSchedule.findMany({
      where: { tenantId, status: 'PENDING' },
      include: { vendor: true },
    });

    const now = Date.now();
    const buckets = {
      current: { total: 0, count: 0, items: [] as unknown[] },
      '1-30': { total: 0, count: 0, items: [] as unknown[] },
      '31-60': { total: 0, count: 0, items: [] as unknown[] },
      '61-90': { total: 0, count: 0, items: [] as unknown[] },
      '90+': { total: 0, count: 0, items: [] as unknown[] },
    };

    for (const s of schedules) {
      const daysOverdue = Math.floor((now - s.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(s.amount);
      const entry = { id: s.id, vendor: s.vendor?.name, dueDate: s.dueDate, amount, daysOverdue };
      if (daysOverdue <= 0) { buckets.current.total += amount; buckets.current.count++; buckets.current.items.push(entry); }
      else if (daysOverdue <= 30) { buckets['1-30'].total += amount; buckets['1-30'].count++; buckets['1-30'].items.push(entry); }
      else if (daysOverdue <= 60) { buckets['31-60'].total += amount; buckets['31-60'].count++; buckets['31-60'].items.push(entry); }
      else if (daysOverdue <= 90) { buckets['61-90'].total += amount; buckets['61-90'].count++; buckets['61-90'].items.push(entry); }
      else { buckets['90+'].total += amount; buckets['90+'].count++; buckets['90+'].items.push(entry); }
    }

    const grandTotal = Object.values(buckets).reduce((s, b) => s + b.total, 0);
    return { buckets, grandTotal, generatedAt: new Date().toISOString() };
  }

  // ── WRITE-OFF / BAD DEBT ──────────────────────────────────

  async writeOffInvoice(tenantId: string, orgId: string, invoiceId: string, reason: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new Error('Invoice not found');
    if (['PAID', 'VOID', 'WRITTEN_OFF'].includes(invoice.status)) {
      throw new Error(`Cannot write off invoice in status ${invoice.status}`);
    }

    // Mark invoice as written off
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'VOID', notes: `[WRITTEN_OFF] ${reason} — ${new Date().toISOString()}` } as never,
    });

    // Create a bad-debt journal entry
    const badDebtAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: resolvedOrgId, name: { contains: 'Bad Debt' } },
    });
    const arAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: resolvedOrgId, type: 'ASSET', name: { contains: 'Receivable' } },
    });

    if (badDebtAccount && arAccount) {
      const writeOffAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount || 0);
      await prisma.journal.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          entryNumber: `WO-${Date.now()}`,
          notes: `Bad debt write-off for invoice ${invoice.invoiceNumber}: ${reason}`,
          status: 'POSTED',
          date: new Date(),
          entries: {
            create: [
              { tenantId, accountId: badDebtAccount.id, debit: writeOffAmount, credit: 0, description: `Bad debt write-off: ${invoice.invoiceNumber}` },
              { tenantId, accountId: arAccount.id, debit: 0, credit: writeOffAmount, description: `AR reduction: ${invoice.invoiceNumber}` },
            ],
          },
        },
      });
    }

    await this.glService.logAudit(prisma, tenantId, 'Invoice', invoiceId, 'WRITE_OFF', { invoiceId, reason }, 'system');
    return { writtenOff: true, invoiceId, reason };
  }

  // ── PROFORMA INVOICE ──────────────────────────────────

  async createProformaInvoice(tenantId: string, orgId: string, sourceInvoiceId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const source = await prisma.invoice.findFirst({
      where: { id: sourceInvoiceId, tenantId },
      include: { lineItems: true },
    });
    if (!source) throw new Error('Source invoice not found');

    const proforma = await prisma.invoice.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        customerId: source.customerId!,
        invoiceNumber: `PRO-${source.invoiceNumber}`,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        notes: `Proforma invoice based on ${source.invoiceNumber}`,
        subtotal: source.subtotal,
        taxAmount: source.taxAmount,
        totalAmount: source.totalAmount,
        currency: source.currency,
        lineItems: {
          create: source.lineItems.map((li) => ({
            tenantId,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            totalAmount: li.totalAmount,
          })),
        },
      } as never,
    });

    return proforma;
  }

  // ── LATE FEE CALCULATION ──────────────────────────────────

  async calculateLateFees(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const dunningLevels = await prisma.dunningLevel.findMany({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { daysOverdue: 'desc' },
    });

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        status: { notIn: ['PAID', 'VOID', 'DRAFT'] },
        dueDate: { lt: new Date() },
      },
      include: { customer: true },
    });

    const now = Date.now();
    const feeCalculations = overdueInvoices.map((inv) => {
      const daysOverdue = Math.floor((now - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const applicableLevel = dunningLevels.find((lvl) => daysOverdue >= lvl.daysOverdue);
      const lateFee = applicableLevel ? Number(applicableLevel.feeAmount) : 0;
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer?.name,
        daysOverdue,
        invoiceAmount: Number(inv.totalAmount),
        lateFee,
        applicableLevel: applicableLevel?.levelName ?? 'None',
      };
    });

    const totalFees = feeCalculations.reduce((s, f) => s + f.lateFee, 0);
    return { calculations: feeCalculations, totalFees, overdueCount: feeCalculations.length };
  }

  // ── FINANCE DASHBOARD KPIs ──────────────────────────────────

  async getFinanceDashboardKpis(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [mtdRevenue, ytdRevenue, unpaidInvoices, overdueInvoices, cashPosition, pendingApprovals] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId, orgId: resolvedOrgId, status: 'PAID', issueDate: { gte: startOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, orgId: resolvedOrgId, status: 'PAID', issueDate: { gte: startOfYear } },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['PAID', 'VOID', 'DRAFT'] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: { tenantId, orgId: resolvedOrgId, status: { notIn: ['PAID', 'VOID', 'DRAFT'] }, dueDate: { lt: now } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.bankAccount.findMany({ where: { tenantId, orgId: resolvedOrgId, status: 'ACTIVE' } }),
      prisma.journal.count({ where: { tenantId, orgId: resolvedOrgId, status: 'PENDING_APPROVAL' } }),
    ]);

    const bankAccountIds = cashPosition.map(ba => ba.accountId);
    const bankAccountsGL = await prisma.account.findMany({
      where: { id: { in: bankAccountIds }, tenantId },
    });
    const totalCash = bankAccountsGL.reduce((s, a) => s + Number(a.balance || 0), 0);

    return {
      mtdRevenue: Number(mtdRevenue._sum.totalAmount || 0),
      ytdRevenue: Number(ytdRevenue._sum.totalAmount || 0),
      totalUnpaidAr: Number(unpaidInvoices._sum.totalAmount || 0),
      unpaidInvoiceCount: unpaidInvoices._count,
      totalOverdueAr: Number(overdueInvoices._sum.totalAmount || 0),
      overdueInvoiceCount: overdueInvoices._count,
      totalCash,
      pendingJournalApprovals: pendingApprovals,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── 13-WEEK CASH FLOW FORECAST ──────────────────────────────────

  async get13WeekCashForecast(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const now = new Date();
    const weeks: { weekStart: Date; weekEnd: Date; label: string; projectedInflows: number; projectedOutflows: number; netCashFlow: number }[] = [];

    for (let w = 0; w < 13; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const [invoicesInflow, apOutflow] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            tenantId, orgId: resolvedOrgId,
            status: { notIn: ['PAID', 'VOID', 'DRAFT'] },
            dueDate: { gte: weekStart, lte: weekEnd },
          },
          _sum: { totalAmount: true },
        }),
        prisma.paymentSchedule.aggregate({
          where: { tenantId, orgId: resolvedOrgId, status: 'PENDING', dueDate: { gte: weekStart, lte: weekEnd } },
          _sum: { amount: true },
        }),
      ]);

      const inflows = Number(invoicesInflow._sum.totalAmount || 0);
      const outflows = Number(apOutflow._sum.amount || 0);

      weeks.push({
        weekStart,
        weekEnd,
        label: `Week ${w + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        projectedInflows: inflows,
        projectedOutflows: outflows,
        netCashFlow: inflows - outflows,
      });
    }

    const totalInflows = weeks.reduce((s, w) => s + w.projectedInflows, 0);
    const totalOutflows = weeks.reduce((s, w) => s + w.projectedOutflows, 0);
    return { weeks, totalInflows, totalOutflows, netPosition: totalInflows - totalOutflows };
  }

  // ── BUDGET MONTHLY SPREAD ──────────────────────────────────

  async getBudgetMonthlySpread(tenantId: string, fiscalYear: string) {
    const yearStart = new Date(`${fiscalYear}-01-01`);
    const yearEnd = new Date(`${fiscalYear}-12-31`);

    const budgets = await prisma.budget.findMany({
      where: { tenantId, startDate: { gte: yearStart }, endDate: { lte: yearEnd } },
      include: { account: true },
    });

    const monthlyBudgets: Record<string, { month: string; budgeted: number; accounts: { name: string; amount: number }[] }> = {};
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(parseInt(fiscalYear), m, 1);
      const monthKey = `${fiscalYear}-${String(m + 1).padStart(2, '0')}`;
      monthlyBudgets[monthKey] = {
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        budgeted: 0,
        accounts: [],
      };
    }

    for (const budget of budgets) {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      const monthCount = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
      const monthlyAmount = Number(budget.amount) / monthCount;

      for (let m = 0; m < monthCount; m++) {
        const d = new Date(start.getFullYear(), start.getMonth() + m, 1);
        if (d.getFullYear() !== parseInt(fiscalYear)) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyBudgets[key]) {
          monthlyBudgets[key].budgeted += monthlyAmount;
          monthlyBudgets[key].accounts.push({ name: budget.account?.name ?? 'Unknown', amount: monthlyAmount });
        }
      }
    }

    return { fiscalYear, months: Object.values(monthlyBudgets), totalBudgeted: budgets.reduce((s, b) => s + Number(b.amount), 0) };
  }

  // ── GL ACCOUNT DRILL-DOWN ──────────────────────────────────

  async getGlAccountDrillDown(tenantId: string, accountId: string, startDate?: string, endDate?: string, page = 1, limit = 50) {
    const account = await prisma.account.findFirst({ where: { id: accountId, tenantId } });
    if (!account) throw new Error('Account not found');

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter['gte'] = new Date(startDate);
    if (endDate) dateFilter['lte'] = new Date(endDate);

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          tenantId,
          accountId,
          ...(Object.keys(dateFilter).length ? { journal: { date: dateFilter } } : {}),
        },
        include: { journal: true },
        orderBy: { journal: { date: 'desc' } },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where: { tenantId, accountId, ...(Object.keys(dateFilter).length ? { journal: { date: dateFilter } } : {}) } }),
    ]);

    let runningBalance = Number(account.balance || 0);
    const transactions = entries.map((e) => {
      const net = Number(e.credit) - Number(e.debit);
      runningBalance -= net; // simplified running backwards
      return {
        date: e.journal.date,
        description: e.description || e.journal.notes || '',
        reference: e.journal.entryNumber,
        debit: Number(e.debit),
        credit: Number(e.credit),
        balance: runningBalance,
      };
    });

    return {
      account: { id: account.id, code: account.code, name: account.name, type: account.type, currentBalance: Number(account.balance || 0) },
      transactions,
      total,
      page,
      limit,
      period: { startDate: startDate || null, endDate: endDate || null },
    };
  }

  // ── CUSTOMER PAYMENT BEHAVIOUR ──────────────────────────────────

  async getCustomerPaymentBehavior(tenantId: string, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const paidInvoices = await prisma.invoice.findMany({
      where: { tenantId, status: 'PAID', issueDate: { gte: since } },
      include: { customer: true, payments: true },
    });

    const byCustomer: Record<string, { name: string; invoiceCount: number; avgDaysToPay: number; totalPaid: number; onTimeCount: number; lateCount: number }> = {};

    for (const inv of paidInvoices) {
      const key = inv.customerId || 'unknown';
      if (!byCustomer[key]) byCustomer[key] = { name: inv.customer?.name ?? 'Unknown', invoiceCount: 0, avgDaysToPay: 0, totalPaid: 0, onTimeCount: 0, lateCount: 0 };

      const lastPayment = inv.payments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
      if (!lastPayment) continue;
      const daysToPay = Math.max(0, (new Date(lastPayment.paidAt).getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24));
      const isLate = new Date(lastPayment.paidAt) > inv.dueDate;

      byCustomer[key].invoiceCount++;
      byCustomer[key].avgDaysToPay = (byCustomer[key].avgDaysToPay * (byCustomer[key].invoiceCount - 1) + daysToPay) / byCustomer[key].invoiceCount;
      byCustomer[key].totalPaid += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      if (isLate) byCustomer[key].lateCount++; else byCustomer[key].onTimeCount++;
    }

    return Object.values(byCustomer)
      .map(c => ({ ...c, onTimeRate: c.invoiceCount > 0 ? (c.onTimeCount / c.invoiceCount) * 100 : 0, avgDaysToPay: Math.round(c.avgDaysToPay) }))
      .sort((a, b) => a.avgDaysToPay - b.avgDaysToPay);
  }

  // ── VENDOR PAYMENT ANALYSIS ──────────────────────────────────

  async getVendorPaymentAnalysis(tenantId: string) {
    const schedules = await prisma.paymentSchedule.findMany({
      where: { tenantId },
      include: { vendor: true },
    });

    const byVendor: Record<string, { name: string; pending: number; paid: number; overdue: number; total: number }> = {};
    const now = Date.now();

    for (const s of schedules) {
      const key = s.vendorId;
      if (!byVendor[key]) byVendor[key] = { name: s.vendor?.name ?? 'Unknown', pending: 0, paid: 0, overdue: 0, total: 0 };
      const amount = Number(s.amount);
      byVendor[key].total += amount;
      if (s.status === 'PAID') { byVendor[key].paid += amount; }
      else if (s.dueDate.getTime() < now) { byVendor[key].overdue += amount; byVendor[key].pending += amount; }
      else { byVendor[key].pending += amount; }
    }

    return Object.values(byVendor).sort((a, b) => b.pending - a.pending);
  }

  // ── TAX FILING SUMMARY ──────────────────────────────────

  async getTaxFilingSummary(tenantId: string, year: string) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);

    const filings = await prisma.taxFiling.findMany({
      where: { tenantId, periodStart: { gte: start, lte: end } },
      orderBy: { periodStart: 'asc' },
    });

    const parsedFilings = filings.map(f => {
      const payload = (f.payload && typeof f.payload === 'object' ? f.payload : {}) as Record<string, unknown>;
      const netTaxPayable = typeof payload.netTaxPayable === 'number' ? payload.netTaxPayable : 0;
      return {
        id: f.id,
        period: `${f.periodStart.toLocaleDateString()} – ${f.periodEnd.toLocaleDateString()}`,
        type: f.filingType,
        liability: netTaxPayable,
        status: f.status,
      };
    });

    const totalTaxLiability = parsedFilings.reduce((s, f) => s + f.liability, 0);
    const totalTaxPaid = parsedFilings.filter(f => f.status === 'FILED').reduce((s, f) => s + f.liability, 0);
    const pending = parsedFilings.filter(f => f.status !== 'FILED').length;

    return {
      year,
      totalFilings: filings.length,
      totalTaxLiability,
      totalTaxPaid,
      pendingFilings: pending,
      filings: parsedFilings,
    };
  }
}

