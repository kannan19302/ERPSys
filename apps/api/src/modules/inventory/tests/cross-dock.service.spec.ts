import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    crossDockStation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    crossDockOrder: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    crossDockEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { CrossDockService } from '../cross-dock.service';

describe('CrossDockService', () => {
  let svc: CrossDockService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(() => {
    svc = new CrossDockService();
    vi.clearAllMocks();
  });

  it('createStation — happy path', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockStation.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.crossDockStation.create).mockResolvedValue({ id: 's1', code: 'D01' } as never);

    const result = await svc.createStation(tenantId, {
      warehouseId: 'wh-1', code: 'D01', name: 'Door 1', doorNumber: '1',
    });
    expect(result).toMatchObject({ id: 's1' });
  });

  it('createStation — duplicate code throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockStation.findUnique).mockResolvedValue({ id: 's1' } as never);
    await expect(svc.createStation(tenantId, {
      warehouseId: 'wh-1', code: 'D01', name: 'Door 1', doorNumber: '1',
    })).rejects.toThrow(BadRequestException);
  });

  it('createOrder — happy path', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.count).mockResolvedValue(0);
    vi.mocked(prisma.crossDockOrder.create).mockResolvedValue({ id: 'o1', orderNumber: 'CDO-000001' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    const result = await svc.createOrder(tenantId, userId, {
      warehouseId: 'wh-1', productId: 'p1', expectedQty: 100,
    });
    expect(result).toMatchObject({ id: 'o1', orderNumber: 'CDO-000001' });
  });

  it('createOrder — zero qty throws', async () => {
    await expect(svc.createOrder(tenantId, userId, {
      warehouseId: 'wh-1', productId: 'p1', expectedQty: 0,
    })).rejects.toThrow(BadRequestException);
  });

  it('receiveGoods — transitions PENDING→RECEIVING', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({
      id: 'o1', status: 'PENDING', dispatchedQty: 0,
    } as never);
    vi.mocked(prisma.crossDockOrder.update).mockResolvedValue({ id: 'o1', status: 'RECEIVING' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    const result = await svc.receiveGoods(tenantId, userId, 'o1', 50);
    expect(vi.mocked(prisma.crossDockOrder.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'RECEIVING' }) }),
    );
    expect(result).toMatchObject({ status: 'RECEIVING' });
  });

  it('receiveGoods — cancelled order throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({ id: 'o1', status: 'CANCELLED' } as never);
    await expect(svc.receiveGoods(tenantId, userId, 'o1', 10)).rejects.toThrow(BadRequestException);
  });

  it('stageOrder — RECEIVING→STAGING', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({ id: 'o1', status: 'RECEIVING' } as never);
    vi.mocked(prisma.crossDockOrder.update).mockResolvedValue({ id: 'o1', status: 'STAGING' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    await svc.stageOrder(tenantId, userId, 'o1');
    expect(vi.mocked(prisma.crossDockOrder.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'STAGING' }) }),
    );
  });

  it('stageOrder — non-RECEIVING status throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({ id: 'o1', status: 'PENDING' } as never);
    await expect(svc.stageOrder(tenantId, userId, 'o1')).rejects.toThrow(BadRequestException);
  });

  it('dispatchOrder — full dispatch sets COMPLETED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({
      id: 'o1', status: 'STAGING', dispatchedQty: 0, receivedQty: 100,
    } as never);
    vi.mocked(prisma.crossDockOrder.update).mockResolvedValue({ id: 'o1', status: 'COMPLETED' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    await svc.dispatchOrder(tenantId, userId, 'o1', 100);
    expect(vi.mocked(prisma.crossDockOrder.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('dispatchOrder — partial dispatch stays DISPATCHED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({
      id: 'o1', status: 'STAGING', dispatchedQty: 0, receivedQty: 100,
    } as never);
    vi.mocked(prisma.crossDockOrder.update).mockResolvedValue({ id: 'o1', status: 'DISPATCHED' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    await svc.dispatchOrder(tenantId, userId, 'o1', 50);
    expect(vi.mocked(prisma.crossDockOrder.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DISPATCHED' }) }),
    );
  });

  it('cancelOrder — happy path', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({ id: 'o1', status: 'PENDING' } as never);
    vi.mocked(prisma.crossDockOrder.update).mockResolvedValue({ id: 'o1', status: 'CANCELLED' } as never);
    vi.mocked(prisma.crossDockEvent.create).mockResolvedValue({} as never);

    const result = await svc.cancelOrder(tenantId, userId, 'o1', 'damaged goods');
    expect(result).toMatchObject({ status: 'CANCELLED' });
  });

  it('cancelOrder — completed order throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue({ id: 'o1', status: 'COMPLETED' } as never);
    await expect(svc.cancelOrder(tenantId, userId, 'o1', 'reason')).rejects.toThrow(BadRequestException);
  });

  it('getDashboard — returns aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.groupBy).mockResolvedValue([{ status: 'PENDING', _count: { id: 5 } }] as never);
    vi.mocked(prisma.crossDockStation.groupBy).mockResolvedValue([{ status: 'AVAILABLE', _count: { id: 3 } }] as never);
    vi.mocked(prisma.crossDockOrder.findMany).mockResolvedValue([]);

    const result = await svc.getDashboard(tenantId);
    expect(result).toHaveProperty('byStatus');
    expect(result).toHaveProperty('stationSummary');
    expect(result).toHaveProperty('recentOrders');
  });

  it('getOrder — not found returns null from prisma', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.crossDockOrder.findFirst).mockResolvedValue(null);
    const result = await svc.getOrder(tenantId, 'nonexistent');
    expect(result).toBeNull();
  });
});
