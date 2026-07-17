import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
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
    pickWaveItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    serialNumber: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    serialNumberHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn: any) => fn(db));
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));

describe('InventoryService — scan-out serial verification at pick', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    service = new InventoryService();
  });

  it('rejects a scanned serial that does not belong to the product', async () => {
    db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', productId: 'p1', quantity: { toString: () => '2' } });
    db.serialNumber.findMany.mockResolvedValue([]);

    await expect(
      service.recordPick('t1', 'wi1', { pickedQty: 1, scannedSerials: ['SN-UNKNOWN'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a scanned serial that is not AVAILABLE', async () => {
    db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', productId: 'p1', quantity: { toString: () => '2' } });
    db.serialNumber.findMany.mockResolvedValue([{ id: 's1', serialNo: 'SN-1', status: 'SOLD' }]);

    await expect(
      service.recordPick('t1', 'wi1', { pickedQty: 1, scannedSerials: ['SN-1'] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('marks verified AVAILABLE serials RESERVED and logs history', async () => {
    db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', productId: 'p1', quantity: { toString: () => '2' } });
    db.serialNumber.findMany.mockResolvedValue([{ id: 's1', serialNo: 'SN-1', status: 'AVAILABLE' }]);
    db.pickWaveItem.update.mockResolvedValue({ id: 'wi1', status: 'PICKED' });

    await service.recordPick('t1', 'wi1', { pickedQty: 2, scannedSerials: ['SN-1'] });

    expect(db.serialNumber.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 's1' }, data: { status: 'RESERVED' },
    }));
    expect(db.serialNumberHistory.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'TRANSFERRED', toStatus: 'RESERVED' }),
    }));
  });

  it('does not touch serial numbers when none are scanned', async () => {
    db.pickWaveItem.findFirst.mockResolvedValue({ id: 'wi1', productId: 'p1', quantity: { toString: () => '2' } });
    db.pickWaveItem.update.mockResolvedValue({ id: 'wi1', status: 'PICKED' });

    await service.recordPick('t1', 'wi1', { pickedQty: 2 });

    expect(db.serialNumber.findMany).not.toHaveBeenCalled();
    expect(db.serialNumber.update).not.toHaveBeenCalled();
  });
});
