import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AssetMaintenanceService {
  async getMaintenanceSchedules(tenantId: string, query: any = {}) {
    const where: any = { tenantId };
    if (query.assetId) where.assetId = query.assetId;
    if (query.status) where.status = query.status;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.assetMaintenanceSchedule.findMany({
        where,
        orderBy: { scheduledDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.assetMaintenanceSchedule.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createMaintenanceSchedule(tenantId: string, data: any) {
    return prisma.assetMaintenanceSchedule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateMaintenanceSchedule(tenantId: string, id: string, data: any) {
    const existing = await prisma.assetMaintenanceSchedule.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Maintenance schedule not found");
    return prisma.assetMaintenanceSchedule.update({
      where: { id },
      data,
    });
  }
}
