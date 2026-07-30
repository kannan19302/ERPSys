// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    analyticsDataPipeline: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { AnalyticsDataPipelinesDeepService } from "../analytics-data-pipelines-deep.service";

describe("AnalyticsDataPipelinesDeepService", () => {
  let service: AnalyticsDataPipelinesDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsDataPipelinesDeepService],
    }).compile();

    service = module.get<AnalyticsDataPipelinesDeepService>(
      AnalyticsDataPipelinesDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createPipeline", () => {
    it("should create analytics ETL pipeline", async () => {
      const mockResult = { id: "pipe-1", pipelineName: "Sales ETL Pipeline" };
      (prisma.analyticsDataPipeline.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createPipeline("t1", {
        pipelineName: "Sales ETL Pipeline",
        sourceDatasetId: "ds1",
        targetDatasetId: "ds2",
      });
      expect(res.pipelineName).toBe("Sales ETL Pipeline");
    });
  });
});
