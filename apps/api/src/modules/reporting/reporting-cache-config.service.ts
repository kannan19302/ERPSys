import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingCacheConfigService {
  async getConfig(tenantId: string, reportId: string) {
    const cfg = await prisma.reportCacheConfig.findUnique({
      where: { tenantId_reportId: { tenantId, reportId } },
    });
    return (
      cfg || {
        ttlMinutes: 60,
        invalidateOnUpdate: true,
        lastCachedAt: null,
        cacheSizeBytes: 0,
      }
    );
  }

  async upsertConfig(
    tenantId: string,
    reportId: string,
    dto: { ttlMinutes?: number; invalidateOnUpdate?: boolean },
  ) {
    return prisma.reportCacheConfig.upsert({
      where: { tenantId_reportId: { tenantId, reportId } },
      create: {
        tenantId,
        reportId,
        ttlMinutes: dto.ttlMinutes ?? 60,
        invalidateOnUpdate: dto.invalidateOnUpdate ?? true,
      },
      update: {
        ttlMinutes: dto.ttlMinutes,
        invalidateOnUpdate: dto.invalidateOnUpdate,
      },
    });
  }

  async invalidateCache(tenantId: string, reportId: string) {
    const cfg = await prisma.reportCacheConfig.findUnique({
      where: { tenantId_reportId: { tenantId, reportId } },
    });
    if (!cfg) throw new NotFoundException("Cache config not found");
    return prisma.reportCacheConfig.update({
      where: { id: cfg.id },
      data: { lastCachedAt: null, cacheSizeBytes: 0 },
    });
  }
}
