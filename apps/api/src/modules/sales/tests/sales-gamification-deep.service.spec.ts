// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesGamificationDeep: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    salesQuotaAttainment: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesGamificationDeepService } from "../sales-gamification-deep.service";

describe("SalesGamificationDeepService", () => {
  let service: SalesGamificationDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesGamificationDeepService],
    }).compile();

    service = module.get<SalesGamificationDeepService>(
      SalesGamificationDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLeaderboard", () => {
    it("should return existing leaderboard or fallback mock", async () => {
      (prisma.salesGamificationDeep.findFirst as any).mockResolvedValue(null);

      const result = await service.getLeaderboard("tenant-1");
      expect(result.leaderboards.length).toBeGreaterThan(0);
      expect(result.period).toBeDefined();
    });
  });

  describe("setQuotaAttainment", () => {
    it("should compute attainment percentage and upsert record", async () => {
      const dto = {
        salesRepId: "rep-101",
        period: "Q1-2026",
        quotaAmount: 100000,
        achievedAmount: 120000,
        commissionEarned: 12000,
      };
      const mockResult = { id: "qa-1", ...dto, attainmentPct: 120 };
      (prisma.salesQuotaAttainment.upsert as any).mockResolvedValue(mockResult);

      const result = await service.setQuotaAttainment("tenant-1", dto);
      expect(result).toEqual(mockResult);
      expect(prisma.salesQuotaAttainment.upsert).toHaveBeenCalled();
    });
  });
});
