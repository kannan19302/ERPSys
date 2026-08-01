import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    analyticsPredictiveModel: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    analyticsForecastRun: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { AnalyticsPredictiveEngineDeepService } from "../analytics-predictive-engine-deep.service";

describe("AnalyticsPredictiveEngineDeepService", () => {
  let service: AnalyticsPredictiveEngineDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsPredictiveEngineDeepService],
    }).compile();

    service = module.get<AnalyticsPredictiveEngineDeepService>(
      AnalyticsPredictiveEngineDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("trainModel", () => {
    it("should train predictive model and return accuracy score", async () => {
      const mockResult = {
        id: "pm-1",
        modelName: "Revenue Forecast Model",
        accuracyScore: 94.5,
      };
      (prisma.analyticsPredictiveModel.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.trainModel("t1", {
        modelName: "Revenue Forecast Model",
        algorithm: "RANDOM_FOREST",
        targetMetric: "REVENUE",
      });
      expect(res.accuracyScore).toBe(94.5);
    });
  });
});
