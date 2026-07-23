import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal { constructor(value: unknown) { return Number(value); } },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    commissionSpiff: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    teamSplit: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    commissionPayout: { findFirst: vi.fn(), update: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
    salesPartnerDealRegistration: { findMany: vi.fn() },
    salesOrder: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesSpiffService } from "../sales-spiff.service";

describe("SalesSpiffService", () => {
  let service: SalesSpiffService;

  beforeEach(() => { service = new SalesSpiffService(); vi.clearAllMocks(); });

  it("should list SPIFF campaigns", async () => {
    vi.mocked(prisma.commissionSpiff.findMany).mockResolvedValue([{ id: "spiff-1", name: "Q4 Bonus" }] as never);
    const result = await service.getSpiffCampaigns("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("should create SPIFF campaign", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.commissionSpiff.create).mockResolvedValue({ id: "spiff-1", name: "New Deal Bonus" } as never);
    const dto = { name: "New Deal Bonus", criteriaType: "DEAL_SIZE_ABOVE", criteriaValue: { threshold: 50000 }, bonusType: "FLAT", bonusAmount: 1000 };
    const result = await service.createSpiffCampaign("tenant-1", "org-1", dto);
    expect(result.name).toBe("New Deal Bonus");
  });

  it("should update SPIFF campaign", async () => {
    vi.mocked(prisma.commissionSpiff.findFirst).mockResolvedValue({ id: "spiff-1" } as never);
    vi.mocked(prisma.commissionSpiff.update).mockResolvedValue({ id: "spiff-1", name: "Updated" } as never);
    const result = await service.updateSpiffCampaign("tenant-1", "spiff-1", { name: "Updated" });
    expect(result).toBeDefined();
  });

  it("should delete SPIFF campaign", async () => {
    vi.mocked(prisma.commissionSpiff.findFirst).mockResolvedValue({ id: "spiff-1" } as never);
    vi.mocked(prisma.commissionSpiff.delete).mockResolvedValue({ id: "spiff-1" } as never);
    await service.deleteSpiffCampaign("tenant-1", "spiff-1");
    expect(prisma.commissionSpiff.delete).toHaveBeenCalled();
  });

  it("should create team split", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.teamSplit.create).mockResolvedValue({ id: "ts-1", name: "50/50 Split", members: [] } as never);
    const dto = { name: "50/50 Split", splitType: "EQUAL", members: [{ userId: "u1", share: 50 }, { userId: "u2", share: 50 }] };
    const result = await service.createTeamSplit("tenant-1", "org-1", dto);
    expect(result).toBeDefined();
  });

  it("should process clawback", async () => {
    vi.mocked(prisma.commissionPayout.findFirst).mockResolvedValue({ id: "po-1", totalPayout: 5000, status: "DRAFT" } as never);
    vi.mocked(prisma.commissionPayout.update).mockResolvedValue({ id: "po-1" } as never);
    const result = await service.processClawback("tenant-1", { payoutId: "po-1", amount: 1000, reason: "Order returned" });
    expect(result).toBeDefined();
  });

  it("should return dashboard stats", async () => {
    vi.mocked(prisma.commissionSpiff.count).mockResolvedValue(5);
    vi.mocked(prisma.commissionPayout.aggregate).mockResolvedValue({ _sum: { spiffBonus: 50000 } } as never);
    vi.mocked(prisma.commissionPayout.count).mockResolvedValue(3);
    const result = await service.getSpiffDashboard("tenant-1");
    expect(result.activeCampaigns).toBe(5);
    expect(result.pendingApprovals).toBe(3);
  });

  it("should calculate SPIFF eligibility", async () => {
    vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({ id: "so-1", totalAmount: 100000 } as never);
    vi.mocked(prisma.commissionSpiff.findMany).mockResolvedValue([{ id: "spiff-1", name: "Big Deal Bonus", criteriaType: "DEAL_SIZE_ABOVE", bonusType: "FLAT", bonusAmount: 2000, criteriaValue: { threshold: 50000 } }] as never);
    const result = await service.calculateSpiffEligibility("tenant-1", "so-1");
    expect(result.matchedSpiffs).toHaveLength(1);
    expect(result.totalBonus).toBe(2000);
  });
});
