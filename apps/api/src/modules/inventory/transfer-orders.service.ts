import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransferOrdersService {
  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async listTransferOrders(tenantId: string, status?: string, fromWarehouseId?: string, toWarehouseId?: string) {
    return prisma.transferOrder.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as never } : {}),
        ...(fromWarehouseId ? { fromWarehouseId } : {}),
        ...(toWarehouseId ? { toWarehouseId } : {}),
      },
      include: { _count: { select: { lines: true, receipts: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransferOrder(tenantId: string, id: string) {
    const t = await prisma.transferOrder.findFirst({
      where: { tenantId, id },
      include: { lines: true, receipts: { include: { lines: true } } },
    });
    if (!t) throw new NotFoundException('Transfer order not found');
    return t;
  }

  async createTransferOrder(tenantId: string, createdBy: string, dto: {
    fromWarehouseId: string;
    toWarehouseId: string;
    priority?: string;
    requestedDate?: string;
    expectedDate?: string;
    notes?: string;
    carrier?: string;
    estimatedCost?: number;
    lines: { productId: string; requestedQty: number; uom?: string; unitCost?: number; lotNumber?: string; serialNumbers?: string[]; binLocationId?: string; notes?: string }[];
  }) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must differ');
    }
    const seq = await prisma.transferOrder.count({ where: { tenantId } });
    const transferNumber = `TO-${String(seq + 1).padStart(5, '0')}`;

    return prisma.transferOrder.create({
      data: {
        tenantId,
        transferNumber,
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        priority: dto.priority ?? 'NORMAL',
        requestedDate: dto.requestedDate ? new Date(dto.requestedDate) : null,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        notes: dto.notes,
        carrier: dto.carrier,
        estimatedCost: dto.estimatedCost != null ? new Prisma.Decimal(dto.estimatedCost) : null,
        createdBy,
        lines: {
          create: dto.lines.map(l => ({
            tenantId,
            productId: l.productId,
            requestedQty: new Prisma.Decimal(l.requestedQty),
            uom: l.uom ?? 'UNIT',
            unitCost: l.unitCost != null ? new Prisma.Decimal(l.unitCost) : null,
            lotNumber: l.lotNumber,
            serialNumbers: l.serialNumbers ?? [],
            binLocationId: l.binLocationId,
            notes: l.notes,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async updateTransferOrder(tenantId: string, id: string, dto: {
    priority?: string;
    expectedDate?: string;
    notes?: string;
    carrier?: string;
    trackingNumber?: string;
    estimatedCost?: number;
  }) {
    const t = await this.getTransferOrder(tenantId, id);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(t.status)) {
      throw new BadRequestException('Can only update DRAFT or PENDING_APPROVAL orders');
    }
    return prisma.transferOrder.update({
      where: { id },
      data: {
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.expectedDate && { expectedDate: new Date(dto.expectedDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.carrier !== undefined && { carrier: dto.carrier }),
        ...(dto.trackingNumber !== undefined && { trackingNumber: dto.trackingNumber }),
        ...(dto.estimatedCost != null && { estimatedCost: new Prisma.Decimal(dto.estimatedCost) }),
      },
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  async submitForApproval(tenantId: string, id: string) {
    const t = await this.getTransferOrder(tenantId, id);
    if (t.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be submitted');
    if (t.lines.length === 0) throw new BadRequestException('Order must have at least one line');
    return prisma.transferOrder.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } });
  }

  async approve(tenantId: string, id: string, approvedBy: string) {
    const t = await this.getTransferOrder(tenantId, id);
    if (t.status !== 'PENDING_APPROVAL') throw new BadRequestException('Order must be PENDING_APPROVAL');
    return prisma.transferOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async ship(tenantId: string, id: string, shippedBy: string, dto: {
    carrier?: string;
    trackingNumber?: string;
    shippedLines: { lineId: string; shippedQty: number }[];
  }) {
    const t = await this.getTransferOrder(tenantId, id);
    if (t.status !== 'APPROVED') throw new BadRequestException('Order must be APPROVED before shipping');

    for (const sl of dto.shippedLines) {
      const line = t.lines.find(l => l.id === sl.lineId);
      if (!line) throw new BadRequestException(`Line ${sl.lineId} not found`);
      if (sl.shippedQty > Number(line.requestedQty)) {
        throw new BadRequestException(`Shipped qty ${sl.shippedQty} exceeds requested ${line.requestedQty} for line ${sl.lineId}`);
      }
      await prisma.transferOrderLine.update({
        where: { id: sl.lineId },
        data: { shippedQty: new Prisma.Decimal(sl.shippedQty) },
      });
    }

    return prisma.transferOrder.update({
      where: { id },
      data: {
        status: 'IN_TRANSIT',
        shippedDate: new Date(),
        shippedBy,
        ...(dto.carrier && { carrier: dto.carrier }),
        ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber }),
      },
    });
  }

  async receive(tenantId: string, id: string, receivedBy: string, dto: {
    notes?: string;
    lines: { lineId: string; receivedQty: number; acceptedQty: number; rejectedQty?: number; rejectionReason?: string }[];
  }) {
    const t = await this.getTransferOrder(tenantId, id);
    if (!['IN_TRANSIT', 'PARTIALLY_RECEIVED'].includes(t.status)) {
      throw new BadRequestException('Order must be IN_TRANSIT or PARTIALLY_RECEIVED to receive');
    }

    const seq = await prisma.transferOrderReceipt.count({ where: { tenantId, transferOrderId: id } });
    const receiptNumber = `TOR-${t.transferNumber}-${String(seq + 1).padStart(2, '0')}`;

    const receipt = await prisma.transferOrderReceipt.create({
      data: {
        tenantId,
        transferOrderId: id,
        receiptNumber,
        receivedBy,
        notes: dto.notes,
        lines: {
          create: dto.lines.map(l => ({
            tenantId,
            transferLineId: l.lineId,
            productId: t.lines.find(tl => tl.id === l.lineId)?.productId ?? '',
            receivedQty: new Prisma.Decimal(l.receivedQty),
            acceptedQty: new Prisma.Decimal(l.acceptedQty),
            rejectedQty: new Prisma.Decimal(l.rejectedQty ?? 0),
            rejectionReason: l.rejectionReason,
          })),
        },
      },
      include: { lines: true },
    });

    // Update received qty per line
    for (const rl of dto.lines) {
      const existing = t.lines.find(l => l.id === rl.lineId);
      if (existing) {
        await prisma.transferOrderLine.update({
          where: { id: rl.lineId },
          data: { receivedQty: { increment: new Prisma.Decimal(rl.receivedQty) } },
        });
      }
    }

    // Determine new status
    const updated = await prisma.transferOrder.findFirst({
      where: { tenantId, id },
      include: { lines: true },
    });
    const allReceived = updated?.lines.every(l => Number(l.receivedQty) >= Number(l.shippedQty)) ?? false;
    const newStatus = allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED';

    await prisma.transferOrder.update({
      where: { id },
      data: {
        status: newStatus as never,
        ...(allReceived ? { completedDate: new Date(), receivedBy } : {}),
      },
    });

    return receipt;
  }

  async cancel(tenantId: string, id: string) {
    const t = await this.getTransferOrder(tenantId, id);
    if (['COMPLETED', 'CANCELLED'].includes(t.status)) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled order');
    }
    return prisma.transferOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async closeOut(tenantId: string, id: string) {
    const t = await this.getTransferOrder(tenantId, id);
    if (t.status !== 'PARTIALLY_RECEIVED') {
      throw new BadRequestException('Only PARTIALLY_RECEIVED orders can be closed out');
    }
    return prisma.transferOrder.update({
      where: { id },
      data: { status: 'COMPLETED', completedDate: new Date() },
    });
  }

  // ── Lines ─────────────────────────────────────────────────────────────────────

  async addLine(tenantId: string, id: string, dto: {
    productId: string; requestedQty: number; uom?: string; unitCost?: number;
    lotNumber?: string; serialNumbers?: string[]; binLocationId?: string; notes?: string;
  }) {
    const t = await this.getTransferOrder(tenantId, id);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(t.status)) {
      throw new BadRequestException('Lines can only be added to DRAFT or PENDING_APPROVAL orders');
    }
    return prisma.transferOrderLine.create({
      data: {
        tenantId,
        transferOrderId: id,
        productId: dto.productId,
        requestedQty: new Prisma.Decimal(dto.requestedQty),
        uom: dto.uom ?? 'UNIT',
        unitCost: dto.unitCost != null ? new Prisma.Decimal(dto.unitCost) : null,
        lotNumber: dto.lotNumber,
        serialNumbers: dto.serialNumbers ?? [],
        binLocationId: dto.binLocationId,
        notes: dto.notes,
      },
    });
  }

  async removeLine(tenantId: string, id: string, lineId: string) {
    const t = await this.getTransferOrder(tenantId, id);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(t.status)) {
      throw new BadRequestException('Lines can only be removed from DRAFT or PENDING_APPROVAL orders');
    }
    await prisma.transferOrderLine.delete({ where: { id: lineId } });
    return { deleted: true };
  }

  // ── Receipts ──────────────────────────────────────────────────────────────────

  async listReceipts(tenantId: string, id: string) {
    await this.getTransferOrder(tenantId, id);
    return prisma.transferOrderReceipt.findMany({
      where: { tenantId, transferOrderId: id },
      include: { lines: true },
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [total, draft, pendingApproval, approved, inTransit, partiallyReceived, completed, cancelled] =
      await Promise.all([
        prisma.transferOrder.count({ where: { tenantId } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'DRAFT' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'APPROVED' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'IN_TRANSIT' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'PARTIALLY_RECEIVED' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'COMPLETED' } }),
        prisma.transferOrder.count({ where: { tenantId, status: 'CANCELLED' } }),
      ]);

    return {
      total,
      byStatus: { draft, pendingApproval, approved, inTransit, partiallyReceived, completed, cancelled },
    };
  }

  async getInTransitSummary(tenantId: string) {
    const orders = await prisma.transferOrder.findMany({
      where: { tenantId, status: { in: ['IN_TRANSIT', 'PARTIALLY_RECEIVED'] as never[] } },
      include: { lines: true },
    });

    return orders.map(o => ({
      id: o.id,
      transferNumber: o.transferNumber,
      fromWarehouseId: o.fromWarehouseId,
      toWarehouseId: o.toWarehouseId,
      status: o.status,
      shippedDate: o.shippedDate,
      expectedDate: o.expectedDate,
      carrier: o.carrier,
      trackingNumber: o.trackingNumber,
      totalLines: o.lines.length,
      pendingLines: o.lines.filter(l => Number(l.receivedQty) < Number(l.shippedQty)).length,
    }));
  }

  async getReceivingReport(tenantId: string, fromWarehouseId?: string, toWarehouseId?: string) {
    const orders = await prisma.transferOrder.findMany({
      where: {
        tenantId,
        status: { in: ['COMPLETED'] as never[] },
        ...(fromWarehouseId ? { fromWarehouseId } : {}),
        ...(toWarehouseId ? { toWarehouseId } : {}),
      },
      include: { lines: true },
      orderBy: { completedDate: 'desc' },
      take: 100,
    });

    const rejections: { productId: string; total: number }[] = [];
    for (const _o of orders) {
      const receipts = await prisma.transferOrderReceiptLine.findMany({
        where: { tenantId },
      });
      for (const r of receipts) {
        if (Number(r.rejectedQty) > 0) {
          const existing = rejections.find(x => x.productId === r.productId);
          if (existing) existing.total += Number(r.rejectedQty);
          else rejections.push({ productId: r.productId, total: Number(r.rejectedQty) });
        }
      }
    }

    return { orders, totalRejections: rejections.reduce((s, r) => s + r.total, 0), rejectionsByProduct: rejections };
  }
}
