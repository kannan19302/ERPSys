import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    inboundShipment: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    outboundShipment: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    shipmentTrackingEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    shipmentException: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { ShipmentTrackingService } from '../shipment-tracking.service';
import { ShipmentDirection, ShipmentExceptionStatus } from '@prisma/client';

describe('ShipmentTrackingService', () => {
  let svc: ShipmentTrackingService;
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(() => {
    svc = new ShipmentTrackingService();
    vi.clearAllMocks();
  });

  it('createInboundShipment — auto-numbers IS-000001', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.count).mockResolvedValue(0);
    vi.mocked(prisma.inboundShipment.create).mockResolvedValue({ id: 's1', shipmentNumber: 'IS-000001' } as never);

    const result = await svc.createInboundShipment(tenantId, { warehouseId: 'wh-1' });
    expect(vi.mocked(prisma.inboundShipment.create)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ shipmentNumber: 'IS-000001' }) }),
    );
    expect(result).toMatchObject({ id: 's1' });
  });

  it('updateInboundStatus — valid transition EXPECTED→IN_TRANSIT', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 's1', status: 'EXPECTED' } as never);
    vi.mocked(prisma.inboundShipment.update).mockResolvedValue({ id: 's1', status: 'IN_TRANSIT' } as never);

    await svc.updateInboundStatus(tenantId, 's1', 'IN_TRANSIT');
    expect(vi.mocked(prisma.inboundShipment.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'IN_TRANSIT' }) }),
    );
  });

  it('updateInboundStatus — invalid transition throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 's1', status: 'COMPLETE' } as never);
    await expect(svc.updateInboundStatus(tenantId, 's1', 'EXPECTED')).rejects.toThrow(BadRequestException);
  });

  it('updateInboundStatus — sets arrivedAt when ARRIVED', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 's1', status: 'IN_TRANSIT' } as never);
    vi.mocked(prisma.inboundShipment.update).mockResolvedValue({ id: 's1', status: 'ARRIVED' } as never);

    await svc.updateInboundStatus(tenantId, 's1', 'ARRIVED');
    expect(vi.mocked(prisma.inboundShipment.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ arrivedAt: expect.any(Date) }) }),
    );
  });

  it('createOutboundShipment — auto-numbers OS-000001', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.outboundShipment.count).mockResolvedValue(0);
    vi.mocked(prisma.outboundShipment.create).mockResolvedValue({ id: 's2', shipmentNumber: 'OS-000001' } as never);

    const result = await svc.createOutboundShipment(tenantId, { warehouseId: 'wh-1' });
    expect(result).toMatchObject({ id: 's2' });
  });

  it('updateOutboundStatus — PACKED→SHIPPED sets shipDate', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.outboundShipment.findFirst).mockResolvedValue({ id: 's2', status: 'PACKED' } as never);
    vi.mocked(prisma.outboundShipment.update).mockResolvedValue({ id: 's2', status: 'SHIPPED' } as never);

    await svc.updateOutboundStatus(tenantId, 's2', 'SHIPPED');
    expect(vi.mocked(prisma.outboundShipment.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ shipDate: expect.any(Date) }) }),
    );
  });

  it('addTrackingEvent — happy path for inbound', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue({ id: 's1' } as never);
    vi.mocked(prisma.shipmentTrackingEvent.create).mockResolvedValue({ id: 'e1' } as never);

    const result = await svc.addTrackingEvent(tenantId, {
      direction: ShipmentDirection.INBOUND,
      shipmentId: 's1',
      eventCode: 'IN_TRANSIT',
      description: 'Package picked up',
    });
    expect(result).toMatchObject({ id: 'e1' });
  });

  it('addTrackingEvent — not found throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.findFirst).mockResolvedValue(null);
    await expect(svc.addTrackingEvent(tenantId, {
      direction: ShipmentDirection.INBOUND, shipmentId: 'xxx', eventCode: 'E', description: 'D',
    })).rejects.toThrow(NotFoundException);
  });

  it('reportException — creates exception', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.shipmentException.create).mockResolvedValue({ id: 'exc1', status: 'OPEN' } as never);

    const result = await svc.reportException(tenantId, userId, {
      direction: ShipmentDirection.OUTBOUND, shipmentId: 's2',
      exceptionCode: 'LOST', description: 'Package lost',
    });
    expect(result).toMatchObject({ id: 'exc1' });
  });

  it('updateExceptionStatus — RESOLVED sets resolvedAt', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.shipmentException.findFirst).mockResolvedValue({ id: 'exc1', status: 'OPEN' } as never);
    vi.mocked(prisma.shipmentException.update).mockResolvedValue({ id: 'exc1', status: 'RESOLVED' } as never);

    await svc.updateExceptionStatus(tenantId, 'exc1', userId, ShipmentExceptionStatus.RESOLVED, 'Found and delivered');
    expect(vi.mocked(prisma.shipmentException.update)).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resolvedAt: expect.any(Date) }) }),
    );
  });

  it('updateExceptionStatus — not found throws', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.shipmentException.findFirst).mockResolvedValue(null);
    await expect(svc.updateExceptionStatus(tenantId, 'xxx', userId, ShipmentExceptionStatus.RESOLVED)).rejects.toThrow(NotFoundException);
  });

  it('getDashboard — returns all aggregates', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.inboundShipment.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.outboundShipment.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.shipmentException.count).mockResolvedValue(2);
    vi.mocked(prisma.shipmentTrackingEvent.findMany).mockResolvedValue([]);

    const result = await svc.getDashboard(tenantId);
    expect(result).toHaveProperty('inboundByStatus');
    expect(result).toHaveProperty('outboundByStatus');
    expect(result.openExceptions).toBe(2);
  });
});
