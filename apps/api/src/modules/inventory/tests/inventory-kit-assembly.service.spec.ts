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
    productKit: {
      findFirst: vi.fn(),
    },
    inventoryItem: {
      findFirst: vi.fn(),
    },
    stockEntry: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { db };
});

vi.mock('@unerp/database', () => ({ prisma: db }));
vi.mock('../../../common/utils/pagination.util', async () => {
  const actual = await vi.importActual<any>('../../../common/utils/pagination.util');
  return { ...actual, resolveOrgId: vi.fn().mockResolvedValue('org-1') };
});

const kit = {
  id: 'kit-1',
  name: 'Starter Bundle',
  productId: 'kit-product-1',
  sellPrice: { toString: () => '100' },
  discount: { toString: () => '10' },
  product: { name: 'Starter Bundle Product', costPrice: { toString: () => '40' } },
  components: [
    { productId: 'comp-1', quantity: { toString: () => '2' }, product: { name: 'Component A', costPrice: { toString: () => '10' } } },
    { productId: 'comp-2', quantity: { toString: () => '1' }, product: { name: 'Component B', costPrice: { toString: () => '5' } } },
  ],
};

describe('InventoryService — kit assembly/disassembly', () => {
  let service: InventoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InventoryService();
    vi.spyOn(service, 'getProductKitById').mockResolvedValue(kit as any);
  });

  it('computes max buildable quantity from the scarcest component', async () => {
    db.inventoryItem.findFirst
      .mockResolvedValueOnce({ quantity: { toString: () => '10' } }) // comp-1: 10/2 = 5
      .mockResolvedValueOnce({ quantity: { toString: () => '3' } }); // comp-2: 3/1 = 3
    const result = await service.getKitAvailability('t1', 'kit-1', 'w1');
    expect(result.maxBuildable).toBe(3);
  });

  it('rolls up component cost and computes margin against discounted sell price', async () => {
    const result = await service.getKitCostRollup('t1', 'kit-1');
    // components: 2*10 + 1*5 = 25; sellPrice = 100 * 0.9 = 90; margin = 65
    expect(result.totalCost).toBe(25);
    expect(result.sellPrice).toBe(90);
    expect(result.margin).toBe(65);
  });

  it('rejects assembling more kits than components allow', async () => {
    vi.spyOn(service, 'getKitAvailability').mockResolvedValue({ maxBuildable: 2 } as any);
    await expect(
      service.assembleKit('t1', 'org-1', 'u1', 'kit-1', { warehouseId: 'w1', quantity: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('assembles kits by creating and submitting a STOCK_ADJUSTMENT entry', async () => {
    vi.spyOn(service, 'getKitAvailability').mockResolvedValue({ maxBuildable: 10 } as any);
    const createSpy = vi.spyOn(service, 'createStockEntry').mockResolvedValue({ id: 'se-1' } as any);
    const submitSpy = vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se-1', status: 'SUBMITTED' } as any);

    const result = await service.assembleKit('t1', 'org-1', 'u1', 'kit-1', { warehouseId: 'w1', quantity: 2 });

    expect(createSpy).toHaveBeenCalledWith('t1', 'org-1', 'u1', expect.objectContaining({ type: 'STOCK_ADJUSTMENT' }));
    expect(submitSpy).toHaveBeenCalledWith('t1', 'se-1', 'u1');
    expect(result.status).toBe('SUBMITTED');
  });

  it('rejects disassembling more kits than are on hand', async () => {
    db.inventoryItem.findFirst.mockResolvedValue({ quantity: { toString: () => '1' } });
    await expect(
      service.disassembleKit('t1', 'org-1', 'u1', 'kit-1', { warehouseId: 'w1', quantity: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('disassembles kits by creating and submitting a STOCK_ADJUSTMENT entry', async () => {
    db.inventoryItem.findFirst.mockResolvedValue({ quantity: { toString: () => '10' } });
    const createSpy = vi.spyOn(service, 'createStockEntry').mockResolvedValue({ id: 'se-2' } as any);
    const submitSpy = vi.spyOn(service, 'submitStockEntry').mockResolvedValue({ id: 'se-2', status: 'SUBMITTED' } as any);

    const result = await service.disassembleKit('t1', 'org-1', 'u1', 'kit-1', { warehouseId: 'w1', quantity: 2 });

    expect(createSpy).toHaveBeenCalledWith('t1', 'org-1', 'u1', expect.objectContaining({ type: 'STOCK_ADJUSTMENT' }));
    expect(submitSpy).toHaveBeenCalledWith('t1', 'se-2', 'u1');
    expect(result.status).toBe('SUBMITTED');
  });
});
