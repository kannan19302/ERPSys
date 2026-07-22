import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createCustomerConsignmentSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityOnHand: z.number().min(0),
  unitPrice: z.number().min(0),
  maxQuantity: z.number().optional(),
  reorderPoint: z.number().optional(),
  notes: z.string().optional(),
});
export type CreateCustomerConsignmentInput = z.infer<typeof createCustomerConsignmentSchema>;

export const updateCustomerConsignmentSchema = createCustomerConsignmentSchema.partial();
export type UpdateCustomerConsignmentInput = z.infer<typeof updateCustomerConsignmentSchema>;

export const recordConsumptionSchema = z.object({
  consignmentId: z.string().min(1),
  quantity: z.number().positive(),
  totalValue: z.number().min(0),
  reference: z.string().optional(),
  consumedAt: z.string().datetime().optional(),
});
export type RecordConsumptionInput = z.infer<typeof recordConsumptionSchema>;

@Injectable()
export class InventoryCustomerConsignmentService {

  async listConsignments(
    tenantId: string,
    query: { customerId?: string; productId?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.CustomerConsignmentStockWhereInput = { tenantId };
    if (query.customerId) where.customerId = query.customerId;
    if (query.productId) where.productId = query.productId;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.customerConsignmentStock.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerConsignmentStock.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getConsignment(tenantId: string, id: string) {
    const record = await prisma.customerConsignmentStock.findFirst({
      where: { id, tenantId },
      include: { consumptions: { orderBy: { consumedAt: 'desc' } } },
    });
    if (!record) throw new NotFoundException('Consignment not found');
    return record;
  }

  async createConsignment(tenantId: string, dto: CreateCustomerConsignmentInput) {
    const quantityOnHand = new Prisma.Decimal(dto.quantityOnHand);
    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const totalValue = quantityOnHand.mul(unitPrice);

    return prisma.customerConsignmentStock.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantityOnHand,
        unitPrice,
        totalValue,
        maxQuantity: dto.maxQuantity !== undefined ? new Prisma.Decimal(dto.maxQuantity) : null,
        reorderPoint: dto.reorderPoint !== undefined ? new Prisma.Decimal(dto.reorderPoint) : null,
        notes: dto.notes ?? null,
      },
    });
  }

  async updateConsignment(tenantId: string, id: string, dto: UpdateCustomerConsignmentInput) {
    const record = await prisma.customerConsignmentStock.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Consignment not found');

    const data: any = {};
    if (dto.customerId !== undefined) data.customerId = dto.customerId;
    if (dto.productId !== undefined) data.productId = dto.productId;
    if (dto.warehouseId !== undefined) data.warehouseId = dto.warehouseId;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.maxQuantity !== undefined) data.maxQuantity = new Prisma.Decimal(dto.maxQuantity);
    if (dto.reorderPoint !== undefined) data.reorderPoint = new Prisma.Decimal(dto.reorderPoint);

    if (dto.quantityOnHand !== undefined || dto.unitPrice !== undefined) {
      const qoh = dto.quantityOnHand !== undefined ? new Prisma.Decimal(dto.quantityOnHand) : record.quantityOnHand;
      const up = dto.unitPrice !== undefined ? new Prisma.Decimal(dto.unitPrice) : record.unitPrice;
      data.quantityOnHand = qoh;
      data.unitPrice = up;
      data.totalValue = qoh.mul(up);
    }

    return prisma.customerConsignmentStock.update({ where: { id }, data });
  }

  async closeConsignment(tenantId: string, id: string) {
    const record = await prisma.customerConsignmentStock.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Consignment not found');
    if (record.status === 'CLOSED') throw new BadRequestException('Consignment is already closed');
    return prisma.customerConsignmentStock.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  async recordConsumption(tenantId: string, dto: RecordConsumptionInput) {
    const consignment = await prisma.customerConsignmentStock.findFirst({
      where: { id: dto.consignmentId, tenantId },
    });
    if (!consignment) throw new NotFoundException('Consignment not found');
    if (consignment.status === 'CLOSED') throw new BadRequestException('Consignment is closed');

    const quantity = new Prisma.Decimal(dto.quantity);
    const newQoh = consignment.quantityOnHand.sub(quantity);
    if (newQoh.isNegative()) throw new BadRequestException('Insufficient consignment stock');

    const consumedAt = dto.consumedAt ? new Date(dto.consumedAt) : new Date();

    const newStatus = newQoh.isZero() ? 'DEPLETED' : 'ACTIVE';

    const [consumption] = await Promise.all([
      prisma.customerConsignmentConsumption.create({
        data: {
          tenantId,
          consignmentId: dto.consignmentId,
          quantity,
          totalValue: new Prisma.Decimal(dto.totalValue),
          reference: dto.reference ?? null,
          consumedAt,
        },
      }),
      prisma.customerConsignmentStock.update({
        where: { id: dto.consignmentId },
        data: { quantityOnHand: newQoh, lastConsumedAt: consumedAt, status: newStatus },
      }),
    ]);

    return consumption;
  }

  async getConsignmentDashboard(tenantId: string) {
    const [activeCount, totalValueAgg, totalConsumedAgg] = await Promise.all([
      prisma.customerConsignmentStock.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.customerConsignmentStock.aggregate({
        where: { tenantId, status: { in: ['ACTIVE', 'DEPLETED'] } },
        _sum: { totalValue: true },
      }),
      prisma.customerConsignmentConsumption.aggregate({
        where: { tenantId },
        _sum: { totalValue: true },
      }),
    ]);

    return {
      totalActiveConsignments: activeCount,
      totalValue: totalValueAgg._sum.totalValue ?? new Prisma.Decimal(0),
      totalConsumed: totalConsumedAgg._sum.totalValue ?? new Prisma.Decimal(0),
    };
  }
}
