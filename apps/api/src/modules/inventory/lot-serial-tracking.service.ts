import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const createBatchSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  batchNo: z.string().min(1),
  quantity: z.number().positive(),
  expiryDate: z.string().datetime().optional(),
  manufactureDate: z.string().datetime().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export const createSerialSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  serialNo: z.string().min(1),
  expiryDate: z.string().datetime().optional(),
  warrantyExpiry: z.string().datetime().optional(),
  purchaseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const recordLotMovementSchema = z.object({
  batchId: z.string().min(1),
  movementType: z.enum(['RECEIPT', 'PICK', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'SCRAP']),
  qty: z.number().positive(),
  uom: z.string().default('EA'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  fromBin: z.string().optional(),
  toBin: z.string().optional(),
  notes: z.string().optional(),
});

export const generatePickSuggestionsSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  qtyNeeded: z.number().positive(),
  strategy: z.enum(['FEFO', 'FIFO', 'LIFO', 'MANUAL']).default('FEFO'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export const confirmPickSchema = z.object({
  pickedQty: z.number().positive(),
});

export const quarantineOrderSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  qty: z.number().positive(),
  reason: z.string().min(1),
  batchId: z.string().optional(),
  serialId: z.string().optional(),
});

export const releaseQuarantineSchema = z.object({
  releaseNotes: z.string().min(1),
});

