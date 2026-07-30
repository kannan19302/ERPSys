// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmCompetitorIntelligenceService } from "../crm-competitor-intelligence.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    winLossReasonCategory: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    competitorIntelligenceReport: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    competitor: { findFirst: vi.fn() },
    opportunity: { findMany: vi.fn(), findFirst: vi.fn() },
    battlecard: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const CAT_ID = "cat-1";
const REPORT_ID = "report-1";
const COMP_ID = "comp-1";
const OPP_ID = "opp-1";

describe("CrmCompetitorIntelligenceService", () => {
  let service: CrmCompetitorIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCompetitorIntelligenceService();
  });

  // ── WIN/LOSS CATEGORIES ──────────────────────────────

  describe("getWinLossReasonCategories", () => {
    it("returns all categories sorted by sortOrder", async () => {
      const mockCategories = [
        {
          id: CAT_ID,
          name: "Price",
          type: "LOSS_REASON",
          sortOrder: 0,
          tenantId: TENANT,
          description: "Price-related",
          isActive: true,
          createdAt: new Date(),
          reasons: [],
        },
      ];
      (
        prisma.winLossReasonCategory.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockCategories);

      const result = await service.getWinLossReasonCategories(TENANT);
      expect(result).toEqual(mockCategories);
    });
  });

  describe("createCategory", () => {
    it("creates a new win/loss category", async () => {
      const dto = {
        name: "Product Features",
        type: "BOTH" as const,
        description: "Feature-related wins/losses",
        sortOrder: 1,
      };
      const expected = {
        id: CAT_ID,
        tenantId: TENANT,
        ...dto,
        isActive: true,
        createdAt: new Date(),
      };
      (
        prisma.winLossReasonCategory.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue(expected);

      const result = await service.createCategory(TENANT, dto);
      expect(result).toEqual(expected);
      expect(prisma.winLossReasonCategory.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT,
          name: dto.name,
          type: dto.type,
          description: dto.description,
          sortOrder: 1,
        },
      });
    });
  });

  describe("updateCategory", () => {
    it("updates an existing category", async () => {
      (
        prisma.winLossReasonCategory.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: CAT_ID, tenantId: TENANT });
      (
        prisma.winLossReasonCategory.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: CAT_ID, name: "Updated Name" });

      const result = await service.updateCategory(TENANT, CAT_ID, {
        name: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
    });

    it("throws for non-existent category", async () => {
      (
        prisma.winLossReasonCategory.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.updateCategory(TENANT, "bad-id", { name: "X" }),
      ).rejects.toThrow("Win/loss category not found");
    });
  });

  describe("deleteCategory", () => {
    it("deletes an existing category", async () => {
      (
        prisma.winLossReasonCategory.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: CAT_ID, tenantId: TENANT });
      (
        prisma.winLossReasonCategory.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: CAT_ID });

      const result = await service.deleteCategory(TENANT, CAT_ID);
      expect(result.id).toBe(CAT_ID);
    });

    it("throws for non-existent category", async () => {
      (
        prisma.winLossReasonCategory.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(service.deleteCategory(TENANT, "bad-id")).rejects.toThrow(
        "Win/loss category not found",
      );
    });
  });

  // ── COMPETITOR INTELLIGENCE REPORTS ──────────────────

  describe("getCompetitorIntelligenceReports", () => {
    it("returns reports with optional filters", async () => {
      const mockReports = [
        {
          id: REPORT_ID,
          competitorId: COMP_ID,
          title: "SWOT Analysis",
          reportType: "SWOT",
          severity: "INFO",
          isRead: false,
          competitor: { id: COMP_ID, name: "Acme Corp" },
        },
      ];
      (
        prisma.competitorIntelligenceReport.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockReports);

      const result = await service.getCompetitorIntelligenceReports(TENANT, {
        competitor: COMP_ID,
        severity: "INFO",
      });
      expect(result).toHaveLength(1);
      expect(prisma.competitorIntelligenceReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            competitorId: COMP_ID,
            severity: "INFO",
          }),
        }),
      );
    });
  });

  describe("createReport", () => {
    it("creates a report for a valid competitor", async () => {
      (
        prisma.competitor.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: COMP_ID, name: "Acme Corp" });
      const dto = {
        competitorId: COMP_ID,
        title: "Market Update",
        content: "Detailed analysis...",
        reportType: "MARKET_UPDATE" as const,
        source: "WEB" as const,
        severity: "WARNING" as const,
      };
      const expected = { id: REPORT_ID, ...dto, createdBy: "user-1" };
      (
        prisma.competitorIntelligenceReport.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue(expected);

      const result = await service.createReport(TENANT, dto, "user-1");
      expect(result).toEqual(expected);
    });

    it("throws for non-existent competitor", async () => {
      (
        prisma.competitor.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.createReport(
          TENANT,
          {
            competitorId: "bad-id",
            title: "T",
            content: "C",
            reportType: "NEWS",
          },
          "user-1",
        ),
      ).rejects.toThrow("Competitor not found");
    });
  });

  describe("updateReport", () => {
    it("updates an existing report", async () => {
      (
        prisma.competitorIntelligenceReport.findFirst as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ id: REPORT_ID, tenantId: TENANT });
      (
        prisma.competitorIntelligenceReport.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: REPORT_ID, title: "Updated Title" });

      const result = await service.updateReport(TENANT, REPORT_ID, {
        title: "Updated Title",
      });
      expect(result.title).toBe("Updated Title");
    });
  });

  describe("deleteReport", () => {
    it("deletes an existing report", async () => {
      (
        prisma.competitorIntelligenceReport.findFirst as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ id: REPORT_ID, tenantId: TENANT });
      (
        prisma.competitorIntelligenceReport.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: REPORT_ID });

      const result = await service.deleteReport(TENANT, REPORT_ID);
      expect(result.id).toBe(REPORT_ID);
    });
  });

  describe("markReportAsRead", () => {
    it("marks report as read", async () => {
      (
        prisma.competitorIntelligenceReport.findFirst as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ id: REPORT_ID, tenantId: TENANT });
      (
        prisma.competitorIntelligenceReport.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: REPORT_ID, isRead: true });

      const result = await service.markReportAsRead(TENANT, REPORT_ID);
      expect(prisma.competitorIntelligenceReport.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isRead: true } }),
      );
    });
  });

  // ── COMPETITOR LANDSCAPE ────────────────────────────

  describe("getCompetitorLandscape", () => {
    it("returns full competitor landscape with SWOT and positioning", async () => {
      (
        prisma.competitor.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: COMP_ID,
        name: "Acme Corp",
        website: "https://acme.com",
        description: "Competitor description",
        strengths: ["Brand recognition"],
        weaknesses: ["Limited support"],
        marketShare: { toString: () => "15" },
      });
      (
        prisma.competitorIntelligenceReport.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: REPORT_ID, isRead: true, title: "SWOT", reportType: "SWOT" },
        {
          id: "report-2",
          isRead: false,
          title: "Pricing Update",
          reportType: "PRICING",
        },
      ]);
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "opp1",
          stage: "CLOSED_WON",
          amount: { toString: () => "50000" },
        },
        {
          id: "opp2",
          stage: "CLOSED_LOST",
          amount: { toString: () => "30000" },
        },
      ]);

      const result = await service.getCompetitorLandscape(TENANT, COMP_ID);

      expect(result.competitor.name).toBe("Acme Corp");
      expect(result.intelligence.totalReports).toBe(2);
      expect(result.competitivePositioning.winRate).toBe(50);
      expect(result.competitivePositioning.totalDealsAgainst).toBe(2);
    });

    it("throws for non-existent competitor", async () => {
      (
        prisma.competitor.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.getCompetitorLandscape(TENANT, "bad-id"),
      ).rejects.toThrow("Competitor not found");
    });
  });

  describe("getCompetitivePositioning", () => {
    it("returns positioning for an opportunity with competitor", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: OPP_ID,
        name: "Big Deal",
        stage: "NEGOTIATION",
        amount: { toString: () => "100000" },
        probability: 70,
        competitorRel: {
          id: COMP_ID,
          name: "Acme Corp",
          strengths: ["Price"],
          weaknesses: ["Support"],
        },
      });
      (
        prisma.battlecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: "bc1", competitor: "Acme Corp", strengths: ["Product depth"] },
      ]);

      const result = await service.getCompetitivePositioning(TENANT, OPP_ID);

      expect(result.hasCompetitor).toBe(true);
      expect(result.competitor.name).toBe("Acme Corp");
      expect(result.battlecardsAvailable).toBe(1);
      expect(result.recommendedStrategy).toBeDefined();
    });

    it("returns no-competitor message when no competitor is tracked", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: OPP_ID,
        name: "Big Deal",
        competitorRel: null,
      });

      const result = await service.getCompetitivePositioning(TENANT, OPP_ID);
      expect(result.hasCompetitor).toBe(false);
    });
  });

  describe("getBattlecardRecommendations", () => {
    it("returns relevant battlecards for an opportunity with competitor match", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: OPP_ID,
        name: "Big Deal",
        competitor: "Acme Corp",
      });
      (
        prisma.battlecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "bc1",
          competitor: "Acme Corp",
          strengths: ["Product depth"],
          weaknesses: [],
          objections: [],
          winStrategy: "Focus on TCO",
          loseReasons: [],
          isActive: true,
          createdAt: new Date(),
          tenantId: TENANT,
          playbookId: null,
          createdBy: "user-1",
          updatedAt: new Date(),
          deletedAt: null,
          playbook: null,
        },
        {
          id: "bc2",
          competitor: "Beta Inc",
          strengths: ["Speed"],
          weaknesses: [],
          objections: [],
          winStrategy: "Focus on reliability",
          loseReasons: [],
          isActive: true,
          createdAt: new Date(),
          tenantId: TENANT,
          playbookId: null,
          createdBy: "user-1",
          updatedAt: new Date(),
          deletedAt: null,
          playbook: null,
        },
      ]);

      const result = await service.getBattlecardRecommendations(TENANT, OPP_ID);

      expect(result.competitor).toBe("Acme Corp");
      expect(result.battlecards).toHaveLength(1);
      expect(result.battlecards[0]!.competitor).toBe("Acme Corp");
    });

    it("returns general battlecards when no competitor match exists", async () => {
      (
        prisma.opportunity.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: OPP_ID,
        name: "Big Deal",
        competitor: "Unknown Inc",
      });
      (
        prisma.battlecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "bc1",
          competitor: "Acme Corp",
          strengths: [],
          weaknesses: [],
          objections: [],
          winStrategy: "",
          loseReasons: [],
          isActive: true,
          createdAt: new Date(),
          tenantId: TENANT,
          playbookId: null,
          createdBy: "user-1",
          updatedAt: new Date(),
          deletedAt: null,
          playbook: null,
        },
      ]);

      const result = await service.getBattlecardRecommendations(TENANT, OPP_ID);

      expect(result.note).toContain("No specific battlecards");
    });
  });
});
