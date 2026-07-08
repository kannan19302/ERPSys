import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseManagementService } from '../services/expense-management.service';
import { GlAccountingService } from '../services/gl-accounting.service';
import { prisma } from '@unerp/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
        valueOf() {
          return this.value;
        }
        toFixed(decimals: number) {
          return this.value.toFixed(decimals);
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    $transaction: vi.fn(),
  });

  return {
    prisma: {
      expenseReport: createMockPrismaCollection(),
      expenseReportItem: createMockPrismaCollection(),
      expenseCategoryPolicy: createMockPrismaCollection(),
      mileageRate: createMockPrismaCollection(),
      perDiemRate: createMockPrismaCollection(),
      corporateCard: createMockPrismaCollection(),
      corporateCardTransaction: createMockPrismaCollection(),
      employee: createMockPrismaCollection(),
      account: createMockPrismaCollection(),
      $transaction: vi.fn(),
    },
  };
});

const TENANT = 'tenant-1';

describe('ExpenseManagementService', () => {
  let service: ExpenseManagementService;
  let glService: GlAccountingService;

  beforeEach(() => {
    vi.clearAllMocks();
    glService = new GlAccountingService();
    service = new ExpenseManagementService(glService);
  });

  describe('addExpenseItem — policy engine', () => {
    it('flags a policy violation when amount exceeds the category max', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      vi.mocked(prisma.expenseCategoryPolicy.findFirst).mockResolvedValue({
        maxAmountPerItem: 100,
        receiptRequiredAbove: 0,
        isActive: true,
      } as any);
      vi.mocked(prisma.expenseReportItem.create).mockResolvedValue({ id: 'item-1' } as any);
      vi.mocked(prisma.expenseReportItem.findMany).mockResolvedValue([{ amount: 250, taxAmount: 0, policyViolation: true }] as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({} as any);

      await service.addExpenseItem(TENANT, 'rep-1', {
        category: 'MEALS',
        description: 'Team dinner',
        amount: 250,
        expenseDate: '2026-07-01',
      });

      const createCall = vi.mocked(prisma.expenseReportItem.create).mock.calls[0][0] as any;
      expect(createCall.data.policyViolation).toBe(true);
      expect(createCall.data.policyViolationReason).toContain('Exceeds per-item limit');
    });

    it('rejects adding items to a non-DRAFT report', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'SUBMITTED' } as any);
      await expect(
        service.addExpenseItem(TENANT, 'rep-1', { category: 'MEALS', description: 'x', amount: 10, expenseDate: '2026-07-01' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addExpenseItem — mileage & per diem', () => {
    it('computes amount from mileage distance × configured rate', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      vi.mocked(prisma.mileageRate.findFirst).mockResolvedValue({ ratePerMile: 0.67 } as any);
      vi.mocked(prisma.expenseCategoryPolicy.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.expenseReportItem.create).mockResolvedValue({ id: 'item-1' } as any);
      vi.mocked(prisma.expenseReportItem.findMany).mockResolvedValue([{ amount: 67, taxAmount: 0, policyViolation: false }] as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({} as any);

      await service.addExpenseItem(TENANT, 'rep-1', {
        category: 'MILEAGE',
        description: 'Client visit drive',
        amount: 0,
        expenseDate: '2026-07-01',
        isMileage: true,
        mileageDistance: 100,
      });

      const createCall = vi.mocked(prisma.expenseReportItem.create).mock.calls[0][0] as any;
      expect(Number(createCall.data.amount)).toBe(67);
    });

    it('throws if no mileage rate is configured for the date', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      vi.mocked(prisma.mileageRate.findFirst).mockResolvedValue(null);

      await expect(
        service.addExpenseItem(TENANT, 'rep-1', {
          category: 'MILEAGE', description: 'x', amount: 0, expenseDate: '2026-07-01', isMileage: true, mileageDistance: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes amount from per-diem days × configured location rate', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      vi.mocked(prisma.perDiemRate.findFirst).mockResolvedValue({ dailyRate: 75 } as any);
      vi.mocked(prisma.expenseCategoryPolicy.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.expenseReportItem.create).mockResolvedValue({ id: 'item-1' } as any);
      vi.mocked(prisma.expenseReportItem.findMany).mockResolvedValue([{ amount: 225, taxAmount: 0, policyViolation: false }] as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({} as any);

      await service.addExpenseItem(TENANT, 'rep-1', {
        category: 'PER_DIEM',
        description: 'Conference trip',
        amount: 0,
        expenseDate: '2026-07-01',
        isPerDiem: true,
        perDiemDays: 3,
        perDiemLocation: 'NYC',
      });

      const createCall = vi.mocked(prisma.expenseReportItem.create).mock.calls[0][0] as any;
      expect(Number(createCall.data.amount)).toBe(225);
    });
  });

  describe('scanReceipt — simulated OCR', () => {
    it('extracts merchant, amount, date, and suggests a category from receipt text', async () => {
      const result = await service.scanReceipt(TENANT, {
        fileName: 'receipt.jpg',
        rawText: 'Marriott Hotel\n2026-06-15\nTotal: $189.50',
      });

      expect(result.extracted.amount).toBe(189.5);
      expect(result.extracted.date).toBe('2026-06-15');
      expect(result.extracted.suggestedCategory).toBe('TRAVEL');
      expect(result.ocrConfidence).toBeGreaterThan(0);
    });

    it('returns low confidence when no amount or date can be extracted', async () => {
      const result = await service.scanReceipt(TENANT, { fileName: 'blank.jpg', rawText: '' });
      expect(result.extracted.amount).toBeNull();
      expect(result.extracted.date).toBeNull();
      expect(result.ocrConfidence).toBeLessThan(0.5);
    });
  });

  describe('submitExpenseReport', () => {
    it('rejects submitting a report with zero line items', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      vi.mocked(prisma.expenseReportItem.count).mockResolvedValue(0);

      await expect(service.submitExpenseReport(TENANT, 'rep-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveExpenseReport — second-approval routing', () => {
    it('routes to PENDING_SECOND_APPROVAL when the report requires second approval', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({
        id: 'rep-1', status: 'SUBMITTED', requiresSecondApproval: true,
      } as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({ status: 'PENDING_SECOND_APPROVAL' } as any);

      const result = await service.approveExpenseReport(TENANT, 'rep-1', 'user-1');

      expect(prisma.expenseReport.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING_SECOND_APPROVAL' }) }),
      );
      expect(result.status).toBe('PENDING_SECOND_APPROVAL');
    });

    it('goes straight to APPROVED when second approval is not required', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({
        id: 'rep-1', status: 'SUBMITTED', requiresSecondApproval: false,
      } as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({ status: 'APPROVED' } as any);

      const result = await service.approveExpenseReport(TENANT, 'rep-1', 'user-1');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('secondApproveExpenseReport', () => {
    it('rejects second approval unless status is PENDING_SECOND_APPROVAL', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'APPROVED' } as any);
      await expect(service.secondApproveExpenseReport(TENANT, 'rep-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markExpenseReportPaid — GL posting', () => {
    it('posts a balanced reimbursement journal and stores the journal id', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({
        id: 'rep-1', orgId: 'org-1', status: 'APPROVED', totalAmount: 500, reportNumber: 'EXP-1',
      } as any);
      vi.mocked(prisma.account.findFirst)
        .mockResolvedValueOnce({ id: 'exp-acc' } as any)
        .mockResolvedValueOnce({ id: 'cash-acc' } as any);
      vi.spyOn(glService, 'createJournal').mockResolvedValue({ id: 'journal-1' } as any);
      vi.mocked(prisma.expenseReport.update).mockResolvedValue({ status: 'PAID', glJournalId: 'journal-1' } as any);

      const result = await service.markExpenseReportPaid(TENANT, 'rep-1');

      expect(glService.createJournal).toHaveBeenCalledWith(
        TENANT,
        'org-1',
        expect.objectContaining({
          entries: [
            expect.objectContaining({ accountId: 'exp-acc', debit: 500, credit: 0 }),
            expect.objectContaining({ accountId: 'cash-acc', debit: 0, credit: 500 }),
          ],
        }),
      );
      expect(result.glJournalId).toBe('journal-1');
    });

    it('rejects paying a report that is not APPROVED', async () => {
      vi.mocked(prisma.expenseReport.findFirst).mockResolvedValue({ id: 'rep-1', status: 'DRAFT' } as any);
      await expect(service.markExpenseReportPaid(TENANT, 'rep-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('corporate card matching', () => {
    it('matches a card transaction to an expense item and marks it MATCHED', async () => {
      vi.mocked(prisma.corporateCardTransaction.findFirst).mockResolvedValue({ id: 'txn-1' } as any);
      vi.mocked(prisma.expenseReportItem.findFirst).mockResolvedValue({ id: 'item-1' } as any);
      vi.mocked(prisma.expenseReportItem.update).mockResolvedValue({} as any);
      vi.mocked(prisma.corporateCardTransaction.update).mockResolvedValue({ id: 'txn-1', status: 'MATCHED' } as any);

      const result = await service.matchCardTransactionToItem(TENANT, 'txn-1', 'item-1');

      expect(prisma.expenseReportItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { corporateCardTransactionId: 'txn-1' },
      });
      expect(result.status).toBe('MATCHED');
    });

    it('throws NotFoundException for an unknown transaction', async () => {
      vi.mocked(prisma.corporateCardTransaction.findFirst).mockResolvedValue(null);
      await expect(service.matchCardTransactionToItem(TENANT, 'nope', 'item-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExpenseAnalytics', () => {
    it('aggregates spend by category and counts policy violations', async () => {
      vi.mocked(prisma.expenseReportItem.findMany).mockResolvedValue([
        { category: 'TRAVEL', amount: 100, taxAmount: 10, policyViolation: false },
        { category: 'TRAVEL', amount: 50, taxAmount: 0, policyViolation: true },
        { category: 'MEALS', amount: 20, taxAmount: 0, policyViolation: false },
      ] as any);
      vi.mocked(prisma.expenseReport.groupBy).mockResolvedValue([
        { status: 'PAID', _count: { _all: 2 }, _sum: { totalAmount: 180 } },
      ] as any);

      const result = await service.getExpenseAnalytics(TENANT);

      expect(result.totalSpend).toBe(180);
      expect(result.policyViolations).toBe(1);
      expect(result.byCategory).toEqual(
        expect.arrayContaining([
          { category: 'TRAVEL', total: 160, count: 2 },
          { category: 'MEALS', total: 20, count: 1 },
        ]),
      );
    });
  });
});
