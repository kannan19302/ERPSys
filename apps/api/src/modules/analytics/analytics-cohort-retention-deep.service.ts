import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AnalyticsCohortRetentionDeepService {
  async getAnalyses(tenantId: string) {
    return prisma.analyticsCohortAnalysis.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCohortAnalysis(
    tenantId: string,
    dto: { cohortName: string; groupingRule: string; timeGranularity?: string },
  ) {
    return prisma.analyticsCohortAnalysis.create({
      data: {
        tenantId,
        cohortName: dto.cohortName,
        groupingRule: dto.groupingRule,
        timeGranularity: dto.timeGranularity || "MONTHLY",
      },
    });
  }

  async addCohortGroup(
    analysisId: string,
    tenantId: string,
    dto: { cohortDate: string; initialUsers: number; retentionRates?: any },
  ) {
    return prisma.analyticsCohortGroup.create({
      data: {
        analysisId,
        tenantId,
        cohortDate: dto.cohortDate,
        initialUsers: dto.initialUsers,
        retentionRates: dto.retentionRates || {
          month1: 85,
          month2: 72,
          month3: 68,
        },
      },
    });
  }
}
