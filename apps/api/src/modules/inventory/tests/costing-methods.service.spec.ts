import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CostingMethodsService } from '../costing-methods.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    inventoryCostProfile: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
      count: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    inventoryCostLayer: {
      findMany: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    inventoryCostAdjustment: {
      findMany: vi.fn(), count: vi.fn(), create: vi.fn(),
    },
  },
}));

const T = 'tenant-1';

describe('CostingMethodsService', () => {
  let svc: CostingMethodsService;
  beforeEach(() => { vi.clearAllMocks(); svc = new CostingMethodsService(); });

  // ── Profiles ──────────────────────────────────────────────────────────────

  it('upsertProfile creates when no existing profile', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.inventoryCostProfile.create).mockResolvedValue({ id: 'cp1', method: 'FIFO' } as any);
    const result = await svc.upsertProfile(T, 'u1', { productId: 'p1', warehouseId: 'w1', method: 'FIFO' });
    expect(prisma.inventoryCostProfile.create).toHaveBeenCalled();
    expect((result as any).method).toBe('FIFO');
  });

  it('upsertProfile updates existing profile', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findUnique).mockResolvedValue({ id: 'cp1', method: 'WAC', currency: 'USD', standardCost: null, notes: null } as any);
    vi.mocked(prisma.inventoryCostProfile.update).mockResolvedValue({ id: 'cp1', method: 'FIFO' } as any);
    const result = await svc.upsertProfile(T, 'u1', { productId: 'p1', warehouseId: 'w1', method: 'FIFO' });
    expect(prisma.inventoryCostProfile.update).toHaveBeenCalled();
    expect((result as any).method).toBe('FIFO');
  });

  it('getProfile throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findFirst).mockResolvedValue(null);
    await expect(svc.getProfile(T, 'cp-none')).rejects.toThrow(NotFoundException);
  });

  // ── Cost Layers ───────────────────────────────────────────────────────────

  it('addCostLayer creates layer and updates WAC', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findFirst).mockResolvedValue({ id: 'cp1', method: 'WAC', currency: 'USD' } as any);
    vi.mocked(prisma.inventoryCostLayer.create).mockResolvedValue({ id: 'cl1', qtyReceived: 100, unitCost: 10 } as any);
    vi.mocked(prisma.inventoryCostLayer.findMany).mockResolvedValue([
      { id: 'cl1', qtyRemaining: 100, unitCost: 10 },
    ] as any);
    vi.mocked(prisma.inventoryCostProfile.update).mockResolvedValue({} as any);
    await svc.addCostLayer(T, { profileId: 'cp1', receiptDate: new Date(), unitCost: 10, qty: 100 });
    expect(prisma.inventoryCostLayer.create).toHaveBeenCalled();
    expect(prisma.inventoryCostProfile.update).toHaveBeenCalled(); // WAC updated
  });

  it('addCostLayer throws for non-positive unitCost', async () => {
    await expect(svc.addCostLayer(T, { profileId: 'cp1', receiptDate: new Date(), unitCost: 0, qty: 10 }))
      .rejects.toThrow(BadRequestException);
  });

  it('addCostLayer throws for non-positive qty', async () => {
    await expect(svc.addCostLayer(T, { profileId: 'cp1', receiptDate: new Date(), unitCost: 5, qty: 0 }))
      .rejects.toThrow(BadRequestException);
  });

  it('consumeLayer FIFO deducts from oldest layer first', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findFirst).mockResolvedValue({ id: 'cp1', method: 'FIFO', currency: 'USD' } as any);
    vi.mocked(prisma.inventoryCostLayer.findMany).mockResolvedValue([
      { id: 'cl1', qtyRemaining: 50, unitCost: 10, status: 'OPEN' },
      { id: 'cl2', qtyRemaining: 100, unitCost: 15, status: 'OPEN' },
    ] as any);
    vi.mocked(prisma.inventoryCostLayer.update).mockResolvedValue({} as any);
    const result = await svc.consumeLayer(T, 'cp1', 60);
    expect(result.qtyConsumed).toBe(60);
    // 50 @ $10 + 10 @ $15 = $650
    expect(result.totalCost).toBe(650);
    expect(prisma.inventoryCostLayer.update).toHaveBeenCalledTimes(2);
  });

  it('consumeLayer throws when insufficient stock', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findFirst).mockResolvedValue({ id: 'cp1', method: 'FIFO', currency: 'USD' } as any);
    vi.mocked(prisma.inventoryCostLayer.findMany).mockResolvedValue([
      { id: 'cl1', qtyRemaining: 10, unitCost: 10 },
    ] as any);
    vi.mocked(prisma.inventoryCostLayer.update).mockResolvedValue({} as any);
    await expect(svc.consumeLayer(T, 'cp1', 50)).rejects.toThrow(BadRequestException);
  });

  // ── Adjustments ───────────────────────────────────────────────────────────

  it('createAdjustment auto-numbers ICA-XXXXXX', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.findFirst).mockResolvedValue({ id: 'cp1', currency: 'USD' } as any);
    vi.mocked(prisma.inventoryCostAdjustment.count).mockResolvedValue(9);
    vi.mocked(prisma.inventoryCostAdjustment.create).mockResolvedValue({ id: 'adj1', adjustmentNumber: 'ICA-000010' } as any);
    const result = await svc.createAdjustment(T, 'u1', { profileId: 'cp1', adjustmentType: 'WRITE_DOWN', amount: 500, reason: 'Damaged goods' });
    expect(prisma.inventoryCostAdjustment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ adjustmentNumber: 'ICA-000010' }) })
    );
    expect((result as any).adjustmentNumber).toBe('ICA-000010');
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('getDashboard returns costing method breakdown', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inventoryCostProfile.count)
      .mockResolvedValueOnce(20).mockResolvedValueOnce(8).mockResolvedValueOnce(10).mockResolvedValueOnce(2);
    vi.mocked(prisma.inventoryCostAdjustment.count).mockResolvedValue(15);
    const result = await svc.getDashboard(T);
    expect(result.totalProfiles).toBe(20);
    expect(result.fifoProfiles).toBe(8);
    expect(result.wacProfiles).toBe(10);
    expect(result.totalAdjustments).toBe(15);
  });
});
