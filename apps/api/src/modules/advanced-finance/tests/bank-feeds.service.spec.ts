import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BankFeedsService } from '../services/bank-feeds.service';
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
  });

  return {
    prisma: {
      bankConnection: createMockPrismaCollection(),
      bankTransaction: createMockPrismaCollection(),
      bankAccount: createMockPrismaCollection(),
      payment: createMockPrismaCollection(),
      journalEntry: createMockPrismaCollection(),
    },
  };
});

describe('BankFeedsService', () => {
  let service: BankFeedsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BankFeedsService();
  });

  describe('getConnections', () => {
    it('should return connection templates with bankAccount join', async () => {
      const mockConnections = [{ id: 'conn-1', bankName: 'Chase' }];
      vi.mocked(prisma.bankConnection.findMany).mockResolvedValue(mockConnections as any);

      const result = await service.getConnections('tenant-1');

      expect(prisma.bankConnection.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockConnections);
    });
  });

  describe('createConnection', () => {
    it('should create connection if bank account exists', async () => {
      const mockAccount = { id: 'acct-1', bankName: 'Chase' };
      const mockConn = { id: 'conn-1', bankName: 'Chase', bankAccountId: 'acct-1' };
      vi.mocked(prisma.bankAccount.findFirst).mockResolvedValue(mockAccount as any);
      vi.mocked(prisma.bankConnection.create).mockResolvedValue(mockConn as any);

      const result = await service.createConnection('tenant-1', 'org-1', {
        bankName: 'Chase',
        accountNumber: '123456',
        accountType: 'CHECKING',
        bankAccountId: 'acct-1',
      });

      expect(prisma.bankAccount.findFirst).toHaveBeenCalled();
      expect(prisma.bankConnection.create).toHaveBeenCalled();
      expect(result).toEqual(mockConn);
    });

    it('should throw NotFoundException if bank account does not exist', async () => {
      vi.mocked(prisma.bankAccount.findFirst).mockResolvedValue(null);

      await expect(
        service.createConnection('tenant-1', 'org-1', {
          bankName: 'Chase',
          accountNumber: '123456',
          accountType: 'CHECKING',
          bankAccountId: 'invalid',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncTransactions', () => {
    it('should create transactions and update sync timestamp', async () => {
      const mockConn = { id: 'conn-1', bankName: 'Chase' };
      vi.mocked(prisma.bankConnection.findFirst).mockResolvedValue(mockConn as any);
      vi.mocked(prisma.bankTransaction.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.bankTransaction.create).mockResolvedValue({ id: 'tx-1' } as any);
      vi.mocked(prisma.bankConnection.update).mockResolvedValue(mockConn as any);

      const result = await service.syncTransactions('tenant-1', 'conn-1');

      expect(prisma.bankConnection.findFirst).toHaveBeenCalled();
      expect(prisma.bankTransaction.create).toHaveBeenCalledTimes(3);
      expect(prisma.bankConnection.update).toHaveBeenCalled();
      expect(result.syncedCount).toBe(3);
    });
  });

  describe('autoMatchTransaction', () => {
    it('should match with Payment if payment exists within date range', async () => {
      const mockTx = { id: 'tx-1', amount: new Prisma.Decimal(120), date: new Date(), status: 'UNMATCHED' };
      const mockPayment = { id: 'pay-1', amount: 120 };
      vi.mocked(prisma.bankTransaction.findFirst).mockResolvedValue(mockTx as any);
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment as any);
      vi.mocked(prisma.bankTransaction.update).mockResolvedValue({ ...mockTx, status: 'MATCHED' } as any);

      const result = await service.autoMatchTransaction('tenant-1', 'tx-1');

      expect(prisma.payment.findFirst).toHaveBeenCalled();
      expect(prisma.bankTransaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { status: 'MATCHED', matchedEntityId: 'pay-1', matchedEntityType: 'PAYMENT' },
      });
      expect(result.matched).toBe(true);
      expect(result.type).toBe('PAYMENT');
    });

    it('should match with JournalEntry if journal matches and no payment matches', async () => {
      const mockTx = { id: 'tx-1', amount: new Prisma.Decimal(-50), date: new Date(), status: 'UNMATCHED' };
      const mockJe = { id: 'je-1', debit: 0, credit: 50 };
      vi.mocked(prisma.bankTransaction.findFirst).mockResolvedValue(mockTx as any);
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.journalEntry.findFirst).mockResolvedValue(mockJe as any);
      vi.mocked(prisma.bankTransaction.update).mockResolvedValue({ ...mockTx, status: 'MATCHED' } as any);

      const result = await service.autoMatchTransaction('tenant-1', 'tx-1');

      expect(prisma.payment.findFirst).toHaveBeenCalled();
      expect(prisma.journalEntry.findFirst).toHaveBeenCalled();
      expect(result.matched).toBe(true);
      expect(result.type).toBe('JOURNAL_ENTRY');
    });
  });

  describe('manualMatchTransaction', () => {
    it('should link transaction to payment', async () => {
      const mockTx = { id: 'tx-1', status: 'UNMATCHED' };
      const mockPayment = { id: 'pay-1' };
      vi.mocked(prisma.bankTransaction.findFirst).mockResolvedValue(mockTx as any);
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment as any);
      vi.mocked(prisma.bankTransaction.update).mockResolvedValue({ ...mockTx, status: 'MATCHED' } as any);

      const result = await service.manualMatchTransaction('tenant-1', 'tx-1', {
        matchedEntityId: 'pay-1',
        matchedEntityType: 'PAYMENT',
      });

      expect(prisma.payment.findFirst).toHaveBeenCalled();
      expect(prisma.bankTransaction.update).toHaveBeenCalled();
      expect(result.status).toBe('MATCHED');
    });
  });

  describe('ignoreTransaction', () => {
    it('should mark status as IGNORED', async () => {
      const mockTx = { id: 'tx-1', status: 'UNMATCHED' };
      vi.mocked(prisma.bankTransaction.findFirst).mockResolvedValue(mockTx as any);
      vi.mocked(prisma.bankTransaction.update).mockResolvedValue({ ...mockTx, status: 'IGNORED' } as any);

      const result = await service.ignoreTransaction('tenant-1', 'tx-1');

      expect(prisma.bankTransaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { status: 'IGNORED' },
      });
      expect(result.status).toBe('IGNORED');
    });
  });
});
