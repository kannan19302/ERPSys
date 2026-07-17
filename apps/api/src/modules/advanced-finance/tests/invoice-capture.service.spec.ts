import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoiceCaptureService } from '../services/invoice-capture.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private _v: number;
        constructor(v: unknown) { this._v = Number(v); }
        toNumber() { return this._v; }
        valueOf() { return this._v; }
        toFixed(d: number) { return this._v.toFixed(d); }
      },
    },
  };
});

const { mockPrisma } = vi.hoisted(() => {
  const m = {
    aPInvoiceCapture: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    aPInvoiceCaptureLine: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    purchaseOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    journal: {
      create: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  m.$transaction.mockImplementation((cb) => cb(m));
  return { mockPrisma: m };
});

vi.mock('@unerp/database', () => ({
  prisma: mockPrisma,
}));

import { prisma } from '@unerp/database';

describe('InvoiceCaptureService', () => {
  let service: InvoiceCaptureService;
  const tenantId = 't-test';
  const userId = 'u-test';

  beforeEach(() => {
    service = new InvoiceCaptureService();
    vi.clearAllMocks();
  });

  describe('listCaptures', () => {
    it('should query invoice capture database records', async () => {
      const mockResult = [{ id: '1', fileName: 'invoice.pdf' }];
      vi.mocked(prisma.aPInvoiceCapture.findMany).mockResolvedValue(mockResult as any);

      const res = await service.listCaptures(tenantId, 'QUEUED');
      expect(prisma.aPInvoiceCapture.findMany).toHaveBeenCalledWith({
        where: { tenantId, status: 'QUEUED' },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { lines: true } } },
      });
      expect(res).toEqual(mockResult);
    });
  });

  describe('getCapture', () => {
    it('should return capture record if found', async () => {
      const mockResult = { id: 'c-1', tenantId, status: 'QUEUED', lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockResult as any);

      const res = await service.getCapture(tenantId, 'c-1');
      expect(res).toEqual(mockResult);
    });

    it('should throw NotFoundException if capture record does not exist', async () => {
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(null);
      await expect(service.getCapture(tenantId, 'c-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCapture', () => {
    it('should create initial draft record and run simulated OCR if rawText provided', async () => {
      const mockCapture = { id: 'c-1', tenantId, status: 'QUEUED', lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.create).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);

      const res = await service.createCapture(tenantId, userId, {
        fileName: 'inv.pdf',
        rawText: 'This is a sample invoice Globex INV-10020 due total: $1200.00 PO #PO-909',
      });

      expect(prisma.aPInvoiceCapture.create).toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('updateCapture', () => {
    it('should update metadata fields successfully', async () => {
      const mockCapture = { id: 'c-1', tenantId, status: 'QUEUED', lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCapture.update).mockResolvedValue({ ...mockCapture, notes: 'new' } as any);

      const res = await service.updateCapture(tenantId, 'c-1', userId, { notes: 'new' });
      expect(res.notes).toEqual('new');
    });
  });

  describe('deleteCapture', () => {
    it('should delete draft record but throw if already processed', async () => {
      const mockProcessed = { id: 'c-1', tenantId, status: 'PROCESSED', lines: [] };
      const mockDraft = { id: 'c-2', tenantId, status: 'QUEUED', lines: [] };

      vi.mocked(prisma.aPInvoiceCapture.findFirst)
        .mockResolvedValueOnce(mockProcessed as any)
        .mockResolvedValueOnce(mockDraft as any);

      await expect(service.deleteCapture(tenantId, 'c-1')).rejects.toThrow(BadRequestException);

      vi.mocked(prisma.aPInvoiceCapture.delete).mockResolvedValue(mockDraft as any);
      const res = await service.deleteCapture(tenantId, 'c-2');
      expect(res).toBeDefined();
    });
  });

  describe('autoCode', () => {
    it('should fetch suggestions based on historical vendor matches', async () => {
      const mockCapture = { id: 'c-1', tenantId, vendorName: 'Acme', lines: [{ id: 'l-1' }] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.findFirst).mockResolvedValue({ suggestedAccountId: 'acc-99', suggestedCostCenterId: 'cc-01' } as any);

      const res = await service.autoCode(tenantId, 'c-1');
      expect(prisma.aPInvoiceCaptureLine.updateMany).toHaveBeenCalledWith({
        where: { captureId: 'c-1' },
        data: { suggestedAccountId: 'acc-99', suggestedCostCenterId: 'cc-01' },
      });
      expect(res).toBeDefined();
    });
  });

  describe('approveCapture', () => {
    it('should generate double-entry GL posts and complete the matching PO', async () => {
      const mockCapture = {
        id: 'c-1',
        tenantId,
        status: 'QUEUED',
        totalAmount: 1200,
        matchingPurchaseOrderId: 'po-100',
        lines: [{ id: 'l-1', amount: 1200, suggestedAccountId: 'exp-1', suggestedCostCenterId: 'cc-1' }],
      };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.account.findFirst).mockResolvedValue({ id: 'liability-1' } as any);
      vi.mocked(prisma.journal.create).mockResolvedValue({ id: 'j-1' } as any);

      const res = await service.approveCapture(tenantId, 'c-1', userId);
      expect(prisma.journal.create).toHaveBeenCalled();
      expect(prisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-100' },
        data: { status: 'BILLED' },
      });
      expect(res).toBeDefined();
    });
  });

  describe('line operations', () => {
    it('should allow adding manual lines', async () => {
      const mockCapture = { id: 'c-1', tenantId, status: 'QUEUED', totalAmount: 0, lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.create).mockResolvedValue({ id: 'l-1', amount: 100 } as any);

      const res = await service.createLine(tenantId, 'c-1', { description: 'test line', quantity: 1, unitPrice: 100 });
      expect(res).toBeDefined();
      expect(prisma.aPInvoiceCapture.update).toHaveBeenCalled();
    });

    it('should allow updating captured lines', async () => {
      const mockCapture = { id: 'c-1', tenantId, status: 'QUEUED', totalAmount: 100, lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.findFirst).mockResolvedValue({ id: 'l-1', quantity: 1, unitPrice: 100, amount: 100 } as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.update).mockResolvedValue({ id: 'l-1', quantity: 1.5, unitPrice: 100, amount: 150 } as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.findMany).mockResolvedValue([{ id: 'l-1', amount: 150 }] as any);

      const res = await service.updateLine(tenantId, 'c-1', 'l-1', { quantity: 1.5 });
      expect(res).toBeDefined();
      expect(prisma.aPInvoiceCapture.update).toHaveBeenCalled();
    });

    it('should allow deleting lines', async () => {
      const mockCapture = { id: 'c-1', tenantId, status: 'QUEUED', totalAmount: 100, lines: [] };
      vi.mocked(prisma.aPInvoiceCapture.findFirst).mockResolvedValue(mockCapture as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.findFirst).mockResolvedValue({ id: 'l-1', amount: 100 } as any);
      vi.mocked(prisma.aPInvoiceCaptureLine.findMany).mockResolvedValue([]);

      const res = await service.deleteLine(tenantId, 'c-1', 'l-1');
      expect(res.deleted).toBe(true);
      expect(prisma.aPInvoiceCaptureLine.delete).toHaveBeenCalled();
    });
  });
});
