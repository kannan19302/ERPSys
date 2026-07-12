import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Input schemas ────────────────────────────────────────────────────────────

export const createCarrierSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1),
  trackingUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});
export type CreateCarrierInput = z.infer<typeof createCarrierSchema>;

export const createServiceLevelSchema = z.object({
  carrierId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  transitDays: z.number().int().positive().optional(),
});
export type CreateServiceLevelInput = z.infer<typeof createServiceLevelSchema>;

export const createAsnSchema = z.object({
  vendorId: z.string().min(1),
  purchaseOrderId: z.string().optional(),
  warehouseId: z.string().min(1),
  shipDate: z.string().datetime().optional(),
  expectedArrival: z.string().datetime().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    productId: z.string().min(1),
    expectedQty: z.number().positive(),
    uom: z.string().default('EA'),
    lotNumber: z.string().optional(),
    serialNos: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })).min(1),
});
export type CreateAsnInput = z.infer<typeof createAsnSchema>;

export const receiveAsnSchema = z.object({
  lineItems: z.array(z.object({
    lineItemId: z.string().min(1),
    receivedQty: z.number().nonnegative(),
  })),
});
export type ReceiveAsnInput = z.infer<typeof receiveAsnSchema>;

export const createInboundShipmentSchema = z.object({
  asnId: z.string().optional(),
  carrierId: z.string().optional(),
  warehouseId: z.string().min(1),
  trackingNumber: z.string().optional(),
  expectedArrival: z.string().datetime().optional(),
  totalPallets: z.number().int().nonnegative().optional(),
  totalCartons: z.number().int().nonnegative().optional(),
  totalWeight: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
export type CreateInboundShipmentInput = z.infer<typeof createInboundShipmentSchema>;

export const createOutboundShipmentSchema = z.object({
  salesOrderId: z.string().optional(),
  carrierId: z.string().optional(),
  serviceLevelId: z.string().optional(),
  warehouseId: z.string().min(1),
  trackingNumber: z.string().optional(),
  shipDate: z.string().datetime().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  totalPallets: z.number().int().nonnegative().optional(),
  totalCartons: z.number().int().nonnegative().optional(),
  totalWeight: z.number().nonnegative().optional(),
  recipientName: z.string().optional(),
  recipientAddr: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateOutboundShipmentInput = z.infer<typeof createOutboundShipmentSchema>;

export const addTrackingEventSchema = z.object({
  eventCode: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  occurredAt: z.string().datetime(),
  source: z.enum(['MANUAL', 'CARRIER_API', 'WEBHOOK']).default('MANUAL'),
});
export type AddTrackingEventInput = z.infer<typeof addTrackingEventSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class InventoryLogisticsService {

  // ─── Carrier Management ───────────────────────────────────────────────────

  async listCarriers(tenantId: string) {
    return prisma.shippingCarrier.findMany({
      where: { tenantId, isActive: true },
      include: { serviceLevels: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCarrier(tenantId: string, dto: CreateCarrierInput) {
    const existing = await prisma.shippingCarrier.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Carrier with code '${dto.code}' already exists`);
    return prisma.shippingCarrier.create({
      data: { tenantId, ...dto },
    });
  }

  async updateCarrier(tenantId: string, id: string, dto: Partial<CreateCarrierInput>) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');
    return prisma.shippingCarrier.update({ where: { id }, data: dto });
  }

  async deactivateCarrier(tenantId: string, id: string) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');
    return prisma.shippingCarrier.update({ where: { id }, data: { isActive: false } });
  }

  async addServiceLevel(tenantId: string, dto: CreateServiceLevelInput) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id: dto.carrierId, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');
    const existing = await prisma.carrierServiceLevel.findFirst({
      where: { tenantId, carrierId: dto.carrierId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Service level '${dto.code}' already exists for this carrier`);
    return prisma.carrierServiceLevel.create({ data: { tenantId, ...dto } });
  }

  async listServiceLevels(tenantId: string, carrierId: string) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id: carrierId, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');
    return prisma.carrierServiceLevel.findMany({
      where: { tenantId, carrierId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Advance Shipping Notices ─────────────────────────────────────────────

  async listAsns(tenantId: string, filters: { vendorId?: string; warehouseId?: string; status?: string }) {
    const where: Prisma.AdvanceShippingNoticeWhereInput = { tenantId };
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    return prisma.advanceShippingNotice.findMany({
      where,
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsn(tenantId: string, id: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!asn) throw new NotFoundException('ASN not found');
    return asn;
  }

  async createAsn(tenantId: string, dto: CreateAsnInput) {
    const asnNumber = `ASN-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.advanceShippingNotice.create({
      data: {
        tenantId,
        asnNumber,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        warehouseId: dto.warehouseId,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : null,
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
        carrierName: dto.carrierName ?? null,
        trackingNumber: dto.trackingNumber ?? null,
        notes: dto.notes ?? null,
        lineItems: {
          create: dto.lineItems.map((l) => ({
            tenantId,
            productId: l.productId,
            expectedQty: new Prisma.Decimal(l.expectedQty.toFixed(4)),
            uom: l.uom,
            lotNumber: l.lotNumber ?? null,
            serialNos: l.serialNos ? JSON.stringify(l.serialNos) : null,
            notes: l.notes ?? null,
          })),
        },
      },
      include: { lineItems: true },
    });
  }

  async markAsnInTransit(tenantId: string, id: string, trackingNumber?: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({ where: { id, tenantId } });
    if (!asn) throw new NotFoundException('ASN not found');
    if (asn.status !== 'PENDING') throw new BadRequestException(`ASN is ${asn.status}, cannot mark in-transit`);
    return prisma.advanceShippingNotice.update({
      where: { id },
      data: { status: 'IN_TRANSIT', trackingNumber: trackingNumber ?? asn.trackingNumber },
    });
  }

  async markAsnArrived(tenantId: string, id: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({ where: { id, tenantId } });
    if (!asn) throw new NotFoundException('ASN not found');
    if (!['PENDING', 'IN_TRANSIT'].includes(asn.status)) {
      throw new BadRequestException(`ASN is ${asn.status}, cannot mark arrived`);
    }
    return prisma.advanceShippingNotice.update({ where: { id }, data: { status: 'ARRIVED' } });
  }

  async receiveAsn(tenantId: string, id: string, dto: ReceiveAsnInput) {
    const asn = await prisma.advanceShippingNotice.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!asn) throw new NotFoundException('ASN not found');
    if (asn.status === 'RECEIVED') throw new BadRequestException('ASN already received');
    if (asn.status === 'CANCELLED') throw new BadRequestException('ASN is cancelled');

    return prisma.$transaction(async (tx) => {
      for (const item of dto.lineItems) {
        const lineItem = asn.lineItems.find((l) => l.id === item.lineItemId);
        if (!lineItem) throw new NotFoundException(`Line item ${item.lineItemId} not found in ASN`);
        await tx.aSNLineItem.update({
          where: { id: item.lineItemId },
          data: { receivedQty: new Prisma.Decimal(item.receivedQty.toFixed(4)) },
        });
      }
      return tx.advanceShippingNotice.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: { lineItems: true },
      });
    });
  }

  async cancelAsn(tenantId: string, id: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({ where: { id, tenantId } });
    if (!asn) throw new NotFoundException('ASN not found');
    if (asn.status === 'RECEIVED') throw new BadRequestException('Cannot cancel a received ASN');
    return prisma.advanceShippingNotice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ─── Inbound Shipments ────────────────────────────────────────────────────

  async listInboundShipments(tenantId: string, warehouseId?: string) {
    const where: Prisma.InboundShipmentWhereInput = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    return prisma.inboundShipment.findMany({
      where,
      include: { carrier: true, trackingEvents: { orderBy: { occurredAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInboundShipment(tenantId: string, dto: CreateInboundShipmentInput) {
    const shipmentNumber = `IS-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    if (dto.carrierId) {
      const carrier = await prisma.shippingCarrier.findFirst({ where: { id: dto.carrierId, tenantId } });
      if (!carrier) throw new NotFoundException('Carrier not found');
    }
    return prisma.inboundShipment.create({
      data: {
        tenantId,
        shipmentNumber,
        asnId: dto.asnId ?? null,
        carrierId: dto.carrierId ?? null,
        warehouseId: dto.warehouseId,
        trackingNumber: dto.trackingNumber ?? null,
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
        totalPallets: dto.totalPallets ?? null,
        totalCartons: dto.totalCartons ?? null,
        totalWeight: dto.totalWeight != null ? new Prisma.Decimal(dto.totalWeight.toFixed(3)) : null,
        notes: dto.notes ?? null,
      },
      include: { carrier: true },
    });
  }

  async updateInboundShipmentStatus(tenantId: string, id: string, status: string, details?: { arrivedAt?: string; completedAt?: string }) {
    const shipment = await prisma.inboundShipment.findFirst({ where: { id, tenantId } });
    if (!shipment) throw new NotFoundException('Inbound shipment not found');
    const allowed: Record<string, string[]> = {
      EXPECTED: ['IN_TRANSIT', 'ARRIVED', 'EXCEPTION'],
      IN_TRANSIT: ['ARRIVED', 'EXCEPTION'],
      ARRIVED: ['RECEIVING', 'EXCEPTION'],
      RECEIVING: ['COMPLETE', 'EXCEPTION'],
      EXCEPTION: ['IN_TRANSIT', 'ARRIVED'],
    };
    if (!allowed[shipment.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${shipment.status} to ${status}`);
    }
    return prisma.inboundShipment.update({
      where: { id },
      data: {
        status,
        arrivedAt: (status === 'ARRIVED' && details?.arrivedAt) ? new Date(details.arrivedAt) : (status === 'ARRIVED' ? new Date() : undefined),
        completedAt: (status === 'COMPLETE' && details?.completedAt) ? new Date(details.completedAt) : (status === 'COMPLETE' ? new Date() : undefined),
      },
    });
  }

  async addInboundTrackingEvent(tenantId: string, shipmentId: string, dto: AddTrackingEventInput) {
    const shipment = await prisma.inboundShipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!shipment) throw new NotFoundException('Inbound shipment not found');
    return prisma.shipmentTrackingEvent.create({
      data: {
        tenantId,
        inboundShipmentId: shipmentId,
        eventCode: dto.eventCode,
        description: dto.description,
        location: dto.location ?? null,
        occurredAt: new Date(dto.occurredAt),
        source: dto.source,
      },
    });
  }

  // ─── Outbound Shipments ───────────────────────────────────────────────────

  async listOutboundShipments(tenantId: string, filters: { salesOrderId?: string; warehouseId?: string; status?: string }) {
    const where: Prisma.OutboundShipmentWhereInput = { tenantId };
    if (filters.salesOrderId) where.salesOrderId = filters.salesOrderId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    return prisma.outboundShipment.findMany({
      where,
      include: { carrier: true, trackingEvents: { orderBy: { occurredAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOutboundShipment(tenantId: string, dto: CreateOutboundShipmentInput) {
    const shipmentNumber = `OS-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.outboundShipment.create({
      data: {
        tenantId,
        shipmentNumber,
        salesOrderId: dto.salesOrderId ?? null,
        carrierId: dto.carrierId ?? null,
        serviceLevelId: dto.serviceLevelId ?? null,
        warehouseId: dto.warehouseId,
        trackingNumber: dto.trackingNumber ?? null,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : null,
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
        totalPallets: dto.totalPallets ?? null,
        totalCartons: dto.totalCartons ?? null,
        totalWeight: dto.totalWeight != null ? new Prisma.Decimal(dto.totalWeight.toFixed(3)) : null,
        recipientName: dto.recipientName ?? null,
        recipientAddr: dto.recipientAddr ?? null,
        notes: dto.notes ?? null,
      },
      include: { carrier: true },
    });
  }

  async shipOutbound(tenantId: string, id: string, trackingNumber?: string) {
    const shipment = await prisma.outboundShipment.findFirst({ where: { id, tenantId } });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');
    if (!['PENDING', 'PACKED'].includes(shipment.status)) {
      throw new BadRequestException(`Cannot ship from status ${shipment.status}`);
    }
    return prisma.outboundShipment.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        shipDate: new Date(),
        trackingNumber: trackingNumber ?? shipment.trackingNumber,
      },
    });
  }

  async recordDelivery(tenantId: string, id: string, proofOfDelivery?: string, recipientName?: string) {
    const shipment = await prisma.outboundShipment.findFirst({ where: { id, tenantId } });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');
    if (!['SHIPPED', 'IN_TRANSIT'].includes(shipment.status)) {
      throw new BadRequestException(`Cannot record delivery from status ${shipment.status}`);
    }
    return prisma.outboundShipment.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        proofOfDelivery: proofOfDelivery ?? null,
        recipientName: recipientName ?? shipment.recipientName,
      },
    });
  }

  async flagOutboundException(tenantId: string, id: string, reason: string) {
    const shipment = await prisma.outboundShipment.findFirst({ where: { id, tenantId } });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');
    return prisma.outboundShipment.update({
      where: { id },
      data: { status: 'EXCEPTION', notes: reason },
    });
  }

  async addOutboundTrackingEvent(tenantId: string, shipmentId: string, dto: AddTrackingEventInput) {
    const shipment = await prisma.outboundShipment.findFirst({ where: { id: shipmentId, tenantId } });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');
    return prisma.shipmentTrackingEvent.create({
      data: {
        tenantId,
        outboundShipmentId: shipmentId,
        eventCode: dto.eventCode,
        description: dto.description,
        location: dto.location ?? null,
        occurredAt: new Date(dto.occurredAt),
        source: dto.source,
      },
    });
  }

  // ─── Logistics Dashboard ──────────────────────────────────────────────────

  async getLogisticsDashboard(tenantId: string) {
    const [
      totalAsns, pendingAsns, inTransitAsns,
      totalInbound, openInbound,
      totalOutbound, pendingOutbound, inTransitOutbound, exceptions,
      carrierCount,
    ] = await Promise.all([
      prisma.advanceShippingNotice.count({ where: { tenantId } }),
      prisma.advanceShippingNotice.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.advanceShippingNotice.count({ where: { tenantId, status: 'IN_TRANSIT' } }),
      prisma.inboundShipment.count({ where: { tenantId } }),
      prisma.inboundShipment.count({ where: { tenantId, status: { in: ['EXPECTED', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING'] } } }),
      prisma.outboundShipment.count({ where: { tenantId } }),
      prisma.outboundShipment.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.outboundShipment.count({ where: { tenantId, status: { in: ['SHIPPED', 'IN_TRANSIT'] } } }),
      prisma.outboundShipment.count({ where: { tenantId, status: 'EXCEPTION' } }),
      prisma.shippingCarrier.count({ where: { tenantId, isActive: true } }),
    ]);

    return {
      asns: { total: totalAsns, pending: pendingAsns, inTransit: inTransitAsns },
      inbound: { total: totalInbound, open: openInbound },
      outbound: { total: totalOutbound, pending: pendingOutbound, inTransit: inTransitOutbound, exceptions },
      carrierCount,
    };
  }

  async getShipmentExceptions(tenantId: string) {
    const [inboundExceptions, outboundExceptions] = await Promise.all([
      prisma.inboundShipment.findMany({
        where: { tenantId, status: 'EXCEPTION' },
        include: { carrier: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.outboundShipment.findMany({
        where: { tenantId, status: 'EXCEPTION' },
        include: { carrier: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);
    return { inboundExceptions, outboundExceptions };
  }
}
