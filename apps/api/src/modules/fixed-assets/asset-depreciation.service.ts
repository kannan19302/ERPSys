import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AssetDepreciationService {
  async getSchedules(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;
    if (query.period) where.period = query.period;
    if (query.isPosted !== undefined)
      where.isPosted = query.isPosted === "true";
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.assetDepreciationSchedule.findMany({
        where,
        orderBy: { period: "desc" },
        skip,
        take: limit,
      }),
      prisma.assetDepreciationSchedule.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createSchedule(tenantId: string, data: any) {
    return prisma.assetDepreciationSchedule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async postSchedule(tenantId: string, id: string) {
    const existing = await prisma.assetDepreciationSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Depreciation schedule entry not found");
    return prisma.assetDepreciationSchedule.update({
      where: { id },
      data: {
        isPosted: true,
        postedAt: new Date(),
      },
    });
  }
}
