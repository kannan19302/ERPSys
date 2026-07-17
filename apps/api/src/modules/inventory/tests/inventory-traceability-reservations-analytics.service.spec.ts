import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    batchQuarantineLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    serialNumber: {
      findFirst: vi.fn(),
    },
    stockReservation: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    stockLedgerEntry: {
      findFirst: vi.fn(),
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — batch quarantine, stock reservations, analytics', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  describe('batch quarantine workflow', () => {
    it('quarantines an active batch and logs the action', async () => {
      db.batch.findFirst.mockResolvedValue({ id: 'b1', status: 'ACTIVE' });
      db.batch.update.mockResolvedValue({ id: 'b1', status: 'QUARANTINE' });
      const result = await service.quarantineBatch('t1', 'b1', 'u1', { reason: 'Suspected contamination' });
      expect(result.status).toBe('QUARANTINE');
      expect(db.batchQuarantineLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'QUARANTINED' }),
      }));
    });

    it('rejects quarantining an already-quarantined batch', async () => {
      db.batch.findFirst.mockResolvedValue({ id: 'b1', status: 'QUARANTINE' });
      await expect(service.quarantineBatch('t1', 'b1', 'u1', { reason: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('releases a quarantined batch back to ACTIVE', async () => {
      db.batch.findFirst.mockResolvedValue({ id: 'b1', status: 'QUARANTINE' });
      db.batch.update.mockResolvedValue({ id: 'b1', status: 'ACTIVE' });
      const result = await service.releaseBatchQuarantine('t1', 'b1', 'u1', {});
      expect(result.status).toBe('ACTIVE');
    });

    it('rejects releasing a non-quarantined batch', async () => {
      db.batch.findFirst.mockResolvedValue({ id: 'b1', status: 'ACTIVE' });
      await expect(service.releaseBatchQuarantine('t1', 'b1', 'u1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('traceability', () => {
    it('throws NotFound tracing an unknown serial number', async () => {
      db.serialNumber.findFirst.mockResolvedValue(null);
      await expect(service.getSerialNumberTrace('t1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('returns serial history and license-plate placements', async () => {
      db.serialNumber.findFirst.mockResolvedValue({
        id: 's1', serialNo: 'SN-1', status: 'SOLD', product: { name: 'Widget' },
        history: [{ action: 'SHIPPED' }],
        licensePlateItems: [{ licensePlate: { code: 'LP-1' } }],
      });
      const result = await service.getSerialNumberTrace('t1', 's1');
      expect(result.history).toHaveLength(1);
      expect(result.licensePlates[0].code).toBe('LP-1');
    });
  });

  describe('stock reservations', () => {
    it('rejects reserving more than the available quantity', async () => {
      db.inventoryItem.findFirst.mockResolvedValue({ quantity: { toString: () => '10' } });
      db.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 8 } });
      await expect(
        service.createStockReservation('t1', 'u1', { productId: 'p1', warehouseId: 'w1', quantity: 5, sourceType: 'MANUAL' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a reservation when enough stock is available', async () => {
      db.inventoryItem.findFirst.mockResolvedValue({ quantity: { toString: () => '10' } });
      db.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });
      db.stockReservation.create.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });
      const result = await service.createStockReservation('t1', 'u1', { productId: 'p1', warehouseId: 'w1', quantity: 5, sourceType: 'MANUAL' } as any);
      expect(result.status).toBe('ACTIVE');
    });

    it('rejects releasing a non-active reservation', async () => {
      db.stockReservation.findFirst.mockResolvedValue({ id: 'r1', status: 'RELEASED' });
      await expect(service.releaseStockReservation('t1', 'r1')).rejects.toThrow(BadRequestException);
    });

    it('fulfills an active reservation', async () => {
      db.stockReservation.findFirst.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });
      db.stockReservation.update.mockResolvedValue({ id: 'r1', status: 'FULFILLED' });
      const result = await service.fulfillStockReservation('t1', 'r1');
      expect(result.status).toBe('FULFILLED');
    });
  });

  describe('analytics', () => {
    it('classifies items into A/B/C by cumulative value', async () => {
      db.inventoryItem.findMany.mockResolvedValue([
        { productId: 'p1', quantity: 1, product: { name: 'High Value', sku: 'HV', costPrice: 80 } },
        { productId: 'p2', quantity: 1, product: { name: 'Mid Value', sku: 'MV', costPrice: 15 } },
        { productId: 'p3', quantity: 1, product: { name: 'Low Value', sku: 'LV', costPrice: 5 } },
      ]);
      const result = await service.getAbcClassification('t1');
      expect(result.items[0].class).toBe('A');
      expect(result.counts.A + result.counts.B + result.counts.C).toBe(3);
    });

    it('flags items with no recent movement as dead stock', async () => {
      db.inventoryItem.findMany.mockResolvedValue([
        { productId: 'p1', warehouseId: 'w1', quantity: 20, product: { name: 'Stale Item', sku: 'SI', costPrice: 10 } },
      ]);
      db.stockLedgerEntry.findFirst.mockResolvedValue(null);
      const result = await service.getDeadStockReport('t1');
      expect(result.deadStockItems).toHaveLength(1);
      expect(result.totalDeadValue).toBe(200);
    });

    it('excludes items below the reorder threshold when they have never moved but hold zero quantity', async () => {
      db.inventoryItem.findMany.mockResolvedValue([
        { productId: 'p1', warehouseId: 'w1', quantity: 0, product: { name: 'Empty', sku: 'E', costPrice: 10 } },
      ]);
      const result = await service.getDeadStockReport('t1');
      expect(result.deadStockItems).toHaveLength(0);
    });

    it('computes turnover ratio from issued quantity over on-hand quantity', async () => {
      db.stockLedgerEntry.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { quantity: -40 } }]);
      db.inventoryItem.findMany.mockResolvedValue([
        { productId: 'p1', quantity: 20, product: { name: 'Fast Mover', sku: 'FM' } },
      ]);
      const result = await service.getTurnoverReport('t1');
      expect(result.items[0].turnoverRatio).toBe(2);
    });
  });
});
