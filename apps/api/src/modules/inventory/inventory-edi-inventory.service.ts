import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const createEdiTransactionSchema = z.object({
  transactionId: z.string().min(1),
  ediType: z.enum(['846', '856', '850']),
  direction: z.enum(['INBOUND', 'OUTBOUND']).default('INBOUND'),
  senderId: z.string().optional(),
  receiverId: z.string().optional(),
  payload: z.any().default({}),
  rawData: z.string().optional(),
  status: z.string().optional(),
});
export type CreateEdiTransactionInput = z.infer<typeof createEdiTransactionSchema>;

export const updateEdiStatusSchema = z.object({
  status: z.enum(['RECEIVED', 'PROCESSED', 'ERROR', 'ACKNOWLEDGED']),
  errorMessage: z.string().optional(),
});
export type UpdateEdiStatusInput = z.infer<typeof updateEdiStatusSchema>;

@Injectable()
export class InventoryEdiInventoryService {

  async listTransactions(
    tenantId: string,
    query: { ediType?: string; direction?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, query.limit ?? 20);
    const where: Prisma.EdiInventoryTransactionWhereInput = { tenantId };
    if (query.ediType) where.ediType = query.ediType;
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.ediInventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ediInventoryTransaction.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getTransaction(tenantId: string, id: string) {
    const record = await prisma.ediInventoryTransaction.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('EDI transaction not found');
    return record;
  }

  async createTransaction(tenantId: string, dto: CreateEdiTransactionInput) {
    const existing = await prisma.ediInventoryTransaction.findFirst({
      where: { tenantId, transactionId: dto.transactionId },
    });
    if (existing) throw new NotFoundException(`Transaction '${dto.transactionId}' already exists`);

    return prisma.ediInventoryTransaction.create({
      data: {
        tenantId,
        transactionId: dto.transactionId,
        ediType: dto.ediType,
        direction: dto.direction,
        senderId: dto.senderId ?? null,
        receiverId: dto.receiverId ?? null,
        payload: dto.payload ?? {},
        rawData: dto.rawData ?? null,
        status: dto.status ?? 'RECEIVED',
      },
    });
  }

  async updateTransactionStatus(tenantId: string, id: string, status: string, errorMessage?: string) {
    const record = await prisma.ediInventoryTransaction.findFirst({ where: { id, tenantId } });
    if (!record) throw new NotFoundException('EDI transaction not found');

    return prisma.ediInventoryTransaction.update({
      where: { id },
      data: {
        status,
        errorMessage: errorMessage ?? null,
        processedAt: status === 'PROCESSED' ? new Date() : record.processedAt,
      },
    });
  }

  async getEdiDashboard(tenantId: string) {
    const [byType, byDirection, byStatus] = await Promise.all([
      prisma.ediInventoryTransaction.groupBy({
        by: ['ediType'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.ediInventoryTransaction.groupBy({
        by: ['direction'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.ediInventoryTransaction.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    return {
      total: byType.reduce((sum, r) => sum + r._count._all, 0),
      byType: byType.map((r) => ({ ediType: r.ediType, count: r._count._all })),
      byDirection: byDirection.map((r) => ({ direction: r.direction, count: r._count._all })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
    };
  }
}
