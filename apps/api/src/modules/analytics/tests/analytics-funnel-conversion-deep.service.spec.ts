import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    analyticsFunnelConversion: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    analyticsFunnelStep: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { AnalyticsFunnelConversionDeepService } from "../analytics-funnel-conversion-deep.service";

describe("AnalyticsFunnelConversionDeepService", () => {
  let service: AnalyticsFunnelConversionDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsFunnelConversionDeepService],
    }).compile();

    service = module.get<AnalyticsFunnelConversionDeepService>(
      AnalyticsFunnelConversionDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("computeFunnelConversion", () => {
    it("should calculate dropoff and record funnel conversion", async () => {
      const mockResult = {
        id: "fc-1",
        funnelName: "User Onboarding",
        overallDropoff: 88.0,
      };
      (prisma.analyticsFunnelConversion.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.computeFunnelConversion("t1", {
        funnelName: "User Onboarding",
      });
      expect(res.overallDropoff).toBe(88.0);
    });
  });
});
