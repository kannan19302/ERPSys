// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    analyticsCustomDashboard: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    analyticsDashboardWidgetDeep: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { AnalyticsCustomDashboardsDeepService } from "../analytics-custom-dashboards-deep.service";

describe("AnalyticsCustomDashboardsDeepService", () => {
  let service: AnalyticsCustomDashboardsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsCustomDashboardsDeepService],
    }).compile();

    service = module.get<AnalyticsCustomDashboardsDeepService>(
      AnalyticsCustomDashboardsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createDashboard", () => {
    it("should create custom analytics dashboard", async () => {
      const mockResult = { id: "dash-1", name: "Executive KPI Dashboard" };
      (prisma.analyticsCustomDashboard.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createDashboard("t1", "u1", {
        name: "Executive KPI Dashboard",
      });
      expect(res.name).toBe("Executive KPI Dashboard");
    });
  });
});
