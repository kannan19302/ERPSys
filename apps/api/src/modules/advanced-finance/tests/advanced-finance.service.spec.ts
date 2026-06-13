import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedFinanceService } from '../advanced-finance.service';
import { BadRequestException } from '@nestjs/common';
// import { Prisma } from '@prisma/client';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        constructor(value: unknown) {
          return Number(value);
        }
      }
    }
  };
});

vi.mock('@unerp/database', () => {
  const genericPrismaMock = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  };

  return {
    prisma: {
      exchangeRate: { ...genericPrismaMock },
      account: { ...genericPrismaMock },
      costCenter: { ...genericPrismaMock },
      journal: { ...genericPrismaMock, findUnique: vi.fn() },
      journalEntry: { ...genericPrismaMock },
      budget: { ...genericPrismaMock },
      bankReconciliation: { ...genericPrismaMock },
      financialPeriod: { ...genericPrismaMock },
      fixedAsset: { ...genericPrismaMock },
      bankAccount: { ...genericPrismaMock },
      creditNote: { ...genericPrismaMock },
      debitNote: { ...genericPrismaMock },
      dunningLevel: { ...genericPrismaMock },
      dunningRun: { ...genericPrismaMock },
      paymentSchedule: { ...genericPrismaMock },
      paymentRun: { ...genericPrismaMock },
      forecastScenario: { ...genericPrismaMock },
      taxRule: { ...genericPrismaMock },
      withholdingTax: { ...genericPrismaMock },
      taxFiling: { ...genericPrismaMock },
      investmentPortfolio: { ...genericPrismaMock },
      treasuryTransaction: { ...genericPrismaMock },
      interCompanyTransfer: { ...genericPrismaMock },
      invoice: { ...genericPrismaMock },
      purchaseOrder: { ...genericPrismaMock },
      customer: { ...genericPrismaMock },
      vendor: { ...genericPrismaMock },
      organization: {
        findFirst: vi.fn().mockResolvedValue({ id: 'org-1' }),
      },
      $transaction: vi.fn(async (cb) => {
        return cb({
          exchangeRate: { ...genericPrismaMock },
          account: { ...genericPrismaMock },
          costCenter: { ...genericPrismaMock },
          journal: { ...genericPrismaMock, findUnique: vi.fn().mockResolvedValue({ id: 'journal-id' }) },
          journalEntry: { ...genericPrismaMock },
          budget: { ...genericPrismaMock },
          bankReconciliation: { ...genericPrismaMock },
          financialPeriod: { ...genericPrismaMock },
          fixedAsset: { ...genericPrismaMock },
          bankAccount: { ...genericPrismaMock },
          creditNote: { ...genericPrismaMock },
          debitNote: { ...genericPrismaMock },
          dunningLevel: { ...genericPrismaMock },
          dunningRun: { ...genericPrismaMock },
          paymentSchedule: { ...genericPrismaMock },
          paymentRun: { ...genericPrismaMock },
          forecastScenario: { ...genericPrismaMock },
          taxRule: { ...genericPrismaMock },
          withholdingTax: { ...genericPrismaMock },
          taxFiling: { ...genericPrismaMock },
          investmentPortfolio: { ...genericPrismaMock },
          treasuryTransaction: { ...genericPrismaMock },
          interCompanyTransfer: { ...genericPrismaMock },
        });
      }),
    },
  };
});

