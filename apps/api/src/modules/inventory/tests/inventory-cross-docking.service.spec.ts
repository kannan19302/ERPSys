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
    putawayTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    pickWaveItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — cross-docking', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  describe('getCrossDockOpportunities', () => {
    it('matches a pending receipt to an open pick-wave demand for the same product/warehouse', async () => {
      db.putawayTask.findMany.mockResolvedValue([
        { id: 'pt1', quantity: { toString: () => '20' }, inventoryItem: { productId: 'p1', warehouseId: 'w1', product: { name: 'Widget' } } },
      ]);
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', quantity: { toString: () => '15' }, pickWave: { warehouseId: 'w1' } });

      const result = await service.getCrossDockOpportunities('t1');

      expect(result.count).toBe(1);
      expect(result.opportunities[0].matchedQty).toBe(15);
    });

    it('skips a receipt when no matching demand exists in the same warehouse', async () => {
      db.putawayTask.findMany.mockResolvedValue([
        { id: 'pt1', quantity: { toString: () => '20' }, inventoryItem: { productId: 'p1', warehouseId: 'w1', product: { name: 'Widget' } } },
      ]);
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', quantity: { toString: () => '15' }, pickWave: { warehouseId: 'w2' } });

      const result = await service.getCrossDockOpportunities('t1');

      expect(result.count).toBe(0);
    });
  });

  describe('executeCrossDock', () => {
    it('completes the receipt and picks the matched wave item in one transaction', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'PENDING', quantity: { toString: () => '20' } });
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', status: 'PENDING', quantity: { toString: () => '15' } });
      db.putawayTask.update.mockResolvedValue({ id: 'pt1', status: 'COMPLETE' });
      db.pickWaveItem.update.mockResolvedValue({ id: 'wi1', status: 'PICKED' });

      const result = await service.executeCrossDock('t1', 'pt1', 'wi1');

      expect(db.pickWaveItem.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'PICKED' }),
      }));
      expect(result.status).toBe('COMPLETE');
    });

    it('rejects executing against an already-completed receipt', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'COMPLETE' });
      await expect(service.executeCrossDock('t1', 'pt1', 'wi1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound for an unknown pick-wave item', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'PENDING', quantity: { toString: () => '20' } });
      db.pickWaveItem.findFirst.mockResolvedValue(null);
      await expect(service.executeCrossDock('t1', 'pt1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('marks the wave item SHORT when the receipt quantity is less than demand', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'PENDING', quantity: { toString: () => '5' } });
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', status: 'PENDING', quantity: { toString: () => '15' } });
      db.putawayTask.update.mockResolvedValue({ id: 'pt1', status: 'COMPLETE' });
      db.pickWaveItem.update.mockResolvedValue({ id: 'wi1', status: 'SHORT' });

      await service.executeCrossDock('t1', 'pt1', 'wi1');

      expect(db.pickWaveItem.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'SHORT' }),
      }));
    });
  });
});
