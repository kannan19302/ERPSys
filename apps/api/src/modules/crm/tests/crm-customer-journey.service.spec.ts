import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmCustomerJourneyService } from "../crm-customer-journey.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    customerJourneyStage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    journeyEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    npsSurvey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    npsResponse: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    churnPrediction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    clvCalculation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    upsellRecommendation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    customerHealthScore: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
    },
    salesOrder: {
      findMany: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmCustomerJourneyService", () => {
  let service: CrmCustomerJourneyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCustomerJourneyService();
  });

  // ── JOURNEY STAGES ───────────────────────────

  it("gets journey stages", async () => {
    (
      prisma.customerJourneyStage.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      { id: "s1", name: "Lead", sortOrder: 0 },
      { id: "s2", name: "Prospect", sortOrder: 1 },
    ]);
    const stages = await service.getJourneyStages(TENANT);
    expect(stages).toHaveLength(2);
    expect(stages[0].name).toBe("Lead");
  });

  it("creates a journey stage", async () => {
    (
      prisma.customerJourneyStage.create as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }) => Promise.resolve({ id: "s1", ...data }));
    const stage = await service.createJourneyStage(TENANT, ORG, {
      name: "Onboarded",
      color: "#22c55e",
    });
    expect(stage.name).toBe("Onboarded");
    expect(stage.color).toBe("#22c55e");
  });

  it("throws on update for missing stage", async () => {
    (
      prisma.customerJourneyStage.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    await expect(
      service.updateJourneyStage(TENANT, "bad-id", { name: "X" }),
    ).rejects.toThrow("Journey stage not found");
  });

  it("deletes a journey stage", async () => {
    (
      prisma.customerJourneyStage.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "s1", tenantId: TENANT });
    (
      prisma.customerJourneyStage.delete as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "s1" });
    const result = await service.deleteJourneyStage(TENANT, "s1");
    expect(result.id).toBe("s1");
  });

  // ── CUSTOMER JOURNEY ─────────────────────────

  it("gets full customer journey", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Acme",
    });
    (
      prisma.customerJourneyStage.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      prisma.journeyEvent.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      prisma.customerHealthScore.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (
      prisma.churnPrediction.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (
      prisma.clvCalculation.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (
      prisma.upsellRecommendation.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const result = await service.getCustomerJourney(TENANT, "c1");
    expect(result.customer.name).toBe("Acme");
    expect(result.stages).toEqual([]);
    expect(result.events).toEqual([]);
  });

  it("records a journey event", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      tenantId: TENANT,
    });
    (prisma.journeyEvent.create as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }) => Promise.resolve({ id: "e1", ...data }),
    );
    const event = await service.recordJourneyEvent(TENANT, ORG, "c1", {
      eventType: "ORDER_PLACED",
      title: "Order #123 placed",
    });
    expect(event.eventType).toBe("ORDER_PLACED");
    expect(event.title).toBe("Order #123 placed");
  });

  it("gets filtered journey timeline", async () => {
    (
      prisma.journeyEvent.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([{ id: "e1", eventType: "ORDER_PLACED" }]);
    (prisma.journeyEvent.count as ReturnType<typeof vi.fn>).mockResolvedValue(
      1,
    );
    const result = await service.getJourneyTimeline(TENANT, "c1", {
      eventTypes: ["ORDER_PLACED"],
      limit: 10,
    });
    expect(result.data).toHaveLength(1);
    expect(result.totalCount).toBe(1);
  });

  // ── NPS SURVEYS ──────────────────────────────

  it("gets NPS surveys", async () => {
    (prisma.npsSurvey.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "n1", name: "Q1 Survey", _count: { responses: 5 } },
    ]);
    const surveys = await service.getNpsSurveys(TENANT);
    expect(surveys).toHaveLength(1);
    expect(surveys[0].name).toBe("Q1 Survey");
  });

  it("creates an NPS survey", async () => {
    (prisma.npsSurvey.create as ReturnType<typeof vi.fn>).mockImplementation(
      ({ data }) => Promise.resolve({ id: "n1", ...data }),
    );
    const survey = await service.createNpsSurvey(TENANT, ORG, {
      name: "Customer Satisfaction",
    });
    expect(survey.name).toBe("Customer Satisfaction");
  });

  it("sends an NPS survey", async () => {
    (prisma.npsSurvey.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "n1",
      tenantId: TENANT,
    });
    (prisma.npsSurvey.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "n1",
      status: "ACTIVE",
    });
    const result = await service.sendNpsSurvey(TENANT, "n1");
    expect(result.status).toBe("ACTIVE");
  });

  it("gets NPS summary", async () => {
    (prisma.npsResponse.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [
        { id: "r1", rating: 9, category: "PROMOTER" },
        { id: "r2", rating: 8, category: "PROMOTER" },
        { id: "r3", rating: 7, category: "PASSIVE" },
        { id: "r4", rating: 4, category: "DETRACTOR" },
        { id: "r5", rating: 2, category: "DETRACTOR" },
      ],
    );
    (prisma.npsSurvey.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    const summary = await service.getNpsSummary(TENANT);
    expect(summary.totalResponses).toBe(5);
    expect(summary.promoters).toBe(2);
    expect(summary.detractors).toBe(2);
    expect(summary.passives).toBe(1);
    expect(summary.npsScore).toBe(0); // (2 - 2) / 5 * 100 = 0
  });

  // ── CHURN PREDICTIONS ────────────────────────

  it("gets churn predictions", async () => {
    (
      prisma.churnPrediction.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      { id: "cp1", score: 85, customer: { name: "At Risk Co" } },
    ]);
    const predictions = await service.getChurnPredictions(TENANT);
    expect(predictions).toHaveLength(1);
  });

  it("creates a churn prediction", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      tenantId: TENANT,
    });
    (
      prisma.churnPrediction.create as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }) => Promise.resolve({ id: "cp1", ...data }));
    const result = await service.createChurnPrediction(TENANT, {
      customerId: "c1",
      score: 72,
      riskLevel: "HIGH",
    });
    expect(result.score).toBe(72);
    expect(result.riskLevel).toBe("HIGH");
  });

  // ── CLV CALCULATIONS ─────────────────────────

  it("calculates CLV for a customer", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      tenantId: TENANT,
    });
    (prisma.salesOrder.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "o1", totalAmount: "100", orderDate: new Date("2025-01-01") },
      { id: "o2", totalAmount: "200", orderDate: new Date("2025-06-01") },
    ]);
    (
      prisma.clvCalculation.create as ReturnType<typeof vi.fn>
    ).mockImplementation(({ data }) =>
      Promise.resolve({ id: "clv1", ...data }),
    );
    const result = await service.calculateClv(TENANT, "c1");
    expect(result.totalOrders).toBe(2);
    expect(result.totalRevenue).toBe(300);
    expect(result.clvAmount).toBeGreaterThan(0);
  });

  // ── UPSELL RECOMMENDATIONS ───────────────────

  it("gets upsell recommendations", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      tenantId: TENANT,
    });
    (
      prisma.upsellRecommendation.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      { id: "ur1", productName: "Premium Plan", status: "PENDING" },
    ]);
    const recs = await service.getUpsellRecommendations(TENANT, "c1");
    expect(recs).toHaveLength(1);
    expect(recs[0].productName).toBe("Premium Plan");
  });

  it("accepts an upsell recommendation", async () => {
    (
      prisma.upsellRecommendation.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "ur1", tenantId: TENANT });
    (
      prisma.upsellRecommendation.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "ur1", status: "ACCEPTED" });
    const result = await service.acceptUpsellRecommendation(TENANT, "ur1");
    expect(result.status).toBe("ACCEPTED");
  });

  it("dismisses an upsell recommendation", async () => {
    (
      prisma.upsellRecommendation.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "ur1", tenantId: TENANT });
    (
      prisma.upsellRecommendation.update as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "ur1", status: "DISMISSED" });
    const result = await service.dismissUpsellRecommendation(TENANT, "ur1");
    expect(result.status).toBe("DISMISSED");
  });

  // ── CUSTOMER HEALTH ──────────────────────────

  it("gets customer health timeline", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      tenantId: TENANT,
    });
    (
      prisma.customerHealthScore.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      { id: "h1", score: 85, status: "GREEN", computedAt: new Date() },
      { id: "h2", score: 60, status: "YELLOW", computedAt: new Date() },
    ]);
    const timeline = await service.getCustomerHealthTimeline(TENANT, "c1");
    expect(timeline).toHaveLength(2);
  });

  // ── CUSTOMER 360 SUMMARY ─────────────────────

  it("gets customer 360 summary", async () => {
    (prisma.customer.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "c1",
      name: "Acme Corp",
      tenantId: TENANT,
      _count: { invoices: 3, quotations: 2, salesOrders: 5, cases: 1 },
      contacts: [],
      tags: [],
    });
    (
      prisma.journeyEvent.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      prisma.customerHealthScore.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (
      prisma.churnPrediction.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (
      prisma.clvCalculation.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue(null);
    (
      prisma.upsellRecommendation.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (prisma.npsResponse.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
    (
      prisma.customerJourneyStage.findMany as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);
    (prisma.activity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const summary = await service.getCustomer360Summary(TENANT, "c1");
    expect(summary.customer.name).toBe("Acme Corp");
    expect(summary.metrics.totalInvoices).toBe(3);
    expect(summary.metrics.totalOrders).toBe(5);
  });
});
