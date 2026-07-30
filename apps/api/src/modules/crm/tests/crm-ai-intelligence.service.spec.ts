// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmAiIntelligenceService } from "../crm-ai-intelligence.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    opportunity: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    lead: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    forecastSnapshot: { findMany: vi.fn() },
    opportunityLineItem: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const OPP_ID = "opp-1";
const LEAD_ID = "lead-1";

const mockOpp = {
  id: OPP_ID,
  tenantId: TENANT,
  name: "Acme Corp Deal",
  stage: "NEGOTIATION",
  amount: { toString: () => "75000" },
  probability: 60,
  updatedAt: new Date(Date.now() - 2 * 86400000),
  createdAt: new Date(Date.now() - 60 * 86400000),
  stageEnteredAt: new Date(Date.now() - 5 * 86400000),
  actualCloseDate: null,
  assignedToId: "rep-1",
  lead: {
    id: LEAD_ID,
    firstName: "John",
    lastName: "Doe",
    activities: [
      {
        id: "act1",
        type: "EMAIL",
        createdAt: new Date(Date.now() - 1 * 86400000),
        completedAt: null,
        subject: "Follow-up",
        description: "test",
      },
      {
        id: "act2",
        type: "CALL",
        createdAt: new Date(Date.now() - 3 * 86400000),
        completedAt: new Date(),
        subject: "Discovery call",
        description: "test",
      },
      {
        id: "act3",
        type: "MEETING",
        createdAt: new Date(Date.now() - 5 * 86400000),
        completedAt: new Date(),
        subject: "Demo",
        description: "test",
      },
    ],
  },
  customer: { salesOrders: [] },
  activities: [],
};

