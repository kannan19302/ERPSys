import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CrossDockStatus, CrossDockType, DockDoorStatus } from '@prisma/client';

@Injectable()
export class CrossDockService {
  // ── Stations ────────────────────────────────────────────────────────────

  async createStation(
    tenantId: string,
    data: {
      warehouseId: string;
      code: string;
      name: string;
      doorNumber: string;
      isInbound?: boolean;
      isOutbound?: boolean;
      notes?: string;
    },
  ) {
    const existing = await prisma.crossDockStation.findUnique({
      where: { tenantId_warehouseId_code: { tenantId, warehouseId: data.warehouseId, code: data.code } },
    });
    if (existing) throw new BadRequestException(`Station code ${data.code} already exists in warehouse`);
    return prisma.crossDockStation.create({ data: { tenantId, ...data } });
  }

  async updateStationStatus(tenantId: string, stationId: string, status: DockDoorStatus) {
    const station = await prisma.crossDockStation.findFirst({ where: { id: stationId, tenantId } });
    if (!station) throw new NotFoundException('Station not found');
    return prisma.crossDockStation.update({ where: { id: stationId }, data: { status } });
  }

  async listStations(tenantId: string, warehouseId?: string) {
    return prisma.crossDockStation.findMany({
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { code: 'asc' },
    });
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  async createOrder(
    tenantId: string,
    userId: string,
    data: {
      type?: CrossDockType;
      warehouseId: string;
      stationId?: string;
      productId: string;
      expectedQty: number;
      inboundRef?: string;
      outboundRef?: string;
      supplierName?: string;
      customerName?: string;
      expectedArrival?: Date;
      expectedDispatch?: Date;
    },
  ) {
    if (data.expectedQty <= 0) throw new BadRequestException('Expected quantity must be positive');
    if (data.stationId) {
      const station = await prisma.crossDockStation.findFirst({
        where: { id: data.stationId, tenantId },
      });
      if (!station) throw new NotFoundException('Station not found');
      if (station.status === DockDoorStatus.MAINTENANCE)
        throw new BadRequestException('Station is under maintenance');
    }

    const count = await prisma.crossDockOrder.count({ where: { tenantId } });
    const orderNumber = `CDO-${String(count + 1).padStart(6, '0')}`;

    const order = await prisma.crossDockOrder.create({
      data: {
        tenantId,
        orderNumber,
        type: data.type ?? CrossDockType.OPPORTUNISTIC,
        warehouseId: data.warehouseId,
        stationId: data.stationId,
        productId: data.productId,
        expectedQty: data.expectedQty,
        inboundRef: data.inboundRef,
        outboundRef: data.outboundRef,
        supplierName: data.supplierName,
        customerName: data.customerName,
        expectedArrival: data.expectedArrival,
        expectedDispatch: data.expectedDispatch,
        createdById: userId,
      },
      include: { station: true },
    });

    await this._addEvent(tenantId, order.id, 'ORDER_CREATED', undefined, 'Order created', userId);
    return order;
  }

  async receiveGoods(
    tenantId: string,
    userId: string,
    orderId: string,
    receivedQty: number,
  ) {
    const order = await this._getOrder(tenantId, orderId);
    if (order.status === CrossDockStatus.CANCELLED)
      throw new BadRequestException('Cannot receive goods on a cancelled order');
    if (order.status === CrossDockStatus.COMPLETED)
      throw new BadRequestException('Order is already completed');
    if (receivedQty <= 0) throw new BadRequestException('Received quantity must be positive');

    const newStatus =
      order.status === CrossDockStatus.PENDING ? CrossDockStatus.RECEIVING : order.status;

    const updated = await prisma.crossDockOrder.update({
      where: { id: orderId },
      data: { receivedQty: { increment: receivedQty }, status: newStatus },
    });

    await this._addEvent(tenantId, orderId, 'GOODS_RECEIVED', receivedQty, undefined, userId);
    return updated;
  }

  async stageOrder(tenantId: string, userId: string, orderId: string, stationId?: string) {
    const order = await this._getOrder(tenantId, orderId);
    if (order.status !== CrossDockStatus.RECEIVING)
      throw new BadRequestException('Order must be in RECEIVING status to stage');

    const updateData: Record<string, unknown> = { status: CrossDockStatus.STAGING };
    if (stationId) {
      const station = await prisma.crossDockStation.findFirst({ where: { id: stationId, tenantId } });
      if (!station) throw new NotFoundException('Station not found');
      updateData.stationId = stationId;
    }

    const updated = await prisma.crossDockOrder.update({ where: { id: orderId }, data: updateData });
    await this._addEvent(tenantId, orderId, 'ORDER_STAGED', undefined, stationId ? `Assigned to station ${stationId}` : undefined, userId);
    return updated;
  }

  async dispatchOrder(tenantId: string, userId: string, orderId: string, dispatchedQty: number) {
    const order = await this._getOrder(tenantId, orderId);
    if (order.status !== CrossDockStatus.STAGING)
      throw new BadRequestException('Order must be in STAGING status to dispatch');
    if (dispatchedQty <= 0) throw new BadRequestException('Dispatched quantity must be positive');

    const totalDispatched = Number(order.dispatchedQty) + dispatchedQty;
    const isComplete = totalDispatched >= Number(order.receivedQty);
    const newStatus = isComplete ? CrossDockStatus.COMPLETED : CrossDockStatus.DISPATCHED;

    const updated = await prisma.crossDockOrder.update({
      where: { id: orderId },
      data: {
        dispatchedQty: { increment: dispatchedQty },
        status: newStatus,
        ...(isComplete ? { completedAt: new Date() } : {}),
      },
    });

    await this._addEvent(tenantId, orderId, 'GOODS_DISPATCHED', dispatchedQty, undefined, userId);
    return updated;
  }

  async cancelOrder(tenantId: string, userId: string, orderId: string, reason: string) {
    const order = await this._getOrder(tenantId, orderId);
    if (order.status === CrossDockStatus.COMPLETED)
      throw new BadRequestException('Cannot cancel a completed order');
    if (order.status === CrossDockStatus.CANCELLED)
      throw new BadRequestException('Order is already cancelled');

    const updated = await prisma.crossDockOrder.update({
      where: { id: orderId },
      data: { status: CrossDockStatus.CANCELLED, cancelReason: reason },
    });

    await this._addEvent(tenantId, orderId, 'ORDER_CANCELLED', undefined, reason, userId);
    return updated;
  }

  async listOrders(tenantId: string, status?: CrossDockStatus, warehouseId?: string) {
    return prisma.crossDockOrder.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { station: true, events: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(tenantId: string, orderId: string) {
    return prisma.crossDockOrder.findFirst({
      where: { id: orderId, tenantId },
      include: { station: true, events: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async getEvents(tenantId: string, orderId: string) {
    await this._getOrder(tenantId, orderId);
    return prisma.crossDockEvent.findMany({
      where: { tenantId, orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getDashboard(tenantId: string) {
    const [byStatus, stationSummary, recentOrders] = await Promise.all([
      prisma.crossDockOrder.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.crossDockStation.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.crossDockOrder.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { station: true },
      }),
    ]);

    return { byStatus, stationSummary, recentOrders };
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async _getOrder(tenantId: string, orderId: string) {
    const order = await prisma.crossDockOrder.findFirst({ where: { id: orderId, tenantId } });
    if (!order) throw new NotFoundException('Cross-dock order not found');
    return order;
  }

  private async _addEvent(
    tenantId: string,
    orderId: string,
    eventType: string,
    qty: number | undefined,
    notes: string | undefined,
    performedBy: string,
  ) {
    return prisma.crossDockEvent.create({
      data: { tenantId, orderId, eventType, qty, notes, performedBy },
    });
  }
}
