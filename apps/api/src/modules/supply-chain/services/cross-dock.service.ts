import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma, CrossDockStatus, CrossDockType } from '@prisma/client';
import {
  CreateCrossDockStationDto,
  CreateCrossDockOrderDto,
  UpdateCrossDockOrderStatusDto,
} from '../dto/supply-chain.dto';

@Injectable()
export class CrossDockService {
  async listStations(tenantId: string, warehouseId?: string) {
    const where: Prisma.CrossDockStationWhereInput = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    return prisma.crossDockStation.findMany({ where, orderBy: { name: 'asc' } });
  }

  async createStation(tenantId: string, dto: CreateCrossDockStationDto) {
    return prisma.crossDockStation.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        code: dto.code,
        name: dto.name,
        doorNumber: dto.doorNumber,
        isInbound: dto.isInbound,
        isOutbound: dto.isOutbound,
        notes: dto.notes,
      },
    });
  }

  async listOrders(tenantId: string, query: { page?: number; limit?: number; status?: string; warehouseId?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const where: Prisma.CrossDockOrderWhereInput = { tenantId };
    if (query.status) where.status = query.status as CrossDockStatus;
    if (query.warehouseId) where.warehouseId = query.warehouseId;

    const [items, total] = await Promise.all([
      prisma.crossDockOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { station: true, events: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.crossDockOrder.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(tenantId: string, id: string) {
    const item = await prisma.crossDockOrder.findFirst({
      where: { id, tenantId },
      include: { station: true, events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Cross-dock order not found');
    return item;
  }

  async createOrder(tenantId: string, dto: CreateCrossDockOrderDto, createdById: string) {
    return prisma.crossDockOrder.create({
      data: {
        tenantId,
        orderNumber: dto.orderNumber,
        type: dto.type as CrossDockType,
        warehouseId: dto.warehouseId,
        stationId: dto.stationId,
        productId: dto.productId,
        expectedQty: new Prisma.Decimal(dto.expectedQty),
        inboundRef: dto.inboundRef,
        outboundRef: dto.outboundRef,
        supplierName: dto.supplierName,
        customerName: dto.customerName,
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
        expectedDispatch: dto.expectedDispatch ? new Date(dto.expectedDispatch) : null,
        createdById,
      },
    });
  }

  async updateOrderStatus(tenantId: string, id: string, dto: UpdateCrossDockOrderStatusDto, userId: string) {
    const existing = await prisma.crossDockOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Cross-dock order not found');

    const now = new Date();
    const extra: Record<string, unknown> = {};
    if (dto.status === 'COMPLETED') extra.completedAt = now;
    if (dto.receivedQty !== undefined && dto.receivedQty !== null) extra.receivedQty = new Prisma.Decimal(dto.receivedQty);
    if (dto.dispatchedQty !== undefined && dto.dispatchedQty !== null) extra.dispatchedQty = new Prisma.Decimal(dto.dispatchedQty);
    if (dto.cancelReason !== undefined) extra.cancelReason = dto.cancelReason;

    await prisma.crossDockEvent.create({
      data: {
        tenantId,
        orderId: id,
        eventType: `STATUS_${dto.status}`,
        qty: dto.receivedQty !== undefined && dto.receivedQty !== null ? new Prisma.Decimal(dto.receivedQty) : null,
        notes: `Status changed from ${existing.status} to ${dto.status}${dto.cancelReason ? ': ' + dto.cancelReason : ''}`,
        performedBy: userId,
      },
    });

    return prisma.crossDockOrder.update({
      where: { id },
      data: { status: dto.status as CrossDockStatus, ...extra },
      include: { station: true, events: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
