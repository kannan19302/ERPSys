import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../inventory.service';

const { db } = vi.hoisted(() => {
  const db: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    stockLedgerEntry: {
      groupBy: vi.fn(),
    },
    inventoryItemBin: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    binLocation: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — dynamic slotting optimization', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  describe('getSlottingRecommendations', () => {
    it('recommends moving a fast mover out of a non-preferred zone into zone A', async () => {
      db.stockLedgerEntry.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { quantity: -100 } }]);
      db.inventoryItemBin.findMany.mockResolvedValue([
        { productId: 'p1', product: { name: 'Fast Mover' }, binLocation: { code: 'B-01', zone: 'B' } },
      ]);
      db.binLocation.findMany
        .mockResolvedValueOnce([{ code: 'A-01' }]) // preferred (zone A)
        .mockResolvedValueOnce([{ code: 'C-01' }]); // reserve (non-A)

      const result = await service.getSlottingRecommendations('t1', 'w1');

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].recommendation).toBe('MOVE_TO_PREFERRED_ZONE');
      expect(result.recommendations[0].suggestedBinCode).toBe('A-01');
    });

    it('recommends moving a zero-pick item out of zone A into reserve', async () => {
      db.stockLedgerEntry.groupBy.mockResolvedValue([]);
      db.inventoryItemBin.findMany.mockResolvedValue([
        { productId: 'p2', product: { name: 'Dead Stock' }, binLocation: { code: 'A-02', zone: 'A' } },
      ]);
      db.binLocation.findMany
        .mockResolvedValueOnce([{ code: 'A-01' }])
        .mockResolvedValueOnce([{ code: 'C-02' }]);

      const result = await service.getSlottingRecommendations('t1', 'w1');

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].recommendation).toBe('MOVE_TO_RESERVE_ZONE');
    });

    it('makes no recommendation for a product already well-placed', async () => {
      db.stockLedgerEntry.groupBy.mockResolvedValue([{ productId: 'p1', _sum: { quantity: -100 } }]);
      db.inventoryItemBin.findMany.mockResolvedValue([
        { productId: 'p1', product: { name: 'Fast Mover' }, binLocation: { code: 'A-01', zone: 'A' } },
      ]);
      db.binLocation.findMany.mockResolvedValueOnce([{ code: 'A-01' }]).mockResolvedValueOnce([{ code: 'C-01' }]);

      const result = await service.getSlottingRecommendations('t1', 'w1');

      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('executeSlottingMove', () => {
    it('rejects moving from a bin with zero quantity', async () => {
      db.inventoryItemBin.findFirst.mockResolvedValue({ id: 'ib1', quantity: 0 });
      await expect(service.executeSlottingMove('t1', 'p1', 'w1', 'bin-from', 'bin-to')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound when the source bin assignment does not exist', async () => {
      db.inventoryItemBin.findFirst.mockResolvedValue(null);
      await expect(service.executeSlottingMove('t1', 'p1', 'w1', 'bin-from', 'bin-to')).rejects.toThrow(NotFoundException);
    });

    it('zeroes the source bin and upserts the destination bin quantity', async () => {
      db.inventoryItemBin.findFirst.mockResolvedValue({ id: 'ib1', quantity: 25 });
      db.inventoryItemBin.upsert.mockResolvedValue({ id: 'ib2', quantity: 25 });

      await service.executeSlottingMove('t1', 'p1', 'w1', 'bin-from', 'bin-to');

      expect(db.inventoryItemBin.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'ib1' }, data: { quantity: 0 },
      }));
      expect(db.inventoryItemBin.upsert).toHaveBeenCalled();
    });
  });
});