describe("CrmAiIntelligenceService", () => {
  let service: CrmAiIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmAiIntelligenceService();
  });

  describe("calculateAiWinProbability", () => {
    it("returns a probability score with factor breakdown", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);
      (prisma.opportunity.count as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(50);

      const result = await service.calculateAiWinProbability(OPP_ID);

      expect(result.opportunityId).toBe(OPP_ID);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(99);
      expect(result.factors).toBeDefined();
      expect(result.factors.stageScore).toBeGreaterThan(0);
    });

    it("throws for non-existent opportunity", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(service.calculateAiWinProbability("bad-id")).rejects.toThrow(
        "Opportunity not found",
      );
    });
  });

  describe("getWinProbabilityRationale", () => {
    it("returns factor breakdown with explanations", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);

      const result = await service.getWinProbabilityRationale(OPP_ID);

      expect(result.opportunityId).toBe(OPP_ID);
      expect(result.factors.length).toBeGreaterThanOrEqual(3);
      expect(result.factors[0]!.factor).toBeDefined();
      expect(result.factors[0]!.explanation).toBeDefined();
    });
  });

  describe("getBatchWinProbabilities", () => {
    it("calculates probabilities for multiple opportunities", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);
      (prisma.opportunity.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        30,
      );

      const results = await service.getBatchWinProbabilities([OPP_ID, "opp-2"]);

      expect(results).toHaveLength(2);
      expect(results[0]!.opportunityId).toBe(OPP_ID);
    });

    it("handles errors gracefully for invalid IDs", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      const results = await service.getBatchWinProbabilities(["bad-id"]);

      expect(results).toHaveLength(1);
      expect(results[0]!).toHaveProperty("error");
    });
  });

  describe("getWinProbabilityTrend", () => {
    it("returns probability data points over time", async () => {
      const oppWithActivities = {
        ...mockOpp,
        activities: [
          {
            id: "act1",
            type: "EMAIL",
            createdAt: new Date(Date.now() - 30 * 86400000),
            completedAt: null,
            subject: "test",
            description: "test",
          },
          {
            id: "act2",
            type: "CALL",
            createdAt: new Date(Date.now() - 15 * 86400000),
            completedAt: null,
            subject: "test",
            description: "test",
          },
        ],
        lead: { ...mockOpp.lead, activities: [] },
      };
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(oppWithActivities);

      const result = await service.getWinProbabilityTrend(OPP_ID);

      expect(result.opportunityId).toBe(OPP_ID);
      expect(result.trend.length).toBeGreaterThan(0);
      expect(result.trend[0]!).toHaveProperty("date");
      expect(result.trend[0]!).toHaveProperty("probability");
    });
  });

  describe("getNextBestAction", () => {
    it("returns recommended action based on stage", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);

      const result = await service.getNextBestAction(OPP_ID);

      expect(result.opportunityId).toBe(OPP_ID);
      expect(result.recommendedAction).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.stageSpecificActions.length).toBeGreaterThan(0);
    });
  });

  describe("getNextBestActionsForPipeline", () => {
    it("returns prioritized actions for all active deals", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([mockOpp]);
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);

      const results = await service.getNextBestActionsForPipeline(TENANT);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.priority).toBeDefined();
    });
  });

  describe("getNextBestActionAnalytics", () => {
    it("returns activity effectiveness analysis from won deals", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          ...mockOpp,
          stage: "CLOSED_WON",
          activities: [{ type: "EMAIL" }, { type: "CALL" }, { type: "EMAIL" }],
        },
      ]);

      const result = await service.getNextBestActionAnalytics(TENANT);

      expect(result.totalWonDealsAnalyzed).toBe(1);
      expect(result.topActions).toContain("EMAIL");
    });
  });

  describe("getDealHealthScore", () => {
    it("returns a 0-100 health score", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);

      const score = await service.getDealHealthScore(OPP_ID);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("getDealHealthFactors", () => {
    it("returns factor breakdown with score", async () => {
      (
        prisma.opportunity.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockOpp);

      const result = await service.getDealHealthFactors(OPP_ID);

      expect(result.opportunityId).toBe(OPP_ID);
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getPipelineAnomalies", () => {
    it("detects stalled deals and other anomalies", async () => {
      const oldOpp = {
        ...mockOpp,
        updatedAt: new Date(Date.now() - 45 * 86400000),
        stageEnteredAt: new Date(Date.now() - 45 * 86400000),
        lead: {
          activities: [{ createdAt: new Date(Date.now() - 45 * 86400000) }],
        },
      };
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([oldOpp]);

      const result = await service.getPipelineAnomalies(TENANT);

      expect(result.totalAnomalies).toBeGreaterThan(0);
      expect(result.anomalies[0]!.type).toBeDefined();
    });
  });

  describe("getActivityRecommendations", () => {
    it("returns recommended activities from winning patterns", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          stage: "CLOSED_WON",
          activities: [
            { type: "EMAIL" },
            { type: "CALL" },
            { type: "EMAIL" },
            { type: "MEETING" },
          ],
        },
        {
          stage: "CLOSED_WON",
          activities: [{ type: "EMAIL" }, { type: "CALL" }],
        },
      ]);

      const result = await service.getActivityRecommendations(TENANT);

      expect(result.totalWonDealsAnalyzed).toBe(2);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getBestTimeToContact", () => {
    it("analyzes contact patterns and returns optimal times", async () => {
      const manyActivities = Array.from({ length: 10 }, (_, i) => ({
        type: "EMAIL",
        createdAt: new Date(2026, 6, 20, 10 + (i % 8)),
      }));
      (prisma.lead.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: LEAD_ID,
        firstName: "John",
        lastName: "Doe",
        activities: manyActivities,
      });

      const result = await service.getBestTimeToContact(LEAD_ID);

      expect(result.leadId).toBe(LEAD_ID);
      expect(result.bestTimeToContact).toMatch(/^\d{2}:\d{2}$/);
      expect(result.bestDayOfWeek).toBeDefined();
    });
  });

  describe("getLeadConversionPredictors", () => {
    it("returns field-level conversion analysis", async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          {
            email: "a@b.com",
            phone: "123",
            company: "Acme",
            website: "acme.com",
            industry: "Tech",
            mobile: null,
          },
          {
            email: "c@d.com",
            phone: null,
            company: "Beta",
            website: null,
            industry: null,
            mobile: "456",
          },
        ])
        .mockResolvedValueOnce([
          {
            email: null,
            phone: null,
            company: null,
            website: null,
            industry: null,
            mobile: null,
          },
        ]);

      const result = await service.getLeadConversionPredictors(TENANT);

      expect(result.predictors.length).toBeGreaterThan(0);
      expect(result.topPredictor).toBeDefined();
    });
  });

  describe("generateRevenueDigest", () => {
    it("returns comprehensive revenue summary for a period", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { amount: { toString: () => "50000" }, stage: "CLOSED_WON" },
        { amount: { toString: () => "30000" }, stage: "CLOSED_WON" },
      ]);

      const result = await service.generateRevenueDigest({
        start: "2026-01-01",
        end: "2026-01-31",
      });

      expect(result.summary.totalWon).toBe(2);
      expect(result.summary.wonValue).toBe(80000);
      expect(result.summary.winRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getRevenueTrends", () => {
    it("returns revenue data for specified periods", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ amount: { toString: () => "50000" } }]);

      const result = await service.getRevenueTrends(["2026-01", "2026-02"]);

      expect(result).toHaveLength(2);
      expect(result[0]!.period).toBe("2026-01");
    });
  });

  describe("getRevenueByStage", () => {
    it("groups revenue by pipeline stage", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          stage: "NEGOTIATION",
          amount: { toString: () => "50000" },
          tenantId: TENANT,
          deletedAt: null,
        },
        {
          stage: "NEGOTIATION",
          amount: { toString: () => "30000" },
          tenantId: TENANT,
          deletedAt: null,
        },
        {
          stage: "PROPOSAL",
          amount: { toString: () => "20000" },
          tenantId: TENANT,
          deletedAt: null,
        },
      ]);

      const result = await service.getRevenueByStage(TENANT);

      expect(result.length).toBe(2);
      const neg = result.find((r) => r.stage === "NEGOTIATION");
      expect(neg!.totalValue).toBe(80000);
      expect(neg!.dealCount).toBe(2);
    });
  });

  describe("getRevenueBySource", () => {
    it("groups revenue by lead source", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          stage: "CLOSED_WON",
          amount: { toString: () => "50000" },
          tenantId: TENANT,
          deletedAt: null,
          lead: { source: { name: "Website" } },
        },
        {
          stage: "CLOSED_LOST",
          amount: { toString: () => "30000" },
          tenantId: TENANT,
          deletedAt: null,
          lead: { source: { name: "Referral" } },
        },
        {
          stage: "CLOSED_WON",
          amount: { toString: () => "20000" },
          tenantId: TENANT,
          deletedAt: null,
          lead: { source: null },
        },
      ]);

      const result = await service.getRevenueBySource(TENANT);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getRevenueByTerritory", () => {
    it("groups revenue by territory", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          amount: { toString: () => "50000" },
          tenantId: TENANT,
          deletedAt: null,
          customer: { territory: "North America" },
        },
        {
          amount: { toString: () => "30000" },
          tenantId: TENANT,
          deletedAt: null,
          customer: { territory: "Europe" },
        },
      ]);

      const result = await service.getRevenueByTerritory(TENANT);

      expect(result.length).toBe(2);
    });
  });

  describe("getRevenueForecastAccuracy", () => {
    it("measures forecast accuracy from snapshots", async () => {
      (
        prisma.forecastSnapshot.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "fs1",
          name: "Q1 2026",
          periodStart: new Date("2026-01-01"),
          periodEnd: new Date("2026-03-31"),
          createdAt: new Date(),
          forecastAmount: { toString: () => "100000" },
          wonAmount: { toString: () => "95000" },
        },
        {
          id: "fs2",
          name: "Q2 2026",
          periodStart: new Date("2026-04-01"),
          periodEnd: new Date("2026-06-30"),
          createdAt: new Date(),
          forecastAmount: { toString: () => "120000" },
          wonAmount: { toString: () => "80000" },
        },
      ]);

      const result = await service.getRevenueForecastAccuracy(TENANT);

      expect(result.totalForecasts).toBe(2);
      expect(result.accuracyRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getBookingVsForecast", () => {
    it("compares bookings to forecast", async () => {
      (
        prisma.forecastSnapshot.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "fs1",
          name: "Q1 2026",
          periodStart: new Date("2026-01-01"),
          periodEnd: new Date("2026-03-31"),
          createdAt: new Date(),
          forecastAmount: { toString: () => "100000" },
          wonAmount: { toString: () => "95000" },
        },
      ]);

      const result = await service.getBookingVsForecast(TENANT);

      expect(result).toHaveLength(1);
      expect(result[0]!.gap).toBe(5000);
    });
  });

  describe("calculateSalesVelocityMetrics", () => {
    it("computes velocity KPIs for a period", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { amount: { toString: () => "50000" } },
        { amount: { toString: () => "30000" } },
        { amount: { toString: () => "20000" } },
      ]);

      const result = await service.calculateSalesVelocityMetrics("2026-01");

      expect(result.metrics.dealCount).toBe(3);
      expect(result.metrics.totalRevenue).toBe(100000);
      expect(result.metrics.avgDealSize).toBeGreaterThan(0);
      expect(result.metrics.salesVelocity).toBeGreaterThan(0);
    });
  });

  describe("getSalesVelocityTrend", () => {
    it("returns velocity for multiple periods", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ amount: { toString: () => "50000" } }]);

      const result = await service.getSalesVelocityTrend([
        "2026-01",
        "2026-02",
      ]);

      expect(result).toHaveLength(2);
    });
  });

  describe("getVelocityByRep", () => {
    it("breaks down velocity per rep", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          amount: { toString: () => "50000" },
          assignedToId: "rep-1",
          customer: {},
        },
        {
          amount: { toString: () => "30000" },
          assignedToId: "rep-2",
          customer: {},
        },
      ]);

      const result = await service.getVelocityByRep(TENANT, "2026-01");

      expect(result).toHaveLength(2);
      expect(result[0]!.repId).toBeDefined();
    });
  });

  describe("getVelocityByProduct", () => {
    it("breaks down velocity per product", async () => {
      (
        prisma.opportunityLineItem.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          quantity: 1,
          unitPrice: { toString: () => "50000" },
          totalPrice: { toString: () => "50000" },
          product: { name: "ERP Core" },
          opportunity: {
            name: "Deal 1",
            actualCloseDate: new Date(),
            amount: { toString: () => "50000" },
          },
        },
        {
          quantity: 2,
          unitPrice: { toString: () => "15000" },
          totalPrice: { toString: () => "30000" },
          product: { name: "CRM Plus" },
          opportunity: {
            name: "Deal 2",
            actualCloseDate: new Date(),
            amount: { toString: () => "30000" },
          },
        },
      ]);

      const result = await service.getVelocityByProduct(TENANT, "2026-01");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]!.product).toBeDefined();
    });
  });

  describe("getCycleTimeAnalysis", () => {
    it("returns stage-by-stage cycle time breakdown", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "opp1",
          name: "Deal 1",
          createdAt: new Date(Date.now() - 60 * 86400000),
          actualCloseDate: new Date(),
          stage: "CLOSED_WON",
          stageEnteredAt: new Date(Date.now() - 5 * 86400000),
        },
        {
          id: "opp2",
          name: "Deal 2",
          createdAt: new Date(Date.now() - 45 * 86400000),
          actualCloseDate: new Date(),
          stage: "CLOSED_WON",
          stageEnteredAt: new Date(Date.now() - 3 * 86400000),
        },
      ]);

      const result = await service.getCycleTimeAnalysis(TENANT, "2026-01");

      expect(result.totalDealsAnalyzed).toBe(2);
      expect(result.avgTotalCycleDays).toBeGreaterThan(0);
      expect(result.stageBreakdown.length).toBeGreaterThan(0);
    });
  });
});
