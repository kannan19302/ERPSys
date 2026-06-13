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
    { method: 'createAccount', args: ['tenant-1', 'org-1', { code: '1000' }] },
    { method: 'createCostCenter', args: ['tenant-1', 'org-1', { code: 'C100' }] },
    { method: 'createBankReconciliation', args: ['tenant-1', { statementDate: new Date().toISOString(), statementBalance: 100 }] },
    { method: 'createFinancialPeriod', args: ['tenant-1', 'org-1', { startDate: new Date().toISOString(), endDate: new Date().toISOString() }] },
    { method: 'updateFinancialPeriodStatus', args: ['tenant-1', 'period-1', 'CLOSED'] },
    { method: 'createFixedAsset', args: ['tenant-1', 'org-1', { purchaseDate: new Date().toISOString(), purchaseValue: 100, salvageValue: 10 }] },
    { method: 'createBankAccount', args: ['tenant-1', 'org-1', {}] },
    { method: 'createCreditNote', args: ['tenant-1', 'org-1', {}] },
    { method: 'createDebitNote', args: ['tenant-1', 'org-1', {}] },
    { method: 'createDunningLevel', args: ['tenant-1', 'org-1', {}] },
    { method: 'createPaymentSchedule', args: ['tenant-1', 'org-1', {}] },
    { method: 'createPaymentRun', args: ['tenant-1', 'org-1', {}] },
    { method: 'createForecastScenario', args: ['tenant-1', 'org-1', {}] },
    { method: 'createTaxRule', args: ['tenant-1', 'org-1', {}] },
    { method: 'createWithholdingTax', args: ['tenant-1', 'org-1', {}] },
    { method: 'createTaxFiling', args: ['tenant-1', 'org-1', {}] },
    { method: 'createInvestmentPortfolio', args: ['tenant-1', 'org-1', {}] },
    { method: 'createTreasuryTransaction', args: ['tenant-1', 'org-1', {}] },
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

      // pass undefined/null for orgId to trigger lines 568-570, 579-581, etc.
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
});
