import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const computeAtpSchema = z.object({
  productId: z.string().optional(),
  warehouseId: z.string().optional(),
});
export type ComputeAtpInput = z.infer<typeof computeAtpSchema>;

export const createAtpReservationSchema = z.object({
  atpId: z.string().min(1),
  referenceId: z.string().min(1),
  referenceType: z.enum(['SALES_ORDER', 'TRANSFER', 'MANUAL']),
  quantity: z.number().positive(),
  committedUntil: z.string().datetime().optional(),
});
export type CreateAtpReservationInput = z.infer<typeof createAtpReservationSchema>;

export const multiWarehouseAtpSchema = z.object({
  warehouseIds: z.array(z.string().min(1)).min(1),
});
export type MultiWarehouseAtpInput = z.infer<typeof multiWarehouseAtpSchema>;

export const listReservationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.string().optional(),
  atpId: z.string().optional(),
});

@Injectable()
export class InventoryAtpCtpService {

  async computeAtp(tenantId: string, productId?: string, warehouseId?: string) {
    const productWhere: Prisma.StockLedgerEntryWhereInput = { tenantId };
    if (productId) productWhere.productId = productId;
    if (warehouseId) productWhere.warehouseId = warehouseId;

    const stockAgg = await prisma.stockLedgerEntry.groupBy({
      by: ['productId', 'warehouseId'],
      where: productWhere,
      _max: { balanceQty: true },
    });

    const results = [];
    for (const row of stockAgg) {
      const pid = row.productId;
      const wid = row.warehouseId;
      const onHand = row._max.balanceQty ?? new Prisma.Decimal(0);

      const onOrderAgg = await prisma.purchaseOrderItem.aggregate({
        _sum: { quantity: true, receivedQty: true },
        where: {
          tenantId,
          productId: pid,
          purchaseOrder: {
            status: { in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'] },
          },
        },
      });
      const totalQty = onOrderAgg._sum.quantity ?? new Prisma.Decimal(0);
      const totalReceived = onOrderAgg._sum.receivedQty ?? new Prisma.Decimal(0);
      const onOrder = Prisma.Decimal.sub(totalQty, totalReceived);

      const allocatedAgg = await prisma.salesOrderItem.aggregate({
        _sum: { quantity: true, deliveredQty: true },
        where: {
          tenantId,
          productId: pid,
          salesOrder: {
            status: { in: ['CONFIRMED', 'PROCESSING', 'PARTIALLY_DELIVERED'] },
          },
        },
      });
      const soQty = allocatedAgg._sum.quantity ?? new Prisma.Decimal(0);
      const soDelivered = allocatedAgg._sum.deliveredQty ?? new Prisma.Decimal(0);
      const allocated = Prisma.Decimal.sub(soQty, soDelivered);

      const available = Prisma.Decimal.sub(Prisma.Decimal.add(onHand, onOrder), allocated);

      const upserted = await prisma.availableToPromise.upsert({
        where: { tenantId_productId_warehouseId: { tenantId, productId: pid, warehouseId: wid } },
        create: {
          tenantId,
          productId: pid,
          warehouseId: wid,
          onHand,
          onOrder,
          allocated,
          available: Prisma.Decimal.max(available, 0),
          computedAt: new Date(),
        },
        update: {
          onHand,
          onOrder,
          allocated,
          available: Prisma.Decimal.max(available, 0),
          computedAt: new Date(),
        },
      });
      results.push(upserted);
    }
    return results;
  }

  async getAtpStatus(
    tenantId: string,
    productId?: string,
    warehouseId?: string,
    query: { page?: number; limit?: number } = {},
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.AvailableToPromiseWhereInput = { tenantId };
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    const [data, total] = await Promise.all([
      prisma.availableToPromise.findMany({
        where,
        include: { product: true, warehouse: true },
        orderBy: { computedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.availableToPromise.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getProductAvailability(tenantId: string, productId: string) {
    const records = await prisma.availableToPromise.findMany({
      where: { tenantId, productId },
      include: { warehouse: true },
      orderBy: { computedAt: 'desc' },
    });
    const totalAvailable = records.reduce(
      (sum, r) => Prisma.Decimal.add(sum, r.available),
      new Prisma.Decimal(0),
    );
    return {
      productId,
      totalAvailable,
      totalOnHand: records.reduce((s, r) => Prisma.Decimal.add(s, r.onHand), new Prisma.Decimal(0)),
      totalOnOrder: records.reduce((s, r) => Prisma.Decimal.add(s, r.onOrder), new Prisma.Decimal(0)),
      totalAllocated: records.reduce((s, r) => Prisma.Decimal.add(s, r.allocated), new Prisma.Decimal(0)),
      warehouseCount: records.length,
      records,
    };
  }

  async getMultiWarehouseAtp(tenantId: string, warehouseIds: string[]) {
    if (!warehouseIds.length) return [];
    return prisma.availableToPromise.findMany({
      where: { tenantId, warehouseId: { in: warehouseIds } },
      include: { product: true, warehouse: true },
      orderBy: { computedAt: 'desc' },
    });
  }

  async createReservation(tenantId: string, dto: CreateAtpReservationInput) {
    const atp = await prisma.availableToPromise.findFirst({
      where: { id: dto.atpId, tenantId },
    });
    if (!atp) throw new NotFoundException('ATP record not found');

    const qty = new Prisma.Decimal(dto.quantity);
    if (qty.gt(atp.available)) {
      throw new BadRequestException(
        `Insufficient available quantity. Requested ${dto.quantity}, available ${atp.available}`,
      );
    }

    const [reservation] = await prisma.$transaction([
      prisma.atpReservation.create({
        data: {
          tenantId,
          atpId: dto.atpId,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          quantity: qty,
          committedUntil: dto.committedUntil ? new Date(dto.committedUntil) : null,
        },
      }),
      prisma.availableToPromise.update({
        where: { id: dto.atpId },
        data: {
          allocated: Prisma.Decimal.add(atp.allocated, qty),
          available: Prisma.Decimal.sub(atp.available, qty),
        },
      }),
    ]);
    return reservation;
  }

  async releaseReservation(tenantId: string, id: string) {
    const reservation = await prisma.atpReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(`Reservation is already ${reservation.status}`);
    }

    const qty = reservation.quantity;
    const atp = await prisma.availableToPromise.findFirst({
      where: { id: reservation.atpId, tenantId },
    });
    if (!atp) throw new NotFoundException('ATP record not found');

    const [released] = await prisma.$transaction([
      prisma.atpReservation.update({
        where: { id },
        data: { status: 'RELEASED' },
      }),
      prisma.availableToPromise.update({
        where: { id: reservation.atpId },
        data: {
          allocated: Prisma.Decimal.sub(atp.allocated, qty),
          available: Prisma.Decimal.add(atp.available, qty),
        },
      }),
    ]);
    return released;
  }

  async fulfillReservation(tenantId: string, id: string) {
    const reservation = await prisma.atpReservation.findFirst({ where: { id, tenantId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException(`Reservation is already ${reservation.status}`);
    }

    return prisma.atpReservation.update({
      where: { id },
      data: { status: 'FULFILLED' },
    });
  }

  async listReservations(
    tenantId: string,
    query: { page?: number; limit?: number; status?: string; atpId?: string } = {},
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.AtpReservationWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.atpId) where.atpId = query.atpId;

    const [data, total] = await Promise.all([
      prisma.atpReservation.findMany({
        where,
        include: { atp: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.atpReservation.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getAtpDashboard(tenantId: string) {
    const [totalAtp, totalReservations, lowAvailability] = await Promise.all([
      prisma.availableToPromise.count({ where: { tenantId } }),
      prisma.atpReservation.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.availableToPromise.findMany({
        where: { tenantId, available: { lte: 0 } },
        include: { product: true, warehouse: true },
        orderBy: { available: 'asc' },
        take: 20,
      }),
    ]);

    return {
      totalAtpRecords: totalAtp,
      activeReservations: totalReservations,
      lowAvailabilityAlerts: lowAvailability.length,
      lowAvailabilityItems: lowAvailability.map((r) => ({
        productId: r.productId,
        productName: r.product?.name ?? null,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouse?.name ?? null,
        available: r.available,
        onHand: r.onHand,
      })),
    };
  }
}
