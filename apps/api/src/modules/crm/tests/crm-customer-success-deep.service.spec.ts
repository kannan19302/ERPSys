import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException } from "@nestjs/common";
import { CrmCustomerSuccessDeepService } from "../services/crm-customer-success-deep.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    customerHealthLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    healthScoreConfig: {
      findFirst: vi.fn(),
    },
    npsAnalytic: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    customerSuccessPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customerSuccessMilestone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    npsResponse: {
      findMany: vi.fn(),
    },
    renewalRiskPrediction: {
      findMany: vi.fn(),
    },
    churnAnalysis: {
      findMany: vi.fn(),
    },
    expansionRevenue: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";

describe("CrmCustomerSuccessDeepService", () => {
  let service: CrmCustomerSuccessDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCustomerSuccessDeepService();
  });

  describe("listHealthScores", () => {
    it("returns health scores for a tenant", async () => {
      const mockScores = [
        {
          id: "hs-1",
          tenantId: TENANT,
          customerId: "c-1",
          score: 85,
          status: "GREEN",
        },
        {
          id: "hs-2",
          tenantId: TENANT,
          customerId: "c-2",
          score: 45,
          status: "YELLOW",
        },
      ];
      (
        prisma.customerHealthLog.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockScores);

      const result = await service.listHealthScores(TENANT);

      expect(result).toEqual(mockScores);
      expect(prisma.customerHealthLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });

    it("filters by customerId when provided", async () => {
      (
        prisma.customerHealthLog.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      await service.listHealthScores(TENANT, "c-1");

      expect(prisma.customerHealthLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, customerId: "c-1" },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    });

    it("returns empty array when no health scores exist", async () => {
      (
        prisma.customerHealthLog.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.listHealthScores(TENANT);

      expect(result).toEqual([]);
    });
  });

  describe("getHealthScore", () => {
    it("returns the health score when found", async () => {
      const mockScore = { id: "hs-1", tenantId: TENANT, score: 90 };
      (
        prisma.customerHealthLog.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockScore);

      const result = await service.getHealthScore(TENANT, "hs-1");

      expect(result).toEqual(mockScore);
    });

    it("throws NotFoundException when not found", async () => {
      (
        prisma.customerHealthLog.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      await expect(
        service.getHealthScore(TENANT, "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createSuccessPlan", () => {
    it("creates a success plan with provided data", async () => {
      const mockPlan = {
        id: "plan-1",
        tenantId: TENANT,
        customerId: "c-1",
        name: "Q3 Retention Plan",
        status: "ACTIVE",
      };
      (
        prisma.customerSuccessPlan.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockPlan);

      const data = {
        customerId: "c-1",
        name: "Q3 Retention Plan",
      };

      const result = await service.createSuccessPlan(TENANT, data, "user-1");

      expect(result).toEqual(mockPlan);
      expect(prisma.customerSuccessPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          customerId: "c-1",
          name: "Q3 Retention Plan",
          status: "ACTIVE",
          ownerId: "user-1",
        }),
      });
    });
  });

  describe("getNpsAnalytics", () => {
    it("returns aggregated NPS analytics", async () => {
      const mockAnalytics = [
        {
          id: "a-1",
          tenantId: TENANT,
          surveyId: "s-1",
          totalSent: 100,
          totalResponses: 60,
          detractors: 10,
          passives: 20,
          promoters: 30,
          npsScore: 33.33,
          responseRate: 60,
          computedAt: new Date("2026-07-01"),
        },
      ];
      (
        prisma.npsAnalytic.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockAnalytics);

      const result = await service.getNpsAnalytics(TENANT);

      expect(result.totalSent).toBe(100);
      expect(result.totalResponses).toBe(60);
      expect(result.npsScore).toBe(33.33);
      expect(result.trend).toHaveLength(1);
      expect(result.trend[0].npsScore).toBe(33.33);
    });

    it("returns zeroed stats when no analytics exist", async () => {
      (
        prisma.npsAnalytic.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.getNpsAnalytics(TENANT);

      expect(result.totalSent).toBe(0);
      expect(result.npsScore).toBe(0);
      expect(result.trend).toEqual([]);
    });
  });
});
