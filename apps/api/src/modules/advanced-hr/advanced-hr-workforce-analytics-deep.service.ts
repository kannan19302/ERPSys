// @ts-nocheck
import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AdvancedHrWorkforceAnalyticsDeepService {
  async getAnalytics(tenantId: string) {
    return prisma.advancedHrWorkforceAnalyticsDeep.findMany({
      where: { tenantId },
      orderBy: { calculatedAt: "desc" },
      take: 12,
    });
  }

  async generateSnapshot(
    tenantId: string,
    dto: {
      reportingPeriod: string;
      headcount: number;
      attritionRate: number;
      avgTenureYears: number;
      engagementScore: number;
    },
  ) {
    return prisma.advancedHrWorkforceAnalyticsDeep.create({
      data: {
        tenantId,
        reportingPeriod: dto.reportingPeriod,
        headcount: dto.headcount,
        attritionRate: dto.attritionRate,
        avgTenureYears: dto.avgTenureYears,
        engagementScore: dto.engagementScore,
      },
    });
  }
}
