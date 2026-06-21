import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ActivityFeedService {
  async getActivityFeed(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      entityType?: string;
      userId?: string;
    },
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (options.entityType) {
      where.entityType = options.entityType;
    }
    if (options.userId) {
      where.userId = options.userId;
    }

    const [items, total] = await Promise.all([
      prisma.changeHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.changeHistory.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
