// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetUtilizationService {
  async getMetrics(tenantId: string, assetId: string, metricType?: string) {
    const where: Prisma.FixedAssetUtilizationMetricWhereInput = {
      tenantId,
      assetId,
    };
    if (metricType) where.metricType = metricType;
    return prisma.fixedAssetUtilizationMetric.findMany({
      where,
      orderBy: { metricDate: "desc" },
      take: 100,
    });
  }

  async recordMetric(
    tenantId: string,
    assetId: string,
    dto: {
      metricDate: string;
      metricType: string;
      value: number;
      unit?: string;
      recordedBy?: string;
      notes?: string;
    },
  ) {
    return prisma.fixedAssetUtilizationMetric.create({
      data: {
        tenantId,
        assetId,
        ...dto,
        metricDate: new Date(dto.metricDate),
        unit: dto.unit || "PERCENT",
      },
    });
  }

  async getAssetUtilizationSummary(tenantId: string, assetId: string) {
    const metrics = await prisma.fixedAssetUtilizationMetric.findMany({
      where: { tenantId, assetId },
    });
    const byType: Record<
      string,
      { count: number; avg: number; max: number; min: number }
    > = {};
    for (const m of metrics) {
      const t = m.metricType;
      if (!byType[t])
        byType[t] = { count: 0, avg: 0, max: -Infinity, min: Infinity };
      const val = Number(m.value);
      const entry = byType[t]!;
      entry.count++;
      entry.avg += val;
      entry.max = Math.max(entry.max, val);
      entry.min = Math.min(entry.min, val);
    }
    for (const key of Object.keys(byType)) {
      const entry = byType[key]!;
      entry.avg =
        entry.count > 0 ? Math.round((entry.avg / entry.count) * 100) / 100 : 0;
      if (entry.max === -Infinity) entry.max = 0;
      if (entry.min === Infinity) entry.min = 0;
    }
    return { assetId, metricsByType: byType, totalRecords: metrics.length };
  }
}
