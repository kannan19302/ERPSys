import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FxRevaluationService } from '../services/fx-revaluation.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
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
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      fxRevaluationRun: createMockPrismaCollection(),
      fxRevaluationDetail: createMockPrismaCollection(),
      exchangeRate: createMockPrismaCollection(),
      account: createMockPrismaCollection(),
      invoice: createMockPrismaCollection(),
      paymentSchedule: createMockPrismaCollection(),
      journal: createMockPrismaCollection(),
    },
  };
});

describe('FxRevaluationService', () => {
  let service: FxRevaluationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FxRevaluationService();
  });

  describe('getRevaluationRuns', () => {
    it('should retrieve list of runs', async () => {
      const mockRuns = [{ id: 'run-1', targetCurrency: 'EUR' }];
      vi.mocked(prisma.fxRevaluationRun.findMany).mockResolvedValue(mockRuns as any);

      const result = await service.getRevaluationRuns('tenant-1');

      expect(prisma.fxRevaluationRun.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRuns);
    });
  });

  describe('createRevaluationRun', () => {
    it('should scan open customer invoices in targetCurrency and calculate draft gains', async () => {
      const runDate = new Date();
      vi.mocked(prisma.exchangeRate.findFirst).mockResolvedValue({ rate: new Prisma.Decimal(1.10) } as any);
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { id: 'inv-1', totalAmount: new Prisma.Decimal(1000), paidAmount: new Prisma.Decimal(0), exchangeRate: new Prisma.Decimal(1.05), dueDate: runDate },
      ] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.fxRevaluationRun.create).mockResolvedValue({ id: 'run-1', status: 'DRAFT' } as any);

      const result = await service.createRevaluationRun('tenant-1', 'org-1', {
        runDate,
        targetCurrency: 'EUR',
      });

      expect(prisma.fxRevaluationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            targetCurrency: 'EUR',
            status: 'DRAFT',
            details: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  entityType: 'INVOICE',
                  entityId: 'inv-1',
                  balanceInForeign: new Prisma.Decimal(1000),
                  originalAmountBase: new Prisma.Decimal(1050), // 1000 * 1.05
                  revaluedAmountBase: new Prisma.Decimal(1100), // 1000 * 1.10
                  unrealizedGainLoss: new Prisma.Decimal(50), // 1100 - 1050
                }),
              ]),
            }),
          }),
        }),
      );
      expect(result.id).toBe('run-1');
    });
  });

  describe('postRevaluationRun', () => {
    it('should throw BadRequestException if run is already posted', async () => {
      vi.mocked(prisma.fxRevaluationRun.findFirst).mockResolvedValue({ id: 'run-1', status: 'POSTED', details: [] } as any);

      await expect(service.postRevaluationRun('tenant-1', 'run-1')).rejects.toThrow(BadRequestException);
    });

    it('should post general ledger entries for gains and losses', async () => {
      const mockDetails = [
        { accountId: 'acc-ar', entityType: 'INVOICE', entityId: 'inv-1', unrealizedGainLoss: new Prisma.Decimal(150) },
        { accountId: 'acc-ap', entityType: 'PAYMENT_SCHEDULE', entityId: 'sched-1', unrealizedGainLoss: new Prisma.Decimal(-80) },
      ];
      vi.mocked(prisma.fxRevaluationRun.findFirst).mockResolvedValue({ id: 'run-1', orgId: 'org-1', status: 'DRAFT', details: mockDetails, runDate: new Date(), targetCurrency: 'EUR' } as any);
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'acc-unrealized' } as any);
      vi.mocked(prisma.journal.create).mockResolvedValue({ id: 'j-fx' } as any);
      vi.mocked(prisma.fxRevaluationRun.update).mockResolvedValue({ id: 'run-1', status: 'POSTED' } as any);

      await service.postRevaluationRun('tenant-1', 'run-1');

      expect(prisma.journal.create).toHaveBeenCalled();
      expect(prisma.fxRevaluationRun.update).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        data: { status: 'POSTED', journalId: 'j-fx' },
      });
    });
  });
});
