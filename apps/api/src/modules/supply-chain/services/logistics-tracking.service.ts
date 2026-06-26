import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  notes?: string;
}

@Injectable()
export class LogisticsTrackingService {
  constructor(private eventEmitter: EventEmitter2) {}

  async getShipmentTracking(tenantId: string, shipmentId: string) {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const trackingHistory: TrackingEvent[] = (shipment as any).trackingHistory || [];

    return {
      shipmentId,
      trackingNumber: (shipment as any).trackingNumber || shipment.id,
      carrier: (shipment as any).carrier || 'Unknown',
      status: shipment.status,
      estimatedDelivery: (shipment as any).estimatedDelivery,
      trackingHistory,
    };
  }

  async updateShipmentStatus(
    tenantId: string,
    shipmentId: string,
    status: string,
    location?: string,
    notes?: string,
  ) {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const event: TrackingEvent = {
      timestamp: new Date().toISOString(),
      status,
      location,
      notes,
    };

    const existingHistory: TrackingEvent[] = (shipment as any).trackingHistory || [];
    existingHistory.push(event);

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status,
        trackingHistory: existingHistory as any,
      } as any,
    });

    this.eventEmitter.emit('shipment.status.updated', {
      tenantId, shipmentId, status, location,
    });

    if (status === 'DELIVERED') {
      this.eventEmitter.emit('notification.send', {
        tenantId,
        userId: 'system',
        type: 'SHIPMENT_DELIVERED',
        title: `Shipment ${(shipment as any).trackingNumber || shipmentId} delivered`,
      });
    }

    return { shipmentId, status, event };
  }

  async getShipmentsInTransit(tenantId: string) {
    const shipments = await prisma.shipment.findMany({
      where: { tenantId, status: { in: ['SHIPPED', 'IN_TRANSIT'] } },
      orderBy: { createdAt: 'desc' },
    });

    return shipments.map((s) => ({
      id: s.id,
      trackingNumber: (s as any).trackingNumber || s.id,
      carrier: (s as any).carrier || 'Unknown',
      status: s.status,
      estimatedDelivery: (s as any).estimatedDelivery,
    }));
  }
}
