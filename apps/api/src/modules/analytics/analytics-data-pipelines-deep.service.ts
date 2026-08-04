import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AnalyticsDataPipelinesDeepService {
  async getPipelines(tenantId: string) {
    return prisma.analyticsDataPipeline.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPipeline(
    tenantId: string,
    dto: {
      pipelineName: string;
      sourceDatasetId: string;
      targetDatasetId: string;
      transformationSql?: string;
    },
  ) {
    return prisma.analyticsDataPipeline.create({
      data: {
        tenantId,
        pipelineName: dto.pipelineName,
        sourceDatasetId: dto.sourceDatasetId,
        targetDatasetId: dto.targetDatasetId,
        transformationSql: dto.transformationSql,
        status: "ACTIVE",
      },
    });
  }

  async runPipeline(id: string) {
    return prisma.analyticsDataPipeline.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
      },
    });
  }
}
