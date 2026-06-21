import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class RecycleBinService {
  async getItems(tenantId: string, entityType?: string, page = 1, limit = 20) {
    const where = {
      tenantId,
      restored: false,
      ...(entityType && { entityType }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.recycleBinItem.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recycleBinItem.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async restoreItem(tenantId: string, id: string, userId: string) {
    const item = await prisma.recycleBinItem.update({
      where: { id, tenantId },
      data: {
        restored: true,
        restoredAt: new Date(),
        restoredBy: userId,
      },
    });

    return item;
  }

  async permanentDelete(tenantId: string, id: string) {
    return prisma.recycleBinItem.delete({
      where: { id, tenantId },
    });
  }

  async purgeAll(tenantId: string, entityType?: string) {
    return prisma.recycleBinItem.deleteMany({
      where: {
        tenantId,
        restored: false,
        ...(entityType && { entityType }),
      },
    });
  }

  async getStats(tenantId: string) {
    const items = await prisma.recycleBinItem.groupBy({
      by: ['entityType'],
      where: { tenantId, restored: false },
      _count: { id: true },
    });

    return items.map((item) => ({
      entityType: item.entityType,
      count: item._count.id,
    }));
  }
}