describe('AdvancedFinanceService', () => {
  let service: AdvancedFinanceService;

  beforeEach(() => {
    service = new AdvancedFinanceService();
    vi.clearAllMocks();
  });

  const getMethods = [
    'getExchangeRates',
    'getAccounts',
    'getCostCenters',
    'getJournals',
    'getBudgets',
    'getBankReconciliations',
    'getFinancialPeriods',
    'getFixedAssets',
    'getBankAccounts',
    'getCreditNotes',
    'getDebitNotes',
    'getDunningLevels',
    'getDunningRuns',
    'getPaymentSchedules',
    'getPaymentRuns',
    'getForecastScenarios',
    'getTaxRules',
    'getWithholdingTaxes',
    'getTaxFilings',
    'getInvestmentPortfolios',
    'getTreasuryTransactions',
    'getInterCompanyTransfers',
  ];

  getMethods.forEach((method) => {
    it(`should run ${method} without errors`, async () => {
      const { prisma } = await import('@unerp/database');
      // Mocking whatever entity model might be called inside by generically making all findMany return []
      Object.keys(prisma).forEach((key) => {
        if ((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]?.findMany) {
          vi.mocked((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]!.findMany!).mockResolvedValue([]);
        }
      });

      const res = await (service as unknown as Record<string, import("vitest").Mock>)[method]!("tenant-123");
      expect(res).toBeDefined();
    });
  });

  const createMethods = [
    { method: 'createAccount', args: ['tenant-1', 'org-1', { code: '1000', name: 'Test', type: 'ASSET' }] },
    { method: 'createCostCenter', args: ['tenant-1', 'org-1', { code: 'C100', name: 'Test CC' }] },
    { method: 'createBankReconciliation', args: ['tenant-1', { accountId: 'acc-1', statementDate: new Date().toISOString(), statementBalance: 100 }] },
    { method: 'createFinancialPeriod', args: ['tenant-1', 'org-1', { name: 'FY2026', startDate: new Date().toISOString(), endDate: new Date().toISOString(), status: 'OPEN' }] },
    { method: 'updateFinancialPeriodStatus', args: ['tenant-1', 'period-1', 'CLOSED'] },
    { method: 'createFixedAsset', args: ['tenant-1', 'org-1', { assetCode: 'AST-001', name: 'Server', purchaseDate: new Date().toISOString(), purchaseValue: 100, salvageValue: 10, usefulLifeYears: 5, depreciationMethod: 'SLM', accountId: 'acc-1', accumDepAccountId: 'acc-2' }] },
    { method: 'createBankAccount', args: ['tenant-1', 'org-1', { accountId: 'acc-1', bankName: 'Test Bank', accountNumber: '123456', currency: 'USD' }] },
    { method: 'createCreditNote', args: ['tenant-1', 'org-1', { customerId: 'cust-1', noteNumber: 'CN-001', amount: 100 }] },
    { method: 'createDebitNote', args: ['tenant-1', 'org-1', { vendorId: 'ven-1', noteNumber: 'DN-001', amount: 50 }] },
    { method: 'createDunningLevel', args: ['tenant-1', 'org-1', { levelName: 'Level 1', daysOverdue: 30 }] },
    { method: 'createPaymentSchedule', args: ['tenant-1', 'org-1', { vendorId: 'ven-1', dueDate: new Date().toISOString(), amount: 100 }] },
    { method: 'createPaymentRun', args: ['tenant-1', 'org-1', { bankAccountId: 'bank-1', runDate: new Date().toISOString() }] },
    { method: 'createForecastScenario', args: ['tenant-1', 'org-1', { name: 'Best Case' }] },
    { method: 'createTaxRule', args: ['tenant-1', 'org-1', { name: 'GST 18%', isDefault: true }] },
    { method: 'createWithholdingTax', args: ['tenant-1', 'org-1', { name: 'TDS 10%', rate: 10, accountId: 'acc-1' }] },
    { method: 'createTaxFiling', args: ['tenant-1', 'org-1', { filingType: 'GSTR-1', periodStart: new Date().toISOString(), periodEnd: new Date().toISOString() }] },
    { method: 'createInvestmentPortfolio', args: ['tenant-1', 'org-1', { name: 'Bond Fund', assetClass: 'BONDS', currentValue: 1000, accountId: 'acc-1' }] },
    { method: 'createTreasuryTransaction', args: ['tenant-1', 'org-1', { type: 'SWEEP', amount: 500, currency: 'USD', date: new Date().toISOString() }] },
  ];

  createMethods.forEach(({ method, args }) => {
    it(`should run ${method} without errors`, async () => {
      const { prisma } = await import('@unerp/database');
      Object.keys(prisma).forEach((key) => {
        if ((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]?.create) {
          vi.mocked((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]!.create!).mockResolvedValue({ id: 'new-id' });
        }
        if ((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]?.findFirst) {
          vi.mocked((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]!.findFirst!).mockResolvedValue(null);
        }
        if ((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]?.update) {
          vi.mocked((prisma as unknown as Record<string, Record<string, import("vitest").Mock>>)[key]!.update!).mockResolvedValue({ id: 'updated-id' });
        }
      });
      // specific mock for org
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as never);

      const res = await (service as unknown as Record<string, import("vitest").Mock>)[method]!(...args);
      expect(res).toBeDefined();
    });

    it(`should run ${method} with fallback orgId without errors`, async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-fallback' } as never);

      // pass undefined/null for orgId to trigger fallback lines
      const modifiedArgs = [...args];
      if (modifiedArgs.length >= 2 && typeof modifiedArgs[1] === 'string') {
        modifiedArgs[1] = '';
      }

      const res = await (service as unknown as Record<string, import("vitest").Mock>)[method]!(...modifiedArgs);
      expect(res).toBeDefined();
    });
  });

  describe('createJournal', () => {
    it('should create a journal successfully', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.account.findUnique).mockResolvedValue({ id: 'acc-1', type: 'ASSET' } as never);

      const dto = {
        entryNumber: 'J-1',
        entries: [
          { accountId: 'acc-1', debit: 100, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 100 },
        ]
      };

      const res = await service.createJournal('tenant-1', 'org-1', dto);
      expect(res).toBeDefined();
    });

    it('should throw error if journal is not balanced', async () => {
      const dto = {
        entryNumber: 'J-1',
        entries: [
          { accountId: 'acc-1', debit: 100, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 50 },
        ]
      };

      await expect(service.createJournal('tenant-1', 'org-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  // ── REPORT TESTS ──

  describe('getProfitAndLoss', () => {
    it('should return P&L report with revenue and expenses', async () => {
      const { prisma } = await import('@unerp/database');
      
      // Mock revenue accounts
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
        { id: 'rev-1', code: '4000', name: 'Sales Revenue', type: 'REVENUE', tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
      ]);
      // Mock expense accounts
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
        { id: 'exp-1', code: '5000', name: 'Salaries', type: 'EXPENSE', tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
      ]);

      // Mock journal entries for revenue (credit entries increase revenue)
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
        { id: 'je-1', tenantId: 'tenant-1', journalId: 'j-1', accountId: 'rev-1', debit: 0 as never, credit: 10000 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
      ]);
      // Mock journal entries for expenses (debit entries increase expenses)
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
        { id: 'je-2', tenantId: 'tenant-1', journalId: 'j-2', accountId: 'exp-1', debit: 6000 as never, credit: 0 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
      ]);

      const result = await service.getProfitAndLoss('tenant-1', 'org-1', '2026-01-01', '2026-12-31');

      expect(result).toBeDefined();
      expect(result.revenue).toBe(10000);
      expect(result.expenses).toBe(6000);
      expect(result.netProfit).toBe(4000);
      expect(result.revenueBreakdown).toHaveLength(1);
      expect(result.expenseBreakdown).toHaveLength(1);
      expect(result.revenueBreakdown?.[0]?.name).toBe('Sales Revenue');
      expect(result.expenseBreakdown?.[0]?.name).toBe('Salaries');
      expect(result.period).toBeDefined();
    });
  });

  describe('getBalanceSheet', () => {
    it('should return balance sheet with assets, liabilities, equity', async () => {
      const { prisma } = await import('@unerp/database');
      
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
        { id: 'ast-1', code: '1100', name: 'Cash', type: 'ASSET', balance: 5000 as never, tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        // 1500 starts with '1', so it's current asset per our naive rule. Use code starting with non-'1' for non-current
        { id: 'ast-2', code: '1500', name: 'Equipment', type: 'ASSET', balance: 8000 as never, tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'lia-1', code: '2100', name: 'Accounts Payable', type: 'LIABILITY', balance: 3000 as never, tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'lia-2', code: '2500', name: 'Long Term Debt', type: 'LIABILITY', balance: 7000 as never, tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'eq-1', code: '3000', name: 'Retained Earnings', type: 'EQUITY', balance: 10000 as never, tenantId: 'tenant-1', orgId: 'org-1', parentId: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await service.getBalanceSheet('tenant-1', 'org-1', '2026-12-31');

      expect(result).toBeDefined();
      expect(result.assets.total).toBe(13000);
      expect(result.liabilities.total).toBe(10000);
      expect(result.equity.total).toBe(10000);
      expect(result.totalLiabilitiesAndEquity).toBe(20000);
      // Both Cash (1100) and Equipment (1500) start with '1', so both are current assets
      expect(result.assets.current.accounts).toHaveLength(2);
      // No non-current assets since we only have codes starting with '1'
      expect(result.assets.nonCurrent.accounts).toHaveLength(0);
      expect(result.asOfDate).toBe('2026-12-31');
    });
  });

  describe('getCashFlow', () => {
    it('should return cash flow with classified activities', async () => {
      const { prisma } = await import('@unerp/database');

      // Mock accounts
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
        { id: 'rev-1', code: '4000', name: 'Sales', type: 'REVENUE', tenantId: 't', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
        { id: 'exp-1', code: '5000', name: 'Rent', type: 'EXPENSE', tenantId: 't', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
        { id: 'ast-2', code: '1500', name: 'Equipment', type: 'ASSET', tenantId: 't', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
      ]);

      // Mock journals with entries
      vi.mocked(prisma.journal.findMany).mockResolvedValueOnce([
        {
          id: 'j-1', tenantId: 't', orgId: 'org-1', entryNumber: 'J-1', date: new Date('2026-06-01'),
          status: 'POSTED', notes: null, createdBy: null, createdAt: new Date(), updatedAt: new Date(),
          entries: [
            { id: 'je-1', tenantId: 't', journalId: 'j-1', accountId: 'rev-1', debit: 0 as never, credit: 5000 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
          ]
        } as never,
        {
          id: 'j-2', tenantId: 't', orgId: 'org-1', entryNumber: 'J-2', date: new Date('2026-06-15'),
          status: 'POSTED', notes: null, createdBy: null, createdAt: new Date(), updatedAt: new Date(),
          entries: [
            { id: 'je-2', tenantId: 't', journalId: 'j-2', accountId: 'exp-1', debit: 2000 as never, credit: 0 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
            { id: 'je-3', tenantId: 't', journalId: 'j-2', accountId: 'ast-2', debit: 3000 as never, credit: 0 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
          ]
        } as never,
      ]);

      const result = await service.getCashFlow('t', 'org-1', '2026-01-01', '2026-12-31');

      expect(result).toBeDefined();
      expect(result.operatingActivities).toBeDefined();
      expect(result.investingActivities).toBeDefined();
      expect(result.financingActivities).toBeDefined();
      expect(result.period).toBeDefined();
    });
  });

  describe('getTrialBalance', () => {
    it('should return trial balance with balanced totals', async () => {
      const { prisma } = await import('@unerp/database');

      // Mock accounts
      vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
        { id: 'acc-1', code: '1000', name: 'Cash', type: 'ASSET', tenantId: 't', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
        { id: 'acc-2', code: '2000', name: 'AP', type: 'LIABILITY', tenantId: 't', orgId: 'org-1', parentId: null, isActive: true, balance: 0 as never, createdAt: new Date(), updatedAt: new Date() },
      ]);

      // Mock journal entries
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValueOnce([
        { id: 'je-1', tenantId: 't', journalId: 'j-1', accountId: 'acc-1', debit: 5000 as never, credit: 0 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
        { id: 'je-2', tenantId: 't', journalId: 'j-1', accountId: 'acc-2', debit: 0 as never, credit: 5000 as never, description: null, departmentId: null, costCenterId: null, projectId: null, createdAt: new Date() },
      ]);

      const result = await service.getTrialBalance('t', 'org-1', '2026-12-31');

      expect(result).toBeDefined();
      expect(result.accounts).toHaveLength(2);
      expect(result.totalDebits).toBe(5000);
      expect(result.totalCredits).toBe(5000);
      expect(result.isBalanced).toBe(true);
      expect(result.asOfDate).toBe('2026-12-31');
    });
  });

  describe('getAgingReport', () => {
    it('should return AR aging report with correct buckets', async () => {
      const { prisma } = await import('@unerp/database');

      const today = new Date('2026-06-13');
      const daysAgo = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
      };

      // Mock invoices for AR
      // inv-1: due 45 days ago → 45 days overdue → '31-60' bucket
      // inv-2: due 95 days ago → 95 days overdue → '90+' bucket
      vi.mocked(prisma.invoice.findMany).mockResolvedValueOnce([
        {
          id: 'inv-1', tenantId: 't', orgId: 'org-1', customerId: 'c-1', invoiceNumber: 'INV-001',
          status: 'SENT', issueDate: daysAgo(60), dueDate: daysAgo(45),
          subtotal: 1000 as never, taxAmount: 100 as never, discountAmount: 0 as never, totalAmount: 1100 as never, paidAmount: 0 as never,
          currency: 'USD', exchangeRate: 1 as never, notes: null, internalNotes: null,
          paidAt: null, sentAt: null, createdBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
          customer: { id: 'c-1', name: 'Acme Corp' }
        } as never,
        {
          id: 'inv-2', tenantId: 't', orgId: 'org-1', customerId: 'c-2', invoiceNumber: 'INV-002',
          status: 'SENT', issueDate: daysAgo(120), dueDate: daysAgo(95),
          subtotal: 2000 as never, taxAmount: 200 as never, discountAmount: 0 as never, totalAmount: 2200 as never, paidAmount: 500 as never,
          currency: 'USD', exchangeRate: 1 as never, notes: null, internalNotes: null,
          paidAt: null, sentAt: null, createdBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
          customer: { id: 'c-2', name: 'Beta Inc' }
        } as never,
      ]);

      const result = await service.getAgingReport('t', 'org-1', 'AR', today.toISOString());

      expect(result).toBeDefined();
      expect(result.type).toBe('AR');
      expect(result.totalItems).toBe(2);
      expect(result.bucketTotals['31-60']).toBeDefined();
      expect(result.bucketTotals['90+']).toBeDefined();
      expect(result.bucketTotals['31-60']?.count).toBe(1);
      expect(result.bucketTotals['90+']?.count).toBe(1);
    });

    it('should return AP aging report', async () => {
      const { prisma } = await import('@unerp/database');

      const today = new Date('2026-06-13');
      const daysAgo = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
      };

      vi.mocked(prisma.purchaseOrder.findMany).mockResolvedValueOnce([
        {
          id: 'po-1', tenantId: 't', orgId: 'org-1', vendorId: 'v-1', poNumber: 'PO-001',
          status: 'SUBMITTED', orderDate: daysAgo(45), expectedDate: null,
          subtotal: 500 as never, taxAmount: 50 as never, discountAmount: 0 as never, totalAmount: 550 as never,
          currency: 'USD', shippingAddress: null, notes: null, internalNotes: null,
          approvedBy: null, approvedAt: null, createdBy: null, createdAt: daysAgo(45), updatedAt: new Date(), deletedAt: null,
          vendor: { id: 'v-1', name: 'Vendor XYZ' }
        } as never,
      ]);

      const result = await service.getAgingReport('t', 'org-1', 'AP', today.toISOString());

      expect(result).toBeDefined();
      expect(result.type).toBe('AP');
      expect(result.totalItems).toBe(1);
      expect(result.bucketTotals['31-60']?.count).toBe(1);
    });
  });
});