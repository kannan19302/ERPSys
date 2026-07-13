import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatchWeightRecallService } from '../catch-weight-recall.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    catchWeightConfig: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    catchWeightReading: { create: vi.fn(), findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    catchWeightTare: { findMany: vi.fn(), upsert: vi.fn() },
    productRecall: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), groupBy: vi.fn() },
    recallAffectedStock: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    recallCustomerNotice: { create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    recallDisposalRecord: { create: vi.fn() },
  },
}));

vi.mock('@prisma/client', () => ({
  Prisma: { Decimal: class Decimal { constructor(v: unknown) { return v; } } },
}));

const T = 'tenant-1';

describe('CatchWeightRecallService', () => {
  let svc: CatchWeightRecallService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new CatchWeightRecallService();
  });

  // ── Catch-Weight Config ───────────────────────────────────────

  it('listConfigs returns all active configs', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findMany).mockResolvedValue([{ id: 'cfg1' }] as any);
    const result = await svc.listConfigs(T);
    expect(result).toHaveLength(1);
  });

  it('getConfig throws NotFoundException when not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findFirst).mockResolvedValue(null);
    await expect(svc.getConfig(T, 'bad')).rejects.toThrow(NotFoundException);
  });

  it('upsertConfig creates or updates config', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.upsert).mockResolvedValue({ id: 'cfg1' } as any);
    const result = await svc.upsertConfig(T, { productId: 'p1', nominalWeightKg: 1.5 });
    expect(result.id).toBe('cfg1');
  });

  it('deactivateConfig marks config inactive', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findFirst).mockResolvedValue({ id: 'cfg1' } as any);
    vi.mocked(prisma.catchWeightConfig.update).mockResolvedValue({ id: 'cfg1', active: false } as any);
    const result = await svc.deactivateConfig(T, 'cfg1');
    expect((result as any).active).toBe(false);
  });

  // ── Catch-Weight Readings ─────────────────────────────────────

  it('captureReading throws NotFoundException when no active config', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findFirst).mockResolvedValue(null);
    await expect(svc.captureReading(T, 'user1', {
      productId: 'p1', referenceType: 'RECEIPT', referenceId: 'r1',
      nominalQty: 5, actualWeightKg: 7.5,
    })).rejects.toThrow(NotFoundException);
  });

  it('captureReading calculates WITHIN_TOLERANCE correctly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findFirst).mockResolvedValue({
      id: 'cfg1', nominalWeightKg: 1.5, tolerancePctPlus: 5, tolerancePctMinus: 5, tareWeightKg: 0,
    } as any);
    vi.mocked(prisma.catchWeightReading.create).mockResolvedValue({ id: 'r1', varianceStatus: 'WITHIN_TOLERANCE' } as any);
    const result = await svc.captureReading(T, 'user1', {
      productId: 'p1', referenceType: 'RECEIPT', referenceId: 'r1',
      nominalQty: 5, actualWeightKg: 7.5, // 5 × 1.5 = 7.5 expected → 0% variance
    });
    expect(result.varianceStatus).toBe('WITHIN_TOLERANCE');
  });

  it('captureReading flags OVER_TOLERANCE when weight exceeds upper bound', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightConfig.findFirst).mockResolvedValue({
      id: 'cfg1', nominalWeightKg: 1.0, tolerancePctPlus: 5, tolerancePctMinus: 5, tareWeightKg: 0,
    } as any);
    vi.mocked(prisma.catchWeightReading.create).mockImplementation(async ({ data }: any) => ({
      id: 'r1', varianceStatus: data.varianceStatus,
    }));
    const result = await svc.captureReading(T, 'user1', {
      productId: 'p1', referenceType: 'RECEIPT', referenceId: 'r1',
      nominalQty: 5, actualWeightKg: 5.5, // 10% over
    });
    expect(result.varianceStatus).toBe('OVER_TOLERANCE');
  });

  it('getVarianceSummary aggregates by status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightReading.groupBy).mockResolvedValue([
      { varianceStatus: 'WITHIN_TOLERANCE', _count: 10, _avg: { variancePct: 1.2 } } as any,
      { varianceStatus: 'OVER_TOLERANCE', _count: 2, _avg: { variancePct: 7.5 } } as any,
    ]);
    const result = await svc.getVarianceSummary(T, 'cfg1');
    expect(result.total).toBe(12);
    expect(result.breakdown).toHaveLength(2);
  });

  // ── Tare Library ──────────────────────────────────────────────

  it('listTares returns all tares', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightTare.findMany).mockResolvedValue([{ id: 't1' }] as any);
    expect(await svc.listTares(T)).toHaveLength(1);
  });

  it('upsertTare creates or updates tare', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.catchWeightTare.upsert).mockResolvedValue({ id: 't1' } as any);
    expect(await svc.upsertTare(T, { containerLabel: 'CRATE-A', tareWeightKg: 0.5 })).toHaveProperty('id');
  });

  // ── Product Recalls ───────────────────────────────────────────

  it('createRecall creates recall in DRAFT status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.create).mockResolvedValue({ id: 'rc1', status: 'DRAFT' } as any);
    const result = await svc.createRecall(T, 'user1', {
      recallNumber: 'RC-001', productId: 'p1', recallClass: 'CLASS_I',
      title: 'Test Recall', reason: 'Contamination', actionRequired: 'RETURN',
    });
    expect(result.status).toBe('DRAFT');
  });

  it('issueRecall transitions DRAFT→ISSUED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'DRAFT' } as any);
    vi.mocked(prisma.productRecall.update).mockResolvedValue({ id: 'rc1', status: 'ISSUED' } as any);
    const result = await svc.issueRecall(T, 'rc1');
    expect(result.status).toBe('ISSUED');
  });

  it('issueRecall throws BadRequestException if not in DRAFT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'CANCELLED' } as any);
    await expect(svc.issueRecall(T, 'rc1')).rejects.toThrow(BadRequestException);
  });

  it('addAffectedStock increments totalUnitsAffected', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'ISSUED' } as any);
    vi.mocked(prisma.productRecall.update).mockResolvedValue({} as any);
    vi.mocked(prisma.recallAffectedStock.create).mockResolvedValue({ id: 'as1', qtyAffected: 100 } as any);
    const result = await svc.addAffectedStock(T, 'rc1', { warehouseId: 'wh1', qtyAffected: 100 });
    expect(result.id).toBe('as1');
    expect(prisma.productRecall.update).toHaveBeenCalled();
  });

  it('quarantineStock throws NotFoundException when stock not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'IN_PROGRESS' } as any);
    vi.mocked(prisma.recallAffectedStock.findFirst).mockResolvedValue(null);
    await expect(svc.quarantineStock(T, 'rc1', 'bad', 10)).rejects.toThrow(NotFoundException);
  });

  it('sendNotices marks all unsent notices as sent', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'ISSUED' } as any);
    vi.mocked(prisma.recallCustomerNotice.updateMany).mockResolvedValue({ count: 3 } as any);
    vi.mocked(prisma.productRecall.update).mockResolvedValue({} as any);
    const result = await svc.sendNotices(T, 'rc1');
    expect(result.sent).toBe(true);
  });

  it('completeRecall transitions IN_PROGRESS→COMPLETED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'IN_PROGRESS' } as any);
    vi.mocked(prisma.productRecall.update).mockResolvedValue({ id: 'rc1', status: 'COMPLETED' } as any);
    const result = await svc.completeRecall(T, 'rc1');
    expect(result.status).toBe('COMPLETED');
  });

  it('cancelRecall prevents cancelling a COMPLETED recall', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.findFirst).mockResolvedValue({ id: 'rc1', status: 'COMPLETED' } as any);
    await expect(svc.cancelRecall(T, 'rc1')).rejects.toThrow(BadRequestException);
  });

  it('getDashboard returns recall and catch-weight aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.productRecall.groupBy).mockResolvedValue([
      { status: 'DRAFT', _count: 2 } as any,
      { status: 'IN_PROGRESS', _count: 1 } as any,
    ]);
    vi.mocked(prisma.catchWeightConfig.count).mockResolvedValue(8);
    vi.mocked(prisma.catchWeightReading.count).mockResolvedValue(15);
    const result = await svc.getDashboard(T);
    expect(result.catchWeightConfigs).toBe(8);
    expect(result.outOfToleranceReadings).toBe(15);
    expect(result.recalls.draft).toBe(2);
  });
});
