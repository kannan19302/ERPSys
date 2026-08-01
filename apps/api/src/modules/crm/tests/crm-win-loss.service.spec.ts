import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmWinLossService } from "../crm-win-loss.service";
import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

vi.mock("@unerp/database", () => ({
  prisma: {
    winLossReason: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    competitor: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    opportunity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";

describe("CrmWinLossService", () => {
  let service: CrmWinLossService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmWinLossService();
  });

  describe("getReasons", () => {
    it("returns all reasons when no category filter", async () => {
      (prisma.winLossReason.findMany as any).mockResolvedValue([
        { id: "r1", name: "Price", category: "LOST_REASON" },
      ]);
      const results = await service.getReasons(TENANT);
      expect(results).toHaveLength(1);
    });

    it("filters by category when provided", async () => {
      (prisma.winLossReason.findMany as any).mockResolvedValue([]);
      await service.getReasons(TENANT, "WON_REASON");
      expect(prisma.winLossReason.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: "WON_REASON" }),
        }),
      );
    });
  });

  describe("createReason", () => {
    it("creates a win/loss reason", async () => {
      const dto = {
        category: "WON_REASON" as const,
        name: "Product Fit",
        sortOrder: 1,
        isActive: true,
      };
      (prisma.winLossReason.create as any).mockResolvedValue({
        id: "r1",
        ...dto,
      });
      const result = await service.createReason(TENANT, "org-1", dto);
      expect(result.id).toBe("r1");
    });
  });

  describe("updateReason", () => {
    it("throws NotFoundException when reason not found", async () => {
      (prisma.winLossReason.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateReason(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteReason", () => {
    it("soft-deletes a reason", async () => {
      (prisma.winLossReason.findFirst as any).mockResolvedValue({ id: "r1" });
      (prisma.winLossReason.update as any).mockResolvedValue({
        id: "r1",
        deletedAt: new Date(),
      });
      const result = await service.deleteReason(TENANT, "r1");
      expect(prisma.winLossReason.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("getCompetitors", () => {
    it("returns active competitors sorted by name", async () => {
      (prisma.competitor.findMany as any).mockResolvedValue([
        { id: "c1", name: "Acme Corp" },
      ]);
      const results = await service.getCompetitors(TENANT);
      expect(results).toHaveLength(1);
    });
  });

  describe("createCompetitor", () => {
    it("creates a competitor record", async () => {
      const dto = {
        name: "Globex",
        strengths: [],
        weaknesses: [],
        isActive: true,
      };
      (prisma.competitor.create as any).mockResolvedValue({ id: "c1", ...dto });
      const result = await service.createCompetitor(TENANT, "org-1", dto);
      expect(result.name).toBe("Globex");
    });
  });

  describe("getCompetitor", () => {
    it("throws NotFoundException when competitor not found", async () => {
      (prisma.competitor.findFirst as any).mockResolvedValue(null);
      await expect(service.getCompetitor(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("recordWinLoss", () => {
    it("throws NotFoundException when opportunity not found", async () => {
      (prisma.opportunity.findFirst as any).mockResolvedValue(null);
      await expect(
        service.recordWinLoss(TENANT, { opportunityId: "opp-1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("sets stage to Closed Won when winLossReasonId present", async () => {
      (prisma.opportunity.findFirst as any).mockResolvedValue({
        id: "opp-1",
        stage: "NEGOTIATION",
      });
      (prisma.opportunity.update as any).mockResolvedValue({});
      await service.recordWinLoss(TENANT, {
        opportunityId: "opp-1",
        winLossReasonId: "r-1",
        notes: "Great deal",
      });
      expect(prisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: "Closed Won",
            actualCloseDate: expect.any(Date),
          }),
        }),
      );
    });

    it("sets stage to Closed Lost when no winLossReasonId", async () => {
      (prisma.opportunity.findFirst as any).mockResolvedValue({
        id: "opp-2",
        stage: "NEGOTIATION",
      });
      (prisma.opportunity.update as any).mockResolvedValue({});
      await service.recordWinLoss(TENANT, {
        opportunityId: "opp-2",
        competitorId: "c-1",
      });
      expect(prisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ stage: "Closed Lost" }),
        }),
      );
    });
  });

  describe("getWinLossAnalytics", () => {
    it("computes win rate and breakdowns", async () => {
      (prisma.winLossReason.findMany as any).mockResolvedValue([
        {
          id: "r1",
          name: "Product Fit",
          category: "WON_REASON",
          isActive: true,
          sortOrder: 0,
          tenantId: TENANT,
          deletedAt: null,
        },
      ]);
      (prisma.competitor.findMany as any).mockResolvedValue([
        {
          id: "c1",
          name: "Acme",
          strengths: [],
          weaknesses: [],
          isActive: true,
          tenantId: TENANT,
          deletedAt: null,
        },
      ]);
      (prisma.opportunity.findMany as any).mockResolvedValue([
        {
          id: "o1",
          stage: "Closed Won",
          amount: new Prisma.Decimal(10000),
          winLossReasonId: "r1",
          competitorId: null,
          assignedToId: "u1",
          actualCloseDate: new Date(),
        },
        {
          id: "o2",
          stage: "Closed Won",
          amount: new Prisma.Decimal(5000),
          winLossReasonId: "r1",
          competitorId: "c1",
          assignedToId: "u1",
          actualCloseDate: new Date(),
        },
        {
          id: "o3",
          stage: "Closed Lost",
          amount: new Prisma.Decimal(3000),
          winLossReasonId: null,
          competitorId: "c1",
          assignedToId: "u2",
          actualCloseDate: new Date(),
        },
      ]);
      const analytics = await service.getWinLossAnalytics(TENANT);
      expect(analytics.total).toBe(3);
      expect(analytics.won).toBe(2);
      expect(analytics.winRate).toBeCloseTo(66.67, 0);
      expect(analytics.totalWonValue).toBe(15000);
      expect(analytics.byReason).toHaveLength(1);
      expect(analytics.byReason[0].count).toBe(2);
      expect(analytics.byCompetitor).toHaveLength(1);
      expect(analytics.byCompetitor[0].wonDeals).toBe(1);
      expect(analytics.byCompetitor[0].lostDeals).toBe(1);
    });

    it("filters by date period when provided", async () => {
      (prisma.winLossReason.findMany as any).mockResolvedValue([]);
      (prisma.competitor.findMany as any).mockResolvedValue([]);
      (prisma.opportunity.findMany as any).mockResolvedValue([]);
      const start = new Date("2026-01-01");
      const end = new Date("2026-03-31");
      await service.getWinLossAnalytics(TENANT, { start, end });
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            actualCloseDate: { gte: start, lte: end },
          }),
        }),
      );
    });
  });

  describe("getWinLossReasonsBreakdown", () => {
    it("returns won and lost reasons separately", async () => {
      (prisma.winLossReason.findMany as any).mockResolvedValueOnce([
        { id: "r1", name: "Product Fit", category: "WON_REASON" },
      ]);
      (prisma.winLossReason.findMany as any).mockResolvedValueOnce([
        { id: "r2", name: "Price", category: "LOST_REASON" },
      ]);
      const result = await service.getWinLossReasonsBreakdown(TENANT);
      expect(result.wonReasons).toHaveLength(1);
      expect(result.lostReasons).toHaveLength(1);
    });
  });
});
