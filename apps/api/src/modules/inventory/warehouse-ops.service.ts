import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const createWarehouseTaskSchema = z.object({
  taskType: z.enum(['PICK', 'PUTAWAY', 'REPLENISH', 'BIN_TRANSFER', 'RECEIVE', 'PACK', 'CYCLE_COUNT']),
  priority: z.number().int().min(1).max(100).default(50),
  warehouseId: z.string().min(1),
  zoneId: z.string().optional(),
  sourceLocation: z.string().optional(),
  destLocation: z.string().optional(),
  productId: z.string().optional(),
  qty: z.number().positive().optional(),
  uom: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const createBinTransferSchema = z.object({
  productId: z.string().min(1),
  fromBin: z.string().min(1),
  toBin: z.string().min(1),
  qty: z.number().positive(),
  uom: z.string().default('EA'),
  reason: z.string().optional(),
  requestedBy: z.string().optional(),
});

export const createGrnSchema = z.object({
  purchaseOrderId: z.string().optional(),
  asnId: z.string().optional(),
  warehouseId: z.string().min(1),
  supplierId: z.string().optional(),
  receivedDate: z.string().datetime(),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  totalCartons: z.number().int().positive().optional(),
  totalWeight: z.number().positive().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    productId: z.string().min(1),
    orderedQty: z.number().positive(),
    receivedQty: z.number().nonnegative(),
    uom: z.string().default('EA'),
    lotNumber: z.string().optional(),
    expiryDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  })).min(1),
});

export const verifyGrnLinesSchema = z.object({
  lineItems: z.array(z.object({
    lineItemId: z.string().min(1),
    acceptedQty: z.number().nonnegative(),
    rejectedQty: z.number().nonnegative(),
    notes: z.string().optional(),
  })),
});

export const createPackingSessionSchema = z.object({
  outboundShipmentId: z.string().optional(),
  pickWaveId: z.string().optional(),
  workerId: z.string().optional(),
});

export const addCartonSchema = z.object({
  weight: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  labelUrl: z.string().url().optional(),
});

@Injectable()
export class WarehouseOpsService {

  // ─── Warehouse Task Queue ─────────────────────────────────────────────────

