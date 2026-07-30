// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPortalSubscriptionUpgrade: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    saasPortalPlanDowngradeReason: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasPortalSubscriptionTierEngineService } from "../saas-portal-subscription-tier-engine.service";

describe("SaasPortalSubscriptionTierEngineService", () => {
  let service: SaasPortalSubscriptionTierEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalSubscriptionTierEngineService],
    }).compile();

    service = module.get<SaasPortalSubscriptionTierEngineService>(
      SaasPortalSubscriptionTierEngineService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("upgradePlan", () => {
    it("should create plan upgrade record", async () => {
      const mockResult = {
        id: "up-1",
        fromTier: "STARTER",
        toTier: "ENTERPRISE",
        proratedCharge: 199,
      };
      (prisma.saasPortalSubscriptionUpgrade.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.upgradePlan("t1", {
        fromTier: "STARTER",
        toTier: "ENTERPRISE",
        proratedCharge: 199,
      });
      expect(res.toTier).toBe("ENTERPRISE");
    });
  });
});
