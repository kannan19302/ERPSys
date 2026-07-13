import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class VmiService {
  // ── Agreements ────────────────────────────────────────────────────────────

  async createAgreement(tenantId: string, userId: string, dto: {
    vendorId: string; warehouseId: string; productId: string;
    replenTrigger?: string; minQty: number; maxQty: number; targetQty: number;
    reviewCycleDays?: number; vendorLeadDays?: number; currency?: string; notes?: string;
  }) {
    if (dto.minQty < 0) throw new BadRequestException('minQty must be non-negative');
    if (dto.minQty >= dto.maxQty) throw new BadRequestException('minQty must be less than maxQty');
    if (dto.targetQty < dto.minQty || dto.targetQty > dto.maxQty) {
      throw new BadRequestException('targetQty must be between minQty and maxQty');
    }
    const count = await prisma.vmiAgreement.count({ where: { tenantId } });
    const agreementNumber = `VMI-${String(count + 1).padStart(6, '0')}`;
    return prisma.vmiAgreement.create({
      data: {
        tenantId, agreementNumber, vendorId: dto.vendorId,
        warehouseId: dto.warehouseId, productId: dto.productId,
        replenTrigger: (dto.replenTrigger as any) ?? 'BELOW_MIN',
        minQty: dto.minQty, maxQty: dto.maxQty, targetQty: dto.targetQty,
        reviewCycleDays: dto.reviewCycleDays ?? 7, vendorLeadDays: dto.vendorLeadDays ?? 3,
        currency: dto.currency ?? 'USD', notes: dto.notes, createdById: userId,
      },
    });
  }

  async listAgreements(tenantId: string, params: { status?: string; vendorId?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    const [items, total] = await Promise.all([
      prisma.vmiAgreement.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { createdAt: 'desc' } }),
      prisma.vmiAgreement.count({ where }),
    ]);
    return { items, total };
  }

  async getAgreement(tenantId: string, id: string) {
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    return ag;
  }

  async activateAgreement(tenantId: string, id: string) {
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    if (ag.status !== 'DRAFT') throw new BadRequestException('Only DRAFT agreements can be activated');
    return prisma.vmiAgreement.update({ where: { id }, data: { status: 'ACTIVE', activatedAt: new Date() } });
  }

  async suspendAgreement(tenantId: string, id: string) {
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    if (ag.status !== 'ACTIVE') throw new BadRequestException('Only ACTIVE agreements can be suspended');
    return prisma.vmiAgreement.update({ where: { id }, data: { status: 'SUSPENDED' } });
  }

  async terminateAgreement(tenantId: string, id: string) {
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    if (ag.status === 'TERMINATED') throw new BadRequestException('Agreement already terminated');
    return prisma.vmiAgreement.update({ where: { id }, data: { status: 'TERMINATED', terminatedAt: new Date() } });
  }

  // ── Stock Snapshots ───────────────────────────────────────────────────────

  async recordSnapshot(tenantId: string, userId: string, dto: {
    agreementId: string; snapshotDate: Date; onHandQty: number; onOrderQty?: number; notes?: string;
  }) {
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id: dto.agreementId } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    const snap = await prisma.vmiStockSnapshot.create({
      data: {
        tenantId, agreementId: dto.agreementId, snapshotDate: dto.snapshotDate,
        onHandQty: dto.onHandQty, onOrderQty: dto.onOrderQty ?? 0,
        recordedById: userId, notes: dto.notes,
      },
    });
    // Auto-trigger replenishment if BELOW_MIN and stock < minQty
    if (ag.status === 'ACTIVE' && ag.replenTrigger === 'BELOW_MIN') {
      const minQty = Number(ag.minQty);
      const onHand = dto.onHandQty;
      if (onHand < minQty) {
        await this.createOrder(tenantId, userId, {
          agreementId: dto.agreementId, triggeredBy: 'BELOW_MIN',
          orderedQty: Number(ag.targetQty) - onHand,
        });
      }
    }
    return snap;
  }

  async listSnapshots(tenantId: string, agreementId: string) {
    return prisma.vmiStockSnapshot.findMany({
      where: { tenantId, agreementId },
      orderBy: { snapshotDate: 'desc' },
      take: 50,
    });
  }

  // ── VMI Orders ────────────────────────────────────────────────────────────

  async createOrder(tenantId: string, _userId: string, dto: {
    agreementId: string; triggeredBy: string; orderedQty: number; notes?: string;
  }) {
    if (dto.orderedQty <= 0) throw new BadRequestException('orderedQty must be positive');
    const ag = await prisma.vmiAgreement.findFirst({ where: { tenantId, id: dto.agreementId } });
    if (!ag) throw new NotFoundException('VMI agreement not found');
    const count = await prisma.vmiOrder.count({ where: { tenantId } });
    const orderNumber = `VMIO-${String(count + 1).padStart(6, '0')}`;
    return prisma.vmiOrder.create({
      data: {
        tenantId, orderNumber, agreementId: dto.agreementId,
        vendorId: ag.vendorId, triggeredBy: dto.triggeredBy as any,
        orderedQty: dto.orderedQty, currency: ag.currency, notes: dto.notes,
      },
    });
  }

  async listOrders(tenantId: string, params: { status?: string; agreementId?: string; vendorId?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.agreementId) where.agreementId = params.agreementId;
    if (params.vendorId) where.vendorId = params.vendorId;
    const [items, total] = await Promise.all([
      prisma.vmiOrder.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { createdAt: 'desc' } }),
      prisma.vmiOrder.count({ where }),
    ]);
    return { items, total };
  }

  async advanceOrderStatus(tenantId: string, id: string, dto: { status: string; receivedQty?: number; cancelReason?: string }) {
    const order = await prisma.vmiOrder.findFirst({ where: { tenantId, id } });
    if (!order) throw new NotFoundException('VMI order not found');

    const transitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['RECEIVED', 'CANCELLED'],
    };
    const allowed = transitions[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const data: any = { status: dto.status };
    if (dto.status === 'CONFIRMED') data.confirmedAt = new Date();
    if (dto.status === 'SHIPPED') data.shippedAt = new Date();
    if (dto.status === 'RECEIVED') { data.receivedAt = new Date(); if (dto.receivedQty != null) data.receivedQty = dto.receivedQty; }
    if (dto.status === 'CANCELLED') { data.cancelledAt = new Date(); data.cancelReason = dto.cancelReason; }

    return prisma.vmiOrder.update({ where: { id }, data });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalAgreements, activeAgreements, draftAgreements,
      totalOrders, pendingOrders, confirmedOrders, shippedOrders] = await Promise.all([
      prisma.vmiAgreement.count({ where: { tenantId } }),
      prisma.vmiAgreement.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.vmiAgreement.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.vmiOrder.count({ where: { tenantId } }),
      prisma.vmiOrder.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.vmiOrder.count({ where: { tenantId, status: 'CONFIRMED' } }),
      prisma.vmiOrder.count({ where: { tenantId, status: 'SHIPPED' } }),
    ]);
    return { totalAgreements, activeAgreements, draftAgreements, totalOrders, pendingOrders, confirmedOrders, shippedOrders };
  }
}
