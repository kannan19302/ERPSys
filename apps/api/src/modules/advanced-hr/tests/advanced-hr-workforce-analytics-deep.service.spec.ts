import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrWorkforceAnalyticsDeep: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { AdvancedHrWorkforceAnalyticsDeepService } from "../advanced-hr-workforce-analytics-deep.service";

describe("AdvancedHrWorkforceAnalyticsDeepService", () => {
  let service: AdvancedHrWorkforceAnalyticsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrWorkforceAnalyticsDeepService],
    }).compile();
    service = module.get<AdvancedHrWorkforceAnalyticsDeepService>(
      AdvancedHrWorkforceAnalyticsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should generate workforce snapshot", async () => {
    (prisma.advancedHrWorkforceAnalyticsDeep.create as any).mockResolvedValue({
      id: "ws-1",
      headcount: 847,
    });
    const res = await service.generateSnapshot("t1", {
      reportingPeriod: "Q3-2026",
      headcount: 847,
      attritionRate: 4.2,
      avgTenureYears: 3.8,
      engagementScore: 78.5,
    });
    expect(res.headcount).toBe(847);
  });
});
