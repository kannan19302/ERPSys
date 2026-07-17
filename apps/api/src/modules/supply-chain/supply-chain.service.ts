import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateShipmentInput } from '@unerp/shared';
import { Prisma, Shipment, AsnDiscrepancyType, ShipmentExceptionStatus } from '@prisma/client';
import {
  CreateCarrierDto,
  CreateCarrierServiceLevelDto,
  CreateAsnDto,
  ReceiveAsnDto,
  CreateInboundShipmentDto,
  CreateOutboundShipmentDto,
  AddTrackingEventDto,
  ReportExceptionDto,
  ResolveExceptionDto,
} from './dto/supply-chain.dto';

@Injectable()
export class SupplyChainService {
  /**
   * Fetch all shipments scoped to tenantId.
   */
  async getShipments(tenantId: string) {
    const shipments = await prisma.shipment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return shipments.map((s: Shipment) => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      type: s.type,
      status: s.status,
      carrierName: s.carrierName,
      trackingNumber: s.trackingNumber,
      trackingUrl: s.trackingUrl,
      weight: s.weight ? Number(s.weight) : null,
      weightUnit: s.weightUnit,
      shippingCost: s.shippingCost ? Number(s.shippingCost) : null,
      currency: s.currency,
      estimatedDelivery: s.estimatedDelivery,
      actualDelivery: s.actualDelivery,
      shippedAt: s.shippedAt,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Get single shipment by ID.
   */
  async getShipmentById(tenantId: string, id: string) {
    const shipment = await prisma.shipment.findFirst({
      where: { id, tenantId },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  /**
   * Create new shipment.
   */
  async createShipment(tenantId: string, orgId: string, dto: CreateShipmentInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found for this Tenant.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.shipment.findFirst({
      where: { tenantId, shipmentNumber: dto.shipmentNumber },
    });
    if (existing) {
      throw new BadRequestException(`Shipment number ${dto.shipmentNumber} already exists.`);
    }

    return prisma.shipment.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        shipmentNumber: dto.shipmentNumber,
        type: dto.type ?? 'OUTBOUND',
        status: 'PENDING',
        carrierName: dto.carrierName || null,
        trackingNumber: dto.trackingNumber || null,
        trackingUrl: dto.trackingUrl || null,
        originAddress: dto.originAddress ? (dto.originAddress as Prisma.InputJsonObject) : Prisma.JsonNull,
        destAddress: dto.destAddress ? (dto.destAddress as Prisma.InputJsonObject) : Prisma.JsonNull,
        weight: dto.weight != null ? new Prisma.Decimal(dto.weight) : null,
        weightUnit: dto.weightUnit ?? 'KG',
        shippingCost: dto.shippingCost != null ? new Prisma.Decimal(dto.shippingCost) : null,
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
        notes: dto.notes || null,
        createdBy,
      },
    });
  }

  /**
   * Update shipment status.
   */
  async updateShipmentStatus(tenantId: string, id: string, status: string) {
    const shipment = await prisma.shipment.findFirst({ where: { id, tenantId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'PICKED_UP' || status === 'IN_TRANSIT') {
      updateData.shippedAt = new Date();
    }
    if (status === 'DELIVERED') {
      updateData.actualDelivery = new Date();
    }

    return prisma.shipment.update({ where: { id }, data: updateData });
  }

  /**
   * Simple Demand Forecasting using moving average of sales.
   */
  async getDemandForecast(tenantId: string) {
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
    });

    const forecasts = [];

    for (const product of products) {
      // Fetch historical sales order items for this product
      const salesItems = await prisma.salesOrderItem.findMany({
        where: {
          tenantId,
          productId: product.id,
          salesOrder: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'DELIVERED'] },
          },
        },
        include: {
          salesOrder: true,
        },
      });

      const totalQuantity = salesItems.reduce((sum: number, item: { quantity: any }) => sum + Number(item.quantity), 0);
      const averageMonthlySales = salesItems.length > 0 ? totalQuantity / Math.max(1, salesItems.length) : 0;
      
      // Predict next month: baseline average monthly sales + 10% trend buffer
      const forecastedQuantity = Math.round(averageMonthlySales * 1.1);

      forecasts.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: 0,
        averageSales: Math.round(averageMonthlySales),
        forecastedQuantity: forecastedQuantity > 0 ? forecastedQuantity : 10,
        confidenceScore: salesItems.length > 3 ? 0.85 : 0.5,
      });
    }

    return forecasts;
  }

  // ==========================================
  // CARRIERS
  // ==========================================

  async getCarriers(tenantId: string) {
    return prisma.shippingCarrier.findMany({
      where: { tenantId },
      include: { serviceLevels: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCarrierById(tenantId: string, id: string) {
    const carrier = await prisma.shippingCarrier.findFirst({
      where: { id, tenantId },
      include: { serviceLevels: true },
    });
    if (!carrier) throw new NotFoundException('Carrier not found');
    return carrier;
  }

  async createCarrier(tenantId: string, dto: CreateCarrierDto) {
    const existing = await prisma.shippingCarrier.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Carrier code ${dto.code} already exists.`);

    return prisma.shippingCarrier.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        trackingUrl: dto.trackingUrl || null,
        contactEmail: dto.contactEmail || null,
        contactPhone: dto.contactPhone || null,
        isActive: dto.isActive !== false,
      },
    });
  }

  async updateCarrier(tenantId: string, id: string, dto: Partial<CreateCarrierDto>) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');

    return prisma.shippingCarrier.update({
      where: { id },
      data: {
        name: dto.name,
        trackingUrl: dto.trackingUrl,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        isActive: dto.isActive,
      },
    });
  }

  async deleteCarrier(tenantId: string, id: string) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');

    return prisma.shippingCarrier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getCarrierServiceLevels(tenantId: string, carrierId: string) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id: carrierId, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');

    return prisma.carrierServiceLevel.findMany({
      where: { tenantId, carrierId },
    });
  }

  async createCarrierServiceLevel(tenantId: string, carrierId: string, dto: CreateCarrierServiceLevelDto) {
    const carrier = await prisma.shippingCarrier.findFirst({ where: { id: carrierId, tenantId } });
    if (!carrier) throw new NotFoundException('Carrier not found');

    const existing = await prisma.carrierServiceLevel.findFirst({
      where: { tenantId, carrierId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Service level code ${dto.code} already exists for this carrier.`);

    return prisma.carrierServiceLevel.create({
      data: {
        tenantId,
        carrierId,
        code: dto.code,
        name: dto.name,
        transitDays: dto.transitDays || null,
        isActive: true,
      },
    });
  }

  // ==========================================
  // ADVANCE SHIPPING NOTICES (ASN)
  // ==========================================

  async getAsns(tenantId: string) {
    return prisma.advanceShippingNotice.findMany({
      where: { tenantId },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsnById(tenantId: string, id: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!asn) throw new NotFoundException('ASN not found');
    return asn;
  }

  async createAsn(tenantId: string, dto: CreateAsnDto) {
    const existing = await prisma.advanceShippingNotice.findFirst({
      where: { tenantId, asnNumber: dto.asnNumber },
    });
    if (existing) throw new BadRequestException(`ASN number ${dto.asnNumber} already exists.`);

    return prisma.$transaction(async (tx) => {
      const asn = await tx.advanceShippingNotice.create({
        data: {
          tenantId,
          asnNumber: dto.asnNumber,
          vendorId: dto.vendorId,
          purchaseOrderId: dto.purchaseOrderId || null,
          warehouseId: dto.warehouseId,
          shipDate: dto.shipDate ? new Date(dto.shipDate) : null,
          expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
          carrierName: dto.carrierName || null,
          trackingNumber: dto.trackingNumber || null,
          notes: dto.notes || null,
          status: 'PENDING',
        },
      });

      const lineItemsData = dto.lineItems.map(item => ({
        tenantId,
        asnId: asn.id,
        productId: item.productId,
        expectedQty: new Prisma.Decimal(item.expectedQty),
        receivedQty: new Prisma.Decimal(0),
        uom: item.uom || 'EA',
        lotNumber: item.lotNumber || null,
        serialNos: item.serialNos || null,
        notes: item.notes || null,
      }));

      await tx.aSNLineItem.createMany({
        data: lineItemsData,
      });

      return tx.advanceShippingNotice.findUnique({
        where: { id: asn.id },
        include: { lineItems: true },
      });
    });
  }

  async receiveAsn(tenantId: string, id: string, dto: ReceiveAsnDto, userId: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!asn) throw new NotFoundException('ASN not found');
    if (asn.status === 'RECEIVED') throw new BadRequestException('ASN has already been fully received.');

    return prisma.$transaction(async (tx) => {
      for (const receiveItem of dto.lineItems) {
        const lineItem = asn.lineItems.find(item => item.id === receiveItem.id);
        if (!lineItem) throw new BadRequestException(`Line item ID ${receiveItem.id} not found in this ASN.`);

        const expected = Number(lineItem.expectedQty);
        const actual = Number(receiveItem.actualQty);

        // Update the received quantity
        await tx.aSNLineItem.update({
          where: { id: lineItem.id },
          data: {
            receivedQty: new Prisma.Decimal(actual),
            lotNumber: receiveItem.lotNumber || lineItem.lotNumber,
            serialNos: receiveItem.serialNos || lineItem.serialNos,
            notes: receiveItem.notes || lineItem.notes,
          },
        });

        // Check for discrepancies
        if (expected !== actual) {
          const diff = actual - expected;
          const discrepancyType = diff < 0 ? AsnDiscrepancyType.SHORTAGE : AsnDiscrepancyType.OVERAGE;

          await tx.asnDiscrepancy.create({
            data: {
              tenantId,
              asnId: asn.id,
              lineItemId: lineItem.id,
              discrepancyType,
              productId: lineItem.productId,
              expectedQty: lineItem.expectedQty,
              actualQty: new Prisma.Decimal(actual),
              notes: receiveItem.notes || `Discrepancy of ${diff} detected during receipt.`,
              reportedBy: userId,
            },
          });
        }
      }

      const receivedStatus = 'RECEIVED';
      
      const updatedAsn = await tx.advanceShippingNotice.update({
        where: { id },
        data: {
          status: receivedStatus,
          receivedAt: new Date(),
        },
        include: { lineItems: true },
      });

      return updatedAsn;
    });
  }

  async getAsnDiscrepancies(tenantId: string, asnId: string) {
    return prisma.asnDiscrepancy.findMany({
      where: { tenantId, asnId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // INBOUND SHIPMENTS
  // ==========================================

  async getInboundShipments(tenantId: string) {
    return prisma.inboundShipment.findMany({
      where: { tenantId },
      include: { carrier: true, trackingEvents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInboundShipmentById(tenantId: string, id: string) {
    const shipment = await prisma.inboundShipment.findFirst({
      where: { id, tenantId },
      include: { carrier: true, trackingEvents: true },
    });
    if (!shipment) throw new NotFoundException('Inbound shipment not found');
    return shipment;
  }

  async createInboundShipment(tenantId: string, dto: CreateInboundShipmentDto) {
    const existing = await prisma.inboundShipment.findFirst({
      where: { tenantId, shipmentNumber: dto.shipmentNumber },
    });
    if (existing) throw new BadRequestException(`Shipment number ${dto.shipmentNumber} already exists.`);

    return prisma.inboundShipment.create({
      data: {
        tenantId,
        shipmentNumber: dto.shipmentNumber,
        asnId: dto.asnId || null,
        carrierId: dto.carrierId || null,
        warehouseId: dto.warehouseId,
        trackingNumber: dto.trackingNumber || null,
        status: 'EXPECTED',
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
        totalPallets: dto.totalPallets || null,
        totalCartons: dto.totalCartons || null,
        totalWeight: dto.totalWeight ? new Prisma.Decimal(dto.totalWeight) : null,
        notes: dto.notes || null,
      },
    });
  }

  // ==========================================
  // OUTBOUND SHIPMENTS
  // ==========================================

  async getOutboundShipments(tenantId: string) {
    return prisma.outboundShipment.findMany({
      where: { tenantId },
      include: { carrier: true, trackingEvents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOutboundShipmentById(tenantId: string, id: string) {
    const shipment = await prisma.outboundShipment.findFirst({
      where: { id, tenantId },
      include: { carrier: true, trackingEvents: true },
    });
    if (!shipment) throw new NotFoundException('Outbound shipment not found');
    return shipment;
  }

  async createOutboundShipment(tenantId: string, dto: CreateOutboundShipmentDto) {
    const existing = await prisma.outboundShipment.findFirst({
      where: { tenantId, shipmentNumber: dto.shipmentNumber },
    });
    if (existing) throw new BadRequestException(`Shipment number ${dto.shipmentNumber} already exists.`);

    return prisma.outboundShipment.create({
      data: {
        tenantId,
        shipmentNumber: dto.shipmentNumber,
        salesOrderId: dto.salesOrderId || null,
        carrierId: dto.carrierId || null,
        serviceLevelId: dto.serviceLevelId || null,
        warehouseId: dto.warehouseId,
        trackingNumber: dto.trackingNumber || null,
        status: 'PENDING',
        estimatedDelivery: dto.estimatedDelivery ? new Date(dto.estimatedDelivery) : null,
        totalPallets: dto.totalPallets || null,
        totalCartons: dto.totalCartons || null,
        totalWeight: dto.totalWeight ? new Prisma.Decimal(dto.totalWeight) : null,
        recipientName: dto.recipientName || null,
        recipientAddr: dto.recipientAddr || null,
        notes: dto.notes || null,
      },
    });
  }

  // ==========================================
  // TRACKING EVENTS & EXCEPTIONS
  // ==========================================

  async addTrackingEvent(
    tenantId: string,
    shipmentType: 'inbound' | 'outbound',
    shipmentId: string,
    dto: AddTrackingEventDto,
  ) {
    return prisma.$transaction(async (tx) => {
      const event = await tx.shipmentTrackingEvent.create({
        data: {
          tenantId,
          inboundShipmentId: shipmentType === 'inbound' ? shipmentId : null,
          outboundShipmentId: shipmentType === 'outbound' ? shipmentId : null,
          eventCode: dto.eventCode,
          description: dto.description,
          location: dto.location || null,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          source: dto.source || 'MANUAL',
        },
      });

      // Update shipment status based on the tracking event
      if (shipmentType === 'inbound') {
        const inboundShipment = await tx.inboundShipment.findFirst({
          where: { id: shipmentId, tenantId },
        });
        if (!inboundShipment) throw new NotFoundException('Inbound shipment not found');

        let status = inboundShipment.status;
        if (dto.eventCode === 'DELIVERED') {
          status = 'COMPLETE';
        } else if (dto.eventCode === 'EXCEPTION') {
          status = 'EXCEPTION';
        } else if (dto.eventCode === 'IN_TRANSIT') {
          status = 'IN_TRANSIT';
        }

        await tx.inboundShipment.update({
          where: { id: shipmentId },
          data: {
            status,
            arrivedAt: dto.eventCode === 'DELIVERED' ? new Date() : inboundShipment.arrivedAt,
            completedAt: dto.eventCode === 'DELIVERED' ? new Date() : inboundShipment.completedAt,
          },
        });
      } else {
        const outboundShipment = await tx.outboundShipment.findFirst({
          where: { id: shipmentId, tenantId },
        });
        if (!outboundShipment) throw new NotFoundException('Outbound shipment not found');

        let status = outboundShipment.status;
        if (dto.eventCode === 'DELIVERED') {
          status = 'DELIVERED';
        } else if (dto.eventCode === 'EXCEPTION') {
          status = 'EXCEPTION';
        } else if (dto.eventCode === 'IN_TRANSIT' || dto.eventCode === 'PICKED_UP' || dto.eventCode === 'OUT_FOR_DELIVERY') {
          status = 'IN_TRANSIT';
        }

        await tx.outboundShipment.update({
          where: { id: shipmentId },
          data: {
            status,
            deliveredAt: dto.eventCode === 'DELIVERED' ? new Date() : outboundShipment.deliveredAt,
            shipDate: dto.eventCode === 'PICKED_UP' ? new Date() : outboundShipment.shipDate,
          },
        });
      }

      return event;
    });
  }

  async getTrackingEvents(tenantId: string, shipmentType: 'inbound' | 'outbound', shipmentId: string) {
    return prisma.shipmentTrackingEvent.findMany({
      where: {
        tenantId,
        inboundShipmentId: shipmentType === 'inbound' ? shipmentId : null,
        outboundShipmentId: shipmentType === 'outbound' ? shipmentId : null,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async reportException(
    tenantId: string,
    shipmentId: string,
    dto: ReportExceptionDto,
    userId: string,
  ) {
    return prisma.shipmentException.create({
      data: {
        tenantId,
        direction: dto.direction,
        shipmentId,
        exceptionCode: dto.exceptionCode,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        status: ShipmentExceptionStatus.OPEN,
        reportedBy: userId,
      },
    });
  }

  async resolveException(
    tenantId: string,
    exceptionId: string,
    dto: ResolveExceptionDto,
    userId: string,
  ) {
    const exception = await prisma.shipmentException.findFirst({
      where: { id: exceptionId, tenantId },
    });
    if (!exception) throw new NotFoundException('Exception record not found');

    return prisma.shipmentException.update({
      where: { id: exceptionId },
      data: {
        status: ShipmentExceptionStatus.RESOLVED,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote: dto.resolutionNote,
      },
    });
  }

  async getExceptions(tenantId: string, shipmentId: string) {
    return prisma.shipmentException.findMany({
      where: { tenantId, shipmentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
