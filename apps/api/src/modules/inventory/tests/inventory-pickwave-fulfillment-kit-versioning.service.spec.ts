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
    pickWave: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    salesOrder: {
      updateMany: vi.fn(),
    },
    kitVersion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    productKitItem: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

const kit = {
  id: 'kit-1',
  components: [{ productId: 'p1', quantity: { toString: () => '2' }, product: { name: 'Component A' } }],
};

describe('InventoryService — pick-wave/sales-order integration, kit BOM versioning', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  describe('completePickWave fulfillment integration', () => {
    it('advances linked sales orders to PROCESSING once the wave completes', async () => {
      db.pickWave.findFirst.mockResolvedValue({
        id: 'wave1',
        items: [{ status: 'PICKED' }],
        orders: [{ salesOrderId: 'so1' }, { salesOrderId: 'so2' }],
      });
      db.pickWave.update.mockResolvedValue({ id: 'wave1', status: 'COMPLETED' });

      await service.completePickWave('t1', 'wave1');

      expect(db.salesOrder.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ id: { in: ['so1', 'so2'] } }),
        data: { status: 'PROCESSING' },
      }));
    });

    it('still rejects completion when items are unpicked, without touching sales orders', async () => {
      db.pickWave.findFirst.mockResolvedValue({ id: 'wave1', items: [{ status: 'PENDING' }], orders: [] });
      await expect(service.completePickWave('t1', 'wave1')).rejects.toThrow(BadRequestException);
      expect(db.salesOrder.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('kit BOM versioning', () => {
    it('creates version 1 when no prior version exists', async () => {
      vi.spyOn(service, 'getProductKitById').mockResolvedValue(kit as any);
      db.kitVersion.findFirst.mockResolvedValue(null);
      db.kitVersion.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'v1', ...data }));

      const result = await service.createKitVersion('t1', 'kit-1', 'u1', { notes: 'Initial BOM' });

      expect(result.versionNo).toBe(1);
      expect(result.componentsSnapshot).toEqual([{ productId: 'p1', productName: 'Component A', quantity: 2 }]);
    });

    it('increments the version number from the latest existing version', async () => {
      vi.spyOn(service, 'getProductKitById').mockResolvedValue(kit as any);
      db.kitVersion.findFirst.mockResolvedValue({ versionNo: 3 });
      db.kitVersion.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'v4', ...data }));

      const result = await service.createKitVersion('t1', 'kit-1', 'u1', {});

      expect(result.versionNo).toBe(4);
    });

    it('throws NotFound activating an unknown version', async () => {
      db.kitVersion.findFirst.mockResolvedValue(null);
      await expect(service.activateKitVersion('t1', 'kit-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('replaces live components with the snapshot when activating a version', async () => {
      db.kitVersion.findFirst.mockResolvedValue({ id: 'v1', componentsSnapshot: [{ productId: 'p2', quantity: 5 }] });
      vi.spyOn(service, 'getProductKitById').mockResolvedValue({ id: 'kit-1', components: [] } as any);

      await service.activateKitVersion('t1', 'kit-1', 'v1');

      expect(db.productKitItem.deleteMany).toHaveBeenCalledWith({ where: { tenantId: 't1', kitId: 'kit-1' } });
      expect(db.productKitItem.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({ productId: 'p2' })],
      }));
    });
  });
});
