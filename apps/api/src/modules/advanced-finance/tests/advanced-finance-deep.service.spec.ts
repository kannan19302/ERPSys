import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@unerp/database';
import { TaxEngineDeepService } from '../services/tax-engine-deep.service';
import { TreasuryDeepService } from '../services/treasury-deep.service';
import { ApIntelligenceService } from '../services/ap-intelligence.service';
import { ArCollectionsService } from '../services/ar-collections.service';
import { FixedAssetDeepService } from '../services/fixed-asset-deep.service';
import { FpaDeepService } from '../services/fpa-deep.service';
import { RevenueBillingService } from '../services/revenue-billing.service';
import { ComplianceControlsService } from '../services/compliance-controls.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn(),
  });

  const models = [
    'taxJurisdiction', 'taxExemptionCertificate', 'taxReconciliation', 'withholdingCertificate',
    'amendedTaxFiling', 'invoice', 'purchaseOrder', 'payment', 'organization', 'treasuryPosition',
    'hedgeInstrument', 'debtFacility', 'investmentHolding', 'vendorStatement', 'aPDuplicateFlag',
    'aPApprovalPolicy', 'grniRecord', 'aRPromiseToPay', 'aRDispute', 'badDebtProvision', 'fixedAsset',
    'assetDepreciation', 'assetInsurance', 'assetImpairment', 'capitalProject', 'capitalProjectCost',
    'rollingForecast', 'journalEntry', 'headcountPlan', 'budgetComment', 'managementReport', 'budget',
    'billingRule', 'billingMilestone', 'contractModification', 'deferredRevenueRollForward',
    'tieredPricingTable', 'revenueSchedule', 'financialControl', 'controlTest', 'sodRuleDefinition',
    'sodConflict', 'auditConfirmation', 'periodCertification', 'user'
  ];

  const mockPrisma: Record<string, any> = {};
  for (const m of models) {
    mockPrisma[m] = createMockPrismaCollection();
  }

  return { prisma: mockPrisma };
});

