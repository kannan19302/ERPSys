import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class ReportingColumnPreferencesService {
  async getPreferences(tenantId: string, userId: string, reportId: string) {
    return prisma.reportColumnPreference.findMany({
      where: { tenantId, userId, reportId },
    });
  }

  async upsertPreferences(
    tenantId: string,
    userId: string,
    reportId: string,
    columns: Array<{
      field: string;
      label?: string;
      visible?: boolean;
      width?: number;
      sortOrder?: number;
      pinned?: string;
    }>,
  ) {
    await prisma.reportColumnPreference.deleteMany({
      where: { tenantId, userId, reportId },
    });
    return prisma.reportColumnPreference.create({
      data: {
        tenantId,
        userId,
        reportId,
        columnConfig: columns as Prisma.InputJsonValue,
      },
    });
  }

  async resetPreferences(tenantId: string, userId: string, reportId: string) {
    await prisma.reportColumnPreference.deleteMany({
      where: { tenantId, userId, reportId },
    });
    return { success: true };
  }
}
