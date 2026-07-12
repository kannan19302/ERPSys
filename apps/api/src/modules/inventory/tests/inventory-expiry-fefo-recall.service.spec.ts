import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../inventory.service';

vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      value: number;
      constructor(v: unknown) { this.value = Number(v); }
      toString() { return String(this.value); }
    },
  },
}));

const { db } = vi.hoisted(() => {
  const db: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    batch: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — expiring batches, FEFO suggestion, recall notice', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('expiring batches report', () => {
    it('computes days-until-expiry for each batch within the window', async () => {
      const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      db.batch.findMany.mockResolvedValue([
        { id: 'b1', batchNo: 'B-1', quantity: { toString: () => '20' }, usedQty: { toString: () => '5' }, expiryDate: soon, product: { name: 'Widget', sku: 'W-1' } },
      ]);

      const result = await service.getExpiringBatchesReport('t1', 30);

      expect(result.count).toBe(1);
      expect(result.batches[0].quantity).toBe(15);
      expect(result.batches[0].daysUntilExpiry).toBeGreaterThanOrEqual(4);
    });
  });

  describe('FEFO pick suggestion', () => {
    it('allocates across batches soonest-expiry-first until the quantity is fulfilled', async () => {
      db.batch.findMany.mockResolvedValue([
        { id: 'b1', batchNo: 'B-1', quantity: { toString: () => '5' }, usedQty: { toString: () => '0' }, expiryDate: new Date('2026-08-01'), createdAt: new Date('2026-07-01') },
        { id: 'b2', batchNo: 'B-2', quantity: { toString: () => '20' }, usedQty: { toString: () => '0' }, expiryDate: new Date('2026-09-01'), createdAt: new Date('2026-07-01') },
      ]);

      const result = await service.getFefoPickSuggestion('t1', 'p1', 'w1', 12);

      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0].allocatedQty).toBe(5);
      expect(result.allocations[1].allocatedQty).toBe(7);
      expect(result.fulfilledQty).toBe(12);
      expect(result.shortfall).toBe(0);
    });

    it('reports a shortfall when total available stock is less than requested', async () => {
      db.batch.findMany.mockResolvedValue([
        { id: 'b1', batchNo: 'B-1', quantity: { toString: () => '3' }, usedQty: { toString: () => '0' }, expiryDate: new Date('2026-08-01'), createdAt: new Date('2026-07-01') },
      ]);

      const result = await service.getFefoPickSuggestion('t1', 'p1', 'w1', 10);

      expect(result.fulfilledQty).toBe(3);
      expect(result.shortfall).toBe(7);
    });
  });

  describe('batch recall notice', () => {
    it('separates traced sales-order consumptions from untraced ones', async () => {
      db.batch.findFirst.mockResolvedValue({
        id: 'b1', batchNo: 'B-1', lotNo: null, status: 'ACTIVE', product: { name: 'Widget' },
        originStockEntry: null,
        stockEntryItems: [
          { stockEntry: { referenceType: 'SALES_ORDER', referenceDoc: 'so-1', entryNumber: 'STE-1' } },
          { stockEntry: { referenceType: null, referenceDoc: null, entryNumber: 'STE-2' } },
        ],
        licensePlateItems: [{ licensePlate: { code: 'LP-1' } }],
      });

      const result = await service.getBatchRecallNotice('t1', 'b1');

      expect(result.affectedSalesOrders).toEqual([{ salesOrderId: 'so-1', stockEntryNumber: 'STE-1' }]);
      expect(result.untracedConsumptions).toBe(1);
      expect(result.licensePlatesInvolved).toEqual(['LP-1']);
      expect(result.recommendedAction).toContain('Quarantine');
    });

    it('recommends notifying customers when the batch is already quarantined', async () => {
      db.batch.findFirst.mockResolvedValue({
        id: 'b1', batchNo: 'B-1', lotNo: null, status: 'QUARANTINE', product: { name: 'Widget' },
        originStockEntry: null, stockEntryItems: [], licensePlateItems: [],
      });

      const result = await service.getBatchRecallNotice('t1', 'b1');

      expect(result.recommendedAction).toContain('notification');
    });
  });
});
