import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DebitNotesService } from '../debit-notes.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    debitNote: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    vendor: { findFirst: vi.fn() },
  },
}));

const { prisma } = require('@unerp/database');

describe('DebitNotesService (extra)', () => {
  let service: DebitNotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [DebitNotesService] }).compile();
    service = module.get<DebitNotesService>(DebitNotesService);
    vi.clearAllMocks();
  });

  it('should get debit note by id', async () => {
    const mockNote = { id: '1', noteNumber: 'DN-0001', vendor: { name: 'Vendor A' }, purchaseOrder: { poNumber: 'PO-001' } };
    prisma.debitNote.findFirst.mockResolvedValue(mockNote);

    const result = await service.getById('tenant-1', '1');
    expect(result.id).toBe('1');
  });

  it('should throw NotFoundException for missing debit note', async () => {
    prisma.debitNote.findFirst.mockResolvedValue(null);
    await expect(service.getById('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
  });

  it('should enforce tenant isolation on getById', async () => {
    prisma.debitNote.findFirst.mockResolvedValue(null);
    await expect(service.getById('tenant-2', '1')).rejects.toThrow(NotFoundException);
    expect(prisma.debitNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '1', tenantId: 'tenant-2' } })
    );
  });

  it('should update debit note in DRAFT status', async () => {
    prisma.debitNote.findFirst.mockResolvedValue({ id: '1', status: 'DRAFT' });
    prisma.debitNote.update.mockResolvedValue({ id: '1', amount: 600, reason: 'Updated reason' });

    const result = await service.update('tenant-1', '1', { amount: 600, reason: 'Updated reason' });
    expect(result.amount).toBe(600);
  });

  it('should throw NotFoundException when updating non-DRAFT debit note', async () => {
    prisma.debitNote.findFirst.mockResolvedValue(null);
    await expect(service.update('tenant-1', '1', { amount: 600 })).rejects.toThrow(NotFoundException);
  });

  it('should process debit note refund from ISSUED status', async () => {
    prisma.debitNote.findFirst.mockResolvedValue({ id: '1', status: 'ISSUED', amount: 500 });
    prisma.debitNote.update.mockResolvedValue({ id: '1', status: 'SETTLED', vendor: { name: 'Vendor A' } });

    const result = await service.processDebitNoteRefund('tenant-1', '1', { refundAmount: 500 });
    expect(result.status).toBe('SETTLED');
  });

  it('should throw BadRequestException when refunding non-refundable status (DRAFT)', async () => {
    prisma.debitNote.findFirst.mockResolvedValue({ id: '1', status: 'DRAFT', amount: 500 });
    await expect(service.processDebitNoteRefund('tenant-1', '1', { refundAmount: 500 })).rejects.toThrow(BadRequestException);
  });

  it('should get debit notes by vendor with tenant isolation', async () => {
    prisma.debitNote.findMany.mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' } }]);
    prisma.debitNote.count.mockResolvedValue(1);

    const result = await service.getDebitNotesByVendor('tenant-1', 'vendor-1', {});
    expect(result.total).toBe(1);
    expect(prisma.debitNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', vendorId: 'vendor-1' } })
    );
  });

  it('should get debit notes by date range', async () => {
    prisma.debitNote.findMany.mockResolvedValue([{ id: '1', vendor: { name: 'Vendor A' } }]);
    prisma.debitNote.count.mockResolvedValue(1);

    const result = await service.getDebitNotesByDateRange('tenant-1', '2026-01-01', '2026-06-30', {});
    expect(result.total).toBe(1);
  });

  it('should get detailed stats with byVendor breakdown', async () => {
    prisma.debitNote.findMany.mockResolvedValue([
      { id: '1', vendorId: 'v1', vendor: { name: 'Vendor A' }, status: 'SETTLED', amount: 500 },
      { id: '2', vendorId: 'v1', vendor: { name: 'Vendor A' }, status: 'DISPUTED', amount: 200 },
      { id: '3', vendorId: 'v2', vendor: { name: 'Vendor B' }, status: 'DRAFT', amount: 100 },
    ]);

    const stats = await service.getDebitNoteStatsDetailed('tenant-1');
    expect(stats.total).toBe(3);
    expect(stats.totalAmount).toBe(800);
    expect(stats.settledAmount).toBe(500);
    expect(stats.disputedAmount).toBe(200);
    expect(stats.byVendor).toHaveLength(2);
    expect(stats.settlementRate).toBeGreaterThan(0);
  });

  it('should list with search filter', async () => {
    prisma.debitNote.findMany.mockResolvedValue([{ id: '1', noteNumber: 'DN-0001', vendor: { name: 'Vendor A' } }]);
    prisma.debitNote.count.mockResolvedValue(1);

    const result = await service.list('tenant-1', { search: 'DN-0001' });
    expect(result.total).toBe(1);
    expect(prisma.debitNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    );
  });
});
