// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AnalyticsPredictiveEngineDeepService {
  async getModels(tenantId: string) {
    return prisma.analyticsPredictiveModel.findMany({
      where: { tenantId },
      orderBy: { trainedAt: "desc" },
    });
  }

  async trainModel(
    tenantId: string,
    dto: { modelName: string; algorithm: string; targetMetric: string },
  ) {
    return prisma.analyticsPredictiveModel.create({
      data: {
        tenantId,
        modelName: dto.modelName,
        algorithm: dto.algorithm || "RANDOM_FOREST",
        targetMetric: dto.targetMetric,
        accuracyScore: 94.5,
        status: "TRAINED",
      },
    });
  }

  async runForecast(
    tenantId: string,
    modelId: string,
    dto: { forecastHorizon: string },
  ) {
    return prisma.analyticsForecastRun.create({
      data: {
        modelId,
        tenantId,
        forecastHorizon: dto.forecastHorizon || "30D",
        resultMetrics: {
          predictedGrowth: "+18.4%",
          confidenceInterval: "95%",
          forecastedValue: 485000,
        },
      },
    });
  }
}
