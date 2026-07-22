import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createSubinventorySchema = z.object({
  warehouseId: z.string().min(1),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: z.enum(['STORAGE', 'RECEIVING', 'SHIPPING', 'QUARANTINE', 'DAMAGE', 'SCRAP', 'INSPECTION']).default('STORAGE'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type CreateSubinventoryInput = z.infer<typeof createSubinventorySchema>;

export const updateSubinventorySchema = createSubinventorySchema.partial();
export type UpdateSubinventoryInput = z.infer<typeof updateSubinventorySchema>;

export const transferBetweenSubinventoriesSchema = z.object({
  fromSubinventoryId: z.string().min(1),
  toSubinventoryId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().positive(),
  reference: z.string().optional(),
});
export type TransferBetweenSubinventoriesInput = z.infer<typeof transferBetweenSubinventoriesSchema>;

@Injectable()
export class InventorySubinventoryService {

  async listSubinventories(
    tenantId: string,
    query: { warehouseId?: string; type?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.SubinventoryWhereInput = { tenantId };
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      prisma.subinventory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subinventory.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getSubinventory(tenantId: string, id: string) {
    const record = await prisma.subinventory.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Subinventory not found');
    return record;
  }

  async createSubinventory(tenantId: string, dto: CreateSubinventoryInput) {
    const existing = await prisma.subinventory.findFirst({
      where: { tenantId, warehouseId: dto.warehouseId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Subinventory code '${dto.code}' already exists in this warehouse`);
    }
    return prisma.subinventory.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSubinventory(tenantId: string, id: string, dto: UpdateSubinventoryInput) {
    const record = await prisma.subinventory.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Subinventory not found');

    if (dto.code && dto.code !== record.code) {
      const dup = await prisma.subinventory.findFirst({
        where: { tenantId, warehouseId: dto.warehouseId ?? record.warehouseId, code: dto.code, id: { not: id } },
      });
      if (dup) throw new BadRequestException(`Subinventory code '${dto.code}' already exists`);
    }

    return prisma.subinventory.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.warehouseId !== undefined && { warehouseId: dto.warehouseId }),
      },
    });
  }

  async deleteSubinventory(tenantId: string, id: string) {
    const record = await prisma.subinventory.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('Subinventory not found');
    return prisma.subinventory.update({ where: { id }, data: { isActive: false } });
  }

  async transferStock(tenantId: string, dto: TransferBetweenSubinventoriesInput) {
    if (dto.fromSubinventoryId === dto.toSubinventoryId) {
      throw new BadRequestException('Source and destination subinventories must be different');
    }

    const from = await prisma.subinventory.findFirst({ where: { id: dto.fromSubinventoryId, tenantId } });
    if (!from) throw new NotFoundException('Source subinventory not found');

    const to = await prisma.subinventory.findFirst({ where: { id: dto.toSubinventoryId, tenantId } });
    if (!to) throw new NotFoundException('Destination subinventory not found');

    const entryNumber = `SUBTR-${Date.now()}`;
    const qty = new Prisma.Decimal(dto.quantity);

    return prisma.stockEntry.create({
      data: {
        tenantId,
        orgId: tenantId,
        entryNumber,
        type: 'MATERIAL_TRANSFER',
        purpose: 'SUBINVENTORY_TRANSFER',
        status: 'SUBMITTED',
        fromWarehouseId: from.warehouseId,
        toWarehouseId: to.warehouseId,
        referenceDoc: dto.reference ?? null,
        referenceType: 'SUBINVENTORY_TRANSFER',
        totalValue: new Prisma.Decimal(0),
        submittedAt: new Date(),
        items: {
          create: {
            tenantId,
            productId: dto.productId,
            qty,
            quantity: qty,
            valuationRate: new Prisma.Decimal(0),
            amount: new Prisma.Decimal(0),
          },
        },
      },
      include: { items: true },
    });
  }
}
