import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MinMaxReplenService } from '../minmax-replen.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    minMaxLevel: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
      count: vi.fn(), create: vi.fn(), update: vi.fn(),
    },
    replenSuggestion: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(),
    },
    replenRunLog: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(),
    },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('MinMaxReplenService', () => {
  let svc: MinMaxReplenService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new MinMaxReplenService();
  });

  // ── Level Config ──────────────────────────────────────────────────────────

  it('upsertLevel creates a new level', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.minMaxLevel.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.minMaxLevel.create).mockResolvedValue({ id: 'lv1', productId: 'p1' } as any);
    const result = await svc.upsertLevel(T, 'u1', { productId: 'p1', warehouseId: 'w1', minQty: 10, maxQty: 100 });
    expect(prisma.minMaxLevel.create).toHaveBeenCalled();
    expect((result as any).id).toBe('lv1');
  });

  it('upsertLevel updates existing level', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.minMaxLevel.findUnique).mockResolvedValue({ id: 'lv1' } as any);
    vi.mocked(prisma.minMaxLevel.update).mockResolvedValue({ id: 'lv1', maxQty: 200 } as any);
    const result = await svc.upsertLevel(T, 'u1', { productId: 'p1', warehouseId: 'w1', minQty: 10, maxQty: 200 });
    expect(prisma.minMaxLevel.update).toHaveBeenCalled();
    expect((result as any).maxQty).toBe(200);
  });

  it('upsertLevel throws BadRequestException when minQty >= maxQty', async () => {
    await expect(svc.upsertLevel(T, 'u1', { productId: 'p1', warehouseId: 'w1', minQty: 100, maxQty: 50 }))
      .rejects.toThrow(BadRequestException);
  });

  it('upsertLevel throws BadRequestException for negative minQty', async () => {
    await expect(svc.upsertLevel(T, 'u1', { productId: 'p1', warehouseId: 'w1', minQty: -5, maxQty: 50 }))
      .rejects.toThrow(BadRequestException);
  });

  it('deactivateLevel throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.minMaxLevel.findFirst).mockResolvedValue(null);
    await expect(svc.deactivateLevel(T, 'lv-none', 'u1')).rejects.toThrow(NotFoundException);
  });

  // ── Replenishment Run ─────────────────────────────────────────────────────

  it('runReplenishment creates suggestions for below-min products', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenRunLog.count).mockResolvedValue(0);
    vi.mocked(prisma.minMaxLevel.findMany).mockResolvedValue([
      { id: 'lv1', productId: 'p1', warehouseId: 'w1', minQty: 20, maxQty: 100, reorderQty: null, method: 'PURCHASE_ORDER', preferredVendorId: null, leadTimeDays: 3 },
      { id: 'lv2', productId: 'p2', warehouseId: 'w1', minQty: 50, maxQty: 200, reorderQty: null, method: 'PURCHASE_ORDER', preferredVendorId: null, leadTimeDays: 0 },
    ] as any);
    vi.mocked(prisma.replenSuggestion.count).mockResolvedValue(0);
    vi.mocked(prisma.replenSuggestion.create).mockResolvedValue({ id: 'sg1' } as any);
    vi.mocked(prisma.replenRunLog.create).mockResolvedValue({ id: 'rl1', runNumber: 'RRL-000001', suggestionsCreated: 1 } as any);

    const result = await svc.runReplenishment(T, 'u1', {
      // p1 has 5 (below min 20) → should suggest; p2 has 80 (above min 50) → skip
      stockSnapshot: { 'p1:w1': 5, 'p2:w1': 80 },
    });

    expect(prisma.replenSuggestion.create).toHaveBeenCalledTimes(1);
    expect((result as any).runNumber).toBe('RRL-000001');
  });

  it('runReplenishment uses reorderQty override when set', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenRunLog.count).mockResolvedValue(0);
    vi.mocked(prisma.minMaxLevel.findMany).mockResolvedValue([
      { id: 'lv1', productId: 'p1', warehouseId: 'w1', minQty: 20, maxQty: 100, reorderQty: 50, method: 'PURCHASE_ORDER', preferredVendorId: null, leadTimeDays: 0 },
    ] as any);
    vi.mocked(prisma.replenSuggestion.count).mockResolvedValue(5);
    vi.mocked(prisma.replenSuggestion.create).mockImplementation(async ({ data }: any) => ({ id: 'sg1', suggestedQty: data.suggestedQty }));
    vi.mocked(prisma.replenRunLog.create).mockResolvedValue({ id: 'rl1' } as any);

    await svc.runReplenishment(T, 'u1', { stockSnapshot: { 'p1:w1': 5 } });

    expect(prisma.replenSuggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ suggestionNumber: 'RS-000006' }) })
    );
  });

  it('runReplenishment skips products at or above min', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenRunLog.count).mockResolvedValue(0);
    vi.mocked(prisma.minMaxLevel.findMany).mockResolvedValue([
      { id: 'lv1', productId: 'p1', warehouseId: 'w1', minQty: 20, maxQty: 100, reorderQty: null, method: 'PURCHASE_ORDER', preferredVendorId: null, leadTimeDays: 0 },
    ] as any);
    vi.mocked(prisma.replenSuggestion.count).mockResolvedValue(0);
    vi.mocked(prisma.replenRunLog.create).mockResolvedValue({ id: 'rl1', suggestionsCreated: 0 } as any);

    await svc.runReplenishment(T, 'u1', { stockSnapshot: { 'p1:w1': 25 } }); // above min
    expect(prisma.replenSuggestion.create).not.toHaveBeenCalled();
  });

  // ── Suggestion Lifecycle ──────────────────────────────────────────────────

  it('approveSuggestion transitions OPEN → APPROVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'OPEN' } as any);
    vi.mocked(prisma.replenSuggestion.update).mockResolvedValue({ id: 'sg1', status: 'APPROVED' } as any);
    const result = await svc.approveSuggestion(T, 'sg1', 'u1');
    expect((result as any).status).toBe('APPROVED');
  });

  it('approveSuggestion throws BadRequestException for non-OPEN', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'APPROVED' } as any);
    await expect(svc.approveSuggestion(T, 'sg1', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('markOrdered throws BadRequestException for non-APPROVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'OPEN' } as any);
    await expect(svc.markOrdered(T, 'sg1')).rejects.toThrow(BadRequestException);
  });

  it('markReceived transitions ORDERED → RECEIVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'ORDERED' } as any);
    vi.mocked(prisma.replenSuggestion.update).mockResolvedValue({ id: 'sg1', status: 'RECEIVED' } as any);
    const result = await svc.markReceived(T, 'sg1');
    expect((result as any).status).toBe('RECEIVED');
  });

  it('cancelSuggestion throws BadRequestException for RECEIVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'RECEIVED' } as any);
    await expect(svc.cancelSuggestion(T, 'sg1', 'u1', 'duplicate')).rejects.toThrow(BadRequestException);
  });

  it('cancelSuggestion cancels OPEN suggestion', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.replenSuggestion.findFirst).mockResolvedValue({ id: 'sg1', status: 'OPEN' } as any);
    vi.mocked(prisma.replenSuggestion.update).mockResolvedValue({ id: 'sg1', status: 'CANCELLED' } as any);
    const result = await svc.cancelSuggestion(T, 'sg1', 'u1', 'No longer needed');
    expect((result as any).status).toBe('CANCELLED');
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('getDashboard returns aggregate stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.minMaxLevel.count)
      .mockResolvedValueOnce(45) // active
      .mockResolvedValueOnce(50); // total
    vi.mocked(prisma.replenSuggestion.count)
      .mockResolvedValueOnce(8)  // open
      .mockResolvedValueOnce(3)  // approved
      .mockResolvedValueOnce(2); // ordered
    vi.mocked(prisma.replenRunLog.count).mockResolvedValue(12);
    vi.mocked(prisma.replenRunLog.findFirst).mockResolvedValue({ id: 'rl12', runNumber: 'RRL-000012' } as any);
    const result = await svc.getDashboard(T);
    expect(result.activeLevels).toBe(45);
    expect(result.openSugg).toBe(8);
    expect(result.totalRuns).toBe(12);
  });
});
