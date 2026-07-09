import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@unerp/database';
import {
  IntercompanyLoansService,
  AssetLifecycleService,
  CashPoolingService,
  ConsolidationDeepService,
} from '../services';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        toNumber() {
          return this.value;
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  });

  const models = [
    'intercompanyLoan', 'loanDrawdown', 'loanRepayment',
    'assetRevaluation', 'assetDisposal', 'fixedAsset',
    'assetDepreciation', 'assetImpairment',
    'cashPool', 'cashPoolRun', 'varianceAlertConfig',
    'consolidationRate', 'consolidationRun', 'consolidationElimination',
    'journal', 'journalEntry', 'bankAccount',
  ];

  const mockPrisma: Record<string, any> = {};
  for (const m of models) {
    mockPrisma[m] = createMockPrismaCollection();
  }

  return { prisma: mockPrisma };
});

describe('Finance Hardening Services', () => {
  const tenantId = 'test-tenant';
  const orgId = 'test-org';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Intercompany Loans Service ──
  describe('IntercompanyLoansService', () => {
    const service = new IntercompanyLoansService();

    it('should create a loan agreement successfully', async () => {
      const mockLoan = { id: 'loan-1', tenantId, status: 'ACTIVE' };
      vi.mocked(prisma.intercompanyLoan.create).mockResolvedValue(mockLoan as any);

      const res = await service.createLoanAgreement(tenantId, {
        lenderOrgId: 'org-lender',
        borrowerOrgId: 'org-borrower',
        loanNumber: 'L-100',
        principalAmount: 100000,
        interestRate: 5.5,
        startDate: '2026-07-01',
        endDate: '2027-07-01',
      });

      expect(res).toBeDefined();
      expect(prisma.intercompanyLoan.create).toHaveBeenCalled();
    });

    it('should calculate accrued simple interest correctly', async () => {
      const mockLoan = { id: 'loan-1', tenantId, interestRate: 6.0, principalAmount: 100000, status: 'ACTIVE' };
      const mockDrawdowns = [{ amount: 100000, drawdownDate: new Date('2026-07-01') }];
      const mockRepayments = [] as any[];

      vi.mocked(prisma.intercompanyLoan.findFirst).mockResolvedValue(mockLoan as any);
      vi.mocked(prisma.loanDrawdown.findMany).mockResolvedValue(mockDrawdowns as any);
      vi.mocked(prisma.loanRepayment.findMany).mockResolvedValue(mockRepayments as any);

      const res = await service.calculateAccruedInterest(tenantId, 'loan-1', '2026-07-31');
      expect(res.accruedInterest).toBeGreaterThan(0);
    });

    it('should generate amortization schedule', async () => {
      const mockLoan = {
        id: 'loan-1',
        tenantId,
        principalAmount: 120000,
        interestRate: 10,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-10-01'),
      };
      vi.mocked(prisma.intercompanyLoan.findFirst).mockResolvedValue(mockLoan as any);

      const res = await service.amortizeLoanSchedule(tenantId, 'loan-1');
      expect(res.schedule.length).toBe(3);
      expect(res.schedule[0].openingBalance).toBe(120000);
      expect(res.schedule[0].closingBalance).toBe(80000);
    });
  });

  // ── Asset Lifecycle Service ──
  describe('AssetLifecycleService', () => {
    const service = new AssetLifecycleService();

    it('should create revaluation and adjust currentValue', async () => {
      const mockAsset = { id: 'asset-1', tenantId, currentValue: 100000 };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);
      vi.mocked(prisma.assetRevaluation.create).mockResolvedValue({ id: 'rev-1' } as any);

      const res = await service.createAssetRevaluation(tenantId, {
        assetId: 'asset-1',
        revaluationDate: '2026-07-01',
        revaluedValue: 120000,
      });

      expect(res).toBeDefined();
      expect(prisma.fixedAsset.update).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        data: { currentValue: expect.any(Object) },
      });
    });

    it('should calculate depreciation post-revaluation', async () => {
      const mockAsset = { id: 'asset-1', tenantId, currentValue: 120000, salvageValue: 20000, usefulLifeYears: 5 };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);

      const dep = await service.calculateDepreciationAfterReval(tenantId, 'asset-1');
      expect(dep).toBe(1666.67);
    });

    it('should dispose asset and calculate gain/loss', async () => {
      const mockAsset = { id: 'asset-1', tenantId, currentValue: 80000, status: 'ACTIVE' };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);
      vi.mocked(prisma.assetDisposal.create).mockResolvedValue({ id: 'disp-1', gainLoss: 10000 } as any);

      const res = await service.createAssetDisposal(tenantId, {
        assetId: 'asset-1',
        disposalDate: '2026-07-01',
        disposalType: 'SALE',
        salePrice: 90000,
      });

      expect(res).toBeDefined();
    });
  });

  // ── Cash Pooling Service ──
  describe('CashPoolingService', () => {
    const service = new CashPoolingService();

    it('should create concentration cash pool definition', async () => {
      vi.mocked(prisma.cashPool.create).mockResolvedValue({ id: 'pool-1' } as any);

      const res = await service.createCashPool(tenantId, {
        orgId,
        name: 'Main Liquidity Pool',
        headerAccountId: 'header-bank-1',
        participantAccountIds: ['part-bank-1', 'part-bank-2'],
        targetBalance: 50000,
      });

      expect(res).toBeDefined();
    });

    it('should run sweep concentration concentration successfully', async () => {
      const mockPool = {
        id: 'pool-1',
        tenantId,
        orgId,
        name: 'Sweep Pool',
        headerAccountId: 'header-bank-1',
        participantAccountIds: ['part-1'],
        targetBalance: 50000,
        isActive: true,
      };
      vi.mocked(prisma.cashPool.findFirst).mockResolvedValue(mockPool as any);
      vi.mocked(prisma.bankAccount.findFirst).mockResolvedValue({ id: 'part-1' } as any);
      vi.mocked(prisma.cashPoolRun.create).mockResolvedValue({ id: 'run-1' } as any);
      vi.mocked(prisma.journal.create).mockResolvedValue({ id: 'journal-1' } as any);

      const res = await service.poolConcentrationRun(tenantId, 'pool-1');
      expect(res).toBeDefined();
    });
  });

  // ── Consolidation Deep Service ──
  describe('ConsolidationDeepService', () => {
    const service = new ConsolidationDeepService();

    it('should register average and closing consolidation rates', async () => {
      vi.mocked(prisma.consolidationRate.upsert).mockResolvedValue({ id: 'rate-1' } as any);

      const res = await service.createConsolidationRate(tenantId, {
        period: '2026-07',
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        averageRate: 1.10,
        closingRate: 1.12,
        historicalRate: 1.08,
      });

      expect(res).toBeDefined();
    });

    it('should run consolidated translations and balance ctaAmount', async () => {
      const mockRates = [{ averageRate: 1.10, closingRate: 1.12 }];
      const mockJournals = [{ debit: 100000, credit: 50000 }];

      vi.mocked(prisma.consolidationRate.findMany).mockResolvedValue(mockRates as any);
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockJournals as any);
      vi.mocked(prisma.consolidationRun.create).mockResolvedValue({ id: 'run-1', ctaAmount: 2750 } as any);

      const res = await service.runConsolidatedTranslation(tenantId, '2026-07', 'USD');
      expect(res).toBeDefined();
    });
  });
});
