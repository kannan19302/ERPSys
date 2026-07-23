import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinancialInstrumentsService } from "../services/financial-instruments.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({ Prisma: { Decimal: class Decimal { private v: number; constructor(val: unknown) { this.v = Number(val); } valueOf() { return this.v; } } } }));
vi.mock("@unerp/database", () => {
  const m = () => ({ findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() });
  return { prisma: { fairValueMeasurement: m(), expectedCreditLossProvision: m() } };
});

describe("FinancialInstrumentsService", () => {
  let service: FinancialInstrumentsService;
  beforeEach(() => { vi.clearAllMocks(); service = new FinancialInstrumentsService(); });

  it("getFairValueMeasurements returns measurements", async () => {
    vi.mocked(prisma.fairValueMeasurement.findMany).mockResolvedValue([{ id: "fv-1" }] as any);
    const result = await service.getFairValueMeasurements("t1");
    expect(result).toHaveLength(1);
  });

  it("getFairValueMeasurementById throws on not found", async () => {
    vi.mocked(prisma.fairValueMeasurement.findFirst).mockResolvedValue(null);
    await expect(service.getFairValueMeasurementById("t1", "bad")).rejects.toThrow(NotFoundException);
  });

  it("createFairValueMeasurement computes unrealized GL", async () => {
    vi.mocked(prisma.fairValueMeasurement.create).mockResolvedValue({ id: "fv-1" } as any);
    const result = await service.createFairValueMeasurement("t1", "o1", { instrumentType: "EQUITY", instrumentId: "inst-1", measurementDate: "2026-06-30", fairValue: 120, costBasis: 100, hierarchyLevel: "LEVEL_1" });
    expect(result.id).toBe("fv-1");
  });

  it("getLatestMeasurement throws if no measurements", async () => {
    vi.mocked(prisma.fairValueMeasurement.findFirst).mockResolvedValue(null);
    await expect(service.getLatestMeasurement("t1", "EQUITY", "inst-1")).rejects.toThrow(NotFoundException);
  });

  it("getFairValueHierarchySummary aggregates by level", async () => {
    vi.mocked(prisma.fairValueMeasurement.findMany).mockResolvedValue([{ fairValue: 100, unrealizedGL: 10, hierarchyLevel: "LEVEL_1" }, { fairValue: 200, unrealizedGL: 20, hierarchyLevel: "LEVEL_2" }] as any);
    const result = await service.getFairValueHierarchySummary("t1", "o1");
    expect(result.totalFairValue).toBe(300);
    expect(result.level1).toBe(100);
    expect(result.level2).toBe(200);
  });

  it("getExpectedCreditLossProvisions returns provisions", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.findMany).mockResolvedValue([{ id: "ecl-1" }] as any);
    const result = await service.getExpectedCreditLossProvisions("t1");
    expect(result).toHaveLength(1);
  });

  it("createExpectedCreditLossProvision computes expected loss", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.create).mockResolvedValue({ id: "ecl-1" } as any);
    const result = await service.createExpectedCreditLossProvision("t1", "o1", { provisionDate: "2026-06-30", period: "2026-06", stage: "STAGE_1", grossCarryingAmount: 10000, lossRate: 0.02, methodology: "ROLL_RATE", portfolio: "TRADE_RECEIVABLES" });
    expect(result.id).toBe("ecl-1");
  });

  it("reviewExpectedCreditLossProvision throws if not draft", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.findFirst).mockResolvedValue({ id: "ecl-1", status: "REVIEWED" } as any);
    await expect(service.reviewExpectedCreditLossProvision("t1", "ecl-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("getECLSummary aggregates by stage", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.findMany).mockResolvedValue([{ stage: "STAGE_1", grossCarryingAmount: 10000, expectedLoss: 200, allowanceBalance: 200, chargeToPL: 200 }] as any);
    const result = await service.getECLSummary("t1", "o1", "2026-06");
    expect(result.totalGrossExposure).toBe(10000);
    expect(result.stage1.count).toBe(1);
  });

  it("computeLossRate returns avg loss rate", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.findMany).mockResolvedValue([{ lossRate: 0.02 }, { lossRate: 0.03 }] as any);
    const result = await service.computeLossRate("t1", "o1", "TRADE_RECEIVABLES");
    expect(result.averageLossRate).toBe(0.025);
  });

  it("getAllECLDashboard returns dashboard data", async () => {
    vi.mocked(prisma.expectedCreditLossProvision.findMany).mockResolvedValue([{ allowanceBalance: 500, status: "DRAFT", portfolio: "TRADE_RECEIVABLES" }] as any);
    const result = await service.getAllECLDashboard("t1", "o1");
    expect(result.totalAllowance).toBe(500);
  });
});
