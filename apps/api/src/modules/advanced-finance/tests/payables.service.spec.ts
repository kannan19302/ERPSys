import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayablesService } from '../services/payables.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mkColl = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
});

vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      private _v: number;
      constructor(v: unknown) { this._v = Number(v); }
      toNumber() { return this._v; }
      valueOf() { return this._v; }
      toFixed(d: number) { return this._v.toFixed(d); }
    },
  },
}));

vi.mock('@unerp/database', () => ({
  prisma: {
    aPMatchRule: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(),
      update: vi.fn(), count: vi.fn(), delete: vi.fn(),
    },
    aPMatchException: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(),
      update: vi.fn(), count: vi.fn(),
    },
    paymentBatch: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(),
      update: vi.fn(), count: vi.fn(), groupBy: vi.fn(),
    },
    paymentBatchLine: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(),
      update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(),
      aggregate: vi.fn(), count: vi.fn(),
    },
    purchaseOrder: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
    },
    journalEntry: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
    },
    journal: {
      findMany: vi.fn(), create: vi.fn(), count: vi.fn(),
    },
    account: {
      findMany: vi.fn(), findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-001';
const USER_ID = 'user-001';
const ORG_ID = 'org-001';

describe('PayablesService', () => {
  let service: PayablesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PayablesService();
  });

  // ── AP Match Rules ────────────────────────────────────────────────────────

  describe('listMatchRules', () => {
    it('returns all active match rules for tenant', async () => {
      const rules = [{ id: 'r1', tenantId: TENANT, status: 'ACTIVE' }];
      (prisma.aPMatchRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(rules);
      const result = await service.listMatchRules(TENANT);
      expect(result).toEqual(rules);
      expect(prisma.aPMatchRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT }) }),
      );
    });
  });

  describe('getMatchRule', () => {
    it('returns a rule by id', async () => {
      const rule = { id: 'r1', tenantId: TENANT };
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(rule);
      const result = await service.getMatchRule(TENANT, 'r1');
      expect(result).toEqual(rule);
    });

    it('throws NotFoundException when rule not found', async () => {
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getMatchRule(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMatchRule', () => {
    it('creates a match rule with valid tolerances', async () => {
      const created = { id: 'r2', tenantId: TENANT };
      (prisma.aPMatchRule.create as ReturnType<typeof vi.fn>).mockResolvedValue(created);
      const result = await service.createMatchRule(TENANT, USER_ID, {
        quantityTolerancePercent: 5,
        priceTolerancePercent: 3,
        effectiveDate: '2026-01-01',
      });
      expect(result).toEqual(created);
    });

    it('throws BadRequestException for negative tolerance', async () => {
      await expect(
        service.createMatchRule(TENANT, USER_ID, {
          quantityTolerancePercent: -1,
          priceTolerancePercent: 5,
          effectiveDate: '2026-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateMatchRule', () => {
    it('updates a match rule', async () => {
      const rule = { id: 'r1', tenantId: TENANT };
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(rule);
      (prisma.aPMatchRule.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...rule, status: 'INACTIVE' });
      const result = await service.updateMatchRule(TENANT, 'r1', USER_ID, { status: 'INACTIVE' });
      expect(result.status).toBe('INACTIVE');
    });
  });

  describe('deleteMatchRule', () => {
    it('soft-deletes a match rule', async () => {
      const rule = { id: 'r1', tenantId: TENANT };
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(rule);
      (prisma.aPMatchRule.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...rule, deletedAt: new Date() });
      const result = await service.deleteMatchRule(TENANT, 'r1', USER_ID);
      expect(result.deletedAt).toBeTruthy();
    });
  });

  // ── Three-Way Match Engine ─────────────────────────────────────────────────

  describe('runMatch', () => {
    it('returns PENDING when no goods received', async () => {
      const po = {
        id: 'po-1',
        tenantId: TENANT,
        vendorId: 'v1',
        totalAmount: 1000,
        lineItems: [{ quantity: 10 }],
        receipts: [],
      };
      (prisma.purchaseOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(po);
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await service.runMatch(TENANT, USER_ID, { purchaseOrderId: 'po-1' });
      expect(result.status).toBe('PENDING');
      expect(result.receivedQty).toBe(0);
    });

    it('returns MATCHED when within tolerance', async () => {
      const po = {
        id: 'po-1',
        tenantId: TENANT,
        vendorId: 'v1',
        totalAmount: 1000,
        lineItems: [{ quantity: 10 }],
        receipts: [{ lineItems: [{ acceptedQty: 10 }] }],
      };
      (prisma.purchaseOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(po);
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'ACTIVE',
        quantityTolerancePercent: 5,
        priceTolerancePercent: 5,
      });
      const result = await service.runMatch(TENANT, USER_ID, { purchaseOrderId: 'po-1' });
      expect(result.status).toBe('MATCHED');
      expect(result.autoPost).toBe(true);
    });

    it('returns EXCEPTION when out of tolerance and records it', async () => {
      const po = {
        id: 'po-1',
        tenantId: TENANT,
        vendorId: 'v1',
        totalAmount: 1000,
        lineItems: [{ quantity: 10 }],
        receipts: [{ lineItems: [{ acceptedQty: 5 }] }], // 50% qty variance
      };
      (prisma.purchaseOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(po);
      (prisma.aPMatchRule.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        status: 'ACTIVE',
        quantityTolerancePercent: 5, // 5% tolerance, 50% variance → exception
        priceTolerancePercent: 5,
      });
      (prisma.aPMatchException.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.aPMatchException.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1' });
      const result = await service.runMatch(TENANT, USER_ID, { purchaseOrderId: 'po-1' });
      expect(result.status).toBe('EXCEPTION');
      expect(prisma.aPMatchException.create).toHaveBeenCalled();
    });

    it('throws NotFoundException when PO not found', async () => {
      (prisma.purchaseOrder.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.runMatch(TENANT, USER_ID, { purchaseOrderId: 'missing' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── Exception Queue ────────────────────────────────────────────────────────

  describe('listExceptions', () => {
    it('lists exceptions filtered by status', async () => {
      const excs = [{ id: 'exc-1', status: 'PENDING' }];
      (prisma.aPMatchException.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(excs);
      const result = await service.listExceptions(TENANT, 'PENDING');
      expect(result).toEqual(excs);
    });
  });

  describe('approveException', () => {
    it('approves a pending exception', async () => {
      (prisma.aPMatchException.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1', status: 'PENDING' });
      (prisma.aPMatchException.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1', status: 'APPROVED' });
      const result = await service.approveException(TENANT, 'exc-1', USER_ID, 'ok');
      expect(result.status).toBe('APPROVED');
    });

    it('throws BadRequestException if exception already approved', async () => {
      (prisma.aPMatchException.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1', status: 'APPROVED' });
      await expect(service.approveException(TENANT, 'exc-1', USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectException', () => {
    it('rejects a pending exception', async () => {
      (prisma.aPMatchException.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1', status: 'PENDING' });
      (prisma.aPMatchException.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'exc-1', status: 'REJECTED' });
      const result = await service.rejectException(TENANT, 'exc-1', USER_ID, 'not ok');
      expect(result.status).toBe('REJECTED');
    });
  });

  // ── Payment Batches ────────────────────────────────────────────────────────

  describe('createPaymentBatch', () => {
    it('creates a DRAFT payment batch', async () => {
      (prisma.paymentBatch.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.paymentBatch.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'b1',
        status: 'DRAFT',
        batchNumber: 'PB-00001',
      });
      const result = await service.createPaymentBatch(TENANT, USER_ID, { paymentMethod: 'ACH' });
      expect(result.status).toBe('DRAFT');
      expect(result.batchNumber).toBe('PB-00001');
    });
  });

  describe('addLineToBatch', () => {
    it('adds a line to a DRAFT batch and recalculates total', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'b1',
        status: 'DRAFT',
        lines: [],
      });
      (prisma.paymentBatchLine.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'l1', amount: 100 });
      (prisma.paymentBatchLine.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { amount: 100 },
      });
      (prisma.paymentBatch.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'b1', totalAmount: 100 });
      const result = await service.addLineToBatch(TENANT, 'b1', USER_ID, {
        referenceId: 'inv-1',
        amount: 100,
        scheduledPaymentDate: '2026-07-31',
      });
      expect(result.id).toBe('l1');
    });

    it('throws BadRequestException if batch is not DRAFT or READY', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'b1',
        status: 'COMPLETED',
        lines: [],
      });
      await expect(
        service.addLineToBatch(TENANT, 'b1', USER_ID, {
          referenceId: 'inv-1',
          amount: 100,
          scheduledPaymentDate: '2026-07-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('runPaymentBatch', () => {
    it('executes batch, settles lines, posts GL journal, marks COMPLETED', async () => {
      const batch = {
        id: 'b1',
        batchNumber: 'PB-00001',
        status: 'DRAFT',
        totalAmount: 500,
        currency: 'USD',
        lines: [{ id: 'l1', amount: 500, status: 'INCLUDED' }],
      };
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(batch);
      (prisma.account.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ id: 'ap-acc', type: 'LIABILITY' })
        .mockResolvedValueOnce({ id: 'bank-acc', type: 'ASSET' });
      (prisma.journal.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
      (prisma.journal.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'j1' });
      (prisma.paymentBatchLine.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
      (prisma.paymentBatch.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...batch, status: 'COMPLETED' });

      const result = await service.runPaymentBatch(TENANT, 'b1', USER_ID, ORG_ID);
      expect(result.batch.status).toBe('COMPLETED');
      expect(result.journalId).toBe('j1');
      expect(result.linesSettled).toBe(1);
    });

    it('throws BadRequestException on empty batch', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'b1',
        status: 'DRAFT',
        lines: [],
      });
      await expect(service.runPaymentBatch(TENANT, 'b1', USER_ID, ORG_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportPaymentBatch', () => {
    const batch = {
      id: 'b1',
      batchNumber: 'PB-00001',
      status: 'COMPLETED',
      totalAmount: 500,
      currency: 'USD',
      lines: [
        {
          id: 'l1',
          invoiceId: 'inv-1',
          amount: 500,
          scheduledPaymentDate: new Date('2026-07-31'),
          status: 'SETTLED',
        },
      ],
    };

    it('exports as NACHA format', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(batch);
      const result = await service.exportPaymentBatch(TENANT, 'b1', 'NACHA');
      expect(result.format).toBe('NACHA');
      expect(result.content).toContain('PB-00001');
    });

    it('exports as SEPA_XML format', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(batch);
      const result = await service.exportPaymentBatch(TENANT, 'b1', 'SEPA_XML');
      expect(result.format).toBe('SEPA_XML');
      expect(result.content).toContain('<Document>');
    });

    it('exports as CSV by default', async () => {
      (prisma.paymentBatch.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(batch);
      const result = await service.exportPaymentBatch(TENANT, 'b1', 'CSV');
      expect(result.format).toBe('CSV');
      expect(result.content).toContain('batch_id,line_id');
    });
  });

  // ── Report Drill-Through ───────────────────────────────────────────────────

  describe('reportDrilldown', () => {
    it('drills into P&L by account and period', async () => {
      const entries = [
        {
          id: 'e1',
          accountId: 'acc-1',
          description: 'Sale',
          debit: 0,
          credit: 500,
          createdAt: new Date(),
          journal: { entryNumber: 'JE-001', notes: 'revenue', status: 'POSTED', date: new Date() },
          account: { code: '4000', name: 'Revenue', type: 'REVENUE' },
        },
      ];
      (prisma.journalEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(entries);
      (prisma.journalEntry.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const result = await service.reportDrilldown(TENANT, 'profit_loss', {
        accountId: 'acc-1',
        period: '2026-06',
        limit: '50',
      });
      expect(result.reportType).toBe('profit_loss');
      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ── Payables Stats ─────────────────────────────────────────────────────────

  describe('getPayablesStats', () => {
    it('returns aggregated payables dashboard stats', async () => {
      (prisma.purchaseOrder.count as ReturnType<typeof vi.fn>).mockResolvedValue(12);
      (prisma.aPMatchException.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      (prisma.paymentBatch.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: 'DRAFT', _count: 2, _sum: { totalAmount: 20000 } },
        { status: 'COMPLETED', _count: 5, _sum: { totalAmount: 95000 } },
      ]);
      (prisma.aPMatchRule.count as ReturnType<typeof vi.fn>).mockResolvedValue(4);

      const result = await service.getPayablesStats(TENANT);
      expect(result.openPurchaseOrders).toBe(12);
      expect(result.pendingExceptions).toBe(3);
      expect(result.draftBatches.count).toBe(2);
      expect(result.completedBatches.count).toBe(5);
      expect(result.activeMatchRules).toBe(4);
    });
  });
});
