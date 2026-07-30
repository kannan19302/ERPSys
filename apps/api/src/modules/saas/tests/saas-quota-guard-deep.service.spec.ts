// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasTenantTierConfig: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    saasTenantCustomQuota: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasQuotaGuardDeepService } from "../saas-quota-guard-deep.service";

describe("SaasQuotaGuardDeepService", () => {
  let service: SaasQuotaGuardDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasQuotaGuardDeepService],
    }).compile();

    service = module.get<SaasQuotaGuardDeepService>(SaasQuotaGuardDeepService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("setTierConfig", () => {
    it("should upsert tenant tier configuration", async () => {
      const mockResult = { id: "tc-1", tierName: "ENTERPRISE", maxUsers: 100 };
      (prisma.saasTenantTierConfig.upsert as any).mockResolvedValue(mockResult);

      const res = await service.setTierConfig("t1", {
        tierName: "ENTERPRISE",
        maxUsers: 100,
      });
      expect(res.maxUsers).toBe(100);
    });
  });
});