export const generateExpiryAlertsSchema = z.object({
  warehouseId: z.string().optional(),
  thresholdDays: z.number().int().min(1).default(30),
});

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LotSerialTrackingService {

  // ── Batch/Lot Management ──────────────────────────────────────────────────

  async listBatches(tenantId: string, filters: { productId?: string; status?: string; warehouseId?: string; expiringBefore?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.productId) where['productId'] = filters.productId;
    if (filters.status) where['status'] = filters.status;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;
    if (filters.expiringBefore) where['expiryDate'] = { lte: new Date(filters.expiringBefore) };
    return prisma.batch.findMany({
      where,
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
      take: 200,
    });
  }

  async getBatch(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async createBatch(tenantId: string, dto: z.infer<typeof createBatchSchema>) {
    const existing = await prisma.batch.findFirst({
      where: { tenantId, productId: dto.productId, batchNo: dto.batchNo },
    });
    if (existing) throw new BadRequestException('Batch number already exists for this product');
    return prisma.batch.create({
      data: {
        tenantId,
        productId: dto.productId,
        batchNo: dto.batchNo,
        quantity: new Prisma.Decimal(dto.quantity),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : undefined,
        supplierBatchNo: dto.supplierId,
        notes: dto.notes,
        status: 'ACTIVE',
      },
    });
  }

  async quarantineBatch(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status === 'QUARANTINE') throw new BadRequestException('Batch is already in quarantine');
    return prisma.batch.update({ where: { id }, data: { status: 'QUARANTINE' } });
  }

  async releaseBatchFromQuarantine(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'QUARANTINE') throw new BadRequestException('Batch is not in quarantine');
    return prisma.batch.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async expireBatch(tenantId: string, id: string) {
    const batch = await prisma.batch.findFirst({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return prisma.batch.update({ where: { id }, data: { status: 'EXPIRED' } });
  }

  async getBatchMovements(tenantId: string, batchId: string) {
    const batch = await prisma.batch.findFirst({ where: { id: batchId, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return prisma.lotMovement.findMany({
      where: { tenantId, batchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordLotMovement(tenantId: string, performedBy: string, dto: z.infer<typeof recordLotMovementSchema>) {
    const batch = await prisma.batch.findFirst({ where: { id: dto.batchId, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return prisma.lotMovement.create({
      data: {
        tenantId,
        batchId: dto.batchId,
        movementType: dto.movementType,
        qty: new Prisma.Decimal(dto.qty),
        uom: dto.uom ?? 'EA',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        performedBy,
        fromBin: dto.fromBin,
        toBin: dto.toBin,
        notes: dto.notes,
      },
    });
  }

  // ── Serial Numbers ────────────────────────────────────────────────────────

  async listSerials(tenantId: string, filters: { productId?: string; status?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.productId) where['productId'] = filters.productId;
    if (filters.status) where['status'] = filters.status;
    return prisma.serialNumber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getSerial(tenantId: string, id: string) {
    const serial = await prisma.serialNumber.findFirst({
      where: { id, tenantId },
      include: { history: { orderBy: { createdAt: 'desc' } } },
    });
    if (!serial) throw new NotFoundException('Serial number not found');
    return serial;
  }

  async createSerial(tenantId: string, dto: z.infer<typeof createSerialSchema>) {
    const existing = await prisma.serialNumber.findFirst({
      where: { tenantId, productId: dto.productId, serialNo: dto.serialNo },
    });
    if (existing) throw new BadRequestException('Serial number already exists for this product');
    return prisma.serialNumber.create({
      data: {
        tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        serialNo: dto.serialNo,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        status: 'AVAILABLE',
        notes: dto.notes,
      },
    });
  }

  async markSerialSold(tenantId: string, id: string, salesOrderId?: string) {
    const serial = await prisma.serialNumber.findFirst({ where: { id, tenantId } });
    if (!serial) throw new NotFoundException('Serial number not found');
    if (serial.status !== 'AVAILABLE' && serial.status !== 'RESERVED') {
      throw new BadRequestException('Serial must be AVAILABLE or RESERVED to mark as sold');
    }
    return prisma.$transaction([
      prisma.serialNumber.update({ where: { id }, data: { status: 'SOLD', salesOrderId: salesOrderId ?? serial.salesOrderId } }),
      prisma.serialNumberHistory.create({
        data: { tenantId, serialNumberId: id, action: 'SHIPPED', fromStatus: serial.status, toStatus: 'SOLD', reference: salesOrderId },
      }),
    ]);
  }

  async markSerialReturned(tenantId: string, id: string, notes?: string) {
    const serial = await prisma.serialNumber.findFirst({ where: { id, tenantId } });
    if (!serial) throw new NotFoundException('Serial number not found');
    if (serial.status !== 'SOLD') throw new BadRequestException('Only SOLD serials can be returned');
    return prisma.$transaction([
      prisma.serialNumber.update({ where: { id }, data: { status: 'RETURNED' } }),
      prisma.serialNumberHistory.create({
        data: { tenantId, serialNumberId: id, action: 'RETURNED', fromStatus: 'SOLD', toStatus: 'RETURNED', notes },
      }),
    ]);
  }

  async scrapSerial(tenantId: string, id: string, notes?: string) {
    const serial = await prisma.serialNumber.findFirst({ where: { id, tenantId } });
    if (!serial) throw new NotFoundException('Serial number not found');
    return prisma.$transaction([
      prisma.serialNumber.update({ where: { id }, data: { status: 'SCRAPPED' } }),
      prisma.serialNumberHistory.create({
        data: { tenantId, serialNumberId: id, action: 'SCRAPPED', fromStatus: serial.status, toStatus: 'SCRAPPED', notes },
      }),
    ]);
  }

  // ── FEFO/FIFO Pick Suggestions ────────────────────────────────────────────

  async generatePickSuggestions(tenantId: string, dto: z.infer<typeof generatePickSuggestionsSchema>) {
    // Fetch active batches for the product ordered by strategy
    const orderBy: Prisma.BatchOrderByWithRelationInput[] =
      dto.strategy === 'FEFO' ? [{ expiryDate: 'asc' }, { createdAt: 'asc' }] :
      dto.strategy === 'FIFO' ? [{ createdAt: 'asc' }] :
      dto.strategy === 'LIFO' ? [{ createdAt: 'desc' }] :
      [{ createdAt: 'asc' }];

    const batches = await prisma.batch.findMany({
      where: {
        tenantId,
        productId: dto.productId,
        status: 'ACTIVE',
        quantity: { gt: 0 },
      },
      orderBy,
    });

    let remaining = dto.qtyNeeded;
    const suggestions: Array<{ batchId: string; batchNo: string; suggestedQty: number; expiryDate: Date | null }> = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const available = parseFloat(batch.quantity.toString()) - parseFloat((batch.usedQty ?? 0).toString());
      if (available <= 0) continue;
      const pickQty = Math.min(available, remaining);
      suggestions.push({
        batchId: batch.id,
        batchNo: batch.batchNo,
        suggestedQty: pickQty,
        expiryDate: batch.expiryDate,
      });
      remaining -= pickQty;
    }

    // Persist suggestions
    const created = await Promise.all(
      suggestions.map(s =>
        prisma.pickSuggestion.create({
          data: {
            tenantId,
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            strategy: dto.strategy,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            batchId: s.batchId,
            suggestedQty: new Prisma.Decimal(s.suggestedQty),
            status: 'PENDING',
          },
        })
      )
    );

    return {
      suggestions: created,
      fullyAllocated: remaining <= 0,
      unallocatedQty: Math.max(0, remaining),
    };
  }

  async listPickSuggestions(tenantId: string, filters: { referenceId?: string; status?: string }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.referenceId) where['referenceId'] = filters.referenceId;
    if (filters.status) where['status'] = filters.status;
    return prisma.pickSuggestion.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async confirmPickSuggestion(tenantId: string, id: string, dto: z.infer<typeof confirmPickSchema>) {
    const suggestion = await prisma.pickSuggestion.findFirst({ where: { id, tenantId } });
    if (!suggestion) throw new NotFoundException('Pick suggestion not found');
    if (suggestion.status !== 'PENDING') throw new BadRequestException('Suggestion is not PENDING');
    if (dto.pickedQty > parseFloat(suggestion.suggestedQty.toString())) {
      throw new BadRequestException('Picked qty cannot exceed suggested qty');
    }
    return prisma.pickSuggestion.update({
      where: { id },
      data: { status: 'CONFIRMED', pickedQty: new Prisma.Decimal(dto.pickedQty) },
    });
  }

  async cancelPickSuggestion(tenantId: string, id: string) {
    const suggestion = await prisma.pickSuggestion.findFirst({ where: { id, tenantId } });
    if (!suggestion) throw new NotFoundException('Pick suggestion not found');
    if (suggestion.status !== 'PENDING') throw new BadRequestException('Only PENDING suggestions can be cancelled');
    return prisma.pickSuggestion.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── Expiry Alerts ─────────────────────────────────────────────────────────

  async generateExpiryAlerts(tenantId: string, dto: z.infer<typeof generateExpiryAlertsSchema>) {
    const cutoff = new Date(Date.now() + dto.thresholdDays * 86400000);
    const where: Record<string, unknown> = {
      tenantId,
      status: 'ACTIVE',
      expiryDate: { lte: cutoff },
    };
    if (dto.warehouseId) where['warehouseId'] = dto.warehouseId;

    const batches = await prisma.batch.findMany({ where });
    const now = new Date();

    const created = await Promise.all(
      batches.map(b => {
        const daysUntil = b.expiryDate
          ? Math.ceil((b.expiryDate.getTime() - now.getTime()) / 86400000)
          : 0;
        const severity = daysUntil <= 0 ? 'EXPIRED' : daysUntil <= 7 ? 'CRITICAL' : 'WARNING';
        return prisma.expiryAlert.create({
          data: {
            tenantId,
            batchId: b.id,
            productId: b.productId,
            warehouseId: dto.warehouseId ?? 'unknown',
            expiryDate: b.expiryDate!,
            daysUntilExpiry: daysUntil,
            qty: b.quantity,
            severity,
          },
        });
      })
    );

    return { generated: created.length, alerts: created };
  }

  async listExpiryAlerts(tenantId: string, filters: { severity?: string; acknowledged?: boolean }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.severity) where['severity'] = filters.severity;
    if (filters.acknowledged !== undefined) where['acknowledged'] = filters.acknowledged;
    return prisma.expiryAlert.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { expiryDate: 'asc' }],
    });
  }

  async acknowledgeExpiryAlert(tenantId: string, id: string, acknowledgedBy: string) {
    const alert = await prisma.expiryAlert.findFirst({ where: { id, tenantId } });
    if (!alert) throw new NotFoundException('Expiry alert not found');
    return prisma.expiryAlert.update({
      where: { id },
      data: { acknowledged: true, acknowledgedBy, acknowledgedAt: new Date() },
    });
  }

  // ── Quarantine Orders ─────────────────────────────────────────────────────

  async listQuarantineOrders(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where['status'] = status;
    return prisma.quarantineOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getQuarantineOrder(tenantId: string, id: string) {
    const order = await prisma.quarantineOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Quarantine order not found');
    return order;
  }

  async createQuarantineOrder(tenantId: string, createdBy: string, dto: z.infer<typeof quarantineOrderSchema>) {
    const count = await prisma.quarantineOrder.count({ where: { tenantId } });
    const orderNumber = `QO-${String(count + 1).padStart(5, '0')}`;

    const tasks: Promise<any>[] = [
      prisma.quarantineOrder.create({
        data: {
          tenantId,
          orderNumber,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          qty: new Prisma.Decimal(dto.qty),
          reason: dto.reason,
          batchId: dto.batchId,
          serialId: dto.serialId,
          quarantinedBy: createdBy,
          status: 'ACTIVE',
        },
      }),
    ];

    if (dto.batchId) {
      tasks.push(prisma.batch.update({ where: { id: dto.batchId }, data: { status: 'QUARANTINE' } }));
    }
    if (dto.serialId) {
      tasks.push(prisma.serialNumber.update({ where: { id: dto.serialId }, data: { status: 'RESERVED' } }));
    }

    const [order] = await Promise.all(tasks);
    return order;
  }

  async releaseQuarantineOrder(tenantId: string, id: string, releasedBy: string, dto: z.infer<typeof releaseQuarantineSchema>) {
    const order = await prisma.quarantineOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Quarantine order not found');
    if (order.status !== 'ACTIVE') throw new BadRequestException('Quarantine order is not ACTIVE');

    const tasks: Promise<any>[] = [
      prisma.quarantineOrder.update({
        where: { id },
        data: { status: 'RELEASED', releasedBy, releasedAt: new Date(), releaseNotes: dto.releaseNotes },
      }),
    ];

    if (order.batchId) {
      tasks.push(prisma.batch.update({ where: { id: order.batchId }, data: { status: 'ACTIVE' } }));
    }
    if (order.serialId) {
      tasks.push(prisma.serialNumber.update({ where: { id: order.serialId }, data: { status: 'AVAILABLE' } }));
    }

    const [updated] = await Promise.all(tasks);
    return updated;
  }

  async scrapQuarantineOrder(tenantId: string, id: string) {
    const order = await prisma.quarantineOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Quarantine order not found');
    if (order.status !== 'ACTIVE') throw new BadRequestException('Quarantine order is not ACTIVE');
    return prisma.quarantineOrder.update({ where: { id }, data: { status: 'SCRAPPED' } });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getLotSerialDashboard(tenantId: string) {
    const [
      activeBatches, expiredBatches, quarantineBatches,
      availableSerials, soldSerials,
      pendingPicks, confirmedPicks,
      unacknowledgedAlerts, criticalAlerts,
      activeQuarantineOrders,
    ] = await Promise.all([
      prisma.batch.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.batch.count({ where: { tenantId, status: 'EXPIRED' } }),
      prisma.batch.count({ where: { tenantId, status: 'QUARANTINE' } }),
      prisma.serialNumber.count({ where: { tenantId, status: 'AVAILABLE' } }),
      prisma.serialNumber.count({ where: { tenantId, status: 'SOLD' } }),
      prisma.pickSuggestion.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.pickSuggestion.count({ where: { tenantId, status: 'CONFIRMED' } }),
      prisma.expiryAlert.count({ where: { tenantId, acknowledged: false } }),
      prisma.expiryAlert.count({ where: { tenantId, severity: 'CRITICAL', acknowledged: false } }),
      prisma.quarantineOrder.count({ where: { tenantId, status: 'ACTIVE' } }),
    ]);

    return {
      batches: { active: activeBatches, expired: expiredBatches, quarantine: quarantineBatches },
      serials: { available: availableSerials, sold: soldSerials },
      picks: { pending: pendingPicks, confirmed: confirmedPicks },
      alerts: { unacknowledged: unacknowledgedAlerts, critical: criticalAlerts },
      quarantine: { active: activeQuarantineOrders },
    };
  }

  async getExpiryReport(tenantId: string) {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);

    const [expired, expiringIn7, expiringIn30, expiringIn90] = await Promise.all([
      prisma.batch.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { lt: now } } }),
      prisma.batch.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { gte: now, lte: in7 } } }),
      prisma.batch.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { gt: in7, lte: in30 } } }),
      prisma.batch.count({ where: { tenantId, status: 'ACTIVE', expiryDate: { gt: in30, lte: in90 } } }),
    ]);

    return { expired, expiringIn7, expiringIn30, expiringIn90 };
  }
}
