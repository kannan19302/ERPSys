import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    pickWave: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    pickWaveOrder: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    pickWaveItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    pickTask: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { PickWavesService } from '../pick-waves.service';

describe('PickWavesService', () => {
  let svc: PickWavesService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const waveId = 'wave-1';

  beforeEach(() => {
    svc = new PickWavesService();
    vi.clearAllMocks();
  });

  it('createWave — auto-numbers WV-000001', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.count).mockResolvedValue(0);
    vi.mocked(prisma.pickWave.create).mockResolvedValue({ id: 'w1', waveNumber: 'WV-000001', status: 'OPEN' } as never);

    const result = await svc.createWave(tenantId, userId, { warehouseId: 'wh-1' });
    expect(vi.mocked(prisma.pickWave.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ waveNumber: 'WV-000001' }) }),
    );
    expect(result).toMatchObject({ waveNumber: 'WV-000001' });
  });

  it('addOrderToWave — throws on non-OPEN wave', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    await expect(svc.addOrderToWave(tenantId, waveId, 'so-1')).rejects.toThrow(BadRequestException);
  });

  it('addOrderToWave — happy path', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'OPEN' } as never);
    vi.mocked(prisma.pickWaveOrder.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pickWaveOrder.create).mockResolvedValue({ id: 'wo1' } as never);

    await svc.addOrderToWave(tenantId, waveId, 'so-1');
    expect(vi.mocked(prisma.pickWaveOrder.create)).toHaveBeenCalled();
  });

  it('addItemToWave — zero qty throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'OPEN' } as never);
    await expect(svc.addItemToWave(tenantId, waveId, { productId: 'p1', quantity: 0 })).rejects.toThrow(BadRequestException);
  });

  it('startWave — throws if no items', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'OPEN' } as never);
    vi.mocked(prisma.pickWaveItem.count).mockResolvedValue(0);
    await expect(svc.startWave(tenantId, waveId)).rejects.toThrow(BadRequestException);
  });

  it('startWave — OPEN→PICKING', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'OPEN' } as never);
    vi.mocked(prisma.pickWaveItem.count).mockResolvedValue(5);
    vi.mocked(prisma.pickWave.update).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);

    await svc.startWave(tenantId, waveId);
    expect(vi.mocked(prisma.pickWave.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PICKING' } }),
    );
  });

  it('confirmPick — full pick sets item PICKED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    vi.mocked(prisma.pickWaveItem.findFirst)
      .mockResolvedValueOnce({ id: 'i1', quantity: 10, pickedQty: 0 } as never)
      .mockResolvedValueOnce({ id: 'i1', status: 'PICKED' } as never);
    vi.mocked(prisma.pickWaveItem.update).mockResolvedValue({ id: 'i1', status: 'PICKED' } as never);
    vi.mocked(prisma.pickTask.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.pickWaveItem.count).mockResolvedValue(0);
    vi.mocked(prisma.pickWave.update).mockResolvedValue({} as never);

    await svc.confirmPick(tenantId, userId, waveId, 'i1', 10);
    expect(vi.mocked(prisma.pickWaveItem.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PICKED' }) }),
    );
  });

  it('confirmPick — partial pick sets IN_PROGRESS', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    vi.mocked(prisma.pickWaveItem.findFirst)
      .mockResolvedValueOnce({ id: 'i1', quantity: 10, pickedQty: 0 } as never)
      .mockResolvedValueOnce({ id: 'i1', status: 'IN_PROGRESS' } as never);
    vi.mocked(prisma.pickWaveItem.update).mockResolvedValue({ id: 'i1', status: 'IN_PROGRESS' } as never);
    vi.mocked(prisma.pickTask.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.pickWaveItem.count).mockResolvedValue(1);

    await svc.confirmPick(tenantId, userId, waveId, 'i1', 5);
    expect(vi.mocked(prisma.pickWaveItem.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
    );
  });

  it('packWave — throws if PENDING items remain', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    vi.mocked(prisma.pickWaveItem.count).mockResolvedValue(2);
    await expect(svc.packWave(tenantId, waveId)).rejects.toThrow(BadRequestException);
  });

  it('cancelWave — cascades to tasks and items', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    vi.mocked(prisma.pickTask.updateMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(prisma.pickWaveItem.updateMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(prisma.pickWave.update).mockResolvedValue({ id: waveId, status: 'CANCELLED' } as never);

    await svc.cancelWave(tenantId, waveId);
    expect(vi.mocked(prisma.pickTask.updateMany)).toHaveBeenCalled();
    expect(vi.mocked(prisma.pickWaveItem.updateMany)).toHaveBeenCalled();
  });

  it('assignTask — happy path', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.findFirst).mockResolvedValue({ id: waveId, status: 'PICKING' } as never);
    vi.mocked(prisma.pickTask.create).mockResolvedValue({ id: 'task-1', assignedTo: 'user-2' } as never);

    const result = await svc.assignTask(tenantId, { pickWaveId: waveId, pickItemId: 'i1', assignedTo: 'user-2' });
    expect(result).toMatchObject({ id: 'task-1' });
  });

  it('startTask — ASSIGNED→IN_PROGRESS', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickTask.findFirst).mockResolvedValue({ id: 'task-1', status: 'ASSIGNED' } as never);
    vi.mocked(prisma.pickTask.update).mockResolvedValue({ id: 'task-1', status: 'IN_PROGRESS' } as never);

    await svc.startTask(tenantId, 'task-1');
    expect(vi.mocked(prisma.pickTask.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
    );
  });

  it('getDashboard — returns all aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.pickWave.groupBy).mockResolvedValue([{ status: 'OPEN', _count: { id: 3 } }] as never);
    vi.mocked(prisma.pickWave.findMany).mockResolvedValue([]);
    vi.mocked(prisma.pickWaveItem.groupBy).mockResolvedValue([]);

    const result = await svc.getDashboard(tenantId);
    expect(result).toHaveProperty('byStatus');
    expect(result).toHaveProperty('openWaves');
    expect(result).toHaveProperty('itemStats');
  });
});
