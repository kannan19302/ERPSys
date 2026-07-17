import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateShipmentInput } from '@unerp/shared';
import { Prisma, Shipment } from '@prisma/client';

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
}
