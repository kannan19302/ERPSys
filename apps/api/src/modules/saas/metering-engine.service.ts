import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasMeteringEngineDeepService {
  async getMeteringRules(tenantId: string) {
    return prisma.saasMeteringRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createMeteringRule(tenantId: string, dto: any) {
    return prisma.saasMeteringRule.create({
      data: {
        tenantId,
        metricCode: dto.metricCode,
        unitPrice: dto.unitPrice,
        currency: dto.currency || "USD",
        aggregationType: dto.aggregationType || "SUM",
        freeTierAllowance: dto.freeTierAllowance || 0,
      },
    });
  }

  async processUsageBatch(
    tenantId: string,
    dto: { batchRef: string; events: any[] },
  ) {
    const batchRef = dto.batchRef || `BATCH-${Date.now()}`;

    return prisma.saasUsageEventBatch.create({
      data: {
        tenantId,
        batchRef,
        eventCount: dto.events.length,
        processedCount: dto.events.length,
        status: "COMPLETED",
        payload: dto.events,
        processedAt: new Date(),
      },
    });
  }

  async getBatchHistory(tenantId: string) {
    return prisma.saasUsageEventBatch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
