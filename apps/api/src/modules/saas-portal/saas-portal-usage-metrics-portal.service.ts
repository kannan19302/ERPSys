import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalUsageMetricsPortalService {
  async getUsageDashboard(tenantId: string, period?: string) {
    const activePeriod = period || new Date().toISOString().slice(0, 7);

    return prisma.saasPortalUsageDashboard.findMany({
      where: { tenantId, period: activePeriod },
    });
  }

  async updateUsageMetric(tenantId: string, dto: any) {
    const period = dto.period || new Date().toISOString().slice(0, 7);
    const currentUsage = BigInt(dto.currentUsage || 0);
    const quotaLimit = BigInt(dto.quotaLimit || 1000);
    const percentUsed = Number(
      (Number(currentUsage) / Number(quotaLimit)) * 100,
    ).toFixed(2);

    return prisma.saasPortalUsageDashboard.upsert({
      where: {
        tenantId_metricName_period: {
          tenantId,
          metricName: dto.metricName,
          period,
        },
      },
      create: {
        tenantId,
        metricName: dto.metricName,
        currentUsage,
        quotaLimit,
        percentUsed,
        period,
      },
      update: {
        currentUsage,
        quotaLimit,
        percentUsed,
      },
    });
  }
}
