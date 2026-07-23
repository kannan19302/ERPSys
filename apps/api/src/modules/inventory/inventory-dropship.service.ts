import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createProviderSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  vendorId: z.string().min(1),
  isActive: z.boolean().optional(),
  shipMethods: z.array(z.string()).default([]),
  carrier: z.string().optional(),
  leadTime: z.number().int().optional(),
  notes: z.string().optional(),
});
export type CreateProviderInput = z.infer<typeof createProviderSchema>;

export const createDropShipOrderSchema = z.object({
  orderNumber: z.string().min(1),
  providerId: z.string().min(1),
  vendorId: z.string().min(1),
  salesOrderId: z.string().optional(),
  customerId: z.string().optional(),
  shipToAddress: z.any(),
  shipMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  requestedDate: z.string().datetime().optional(),
  estimatedCost: z.number().positive().optional(),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
});
export type CreateDropShipOrderInput = z.infer<typeof createDropShipOrderSchema>;

export const createDropShipOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  shippedQty: z.number().default(0),
});
export type CreateDropShipOrderItemInput = z.infer<typeof createDropShipOrderItemSchema>;

export const updateDropShipOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'AWAITING_ACK', 'ACKNOWLEDGED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});
export type UpdateDropShipOrderStatusInput = z.infer<typeof updateDropShipOrderStatusSchema>;

@Injectable()
export class InventoryDropShipService {

  async listProviders(tenantId: string, query: { search?: string; isActive?: string }) {
    const where: Prisma.DropShipProviderWhereInput = { tenantId };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    return prisma.dropShipProvider.findMany({ where, orderBy: { name: 'asc' } });
  }

  async createProvider(tenantId: string, dto: CreateProviderInput) {
    const existing = await prisma.dropShipProvider.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Provider with code '${dto.code}' already exists`);
    }
    return prisma.dropShipProvider.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        vendorId: dto.vendorId,
        isActive: dto.isActive ?? true,
        shipMethods: dto.shipMethods,
        carrier: dto.carrier ?? null,
        leadTime: dto.leadTime ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateProvider(tenantId: string, id: string, dto: Partial<CreateProviderInput>) {
    const record = await prisma.dropShipProvider.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Drop-ship provider not found');
    return prisma.dropShipProvider.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.shipMethods !== undefined && { shipMethods: dto.shipMethods }),
        ...(dto.carrier !== undefined && { carrier: dto.carrier }),
        ...(dto.leadTime !== undefined && { leadTime: dto.leadTime }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteProvider(tenantId: string, id: string) {
    const record = await prisma.dropShipProvider.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Drop-ship provider not found');
    return prisma.dropShipProvider.update({ where: { id }, data: { isActive: false } });
  }

  async listOrders(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; providerId?: string; vendorId?: string },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.DropShipOrderWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.providerId) where.providerId = query.providerId;
    if (query.vendorId) where.vendorId = query.vendorId;

    const [data, total] = await Promise.all([
      prisma.dropShipOrder.findMany({
        where,
        include: { provider: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dropShipOrder.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getOrderById(tenantId: string, id: string) {
    const order = await prisma.dropShipOrder.findFirst({
      where: { id, tenantId },
      include: { provider: true, items: true },
    });
    if (!order) throw new NotFoundException('Drop-ship order not found');
    return order;
  }

  async createOrder(tenantId: string, dto: CreateDropShipOrderInput & { items?: CreateDropShipOrderItemInput[] }) {
    const provider = await prisma.dropShipProvider.findFirst({
      where: { id: dto.providerId, tenantId },
    });
    if (!provider) throw new NotFoundException('Drop-ship provider not found');

    const existing = await prisma.dropShipOrder.findFirst({
      where: { tenantId, orderNumber: dto.orderNumber },
    });
    if (existing) {
      throw new BadRequestException(`Order '${dto.orderNumber}' already exists`);
    }

    const orderItems = (dto.items ?? []).map((item: any) => ({
      tenantId,
      productId: item.productId,
      quantity: new Prisma.Decimal(Number(item.quantity).toFixed(3)),
      shippedQty: new Prisma.Decimal(Number(item.shippedQty ?? 0).toFixed(3)),
      unitPrice: new Prisma.Decimal(Number(item.unitPrice).toFixed(2)),
      totalPrice: new Prisma.Decimal((Number(item.unitPrice) * Number(item.quantity)).toFixed(2)),
    }));

    return prisma.dropShipOrder.create({
      data: {
        tenantId,
        orderNumber: dto.orderNumber,
        providerId: dto.providerId,
        vendorId: dto.vendorId,
        salesOrderId: dto.salesOrderId ?? null,
        customerId: dto.customerId ?? null,
        shipToAddress: dto.shipToAddress,
        shipMethod: dto.shipMethod ?? null,
        trackingNumber: dto.trackingNumber ?? null,
        carrier: dto.carrier ?? null,
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : null,
        estimatedCost: dto.estimatedCost !== undefined ? new Prisma.Decimal(dto.estimatedCost.toFixed(2)) : null,
        currency: dto.currency,
        notes: dto.notes ?? null,
        items: { create: orderItems },
      },
      include: { provider: true, items: true },
    });
  }

  async updateOrderStatus(tenantId: string, id: string, dto: UpdateDropShipOrderStatusInput) {
    const order = await prisma.dropShipOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Drop-ship order not found');

    const validTransitions: Record<string, string[]> = {
      PENDING: ['AWAITING_ACK', 'CANCELLED'],
      AWAITING_ACK: ['ACKNOWLEDGED', 'CANCELLED'],
      ACKNOWLEDGED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${order.status}' to '${dto.status}'`,
      );
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'SHIPPED') updateData.shippedDate = new Date();
    if (dto.status === 'DELIVERED') updateData.deliveredDate = new Date();

    return prisma.dropShipOrder.update({
      where: { id },
      data: updateData,
      include: { provider: true, items: true },
    });
  }

  async cancelOrder(tenantId: string, id: string) {
    const order = await prisma.dropShipOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Drop-ship order not found');
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel a delivered or already cancelled order');
    }
    return prisma.dropShipOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { provider: true, items: true },
    });
  }

  async getOrderDashboard(tenantId: string) {
    const where: Prisma.DropShipOrderWhereInput = { tenantId };

    const [totalOrders, byStatus] = await Promise.all([
      prisma.dropShipOrder.count({ where }),
      prisma.dropShipOrder.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = {};
    for (const row of byStatus) {
      counts[row.status] = row._count._all;
    }

    return {
      totalOrders,
      pending: counts['PENDING'] ?? 0,
      awaitingAck: counts['AWAITING_ACK'] ?? 0,
      acknowledged: counts['ACKNOWLEDGED'] ?? 0,
      shipped: counts['SHIPPED'] ?? 0,
      delivered: counts['DELIVERED'] ?? 0,
      cancelled: counts['CANCELLED'] ?? 0,
    };
  }
}
