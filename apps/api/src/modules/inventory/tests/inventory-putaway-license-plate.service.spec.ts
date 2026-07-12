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
    cycleCountSchedule: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cycleCount: {
      findMany: vi.fn(),
    },
    licensePlate: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    licensePlateItem: {
      create: vi.fn(),
    },
    putawayTask: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
    },
    binLocation: {
      findMany: vi.fn(),
    },
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — cycle count schedules, license plates, directed putaway', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
  });

  describe('cycle count schedules', () => {
    it('creates a schedule with a parsed due date', async () => {
      db.cycleCountSchedule.create.mockResolvedValue({ id: 's1' });
      await service.createCycleCountSchedule('t1', {
        warehouseId: 'w1', frequency: 'MONTHLY', blindCount: false, nextDueDate: '2026-08-01', active: true,
      } as any);
      expect(db.cycleCountSchedule.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', warehouseId: 'w1' }),
      }));
    });

    it('throws NotFound updating a schedule that does not belong to the tenant', async () => {
      db.cycleCountSchedule.findFirst.mockResolvedValue(null);
      await expect(service.updateCycleCountSchedule('t1', 'missing', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('rolls a MONTHLY schedule forward by 30 days', async () => {
      const due = new Date('2026-07-01T00:00:00.000Z');
      db.cycleCountSchedule.findFirst.mockResolvedValue({ id: 's1', frequency: 'MONTHLY', nextDueDate: due });
      db.cycleCountSchedule.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 's1', ...data }));
      const result = await service.rollForwardCycleCountSchedule('t1', 's1');
      expect(result.nextDueDate.toISOString()).toBe('2026-07-31T00:00:00.000Z');
    });

    it('computes accuracy rate from counted items with zero variance', async () => {
      db.cycleCount.findMany.mockResolvedValue([
        { items: [{ countedQty: 10, varianceQty: 0 }, { countedQty: 8, varianceQty: -2 }] },
        { items: [{ countedQty: 5, varianceQty: 0 }] },
      ]);
      const result = await service.getCycleCountAccuracy('t1');
      expect(result.itemsCounted).toBe(3);
      expect(result.accurateItems).toBe(2);
      expect(result.accuracyRate).toBeCloseTo(66.67, 1);
    });

    it('returns null accuracy rate when nothing has been counted', async () => {
      db.cycleCount.findMany.mockResolvedValue([]);
      const result = await service.getCycleCountAccuracy('t1');
      expect(result.accuracyRate).toBeNull();
    });
  });

  describe('license plates', () => {
    it('rejects creating a duplicate license plate code', async () => {
      db.licensePlate.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.createLicensePlate('t1', { code: 'LP-1', warehouseId: 'w1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('creates an OPEN license plate', async () => {
      db.licensePlate.findFirst.mockResolvedValue(null);
      db.licensePlate.create.mockResolvedValue({ id: 'lp1', status: 'OPEN' });
      const result = await service.createLicensePlate('t1', { code: 'LP-2', warehouseId: 'w1' } as any);
      expect(result.status).toBe('OPEN');
    });

    it('rejects adding items to a closed license plate', async () => {
      db.licensePlate.findFirst.mockResolvedValue({ id: 'lp1', status: 'CLOSED' });
      await expect(
        service.addLicensePlateItem('t1', 'lp1', { inventoryItemId: 'i1', quantity: 5 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects moving a consumed license plate', async () => {
      db.licensePlate.findFirst.mockResolvedValue({ id: 'lp1', status: 'CONSUMED' });
      await expect(service.moveLicensePlate('t1', 'lp1', { binId: 'b2' } as any)).rejects.toThrow(BadRequestException);
    });

    it('closes an open license plate', async () => {
      db.licensePlate.findFirst.mockResolvedValue({ id: 'lp1', status: 'OPEN' });
      db.licensePlate.update.mockResolvedValue({ id: 'lp1', status: 'CLOSED' });
      const result = await service.closeLicensePlate('t1', 'lp1');
      expect(result.status).toBe('CLOSED');
    });
  });

  describe('directed put-away', () => {
    it('suggests the bin with the most free capacity', async () => {
      db.inventoryItem.findFirst.mockResolvedValue({ id: 'i1', warehouseId: 'w1' });
      db.binLocation.findMany.mockResolvedValue([
        { id: 'b1', capacity: 100, _count: { inventoryBins: 90 } },
        { id: 'b2', capacity: 100, _count: { inventoryBins: 10 } },
      ]);
      const result = await service.suggestPutawayBin('t1', 'i1');
      expect(result?.id).toBe('b2');
    });

    it('throws NotFound suggesting a bin for an unknown item', async () => {
      db.inventoryItem.findFirst.mockResolvedValue(null);
      await expect(service.suggestPutawayBin('t1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('creates a putaway task and auto-suggests a bin when none is provided', async () => {
      db.inventoryItem.findFirst.mockResolvedValue({ id: 'i1', warehouseId: 'w1' });
      db.binLocation.findMany.mockResolvedValue([{ id: 'b1', capacity: null, _count: { inventoryBins: 0 } }]);
      db.putawayTask.create.mockResolvedValue({ id: 'pt1', suggestedBinId: 'b1' });
      const result = await service.createPutawayTask('t1', { stockEntryId: 'se1', inventoryItemId: 'i1', quantity: 3 } as any);
      expect(result.suggestedBinId).toBe('b1');
    });

    it('rejects completing an already-complete putaway task', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'COMPLETE' });
      await expect(service.completePutawayTask('t1', 'pt1', {})).rejects.toThrow(BadRequestException);
    });

    it('completes a pending putaway task', async () => {
      db.putawayTask.findFirst.mockResolvedValue({ id: 'pt1', status: 'PENDING' });
      db.putawayTask.update.mockResolvedValue({ id: 'pt1', status: 'COMPLETE' });
      const result = await service.completePutawayTask('t1', 'pt1', {});
      expect(result.status).toBe('COMPLETE');
    });
  });
});
