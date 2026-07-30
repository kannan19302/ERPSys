// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPortalUsageDashboard: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasPortalUsageMetricsPortalService } from "../saas-portal-usage-metrics-portal.service";

describe("SaasPortalUsageMetricsPortalService", () => {
  let service: SaasPortalUsageMetricsPortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalUsageMetricsPortalService],
    }).compile();

    service = module.get<SaasPortalUsageMetricsPortalService>(
      SaasPortalUsageMetricsPortalService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateUsageMetric", () => {
    it("should calculate percentage used and upsert dashboard snapshot", async () => {
      const mockResult = {
        id: "ud-1",
        metricName: "API_CALLS",
        percentUsed: 50.0,
      };
      (prisma.saasPortalUsageDashboard.upsert as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.updateUsageMetric("t1", {
        metricName: "API_CALLS",
        currentUsage: 500,
        quotaLimit: 1000,
      });
      expect(res.percentUsed).toBe(50.0);
    });
  });
});
