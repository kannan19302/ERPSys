// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmForecastGovernanceService } from "../crm-forecast-governance.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    opportunity: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findMany: vi.fn(), findFirst: vi.fn() },
    salesTarget: { findMany: vi.fn(), findFirst: vi.fn() },
    forecastAdjustment: { create: vi.fn(), findMany: vi.fn() },
    forecastTeamRollup: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";
const emit = vi.fn();
const mockEmitter = {
  emit,
} as unknown as import("@nestjs/event-emitter").EventEmitter2;

describe("CrmForecastGovernanceService", () => {
  let service: CrmForecastGovernanceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmForecastGovernanceService(mockEmitter);
  });

  describe("getForecastCategories", () => {
    it("returns categorized pipeline deals with summary", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { probability: 90, amount: 100000 },
        { probability: 70, amount: 50000 },
        { probability: 30, amount: 25000 },
        { probability: 10, amount: 10000 },
      ]);

      const result = await service.getForecastCategories(TENANT);

      expect(result.categories).toHaveLength(4);
      const commit = result.categories.find((c) => c.category === "Commit");
      expect(commit?.totalAmount).toBe(100000);
      expect(result.summary.totalCommit).toBe(100000);
      expect(result.summary.totalPipeline).toBe(185000);
    });

    it("returns empty categories when no open deals", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.getForecastCategories(TENANT);

      expect(result.categories.every((c) => c.dealCount === 0)).toBe(true);
      expect(result.summary.totalPipeline).toBe(0);
    });
  });

  describe("getManagerForecastRollup", () => {
    it("returns team forecast rollup with totals", async () => {
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "user-1", firstName: "Alice", lastName: "A" },
        { id: "user-2", firstName: "Bob", lastName: "B" },
      ]);
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { assignedToId: "user-1", probability: 90, amount: 100000 },
        { assignedToId: "user-1", probability: 70, amount: 50000 },
        { assignedToId: "user-2", probability: 85, amount: 75000 },
      ]);
      (
        prisma.salesTarget.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { userId: "user-1", target: 200000 },
        { userId: "user-2", target: 150000 },
      ]);

      const result = await service.getManagerForecastRollup(
        TENANT,
        "manager-1",
        "2026-Q3",
      );

      expect(result.team).toHaveLength(2);
      expect(result.totals.commit).toBe(175000);
      expect(result.totals.quota).toBe(350000);
    });

    it("returns empty when manager has no team", async () => {
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.getManagerForecastRollup(
        TENANT,
        "manager-1",
      );

      expect(result.team).toHaveLength(0);
      expect(result.totals.commit).toBe(0);
    });
  });

  describe("adjustForecast", () => {
    it("creates adjustment record and emits event", async () => {
      (
        prisma.forecastAdjustment.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "adj-1" });

      const result = await service.adjustForecast(TENANT, ORG, {
        forecastId: "forecast-1",
        category: "COMMIT",
        previousAmount: 100000,
        adjustedAmount: 120000,
        adjustedBy: "manager-1",
        reason: "Updated forecast",
      });

      expect(prisma.forecastAdjustment.create).toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(
        "crm.forecast.adjusted",
        expect.objectContaining({ forecastId: "forecast-1" }),
      );
      expect(result.id).toBe("adj-1");
    });
  });

  describe("getForecastAdjustments", () => {
    it("returns adjustment history ordered by date desc", async () => {
      (
        prisma.forecastAdjustment.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: "adj-1", previousAmount: 100000, adjustedAmount: 120000 },
      ]);

      const result = await service.getForecastAdjustments(TENANT, "forecast-1");

      expect(prisma.forecastAdjustment.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, forecastId: "forecast-1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("createTeamRollup", () => {
    it("creates rollup with calculated attainment percentage", async () => {
      (
        prisma.forecastTeamRollup.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "rollup-1" });

      const result = await service.createTeamRollup(TENANT, {
        managerId: "manager-1",
        period: "2026-Q3",
        teamMembers: [{ userId: "user-1", name: "Alice" }],
        totalCommit: 200000,
        totalBestCase: 300000,
        totalPipeline: 500000,
        totalQuota: 400000,
      });

      expect(prisma.forecastTeamRollup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ attainmentPct: 50 }),
        }),
      );
      expect(result.id).toBe("rollup-1");
    });
  });

  describe("getPipelineCoverage", () => {
    it("calculates overall and per-rep coverage ratios", async () => {
      (
        prisma.salesTarget.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ userId: "user-1", target: 100000 }]);
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ assignedToId: "user-1", amount: 250000 }]);
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "user-1", firstName: "Alice", lastName: "A" },
      ]);

      const result = await service.getPipelineCoverage(TENANT);

      expect(result.overallCoverage).toBe(2.5);
      expect(result.coverageByRep[0].coverage).toBe(2.5);
      expect(result.totalPipeline).toBe(250000);
    });
  });

  describe("getForecastTrend", () => {
    it("returns multi-period trend data", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.getForecastTrend(TENANT, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("period");
      expect(result[0]).toHaveProperty("commit");
      expect(result[0]).toHaveProperty("pipeline");
      expect(result[0]).toHaveProperty("closedWon");
    });
  });

  describe("getCommitVsQuota", () => {
    it("compares commit attainment against quota", async () => {
      (
        prisma.salesTarget.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ userId: "user-1", target: 100000 }]);
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { assignedToId: "user-1", probability: 90, amount: 80000 },
        ])
        .mockResolvedValueOnce([]);
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "user-1", firstName: "Alice", lastName: "A" },
      ]);

      const result = await service.getCommitVsQuota(TENANT);

      expect(result.results[0].commit).toBe(80000);
      expect(result.results[0].quota).toBe(100000);
      expect(result.totals.gap).toBe(20000);
    });
  });
});
