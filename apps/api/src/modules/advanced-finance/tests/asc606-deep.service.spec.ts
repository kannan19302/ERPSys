import { describe, it, expect, vi, beforeEach } from "vitest";
import { Asc606DeepService } from "../services/asc606-deep.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({ Prisma: { Decimal: class Decimal { private v: number; constructor(val: unknown) { this.v = Number(val); } valueOf() { return this.v; } } } }));
vi.mock("@unerp/database", () => {
  const m = () => ({ findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn(), count: vi.fn() });
  return { prisma: { performanceObligation: m(), asc606ContractModification: m(), asc606DeferredRevenueRollForward: m(), revenueSchedule: m() } };
});

describe("Asc606DeepService", () => {
  let service: Asc606DeepService;
  beforeEach(() => { vi.clearAllMocks(); service = new Asc606DeepService(); });

  it("getPerformanceObligations returns obligations", async () => {
    vi.mocked(prisma.performanceObligation.findMany).mockResolvedValue([{ id: "po-1" }] as any);
    const result = await service.getPerformanceObligations("t1");
    expect(result).toHaveLength(1);
  });

  it("getPerformanceObligationById throws on not found", async () => {
    vi.mocked(prisma.performanceObligation.findFirst).mockResolvedValue(null);
    await expect(service.getPerformanceObligationById("t1", "bad")).rejects.toThrow(NotFoundException);
  });

  it("createPerformanceObligation creates record", async () => {
    vi.mocked(prisma.performanceObligation.create).mockResolvedValue({ id: "po-1" } as any);
    const result = await service.createPerformanceObligation("t1", "o1", { description: "test", transactionPrice: 1000, obligationType: "GOODS", satisfactionTiming: "POINT_IN_TIME", startDate: "2026-01-01" });
    expect(result.id).toBe("po-1");
  });

  it("satisfyPerformanceObligation throws if already satisfied", async () => {
    vi.mocked(prisma.performanceObligation.findFirst).mockResolvedValue({ id: "po-1", status: "SATISFIED" } as any);
    await expect(service.satisfyPerformanceObligation("t1", "po-1")).rejects.toThrow(BadRequestException);
  });

  it("allocateTransactionPrice allocates by SSP", async () => {
    vi.mocked(prisma.performanceObligation.findMany).mockResolvedValue([{ id: "po-1", ssp: new Prisma.Decimal(60), transactionPrice: new Prisma.Decimal(30), description: "A" } as any]);
    vi.mocked(prisma.performanceObligation.update).mockResolvedValue({} as any);
    const result = await service.allocateTransactionPrice("t1", "o1", "C-001");
    expect(result.allocations).toHaveLength(1);
  });

  it("getContractModifications returns modifications", async () => {
    vi.mocked(prisma.contractModification.findMany).mockResolvedValue([{ id: "cm-1" }] as any);
    const result = await service.getContractModifications("t1");
    expect(result).toHaveLength(1);
  });

  it("createContractModification creates record", async () => {
    vi.mocked(prisma.contractModification.create).mockResolvedValue({ id: "cm-1" } as any);
    const result = await service.createContractModification("t1", "o1", { contractRef: "C-001", modNumber: "M1", modificationDate: "2026-06-01", modType: "PRICE_CHANGE", originalConsideration: 100, modifiedConsideration: 120, accountingMethod: "PROSPECTIVE" });
    expect(result.id).toBe("cm-1");
  });

  it("approveContractModification throws if not draft", async () => {
    vi.mocked(prisma.contractModification.findFirst).mockResolvedValue({ id: "cm-1", status: "APPROVED" } as any);
    await expect(service.approveContractModification("t1", "cm-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("applyContractModification throws if not approved", async () => {
    vi.mocked(prisma.contractModification.findFirst).mockResolvedValue({ id: "cm-1", status: "DRAFT" } as any);
    await expect(service.applyContractModification("t1", "cm-1")).rejects.toThrow(BadRequestException);
  });

  it("getDeferredRevenueRollForwards returns roll-forwards", async () => {
    vi.mocked(prisma.deferredRevenueRollForward.findMany).mockResolvedValue([{ id: "rf-1" }] as any);
    const result = await service.getDeferredRevenueRollForwards("t1");
    expect(result).toHaveLength(1);
  });

  it("createDeferredRevenueRollForward computes balances", async () => {
    vi.mocked(prisma.deferredRevenueRollForward.create).mockResolvedValue({ id: "rf-1" } as any);
    const result = await service.createDeferredRevenueRollForward("t1", "o1", { period: "2026-07", openingBalance: 1000, additions: 500, recognized: 300 });
    expect(result.id).toBe("rf-1");
  });

  it("computeRollForwardFromSchedules upserts roll-forward", async () => {
    vi.mocked(prisma.revenueSchedule.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.deferredRevenueRollForward.upsert).mockResolvedValue({ id: "rf-1" } as any);
    const result = await service.computeRollForwardFromSchedules("t1", "o1", "2026-07");
    expect(result.id).toBe("rf-1");
  });

  it("getMultiElementSummary aggregates obligations", async () => {
    vi.mocked(prisma.performanceObligation.findMany).mockResolvedValue([{ transactionPrice: 100, allocatedAmount: 100, revenueRecognized: 40, revenueDeferred: 60, status: "ACTIVE" }] as any);
    const result = await service.getMultiElementSummary("t1");
    expect(result.totalObligations).toBe(1);
    expect(result.totalPrice).toBe(100);
  });

  it("getRevenueAging returns aging buckets", async () => {
    vi.mocked(prisma.revenueSchedule.findMany).mockResolvedValue([{ deferredAmount: 500, endDate: new Date("2025-01-01"), status: "ACTIVE" }] as any);
    const result = await service.getRevenueAging("t1", "o1");
    expect(result.totalDeferred).toBe(500);
  });

  it("getRevenueForecast returns monthly forecast", async () => {
    vi.mocked(prisma.revenueSchedule.findMany).mockResolvedValue([{ totalAmount: 1200, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), status: "ACTIVE" }] as any);
    const result = await service.getRevenueForecast("t1", "o1", 3);
    expect(result).toHaveLength(3);
  });

  it("getContractRevenueSummary summarizes contract", async () => {
    vi.mocked(prisma.performanceObligation.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.contractModification.findMany).mockResolvedValue([] as any);
    const result = await service.getContractRevenueSummary("t1", "C-001");
    expect(result.contractRef).toBe("C-001");
  });

  it("getAsc606Dashboard returns dashboard data", async () => {
    vi.mocked(prisma.performanceObligation.findMany).mockResolvedValue([{ revenueDeferred: 100, revenueRecognized: 50, status: "ACTIVE" }] as any);
    vi.mocked(prisma.deferredRevenueRollForward.findMany).mockResolvedValue([] as any);
    const result = await service.getAsc606Dashboard("t1", "o1");
    expect(result.totalDeferred).toBe(100);
  });
});
