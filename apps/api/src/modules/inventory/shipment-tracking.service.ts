import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { ShipmentDirection, ShipmentExceptionStatus } from '@prisma/client';

@Injectable()
export class ShipmentTrackingService {
  // ── Inbound Shipments ─────────────────────────────────────────────────────

  async createInboundShipment(
    tenantId: string,
    data: {
      warehouseId: string;
      asnId?: string;
      carrierId?: string;
      trackingNumber?: string;
      expectedArrival?: Date;
      totalPallets?: number;
      totalCartons?: number;
      totalWeight?: number;
      notes?: string;
    },
  ) {
    const count = await prisma.inboundShipment.count({ where: { tenantId } });
    const shipmentNumber = `IS-${String(count + 1).padStart(6, '0')}`;

    return prisma.inboundShipment.create({
      data: { tenantId, shipmentNumber, ...data, status: 'EXPECTED' },
    });
  }

  async updateInboundStatus(tenantId: string, shipmentId: string, status: string) {
    const shipment = await prisma.inboundShipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!shipment) throw new NotFoundException('Inbound shipment not found');

    const validTransitions: Record<string, string[]> = {
      EXPECTED: ['IN_TRANSIT', 'EXCEPTION'],
      IN_TRANSIT: ['ARRIVED', 'EXCEPTION'],
      ARRIVED: ['RECEIVING', 'EXCEPTION'],
      RECEIVING: ['COMPLETE', 'EXCEPTION'],
      EXCEPTION: ['IN_TRANSIT', 'ARRIVED', 'RECEIVING'],
    };

    if (!validTransitions[shipment.status]?.includes(status))
      throw new BadRequestException(`Cannot transition from ${shipment.status} to ${status}`);

    const arrivedAt = status === 'ARRIVED' ? new Date() : undefined;
    const completedAt = status === 'COMPLETE' ? new Date() : undefined;

