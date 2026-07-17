import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { z } from 'zod';

// ─── Input schemas ───────────────────────────────────────────────────────────

export const createReasonCodeSchema = z.object({
  code: z.string().min(1).max(20).toUpperCase(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});
export type CreateReasonCodeInput = z.infer<typeof createReasonCodeSchema>;

export const updateReasonCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateReasonCodeInput = z.infer<typeof updateReasonCodeSchema>;

export const createRmaRequestSchema = z.object({
  purchaseReturnId: z.string().min(1),
  vendorId: z.string().min(1),
  reasonCodeId: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateRmaRequestInput = z.infer<typeof createRmaRequestSchema>;

export const updateRmaStatusSchema = z.object({
  vendorRmaRef: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateRmaStatusInput = z.infer<typeof updateRmaStatusSchema>;

export const rejectRmaSchema = z.object({
  rejectionReason: z.string().min(1),
});
export type RejectRmaInput = z.infer<typeof rejectRmaSchema>;

export const createShipmentSchema = z.object({
  rmaRequestId: z.string().min(1),
  warehouseId: z.string().min(1),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const recordCreditMemoSchema = z.object({
  creditMemoRef: z.string().min(1),
  creditAmount: z.number().positive(),
});
export type RecordCreditMemoInput = z.infer<typeof recordCreditMemoSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class RtvService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ─── Return Reason Codes ─────────────────────────────────────────────────

  async listReasonCodes(tenantId: string, includeInactive = false) {
    const where: Prisma.ReturnReasonCodeWhereInput = { tenantId };
    if (!includeInactive) where.isActive = true;
    return prisma.returnReasonCode.findMany({ where, orderBy: { code: 'asc' } });
  }

  async createReasonCode(tenantId: string, dto: CreateReasonCodeInput) {
    const existing = await prisma.returnReasonCode.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) throw new ConflictException(`Reason code '${dto.code}' already exists`);
    return prisma.returnReasonCode.create({ data: { tenantId, ...dto } });
  }

  async updateReasonCode(tenantId: string, id: string, dto: UpdateReasonCodeInput) {
    const rc = await prisma.returnReasonCode.findFirst({ where: { id, tenantId } });
    if (!rc) throw new NotFoundException('Return reason code not found');
    return prisma.returnReasonCode.update({ where: { id }, data: dto });
  }

  // ─── RMA Requests ────────────────────────────────────────────────────────

  async listRmaRequests(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; vendorId?: string },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.VendorRmaRequestWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.vendorId) where.vendorId = query.vendorId;

    const [data, total] = await Promise.all([
      prisma.vendorRmaRequest.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          reasonCode: { select: { id: true, code: true, name: true } },
          _count: { select: { shipments: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorRmaRequest.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getRmaRequest(tenantId: string, id: string) {
    const rma = await prisma.vendorRmaRequest.findFirst({
      where: { id, tenantId },
      include: {
        vendor: true,
        reasonCode: true,
        shipments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!rma) throw new NotFoundException('RMA request not found');
    return rma;
  }

  async createRmaRequest(tenantId: string, orgId: string, userId: string, dto: CreateRmaRequestInput) {
    const rmaNumber = `RMA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const rma = await prisma.vendorRmaRequest.create({
      data: {
        tenantId,
        orgId,
        rmaNumber,
        purchaseReturnId: dto.purchaseReturnId,
        vendorId: dto.vendorId,
        reasonCodeId: dto.reasonCodeId ?? null,
        notes: dto.notes ?? null,
        createdBy: userId,
        status: 'PENDING',
      },
    });
    this.eventEmitter.emit('inventory.rtv.rma_created', { tenantId, rmaId: rma.id });
    return rma;
  }

  async submitRmaRequest(tenantId: string, id: string) {
    const rma = await this.getRmaRequest(tenantId, id);
    if (rma.status !== 'PENDING') {
      throw new BadRequestException(`RMA is ${rma.status.toLowerCase()}, cannot submit`);
    }
    return prisma.vendorRmaRequest.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  async authorizeRmaRequest(tenantId: string, id: string, dto: UpdateRmaStatusInput) {
    const rma = await this.getRmaRequest(tenantId, id);
    if (rma.status !== 'SUBMITTED') {
      throw new BadRequestException(`RMA is ${rma.status.toLowerCase()}, cannot authorize`);
    }
    return prisma.vendorRmaRequest.update({
      where: { id },
      data: {
        status: 'AUTHORIZED',
        authorizedAt: new Date(),
        vendorRmaRef: dto.vendorRmaRef ?? null,
        notes: dto.notes ?? rma.notes,
      },
    });
  }

  async rejectRmaRequest(tenantId: string, id: string, dto: RejectRmaInput) {
    const rma = await this.getRmaRequest(tenantId, id);
    if (!['SUBMITTED', 'PENDING'].includes(rma.status)) {
      throw new BadRequestException(`RMA is ${rma.status.toLowerCase()}, cannot reject`);
    }
    return prisma.vendorRmaRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason: dto.rejectionReason },
    });
  }

  async completeRmaRequest(tenantId: string, id: string) {
    const rma = await this.getRmaRequest(tenantId, id);
    if (rma.status !== 'AUTHORIZED') {
      throw new BadRequestException(`RMA is ${rma.status.toLowerCase()}, cannot complete`);
    }
    const updated = await prisma.vendorRmaRequest.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    this.eventEmitter.emit('inventory.rtv.rma_completed', { tenantId, rmaId: id });
    return updated;
  }

  // ─── Return Shipments ────────────────────────────────────────────────────

  async listShipments(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; rmaRequestId?: string },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.VendorReturnShipmentWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.rmaRequestId) where.rmaRequestId = query.rmaRequestId;

    const [data, total] = await Promise.all([
      prisma.vendorReturnShipment.findMany({
        where,
        include: {
          rmaRequest: { select: { id: true, rmaNumber: true, vendorRmaRef: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendorReturnShipment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getShipment(tenantId: string, id: string) {
    const shipment = await prisma.vendorReturnShipment.findFirst({
      where: { id, tenantId },
      include: {
        rmaRequest: true,
        warehouse: true,
      },
    });
    if (!shipment) throw new NotFoundException('Return shipment not found');
    return shipment;
  }

  async createShipment(tenantId: string, dto: CreateShipmentInput) {
    const rma = await prisma.vendorRmaRequest.findFirst({ where: { id: dto.rmaRequestId, tenantId } });
    if (!rma) throw new NotFoundException('RMA request not found');
    if (rma.status !== 'AUTHORIZED') {
      throw new BadRequestException('RMA must be AUTHORIZED before creating a shipment');
    }
    const shipmentNumber = `RTSHIP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return prisma.vendorReturnShipment.create({
      data: {
        tenantId,
        rmaRequestId: dto.rmaRequestId,
        warehouseId: dto.warehouseId,
        shipmentNumber,
        carrier: dto.carrier ?? null,
        trackingNumber: dto.trackingNumber ?? null,
        notes: dto.notes ?? null,
        status: 'PENDING',
      },
    });
  }

  async packShipment(tenantId: string, id: string) {
    const shipment = await this.getShipment(tenantId, id);
    if (shipment.status !== 'PENDING') {
      throw new BadRequestException(`Shipment is ${shipment.status.toLowerCase()}, cannot pack`);
    }
    return prisma.vendorReturnShipment.update({
      where: { id },
      data: { status: 'PACKED', packedAt: new Date() },
    });
  }

  async markShipped(tenantId: string, id: string) {
    const shipment = await this.getShipment(tenantId, id);
    if (shipment.status !== 'PACKED') {
      throw new BadRequestException(`Shipment is ${shipment.status.toLowerCase()}, cannot mark shipped`);
    }
    return prisma.vendorReturnShipment.update({
      where: { id },
      data: { status: 'SHIPPED', shippedAt: new Date() },
    });
  }

  async markDelivered(tenantId: string, id: string) {
    const shipment = await this.getShipment(tenantId, id);
    if (shipment.status !== 'SHIPPED') {
      throw new BadRequestException(`Shipment is ${shipment.status.toLowerCase()}, cannot mark delivered`);
    }
    return prisma.vendorReturnShipment.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
  }

  async recordCreditMemo(tenantId: string, id: string, dto: RecordCreditMemoInput) {
    const shipment = await this.getShipment(tenantId, id);
    if (shipment.status !== 'DELIVERED') {
      throw new BadRequestException('Credit memo can only be recorded after delivery');
    }
    const updated = await prisma.vendorReturnShipment.update({
      where: { id },
      data: {
        creditMemoRef: dto.creditMemoRef,
        creditAmount: new Prisma.Decimal(dto.creditAmount.toFixed(2)),
      },
    });
    this.eventEmitter.emit('inventory.rtv.credit_memo_received', {
      tenantId,
      shipmentId: id,
      creditMemoRef: dto.creditMemoRef,
      creditAmount: dto.creditAmount,
    });
    return updated;
  }

  // ─── Analytics ───────────────────────────────────────────────────────────

  async getRtvDashboard(tenantId: string) {
    const [totalRmas, byStatus, pendingShipments, totalCreditAmount] = await Promise.all([
      prisma.vendorRmaRequest.count({ where: { tenantId } }),
      prisma.vendorRmaRequest.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.vendorReturnShipment.count({ where: { tenantId, status: { in: ['PENDING', 'PACKED', 'SHIPPED'] } } }),
      prisma.vendorReturnShipment.aggregate({
        where: { tenantId, creditMemoRef: { not: null } },
        _sum: { creditAmount: true },
      }),
    ]);

    return {
      totalRmas,
      byStatus: byStatus.reduce(
        (acc, row) => ({ ...acc, [row.status]: row._count._all }),
        {} as Record<string, number>,
      ),
      pendingShipments,
      totalCreditReceived: totalCreditAmount._sum.creditAmount ?? 0,
    };
  }
}