  async listTasks(tenantId: string, filters: { status?: string; taskType?: string; assignedTo?: string; warehouseId?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.taskType) where['taskType'] = filters.taskType;
    if (filters.assignedTo) where['assignedTo'] = filters.assignedTo;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;
    return prisma.warehouseTask.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTask(tenantId: string, id: string) {
    const task = await prisma.warehouseTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Warehouse task not found');
    return task;
  }

  async createTask(tenantId: string, dto: z.infer<typeof createWarehouseTaskSchema>) {
    const taskNumber = `WT-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.warehouseTask.create({
      data: {
        tenantId,
        taskNumber,
        taskType: dto.taskType,
        priority: dto.priority ?? 50,
        warehouseId: dto.warehouseId,
        zoneId: dto.zoneId,
        sourceLocation: dto.sourceLocation,
        destLocation: dto.destLocation,
        productId: dto.productId,
        qty: dto.qty !== undefined ? new Prisma.Decimal(dto.qty) : undefined,
        uom: dto.uom,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        notes: dto.notes,
      },
    });
  }

  async assignTask(tenantId: string, id: string, userId: string) {
    const task = await prisma.warehouseTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Warehouse task not found');
    if (!['QUEUED', 'ASSIGNED'].includes(task.status)) {
      throw new BadRequestException(`Cannot assign task in ${task.status} status`);
    }
    return prisma.warehouseTask.update({
      where: { id },
      data: { status: 'ASSIGNED', assignedTo: userId, assignedAt: new Date() },
    });
  }

  async startTask(tenantId: string, id: string) {
    const task = await prisma.warehouseTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Warehouse task not found');
    if (task.status !== 'ASSIGNED') throw new BadRequestException('Task must be ASSIGNED before starting');
    return prisma.warehouseTask.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async completeTask(tenantId: string, id: string, notes?: string) {
    const task = await prisma.warehouseTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Warehouse task not found');
    if (task.status !== 'IN_PROGRESS') throw new BadRequestException('Task must be IN_PROGRESS to complete');
    return prisma.warehouseTask.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date(), notes: notes ?? task.notes },
    });
  }

  async cancelTask(tenantId: string, id: string, reason?: string) {
    const task = await prisma.warehouseTask.findFirst({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Warehouse task not found');
    if (['COMPLETE', 'CANCELLED'].includes(task.status)) {
      throw new BadRequestException(`Task already ${task.status}`);
    }
    return prisma.warehouseTask.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason ?? task.notes },
    });
  }

  async getWorkerQueue(tenantId: string, userId: string) {
    return prisma.warehouseTask.findMany({
      where: { tenantId, assignedTo: userId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      orderBy: [{ status: 'desc' }, { priority: 'asc' }],
    });
  }

  async getTaskDashboard(tenantId: string) {
    const [queued, assigned, inProgress, complete, byType] = await Promise.all([
      prisma.warehouseTask.count({ where: { tenantId, status: 'QUEUED' } }),
      prisma.warehouseTask.count({ where: { tenantId, status: 'ASSIGNED' } }),
      prisma.warehouseTask.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      prisma.warehouseTask.count({ where: { tenantId, status: 'COMPLETE' } }),
      prisma.warehouseTask.groupBy({
        by: ['taskType'],
        where: { tenantId, status: { not: 'CANCELLED' } },
        _count: { id: true },
      }),
    ]);
    return { queued, assigned, inProgress, complete, byType };
  }

  // ─── Bin Transfer Requests ────────────────────────────────────────────────

  async listBinTransfers(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where['status'] = status;
    return prisma.binTransferRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBinTransfer(tenantId: string, id: string) {
    const record = await prisma.binTransferRequest.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Bin transfer request not found');
    return record;
  }

  async createBinTransfer(tenantId: string, dto: z.infer<typeof createBinTransferSchema>) {
    if (dto.fromBin === dto.toBin) throw new BadRequestException('Source and destination bins must differ');
    const transferNumber = `BTR-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.binTransferRequest.create({
      data: {
        tenantId,
        transferNumber,
        productId: dto.productId,
        fromBin: dto.fromBin,
        toBin: dto.toBin,
        qty: new Prisma.Decimal(dto.qty),
        uom: dto.uom ?? 'EA',
        reason: dto.reason,
        requestedBy: dto.requestedBy,
      },
    });
  }

  async approveBinTransfer(tenantId: string, id: string, approvedBy: string) {
    const record = await prisma.binTransferRequest.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Bin transfer request not found');
    if (record.status !== 'PENDING') throw new BadRequestException('Only PENDING requests can be approved');
    return prisma.binTransferRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async rejectBinTransfer(tenantId: string, id: string, rejectedReason: string) {
    const record = await prisma.binTransferRequest.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Bin transfer request not found');
    if (record.status !== 'PENDING') throw new BadRequestException('Only PENDING requests can be rejected');
    return prisma.binTransferRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason },
    });
  }

  async completeBinTransfer(tenantId: string, id: string) {
    const record = await prisma.binTransferRequest.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Bin transfer request not found');
    if (record.status !== 'APPROVED' && record.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Transfer must be APPROVED or IN_PROGRESS to complete');
    }
    return prisma.binTransferRequest.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });
  }

  // ─── Goods Receipt Notes ──────────────────────────────────────────────────

  async listGrns(tenantId: string, filters: { status?: string; warehouseId?: string; purchaseOrderId?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where['status'] = filters.status;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;
    if (filters.purchaseOrderId) where['purchaseOrderId'] = filters.purchaseOrderId;
    return prisma.goodsReceiptNote.findMany({
      where,
      include: { lineItems: true },
      orderBy: { receivedDate: 'desc' },
    });
  }

  async getGrn(tenantId: string, id: string) {
    const grn = await prisma.goodsReceiptNote.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!grn) throw new NotFoundException('GRN not found');
    return grn;
  }

  async createGrn(tenantId: string, dto: z.infer<typeof createGrnSchema>) {
    const grnCount = await prisma.goodsReceiptNote.count({ where: { tenantId } });
    const grnNumber = `GRN-${String(grnCount + 1).padStart(5, '0')}`;
    return prisma.goodsReceiptNote.create({
      data: {
        tenantId,
        grnNumber,
        purchaseOrderId: dto.purchaseOrderId,
        asnId: dto.asnId,
        warehouseId: dto.warehouseId,
        supplierId: dto.supplierId,
        receivedDate: new Date(dto.receivedDate),
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        totalCartons: dto.totalCartons,
        totalWeight: dto.totalWeight !== undefined ? new Prisma.Decimal(dto.totalWeight) : undefined,
        notes: dto.notes,
        lineItems: {
          create: dto.lineItems.map(li => ({
            tenantId,
            productId: li.productId,
            orderedQty: new Prisma.Decimal(li.orderedQty),
            receivedQty: new Prisma.Decimal(li.receivedQty),
            uom: li.uom ?? 'EA',
            lotNumber: li.lotNumber,
            expiryDate: li.expiryDate ? new Date(li.expiryDate) : undefined,
            notes: li.notes,
          })),
        },
      },
      include: { lineItems: true },
    });
  }

  async verifyGrn(tenantId: string, id: string, dto: z.infer<typeof verifyGrnLinesSchema>) {
    const grn = await prisma.goodsReceiptNote.findFirst({ where: { id, tenantId } });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'DRAFT') throw new BadRequestException('GRN must be in DRAFT status to verify');

    await prisma.$transaction([
      ...dto.lineItems.map(li =>
        prisma.grnLineItem.update({
          where: { id: li.lineItemId },
          data: {
            acceptedQty: new Prisma.Decimal(li.acceptedQty),
            rejectedQty: new Prisma.Decimal(li.rejectedQty),
            notes: li.notes,
          },
        }),
      ),
      prisma.goodsReceiptNote.update({ where: { id }, data: { status: 'VERIFIED' } }),
    ]);

    return prisma.goodsReceiptNote.findFirst({ where: { id }, include: { lineItems: true } });
  }

  async qualityCheckGrn(tenantId: string, id: string) {
    const grn = await prisma.goodsReceiptNote.findFirst({ where: { id, tenantId } });
    if (!grn) throw new NotFoundException('GRN not found');
    if (grn.status !== 'VERIFIED') throw new BadRequestException('GRN must be VERIFIED before quality check');
    return prisma.goodsReceiptNote.update({ where: { id }, data: { status: 'QUALITY_CHECK' } });
  }

  async completeGrnPutaway(tenantId: string, id: string) {
    const grn = await prisma.goodsReceiptNote.findFirst({ where: { id, tenantId } });
    if (!grn) throw new NotFoundException('GRN not found');
    if (!['VERIFIED', 'QUALITY_CHECK'].includes(grn.status)) {
      throw new BadRequestException('GRN must be VERIFIED or QUALITY_CHECK to complete put-away');
    }
    return prisma.goodsReceiptNote.update({ where: { id }, data: { status: 'COMPLETE' } });
  }

  async rejectGrn(tenantId: string, id: string, reason: string) {
    const grn = await prisma.goodsReceiptNote.findFirst({ where: { id, tenantId } });
    if (!grn) throw new NotFoundException('GRN not found');
    if (['COMPLETE', 'REJECTED'].includes(grn.status)) throw new BadRequestException(`GRN already ${grn.status}`);
    return prisma.goodsReceiptNote.update({ where: { id }, data: { status: 'REJECTED', rejectedReason: reason } });
  }

  async getGrnDashboard(tenantId: string) {
    const [draft, verified, qualityCheck, complete, rejected] = await Promise.all([
      prisma.goodsReceiptNote.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.goodsReceiptNote.count({ where: { tenantId, status: 'VERIFIED' } }),
      prisma.goodsReceiptNote.count({ where: { tenantId, status: 'QUALITY_CHECK' } }),
      prisma.goodsReceiptNote.count({ where: { tenantId, status: 'COMPLETE' } }),
      prisma.goodsReceiptNote.count({ where: { tenantId, status: 'REJECTED' } }),
    ]);
    return { draft, verified, qualityCheck, complete, rejected };
  }

  // ─── Packing Sessions ─────────────────────────────────────────────────────

  async listPackingSessions(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where['status'] = status;
    return prisma.packingSession.findMany({
      where,
      include: { cartons: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPackingSession(tenantId: string, id: string) {
    const session = await prisma.packingSession.findFirst({
      where: { id, tenantId },
      include: { cartons: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Packing session not found');
    return session;
  }

  async createPackingSession(tenantId: string, dto: z.infer<typeof createPackingSessionSchema>) {
    const sessionNumber = `PACK-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.packingSession.create({
      data: {
        tenantId,
        sessionNumber,
        outboundShipmentId: dto.outboundShipmentId,
        pickWaveId: dto.pickWaveId,
        workerId: dto.workerId,
      },
      include: { cartons: true },
    });
  }

  async addCarton(tenantId: string, sessionId: string, dto: z.infer<typeof addCartonSchema>) {
    const session = await prisma.packingSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Packing session not found');
    if (session.status !== 'OPEN') throw new BadRequestException('Session is not OPEN');

    const cartonNumber = `C-${session.totalCartons + 1}`;
    const [carton] = await prisma.$transaction([
      prisma.packingCarton.create({
        data: {
          tenantId,
          sessionId,
          cartonNumber,
          weight: dto.weight !== undefined ? new Prisma.Decimal(dto.weight) : undefined,
          length: dto.length !== undefined ? new Prisma.Decimal(dto.length) : undefined,
          width: dto.width !== undefined ? new Prisma.Decimal(dto.width) : undefined,
          height: dto.height !== undefined ? new Prisma.Decimal(dto.height) : undefined,
          labelUrl: dto.labelUrl,
        },
      }),
      prisma.packingSession.update({
        where: { id: sessionId },
        data: { totalCartons: { increment: 1 } },
      }),
    ]);
    return carton;
  }

  async sealCarton(tenantId: string, sessionId: string, cartonId: string) {
    const carton = await prisma.packingCarton.findFirst({ where: { id: cartonId, sessionId, tenantId } });
    if (!carton) throw new NotFoundException('Carton not found in this session');
    if (carton.sealedAt) throw new BadRequestException('Carton already sealed');
    return prisma.packingCarton.update({ where: { id: cartonId }, data: { sealedAt: new Date() } });
  }

  async completePackingSession(tenantId: string, id: string) {
    const session = await prisma.packingSession.findFirst({
      where: { id, tenantId },
      include: { cartons: true },
    });
    if (!session) throw new NotFoundException('Packing session not found');
    if (session.status !== 'OPEN') throw new BadRequestException('Session is not OPEN');
    if (session.cartons.length === 0) throw new BadRequestException('Cannot complete session with no cartons');

    const totalWeight = session.cartons.reduce((sum, c) =>
      sum + (c.weight ? parseFloat(c.weight.toString()) : 0), 0
    );

    return prisma.packingSession.update({
      where: { id },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
        totalWeight: totalWeight > 0 ? new Prisma.Decimal(totalWeight) : undefined,
      },
      include: { cartons: true },
    });
  }

  // ─── Warehouse Ops Dashboard ──────────────────────────────────────────────

  async getWarehouseOpsDashboard(tenantId: string) {
    const [taskDash, grnDash, openPackSessions, pendingBinTransfers] = await Promise.all([
      this.getTaskDashboard(tenantId),
      this.getGrnDashboard(tenantId),
      prisma.packingSession.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.binTransferRequest.count({ where: { tenantId, status: 'PENDING' } }),
    ]);
    return { tasks: taskDash, grns: grnDash, openPackSessions, pendingBinTransfers };
  }
}