    return prisma.inboundShipment.update({
      where: { id: shipmentId },
      data: { status, ...(arrivedAt ? { arrivedAt } : {}), ...(completedAt ? { completedAt } : {}) },
    });
  }

  async listInboundShipments(tenantId: string, status?: string, warehouseId?: string) {
    return prisma.inboundShipment.findMany({
      where: { tenantId, ...(status ? { status } : {}), ...(warehouseId ? { warehouseId } : {}) },
      include: { trackingEvents: { orderBy: { occurredAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Outbound Shipments ────────────────────────────────────────────────────

  async createOutboundShipment(
    tenantId: string,
    data: {
      warehouseId: string;
      salesOrderId?: string;
      carrierId?: string;
      serviceLevelId?: string;
      trackingNumber?: string;
      recipientName?: string;
      recipientAddr?: string;
      totalPallets?: number;
      totalCartons?: number;
      totalWeight?: number;
      estimatedDelivery?: Date;
      notes?: string;
    },
  ) {
    const count = await prisma.outboundShipment.count({ where: { tenantId } });
    const shipmentNumber = `OS-${String(count + 1).padStart(6, '0')}`;

    return prisma.outboundShipment.create({
      data: { tenantId, shipmentNumber, ...data, status: 'PENDING' },
    });
  }

  async updateOutboundStatus(tenantId: string, shipmentId: string, status: string, proofOfDelivery?: string) {
    const shipment = await prisma.outboundShipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['PACKED', 'EXCEPTION'],
      PACKED: ['SHIPPED', 'EXCEPTION'],
      SHIPPED: ['IN_TRANSIT', 'EXCEPTION'],
      IN_TRANSIT: ['DELIVERED', 'EXCEPTION', 'RETURNED'],
      EXCEPTION: ['IN_TRANSIT', 'PACKED', 'RETURNED'],
    };

    if (!validTransitions[shipment.status]?.includes(status))
      throw new BadRequestException(`Cannot transition from ${shipment.status} to ${status}`);

    const deliveredAt = status === 'DELIVERED' ? new Date() : undefined;
    const shipDate = status === 'SHIPPED' ? new Date() : undefined;

    return prisma.outboundShipment.update({
      where: { id: shipmentId },
      data: {
        status,
        ...(deliveredAt ? { deliveredAt } : {}),
        ...(shipDate ? { shipDate } : {}),
        ...(proofOfDelivery ? { proofOfDelivery } : {}),
      },
    });
  }

  async listOutboundShipments(tenantId: string, status?: string, warehouseId?: string) {
    return prisma.outboundShipment.findMany({
      where: { tenantId, ...(status ? { status } : {}), ...(warehouseId ? { warehouseId } : {}) },
      include: { trackingEvents: { orderBy: { occurredAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Tracking Events ───────────────────────────────────────────────────────

  async addTrackingEvent(
    tenantId: string,
    data: {
      direction: ShipmentDirection;
      shipmentId: string;
      eventCode: string;
      description: string;
      location?: string;
      occurredAt?: Date;
      source?: string;
    },
  ) {
    const isInbound = data.direction === ShipmentDirection.INBOUND;
    if (isInbound) {
      const s = await prisma.inboundShipment.findFirst({ where: { id: data.shipmentId, tenantId } });
      if (!s) throw new NotFoundException('Inbound shipment not found');
    } else {
      const s = await prisma.outboundShipment.findFirst({ where: { id: data.shipmentId, tenantId } });
      if (!s) throw new NotFoundException('Outbound shipment not found');
    }

    return prisma.shipmentTrackingEvent.create({
      data: {
        tenantId,
        ...(isInbound ? { inboundShipmentId: data.shipmentId } : { outboundShipmentId: data.shipmentId }),
        eventCode: data.eventCode,
        description: data.description,
        location: data.location,
        occurredAt: data.occurredAt ?? new Date(),
        source: data.source ?? 'MANUAL',
      },
    });
  }

  async getTrackingHistory(tenantId: string, direction: ShipmentDirection, shipmentId: string) {
    const where = direction === ShipmentDirection.INBOUND
      ? { tenantId, inboundShipmentId: shipmentId }
      : { tenantId, outboundShipmentId: shipmentId };

    return prisma.shipmentTrackingEvent.findMany({ where, orderBy: { occurredAt: 'asc' } });
  }

  // ── Exceptions ────────────────────────────────────────────────────────────

  async reportException(
    tenantId: string,
    userId: string,
    data: {
      direction: ShipmentDirection;
      shipmentId: string;
      exceptionCode: string;
      description: string;
      severity?: string;
    },
  ) {
    return prisma.shipmentException.create({
      data: {
        tenantId,
        direction: data.direction,
        shipmentId: data.shipmentId,
        exceptionCode: data.exceptionCode,
        description: data.description,
        severity: data.severity ?? 'MEDIUM',
        reportedBy: userId,
      },
    });
  }

  async updateExceptionStatus(tenantId: string, exceptionId: string, userId: string, status: ShipmentExceptionStatus, note?: string) {
    const exc = await prisma.shipmentException.findFirst({ where: { id: exceptionId, tenantId } });
    if (!exc) throw new NotFoundException('Exception not found');

    const resolvedAt = status === ShipmentExceptionStatus.RESOLVED ? new Date() : undefined;

    return prisma.shipmentException.update({
      where: { id: exceptionId },
      data: {
        status,
        ...(resolvedAt ? { resolvedAt, resolvedBy: userId } : {}),
        ...(note ? { resolutionNote: note } : {}),
      },
    });
  }

  async listExceptions(tenantId: string, status?: ShipmentExceptionStatus, shipmentId?: string) {
    return prisma.shipmentException.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(shipmentId ? { shipmentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [inboundByStatus, outboundByStatus, openExceptions, recentTracking] = await Promise.all([
      prisma.inboundShipment.groupBy({ by: ['status'], where: { tenantId }, _count: { id: true } }),
      prisma.outboundShipment.groupBy({ by: ['status'], where: { tenantId }, _count: { id: true } }),
      prisma.shipmentException.count({ where: { tenantId, status: { not: ShipmentExceptionStatus.RESOLVED } } }),
      prisma.shipmentTrackingEvent.findMany({
        where: { tenantId },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
    ]);

    return { inboundByStatus, outboundByStatus, openExceptions, recentTracking };
  }
}
