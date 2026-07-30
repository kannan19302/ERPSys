// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmPipelineDeepService } from "../crm-pipeline-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    crmPipelineInspectionConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmPipelineInspectionResult: { findMany: vi.fn(), create: vi.fn() },
    opportunity: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    opportunityStageHistory: { findMany: vi.fn() },
    opportunityLineItem: { findMany: vi.fn() },
    lead: { findMany: vi.fn(), groupBy: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmPipelineDeepService", () => {
  let service: CrmPipelineDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmPipelineDeepService();
  });

  describe("getPipelineInspectionConfigs", () => {
    it("returns configs with pipeline info", async () => {
      (prisma.crmPipelineInspectionConfig.findMany as any).mockResolvedValue([
        {
          id: "ic-1",
          name: "Daily Scan",
          pipeline: { id: "pl-1", name: "Sales" },
        },
      ]);
      const r = await service.getPipelineInspectionConfigs(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("getPipelineInspectionConfig", () => {
    it("throws NotFound when not found", async () => {
      (prisma.crmPipelineInspectionConfig.findFirst as any).mockResolvedValue(
        null,
      );
      await expect(
        service.getPipelineInspectionConfig(TENANT, "x"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPipelineInspectionConfig", () => {
    it("creates an inspection config", async () => {
      (prisma.crmPipelineInspectionConfig.create as any).mockResolvedValue({
        id: "ic-new",
        name: "Weekly Scan",
        rules: [],
        schedule: "WEEKLY",
        pipeline: null,
      });
      const dto = {
        name: "Weekly Scan",
        rules: [],
        schedule: "WEEKLY" as const,
      };
      const r = await service.createPipelineInspectionConfig(TENANT, ORG, dto);
      expect(r.id).toBe("ic-new");
    });
  });

  describe("deletePipelineInspectionConfig", () => {
    it("soft-deletes", async () => {
      (prisma.crmPipelineInspectionConfig.findFirst as any).mockResolvedValue({
        id: "ic-1",
      });
      (prisma.crmPipelineInspectionConfig.update as any).mockResolvedValue({
        id: "ic-1",
        deletedAt: new Date(),
      });
      const r = await service.deletePipelineInspectionConfig(TENANT, "ic-1");
      expect(r.deletedAt).toBeDefined();
    });
  });

  describe("runPipelineInspection", () => {
    it("runs inspection and produces findings", async () => {
      (prisma.crmPipelineInspectionConfig.findFirst as any).mockResolvedValue({
        id: "ic-1",
        pipelineId: "pl-1",
        schedule: "MANUAL",
        name: "Test",
        rules: [
          {
            type: "AMOUNT_THRESHOLD",
            threshold: 50000,
            severity: "HIGH",
            enabled: true,
          },
        ],
      });
      (prisma.opportunity.findMany as any).mockResolvedValue([
        {
          id: "opp-1",
          name: "Big Deal",
          stage: "NEGOTIATION",
          amount: 100000,
          probability: 60,
          expectedCloseDate: null,
          stageEnteredAt: new Date(),
          createdAt: new Date(),
          discount: 0,
        },
      ]);
      (prisma.crmPipelineInspectionResult.create as any).mockResolvedValue({
        id: "ir-1",
        totalScanned: 1,
        totalFindings: 1,
        status: "COMPLETED",
        findings: [],
      });
      const r = await service.runPipelineInspection(TENANT, "ic-1");
      expect(r.totalScanned).toBe(1);
      expect(r.totalFindings).toBe(1);
    });
  });

  describe("getPipelineInspectionResults", () => {
    it("returns recent results", async () => {
      (prisma.crmPipelineInspectionResult.findMany as any).mockResolvedValue([
        { id: "ir-1", status: "COMPLETED" },
      ]);
      const r = await service.getPipelineInspectionResults(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("getDealComparison", () => {
    it("throws when less than 2 IDs", async () => {
      await expect(
        service.getDealComparison(TENANT, ["opp-1"]),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when more than 10 IDs", async () => {
      await expect(
        service.getDealComparison(
          TENANT,
          Array.from({ length: 11 }, (_, i) => `opp-${i}`),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when opportunities not all found", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([{ id: "opp-1" }]);
      await expect(
        service.getDealComparison(TENANT, ["opp-1", "opp-2"]),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns side-by-side comparison", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        {
          id: "opp-1",
          name: "Deal A",
          stage: "NEGOTIATION",
          amount: 50000,
          probability: 70,
          expectedCloseDate: new Date(),
          customer: { id: "c-1", name: "Acme" },
          assignedTo: { id: "u-1", name: "Alice" },
          pipeline: { id: "pl-1", name: "Sales" },
          lineItems: [],
        },
        {
          id: "opp-2",
          name: "Deal B",
          stage: "PROPOSAL",
          amount: 30000,
          probability: 50,
          expectedCloseDate: new Date(),
          customer: { id: "c-2", name: "Beta" },
          assignedTo: { id: "u-2", name: "Bob" },
          pipeline: { id: "pl-1", name: "Sales" },
          lineItems: [],
        },
      ]);
      const r = await service.getDealComparison(TENANT, ["opp-1", "opp-2"]);
      expect(r).toHaveLength(2);
      expect(r[0].weightedAmount).toBe(35000);
    });
  });

  describe("getDealAnalyticsDashboard", () => {
    it("returns aggregate KPIs", async () => {
      (prisma.opportunity.count as any)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);
      (prisma.opportunity.aggregate as any).mockResolvedValue({
        _sum: { amount: 2000000 },
      });
      (prisma.opportunity.groupBy as any).mockResolvedValue([
        { stage: "PROPOSAL", _count: 25 },
      ]);
      (prisma.lead.groupBy as any).mockResolvedValue([
        { source: "Website", _count: 15 },
      ]);
      const d = await service.getDealAnalyticsDashboard(TENANT);
      expect(d.totalDeals).toBe(100);
      expect(d.wonDeals).toBe(30);
      expect(d.winRate).toBe(30);
      expect(d.pipelineValue).toBe(2000000);
    });
  });

  describe("getStageConversionRates", () => {
    it("computes conversion per stage", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        { id: "1", stage: "PROSPECTING" },
        { id: "2", stage: "PROSPECTING" },
        { id: "3", stage: "CLOSED_WON" },
        { id: "4", stage: "CLOSED_LOST" },
      ]);
      const r = await service.getStageConversionRates(TENANT);
      const prospecting = r.find((s) => s.stage === "PROSPECTING");
      expect(prospecting?.entered).toBe(2);
    });
  });

  describe("getStageDurationAnalysis", () => {
    it("computes duration stats", async () => {
      const now = Date.now();
      (prisma.opportunityStageHistory.findMany as any).mockResolvedValue([
        {
          stageName: "PROSPECTING",
          enteredAt: new Date(now - 10 * 86_400_000),
          exitedAt: new Date(now - 5 * 86_400_000),
          opportunity: { id: "1", stage: "PROPOSAL" },
        },
        {
          stageName: "PROSPECTING",
          enteredAt: new Date(now - 20 * 86_400_000),
          exitedAt: new Date(now - 10 * 86_400_000),
          opportunity: { id: "2", stage: "NEGOTIATION" },
        },
      ]);
      const r = await service.getStageDurationAnalysis(TENANT);
      const prospecting = r.find((s) => s.stage === "PROSPECTING");
      expect(prospecting?.count).toBe(2);
      expect(prospecting?.avgDays).toBe(7.5);
    });
  });

  describe("getDealSizeDistribution", () => {
    it("buckets deals by amount", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        { amount: 3000 },
        { amount: 7500 },
        { amount: 15000 },
        { amount: 300000 },
      ]);
      const r = await service.getDealSizeDistribution(TENANT);
      expect(r[0].label).toBe("0-5K");
      expect(r[0].count).toBe(1);
      expect(r[6].label).toBe("250K+");
      expect(r[6].count).toBe(1);
    });
  });

  describe("getWinRateByStage", () => {
    it("computes win rate per stage", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        { stage: "CLOSED_WON" },
        { stage: "CLOSED_WON" },
        { stage: "CLOSED_LOST" },
        { stage: "PROSPECTING" },
      ]);
      const r = await service.getWinRateByStage(TENANT);
      const cw = r.find((s) => s.stage === "CLOSED_WON");
      expect(cw?.total).toBe(2);
      expect(cw?.won).toBe(2);
      expect(cw?.winRate).toBe(100);
    });
  });

  describe("getLossReasonAnalysis", () => {
    it("aggregates loss reasons", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        { lossReason: "Budget", amount: 50000 },
        { lossReason: "Budget", amount: 30000 },
        { lossReason: "Competitor", amount: 20000 },
      ]);
      const r = await service.getLossReasonAnalysis(TENANT);
      const budget = r.find((l) => l.reason === "Budget");
      expect(budget?.count).toBe(2);
      expect(budget?.totalAmount).toBe(80000);
    });
  });

  describe("getWinRateBySource", () => {
    it("computes conversion by lead source", async () => {
      (prisma.lead.findMany as any).mockResolvedValue([
        { source: "Website", status: "CONVERTED" },
        { source: "Website", status: "CONVERTED" },
        { source: "Website", status: "NEW" },
        { source: "Referral", status: "CONVERTED" },
      ]);
      const r = await service.getWinRateBySource(TENANT);
      const web = r.find((s) => s.source === "Website");
      expect(web?.total).toBe(3);
      expect(web?.converted).toBe(2);
      expect(web?.conversionRate).toBeCloseTo(66.67, 0);
    });
  });

  describe("getSalesCycleByProduct", () => {
    it("computes avg cycle per product", async () => {
      const now = Date.now();
      (prisma.opportunityLineItem.findMany as any).mockResolvedValue([
        {
          productName: "ERP License",
          opportunity: {
            createdAt: new Date(now - 30 * 86_400_000),
            actualCloseDate: new Date(now),
            stage: "CLOSED_WON",
          },
        },
        {
          productName: "ERP License",
          opportunity: {
            createdAt: new Date(now - 20 * 86_400_000),
            actualCloseDate: new Date(now),
            stage: "CLOSED_WON",
          },
        },
      ]);
      const r = await service.getSalesCycleByProduct(TENANT);
      expect(r).toHaveLength(1);
      expect(r[0].product).toBe("ERP License");
      expect(r[0].count).toBe(2);
    });
  });

  describe("getForecastVsActualByRep", () => {
    it("computes per-rep forecast accuracy", async () => {
      (prisma.opportunity.findMany as any).mockResolvedValue([
        {
          id: "1",
          stage: "CLOSED_WON",
          amount: 50000,
          probability: 80,
          assignedToId: "u-1",
          assignedTo: { id: "u-1", name: "Alice" },
          createdAt: new Date(),
        },
        {
          id: "2",
          stage: "CLOSED_LOST",
          amount: 30000,
          probability: 60,
          assignedToId: "u-1",
          assignedTo: { id: "u-1", name: "Alice" },
          createdAt: new Date(),
        },
        {
          id: "3",
          stage: "PROPOSAL",
          amount: 20000,
          probability: 50,
          assignedToId: "u-2",
          assignedTo: { id: "u-2", name: "Bob" },
          createdAt: new Date(),
        },
      ]);
      const r = await service.getForecastVsActualByRep(TENANT);
      const alice = r.find((rep) => rep.repName === "Alice");
      expect(alice?.totalDeals).toBe(2);
      expect(alice?.wonDeals).toBe(1);
      expect(alice?.forecastAmount).toBeGreaterThan(0);
    });
  });
});
