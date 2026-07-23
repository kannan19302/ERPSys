import { describe, it, expect, vi, beforeEach } from "vitest";
import { GlobalTaxDeepService } from "../services/global-tax-deep.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({ Prisma: { Decimal: class Decimal { private v: number; constructor(val: unknown) { this.v = Number(val); } valueOf() { return this.v; } } } }));
vi.mock("@unerp/database", () => {
  const m = () => ({ findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn(), distinct: vi.fn() });
  return { prisma: { transferPricingPolicy: m(), transferPricingAdjustment: m(), apportionmentFactor: m() } };
});

describe("GlobalTaxDeepService", () => {
  let service: GlobalTaxDeepService;
  beforeEach(() => { vi.clearAllMocks(); service = new GlobalTaxDeepService(); });

  it("getTransferPricingPolicies returns policies", async () => {
    vi.mocked(prisma.transferPricingPolicy.findMany).mockResolvedValue([{ id: "tp-1" }] as any);
    const result = await service.getTransferPricingPolicies("t1");
    expect(result).toHaveLength(1);
  });

  it("getTransferPricingPolicyById throws on not found", async () => {
    vi.mocked(prisma.transferPricingPolicy.findFirst).mockResolvedValue(null);
    await expect(service.getTransferPricingPolicyById("t1", "bad")).rejects.toThrow(NotFoundException);
  });

  it("createTransferPricingPolicy creates record", async () => {
    vi.mocked(prisma.transferPricingPolicy.create).mockResolvedValue({ id: "tp-1" } as any);
    const result = await service.createTransferPricingPolicy("t1", "o1", { policyName: "IP Royalty", policyType: "ROYALTIES", method: "CUP", effectiveFrom: "2026-01-01" });
    expect(result.id).toBe("tp-1");
  });

  it("approveTransferPricingPolicy updates status", async () => {
    vi.mocked(prisma.transferPricingPolicy.findFirst).mockResolvedValue({ id: "tp-1", isActive: false } as any);
    vi.mocked(prisma.transferPricingPolicy.update).mockResolvedValue({ id: "tp-1", isActive: true } as any);
    const result = await service.approveTransferPricingPolicy("t1", "tp-1", "user1");
    expect(result).toBeDefined();
  });

  it("getTransferPricingAdjustments returns adjustments", async () => {
    vi.mocked(prisma.transferPricingAdjustment.findMany).mockResolvedValue([{ id: "adj-1" }] as any);
    const result = await service.getTransferPricingAdjustments("t1");
    expect(result).toHaveLength(1);
  });

  it("createTransferPricingAdjustment computes direction", async () => {
    vi.mocked(prisma.transferPricingPolicy.findFirst).mockResolvedValue({ id: "tp-1" } as any);
    vi.mocked(prisma.transferPricingAdjustment.create).mockResolvedValue({ id: "adj-1", adjustmentDirection: "INCREASE" } as any);
    const result = await service.createTransferPricingAdjustment("t1", "o1", { policyId: "tp-1", adjustmentDate: "2026-06-01", fiscalYear: "2026", relatedPartyId: "rp-1", transactionType: "GOODS", originalAmount: 100, adjustedAmount: 120 });
    expect(result.id).toBe("adj-1");
  });

  it("reviewTransferPricingAdjustment throws if not draft", async () => {
    vi.mocked(prisma.transferPricingAdjustment.findFirst).mockResolvedValue({ id: "adj-1", status: "REVIEWED" } as any);
    await expect(service.reviewTransferPricingAdjustment("t1", "adj-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("approveTransferPricingAdjustment throws if not reviewed", async () => {
    vi.mocked(prisma.transferPricingAdjustment.findFirst).mockResolvedValue({ id: "adj-1", status: "DRAFT" } as any);
    await expect(service.approveTransferPricingAdjustment("t1", "adj-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("postTransferPricingAdjustment throws if not approved", async () => {
    vi.mocked(prisma.transferPricingAdjustment.findFirst).mockResolvedValue({ id: "adj-1", status: "DRAFT" } as any);
    await expect(service.postTransferPricingAdjustment("t1", "adj-1")).rejects.toThrow(BadRequestException);
  });

  it("getApportionmentFactors returns factors", async () => {
    vi.mocked(prisma.apportionmentFactor.findMany).mockResolvedValue([{ id: "af-1" }] as any);
    const result = await service.getApportionmentFactors("t1");
    expect(result).toHaveLength(1);
  });

  it("createApportionmentFactor computes factor pct", async () => {
    vi.mocked(prisma.apportionmentFactor.create).mockResolvedValue({ id: "af-1" } as any);
    const result = await service.createApportionmentFactor("t1", "o1", { fiscalYear: "2026", jurisdiction: "CA", factorType: "SALES", numerator: 500000, denominator: 1000000 });
    expect(result.id).toBe("af-1");
  });

  it("computeEffectiveApportionment aggregates factors by jurisdiction", async () => {
    vi.mocked(prisma.apportionmentFactor.findMany).mockResolvedValue([{ jurisdiction: "CA", factorType: "SALES", factorPct: new Prisma.Decimal(0.25) } as any, { jurisdiction: "CA", factorType: "PROPERTY", factorPct: new Prisma.Decimal(0.15) } as any]);
    const result = await service.computeEffectiveApportionment("t1", "o1", "2026");
    expect(result.jurisdictions).toHaveLength(1);
  });

  it("computeEffectiveApportionment throws if no factors", async () => {
    vi.mocked(prisma.apportionmentFactor.findMany).mockResolvedValue([]);
    await expect(service.computeEffectiveApportionment("t1", "o1", "2026")).rejects.toThrow(NotFoundException);
  });

  it("getTaxComplianceDashboard returns dashboard data", async () => {
    vi.mocked(prisma.transferPricingPolicy.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.transferPricingAdjustment.count).mockResolvedValue(0);
    vi.mocked(prisma.apportionmentFactor.findMany).mockResolvedValue([] as any);
    const result = await service.getTaxComplianceDashboard("t1", "o1");
    expect(result.activePolicies).toBe(0);
  });

  it("getTransferPricingSummary aggregates by status", async () => {
    vi.mocked(prisma.transferPricingPolicy.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.transferPricingAdjustment.findMany).mockResolvedValue([{ adjustmentAmount: 100, status: "DRAFT" }] as any);
    const result = await service.getTransferPricingSummary("t1", "o1", "2026");
    expect(result.totalAdjustmentAmount).toBe(100);
  });
});
