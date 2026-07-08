import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InterCompanyService } from '../services/intercompany.service';
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
      interCompanyTransaction: createMockPrismaCollection(),
      invoice: createMockPrismaCollection(),
      paymentSchedule: createMockPrismaCollection(),
      account: createMockPrismaCollection(),
      journal: createMockPrismaCollection(),
    },
  };
});

describe('InterCompanyService', () => {
  let service: InterCompanyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InterCompanyService();
  });

  describe('getTransactions', () => {
    it('should query intercompany transactions with skip and take limit', async () => {
      const mockTxs = [{ id: 'tx-1', status: 'PENDING' }];
      vi.mocked(prisma.interCompanyTransaction.findMany).mockResolvedValue(mockTxs as any);
      vi.mocked(prisma.interCompanyTransaction.count).mockResolvedValue(1);

      const result = await service.getTransactions('tenant-1', { page: 2, limit: 10 });

      expect(prisma.interCompanyTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.items).toEqual(mockTxs);
      expect(result.total).toBe(1);
    });
  });

  describe('autoMatchTransactions', () => {
    it('should match an AR Invoice to a Buyer AP PaymentSchedule when amounts, mismatching orgs and dates align', async () => {
      const now = new Date();
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { id: 'inv-1', tenantId: 'tenant-1', orgId: 'org-A', totalAmount: new Prisma.Decimal(5000), dueDate: now, currency: 'USD' },
      ] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([
        { id: 'sched-1', tenantId: 'tenant-1', orgId: 'org-B', amount: new Prisma.Decimal(5000), dueDate: now },
      ] as any);
      vi.mocked(prisma.interCompanyTransaction.findFirst).mockResolvedValue(null);

      const result = await service.autoMatchTransactions('tenant-1');

      expect(prisma.interCompanyTransaction.create).toHaveBeenCalled();
      expect(result.matchCount).toBe(1);
    });

    it('should skip creating matched logs if invoice has already been auto matched', async () => {
      const now = new Date();
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { id: 'inv-1', tenantId: 'tenant-1', orgId: 'org-A', totalAmount: new Prisma.Decimal(5000), dueDate: now, currency: 'USD' },
      ] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([
        { id: 'sched-1', tenantId: 'tenant-1', orgId: 'org-B', amount: new Prisma.Decimal(5000), dueDate: now },
      ] as any);
      vi.mocked(prisma.interCompanyTransaction.findFirst).mockResolvedValue({ id: 'existing-tx' } as any);

      const result = await service.autoMatchTransactions('tenant-1');

      expect(prisma.interCompanyTransaction.create).not.toHaveBeenCalled();
      expect(result.matchCount).toBe(0);
    });
  });

  describe('manualMatchTransactions', () => {
    it('should throw BadRequestException if matching orgs are same', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'inv-1', orgId: 'org-A', totalAmount: 3000 } as any);
      vi.mocked(prisma.paymentSchedule.findFirst).mockResolvedValue({ id: 'sched-1', orgId: 'org-A', amount: 3000 } as any);

      await expect(
        service.manualMatchTransactions('tenant-1', { fromInvoiceId: 'inv-1', toInvoiceId: 'sched-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create manual intercompany log if valid mismatching orgs are linked', async () => {
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({ id: 'inv-1', orgId: 'org-A', totalAmount: 3000, dueDate: new Date() } as any);
      vi.mocked(prisma.paymentSchedule.findFirst).mockResolvedValue({ id: 'sched-1', orgId: 'org-B', amount: 3000 } as any);
      vi.mocked(prisma.interCompanyTransaction.findFirst).mockResolvedValue(null);

      await service.manualMatchTransactions('tenant-1', { fromInvoiceId: 'inv-1', toInvoiceId: 'sched-1' });

      expect(prisma.interCompanyTransaction.create).toHaveBeenCalled();
    });
  });

  describe('eliminateTransaction', () => {
    it('should create elimination journal postings and close source schedules', async () => {
      const mockTx = {
        id: 'tx-1',
        tenantId: 'tenant-1',
        fromOrgId: 'org-A',
        toOrgId: 'org-B',
        amount: new Prisma.Decimal(4000),
        status: 'MATCHED',
        fromInvoiceId: 'inv-1',
        toInvoiceId: 'sched-1',
        description: 'Test netting',
      };

      vi.mocked(prisma.interCompanyTransaction.findFirst).mockResolvedValue(mockTx as any);
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'acc-1' } as any);
      vi.mocked(prisma.journal.create).mockResolvedValue({ id: 'j-1' } as any);

      await service.eliminateTransaction('tenant-1', 'tx-1');

      expect(prisma.journal.create).toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({ status: 'PAID' }),
      });
      expect(prisma.paymentSchedule.update).toHaveBeenCalledWith({
        where: { id: 'sched-1' },
        data: { status: 'PAID' },
      });
      expect(prisma.interCompanyTransaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { status: 'ELIMINATED', eliminationJournalId: 'j-1' },
      });
    });
  });
});