describe('Advanced Finance Deep Services (Batches 1-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── BATCH 1: TAX ENGINE DEEP-DIVE ──────────────────────
  describe('TaxEngineDeepService', () => {
    const service = new TaxEngineDeepService();

    it('should create tax jurisdiction', async () => {
      const mockResult = { id: 'jur-1', name: 'US State' };
      vi.mocked(prisma.taxJurisdiction.create).mockResolvedValue(mockResult as any);

      const result = await service.createJurisdiction('tenant-1', {
        name: 'US State', code: 'US-ST', country: 'US', rate: 5, effectiveFrom: '2026-01-01'
      });

      expect(prisma.taxJurisdiction.create).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should compute tax reconciliation', async () => {
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({ _sum: { taxAmount: 100 } } as any);
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({ _sum: { taxAmount: 40 } } as any);
      const mockRec = { id: 'rec-1', netLiability: 60 };
      vi.mocked(prisma.taxReconciliation.create).mockResolvedValue(mockRec as any);

      const result = await service.computeTaxReconciliation('tenant-1', 'org-1', {
        periodStart: '2026-01-01', periodEnd: '2026-01-31', taxType: 'VAT'
      });

      expect(result.netLiability).toBe(60);
    });
  });

  // ── BATCH 2: TREASURY MANAGEMENT DEEPENING ──────────────
  describe('TreasuryDeepService', () => {
    const service = new TreasuryDeepService();

    it('should calculate projected net liquidity', async () => {
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({ _sum: { totalAmount: 5000 } } as any);
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({ _sum: { totalAmount: 2000 } } as any);

      const result = await service.getLiquidityForecast('tenant-1', 30);
      expect(result.netLiquidity).toBe(3000);
    });

    it('should record debt drawdown', async () => {
      vi.mocked(prisma.debtFacility.findFirst).mockResolvedValue({ id: 'fac-1', facilityLimit: 10000, drawnAmount: 1000 } as any);
      vi.mocked(prisma.debtFacility.update).mockResolvedValue({ id: 'fac-1', drawnAmount: 2000 } as any);

      const result = await service.recordDebtDrawdown('tenant-1', 'fac-1', 1000);
      expect(result.drawnAmount).toBe(2000);
    });
  });

  // ── BATCH 3: AP INTELLIGENCE ───────────────────────────
  describe('ApIntelligenceService', () => {
    const service = new ApIntelligenceService();

    it('should scan for duplicates', async () => {
      const mockInvoices = [
        { id: 'inv-1', totalAmount: 100, customerId: 'cust-1', issueDate: new Date('2026-07-01') },
        { id: 'inv-2', totalAmount: 100, customerId: 'cust-1', issueDate: new Date('2026-07-02') }
      ];
      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
      vi.mocked(prisma.aPDuplicateFlag.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.aPDuplicateFlag.create).mockResolvedValue({ id: 'flag-1' } as any);

      const result = await service.runDuplicateScan('tenant-1');
      expect(result.flagged).toBe(1);
    });

    it('should get GRNI aging categories', async () => {
      const mockRecords = [
        { id: 'grni-1', totalValue: 500, receivedDate: new Date() },
        { id: 'grni-2', totalValue: 1500, receivedDate: new Date(Date.now() - 40 * 86400000) }
      ];
      vi.mocked(prisma.grniRecord.findMany).mockResolvedValue(mockRecords as any);

      const result = await service.getGrniAging('tenant-1');
      expect(result.buckets['0-30']).toBe(500);
      expect(result.buckets['31-60']).toBe(1500);
    });
  });

  // ── BATCH 4: AR COLLECTIONS ───────────────────────────
  describe('ArCollectionsService', () => {
    const service = new ArCollectionsService();

    it('should check broken promises', async () => {
      const mockBroken = [
        { id: 'p-1', promisedAmount: 1000, receivedAmount: 200 }
      ];
      vi.mocked(prisma.aRPromiseToPay.findMany).mockResolvedValue(mockBroken as any);
      vi.mocked(prisma.aRPromiseToPay.update).mockResolvedValue({ id: 'p-1', status: 'BROKEN' } as any);

      const result = await service.checkBrokenPromises('tenant-1');
      expect(result.brokenCount).toBe(1);
    });

    it('should calculate bad debt provisions', async () => {
      const mockInvoices = [
        { id: 'inv-1', totalAmount: 1000, dueDate: new Date(Date.now() - 100 * 86400000), status: 'SENT' }
      ];
      vi.mocked(prisma.invoice.findMany).mockResolvedValue(mockInvoices as any);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1' } as any);
      vi.mocked(prisma.badDebtProvision.create).mockResolvedValue({ id: 'prov-1', provisionAmount: 100 } as any);

      const result = await service.computeBadDebtProvision('tenant-1', '2026-07');
      expect(result.provisionAmount).toBe(100);
    });
  });

  // ── BATCH 5: FIXED ASSET DEEPENING ──────────────────────
  describe('FixedAssetDeepService', () => {
    const service = new FixedAssetDeepService();

    it('should preview depreciation schedule', async () => {
      const mockAsset = { id: 'asset-1', purchaseValue: 12000, salvageValue: 0, usefulLifeYears: 1, purchaseDate: new Date('2026-01-01') };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);

      const result = await service.getDepreciationSchedulePreview('tenant-1', 'asset-1');
      expect(result.usefulLifeMonths).toBe(12);
      expect(result.monthlyDepreciation).toBe(1000);
      expect(result.schedule[11]!.bookValue).toBe(0);
    });
  });

  // ── BATCH 6: FP&A DEEPENING ────────────────────────────
  describe('FpaDeepService', () => {
    const service = new FpaDeepService();

    it('should run what-if sensitivity analysis', async () => {
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({ _sum: { totalAmount: 10000 } } as any);
      vi.mocked(prisma.purchaseOrder.aggregate).mockResolvedValue({ _sum: { totalAmount: 6000 } } as any);

      const result = await service.runWhatIfSensitivity('tenant-1', {
        revenueChangePct: 10, costChangePct: -5
      });

      expect(result.base.profit).toBe(4000);
      expect(result.scenario.revenue).toBe(11000);
      expect(result.scenario.cost).toBe(5700);
      expect(result.scenario.profit).toBe(5300);
    });
  });

  // ── BATCH 7: REVENUE & BILLING ────────────────────────
  describe('RevenueBillingService', () => {
    const service = new RevenueBillingService();

    it('should calculate revenue schedule recognition asOf', async () => {
      const mockSchedule = {
        totalAmount: 12000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        recognitionType: 'STRAIGHT_LINE'
      };

      const result = (service as any).calculateRecognizedAsOf(mockSchedule, new Date('2026-06-30'));
      expect(result).toBe(6000);
    });
  });

  // ── BATCH 8: COMPLIANCE & CONTROLS ────────────────────
  describe('ComplianceControlsService', () => {
    const service = new ComplianceControlsService();

    it('should compute control effectiveness pass rates', async () => {
      const mockTests = [
        { id: 't-1', result: 'EFFECTIVE', control: { ownerId: 'user-1' } },
        { id: 't-2', result: 'EFFECTIVE', control: { ownerId: 'user-1' } },
        { id: 't-3', result: 'DEFICIENT', control: { ownerId: 'user-1' } }
      ];
      vi.mocked(prisma.controlTest.findMany).mockResolvedValue(mockTests as any);

      const result = await service.getControlEffectivenessDashboard('tenant-1');
      expect(result.passRate).toBe('66.7');
      expect(result.deficiencies).toBe(1);
    });
  });
});
