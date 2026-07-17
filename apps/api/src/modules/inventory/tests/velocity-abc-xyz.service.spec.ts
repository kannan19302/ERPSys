import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VelocityAbcXyzService } from '../velocity-abc-xyz.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    velocityClassificationRun: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(),
    },
    velocityClassificationItem: {
      findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(),
      createMany: vi.fn(), deleteMany: vi.fn(), groupBy: vi.fn(),
    },
    velocitySlottingPolicy: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(),
    },
    productVelocitySnapshot: {
      findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(),
    },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('VelocityAbcXyzService', () => {
  let svc: VelocityAbcXyzService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new VelocityAbcXyzService();
  });

  // ── Runs ─────────────────────────────────────────────────────────────────

  it('createRun generates VCR-000001 for first run', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.count).mockResolvedValue(0);
    vi.mocked(prisma.velocityClassificationRun.create).mockImplementation(async ({ data }: any) => ({
      id: 'r1', runNumber: data.runNumber,
    }));
    const result = await svc.createRun(T, {
      periodStart: '2026-01-01', periodEnd: '2026-06-30', runByUserId: 'u1',
    });
    expect((result as any).runNumber).toBe('VCR-000001');
  });

  it('getRun throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue(null);
    await expect(svc.getRun(T, 'r-none')).rejects.toThrow(NotFoundException);
  });

  it('deleteRun throws BadRequestException when run is ACTIVE', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'ACTIVE' } as any);
    await expect(svc.deleteRun(T, 'r1')).rejects.toThrow(BadRequestException);
  });

  it('activateRun throws BadRequestException when not DRAFT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'ACTIVE' } as any);
    await expect(svc.activateRun(T, 'r1')).rejects.toThrow(BadRequestException);
  });

  it('activateRun throws BadRequestException when no products classified', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'DRAFT', totalProducts: 0 } as any);
    await expect(svc.activateRun(T, 'r1')).rejects.toThrow(BadRequestException);
  });

  it('activateRun supersedes previous active run and activates draft', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({
      id: 'r2', status: 'DRAFT', totalProducts: 10, warehouseId: null,
    } as any);
    vi.mocked(prisma.velocityClassificationRun.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(prisma.velocityClassificationRun.update).mockResolvedValue({ id: 'r2', status: 'ACTIVE' } as any);
    const result = await svc.activateRun(T, 'r2');
    expect(prisma.velocityClassificationRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SUPERSEDED' } })
    );
    expect((result as any).status).toBe('ACTIVE');
  });

  // ── ABC-XYZ Computation ───────────────────────────────────────────────────

  it('computeClassification classifies top revenue product as A', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'DRAFT' } as any);
    vi.mocked(prisma.velocityClassificationItem.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.velocityClassificationItem.createMany).mockResolvedValue({ count: 3 } as any);
    vi.mocked(prisma.velocityClassificationRun.update).mockImplementation(async ({ data }: any) => ({ id: 'r1', ...data }));

    const items = [
      { productId: 'p1', totalRevenue: 80000, totalQuantitySold: 100, monthlyDemandSeries: [10, 10, 10, 10] },
      { productId: 'p2', totalRevenue: 15000, totalQuantitySold: 50, monthlyDemandSeries: [5, 10, 5, 5] },
      { productId: 'p3', totalRevenue: 5000, totalQuantitySold: 20, monthlyDemandSeries: [1, 8, 3, 2] },
    ];
    await svc.computeClassification(T, 'r1', items);

    const createManyCall = vi.mocked(prisma.velocityClassificationItem.createMany).mock.calls[0][0] as any;
    const p1item = createManyCall.data.find((d: any) => d.productId === 'p1');
    expect(p1item.abcClass).toBe('A');
    expect(p1item.combinedClass).toMatch(/^A/);
  });

  it('computeClassification assigns XYZ based on CV', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'DRAFT' } as any);
    vi.mocked(prisma.velocityClassificationItem.deleteMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.velocityClassificationItem.createMany).mockResolvedValue({ count: 2 } as any);
    vi.mocked(prisma.velocityClassificationRun.update).mockImplementation(async ({ data }: any) => ({ id: 'r1', ...data }));

    const items = [
      // stable demand CV≈0 → X
      { productId: 'p-stable', totalRevenue: 90000, totalQuantitySold: 100, monthlyDemandSeries: [10, 10, 10, 10] },
      // erratic demand CV > 0.5 → Z
      { productId: 'p-erratic', totalRevenue: 10000, totalQuantitySold: 20, monthlyDemandSeries: [1, 50, 1, 50] },
    ];
    await svc.computeClassification(T, 'r1', items);
    const createManyCall = vi.mocked(prisma.velocityClassificationItem.createMany).mock.calls[0][0] as any;
    const stable = createManyCall.data.find((d: any) => d.productId === 'p-stable');
    const erratic = createManyCall.data.find((d: any) => d.productId === 'p-erratic');
    expect(stable.xyzClass).toBe('X');
    expect(erratic.xyzClass).toBe('Z');
  });

  it('computeClassification throws BadRequestException for non-DRAFT run', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({ id: 'r1', status: 'ACTIVE' } as any);
    await expect(svc.computeClassification(T, 'r1', [])).rejects.toThrow(BadRequestException);
  });

  // ── Slotting Policies ─────────────────────────────────────────────────────

  it('upsertPolicy creates when none exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocitySlottingPolicy.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.velocitySlottingPolicy.create).mockResolvedValue({ id: 'sp1', combinedClass: 'AX' } as any);
    const result = await svc.upsertPolicy(T, {
      combinedClass: 'AX', reviewFrequency: 'DAILY', reorderMethod: 'CONTINUOUS',
    });
    expect(prisma.velocitySlottingPolicy.create).toHaveBeenCalled();
    expect((result as any).combinedClass).toBe('AX');
  });

  it('upsertPolicy updates existing policy', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocitySlottingPolicy.findUnique).mockResolvedValue({ id: 'sp1' } as any);
    vi.mocked(prisma.velocitySlottingPolicy.update).mockResolvedValue({ id: 'sp1', reviewFrequency: 'WEEKLY' } as any);
    const result = await svc.upsertPolicy(T, {
      combinedClass: 'AX', reviewFrequency: 'WEEKLY', reorderMethod: 'CONTINUOUS',
    });
    expect(prisma.velocitySlottingPolicy.update).toHaveBeenCalled();
    expect((result as any).reviewFrequency).toBe('WEEKLY');
  });

  it('deletePolicy throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocitySlottingPolicy.findFirst).mockResolvedValue(null);
    await expect(svc.deletePolicy(T, 'sp-none')).rejects.toThrow(NotFoundException);
  });

  // ── Velocity Snapshots ────────────────────────────────────────────────────

  it('recordSnapshot creates new snapshot', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productVelocitySnapshot.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.productVelocitySnapshot.create).mockResolvedValue({ id: 'sn1', productId: 'p1' } as any);
    const result = await svc.recordSnapshot(T, {
      productId: 'p1', snapshotMonth: '2026-06-01',
      quantitySold: 150, revenue: 7500, transactionCount: 12,
    });
    expect(prisma.productVelocitySnapshot.create).toHaveBeenCalled();
    expect((result as any).productId).toBe('p1');
  });

  it('recordSnapshot updates when month already exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productVelocitySnapshot.findFirst).mockResolvedValue({ id: 'sn1' } as any);
    vi.mocked(prisma.productVelocitySnapshot.update).mockResolvedValue({ id: 'sn1', quantitySold: 200 } as any);
    const result = await svc.recordSnapshot(T, {
      productId: 'p1', snapshotMonth: '2026-06-01',
      quantitySold: 200, revenue: 10000, transactionCount: 15,
    });
    expect(prisma.productVelocitySnapshot.update).toHaveBeenCalled();
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('getDashboard returns aggregate stats', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.velocityClassificationRun.count).mockResolvedValue(5);
    vi.mocked(prisma.velocityClassificationRun.findFirst).mockResolvedValue({
      id: 'r1', runNumber: 'VCR-000005', totalProducts: 200, activatedAt: new Date(),
      classACount: 40, classBCount: 80, classCCount: 80,
      classXCount: 60, classYCount: 80, classZCount: 60,
    } as any);
    vi.mocked(prisma.productVelocitySnapshot.count).mockResolvedValue(2400);
    vi.mocked(prisma.velocityClassificationItem.groupBy).mockResolvedValue([
      { combinedClass: 'AX', _count: { id: 20 } },
      { combinedClass: 'AZ', _count: { id: 20 } },
    ] as any);
    vi.mocked(prisma.velocitySlottingPolicy.count).mockResolvedValue(9);
    const result = await svc.getDashboard(T);
    expect(result.totalRuns).toBe(5);
    expect(result.activeRun?.totalProducts).toBe(200);
    expect(result.totalSnapshots).toBe(2400);
    expect(result.activePolicies).toBe(9);
  });
});
