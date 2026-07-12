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
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pickWaveItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    salesOrder: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryItemBin: {
      findFirst: vi.fn(),
    },
    consignmentStock: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    consignmentConsumption: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    serialNumber: {
      create: vi.fn(),
    },
    batch: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));
vi.mock('../../../common/utils/pagination.util', async () => {
  const actual = await vi.importActual<any>('../../../common/utils/pagination.util');
  return { ...actual, resolveOrgId: vi.fn().mockResolvedValue('org-1') };
});

describe('InventoryService — wave pick, consignment inventory, receipt traceability', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  describe('wave pick', () => {
    it('aggregates line items across multiple sales orders into wave items', async () => {
      db.pickWave.count.mockResolvedValue(0);
      db.salesOrder.findFirst
        .mockResolvedValueOnce({ id: 'so1', lineItems: [{ productId: 'p1', quantity: 5 }] })
        .mockResolvedValueOnce({ id: 'so2', lineItems: [{ productId: 'p1', quantity: 3 }] });
      db.inventoryItemBin.findFirst.mockResolvedValue({ binLocationId: 'bin1' });
      db.pickWave.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'wave1', ...data }));

      const result = await service.createPickWave('t1', 'org-1', 'u1', { warehouseId: 'w1', salesOrderIds: ['so1', 'so2'] });

      expect(db.pickWave.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          items: { create: [expect.objectContaining({ productId: 'p1', binLocationId: 'bin1' })] },
        }),
      }));
      expect(result.id).toBe('wave1');
    });

    it('marks a wave item PICKED when the full quantity is recorded', async () => {
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', quantity: { toString: () => '5' } });
      db.pickWaveItem.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'wi1', ...data }));
      const result = await service.recordPick('t1', 'wi1', { pickedQty: 5 });
      expect(result.status).toBe('PICKED');
    });

    it('marks a wave item SHORT when less than the full quantity is recorded', async () => {
      db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', quantity: { toString: () => '5' } });
      db.pickWaveItem.update.mockImplementation(({ data }: any) => Promise.resolve({ id: 'wi1', ...data }));
      const result = await service.recordPick('t1', 'wi1', { pickedQty: 2 });
      expect(result.status).toBe('SHORT');
    });

    it('rejects completing a wave with unpicked items', async () => {
      db.pickWave.findFirst.mockResolvedValue({ id: 'wave1', items: [{ status: 'PENDING' }] });
      await expect(service.completePickWave('t1', 'wave1')).rejects.toThrow(BadRequestException);
    });

    it('completes a wave once every item is picked', async () => {
      db.pickWave.findFirst.mockResolvedValue({ id: 'wave1', items: [{ status: 'PICKED' }], orders: [] });
      db.pickWave.update.mockResolvedValue({ id: 'wave1', status: 'COMPLETED' });
      const result = await service.completePickWave('t1', 'wave1');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('consignment inventory', () => {
    it('rejects consuming more than the on-hand quantity', async () => {
      db.consignmentStock.findFirst.mockResolvedValue({ id: 'cs1', quantityOnHand: { toString: () => '5' }, unitCost: { toString: () => '10' } });
      await expect(service.recordConsignmentConsumption('t1', 'cs1', { quantity: 10 })).rejects.toThrow(BadRequestException);
    });

    it('records consumption and computes total cost from unit cost', async () => {
      db.consignmentStock.findFirst.mockResolvedValue({ id: 'cs1', quantityOnHand: { toString: () => '20' }, unitCost: { toString: () => '10' } });
      db.consignmentStock.update.mockResolvedValue({});
      db.consignmentConsumption.create.mockImplementation(({ data }: any) => Promise.resolve(data));

      const result = await service.recordConsignmentConsumption('t1', 'cs1', { quantity: 4 });

      expect(Number(result.totalCost)).toBe(40);
      expect(result.billed).toBe(false);
    });

    it('marks an unbilled consumption as billed', async () => {
      db.consignmentConsumption.findFirst.mockResolvedValue({ id: 'cc1', billed: false });
      db.consignmentConsumption.update.mockResolvedValue({ id: 'cc1', billed: true });
      const result = await service.markConsignmentConsumptionBilled('t1', 'cc1');
      expect(result.billed).toBe(true);
    });

    it('throws NotFound marking an unknown consumption billed', async () => {
      db.consignmentConsumption.findFirst.mockResolvedValue(null);
      await expect(service.markConsignmentConsumptionBilled('t1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('receipt with traceability', () => {
    it('creates the stock entry, serial numbers, and batch in one call', async () => {
      vi.spyOn(service, 'createStockEntry').mockResolvedValue({ id: 'se1' } as any);
      vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se1', status: 'SUBMITTED' } as any);
      db.serialNumber.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'sn1', ...data }));
      db.batch.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'b1', ...data }));

      const result = await service.receiveWithTraceability('t1', 'org-1', 'u1', {
        productId: 'p1', warehouseId: 'w1', quantity: 10, valuationRate: 5,
        serialNumbers: ['SN-1', 'SN-2'], batchNo: 'BATCH-1', lotNo: null, expiryDate: null,
      });

      expect(result.serialNumbers).toHaveLength(2);
      expect(result.batch?.batchNo).toBe('BATCH-1');
      expect(result.stockEntry.status).toBe('SUBMITTED');
    });

    it('skips batch creation when no batchNo is provided', async () => {
      vi.spyOn(service, 'createStockEntry').mockResolvedValue({ id: 'se2' } as any);
      vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se2', status: 'SUBMITTED' } as any);

      const result = await service.receiveWithTraceability('t1', 'org-1', 'u1', {
        productId: 'p1', warehouseId: 'w1', quantity: 10, valuationRate: 5,
        serialNumbers: [], batchNo: null, lotNo: null, expiryDate: null,
      });

      expect(result.batch).toBeNull();
      expect(db.batch.create).not.toHaveBeenCalled();
    });
  });
});
