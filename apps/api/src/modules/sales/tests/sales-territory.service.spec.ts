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
    salesTerritory: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    salesTeamMember: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn(), update: vi.fn(), count: vi.fn() },
    territoryAssignmentRule: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    territoryAssignmentLog: { findMany: vi.fn(), create: vi.fn() },
    salesTerritoryForecast: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    salesTerritoryRealignment: { create: vi.fn() },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesTerritoryService } from "../sales-territory.service";

describe("SalesTerritoryService", () => {
  let service: SalesTerritoryService;

  beforeEach(() => { service = new SalesTerritoryService(); vi.clearAllMocks(); });

  it("should list territories", async () => {
    vi.mocked(prisma.salesTerritory.findMany).mockResolvedValue([{ id: "t1", name: "North America", _count: { members: 5, children: 2 }, parent: null }] as never);
    const result = await service.getTerritories("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("should get territory by id", async () => {
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1", name: "North America", parent: null, children: [], members: [], rules: [], forecasts: [], realignments: [] } as never);
    const result = await service.getTerritoryById("tenant-1", "t1");
    expect(result.name).toBe("North America");
  });

  it("should create territory", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.salesTerritory.create).mockResolvedValue({ id: "t1", name: "EMEA" } as never);
    const result = await service.createTerritory("tenant-1", "org-1", { name: "EMEA" });
    expect(result.name).toBe("EMEA");
  });

  it("should add and remove member", async () => {
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.salesTeamMember.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.salesTeamMember.create).mockResolvedValue({ id: "m1" } as never);
    await service.addMember("tenant-1", "t1", { userId: "u1" });

    vi.mocked(prisma.salesTeamMember.findFirst).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.salesTeamMember.delete).mockResolvedValue({} as never);
    await service.removeMember("tenant-1", "t1", "u1");
    expect(prisma.salesTeamMember.delete).toHaveBeenCalled();
  });

  it("should create assignment rule", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.territoryAssignmentRule.create).mockResolvedValue({ id: "r1" } as never);
    const result = await service.createRule("tenant-1", "org-1", { territoryId: "t1", name: "West Coast Rule", ruleType: "GEOGRAPHY" });
    expect(result).toBeDefined();
  });

  it("should assign entity to territory", async () => {
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1" } as never);
    const result = await service.assignEntity("tenant-1", { territoryId: "t1", entityType: "LEAD", entityIds: ["e1", "e2"] });
    expect(result.assigned).toBe(2);
  });

  it("should create forecast", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.salesTerritoryForecast.create).mockResolvedValue({ id: "f1", period: "2026-Q3" } as never);
    const result = await service.createForecast("tenant-1", "org-1", { territoryId: "t1", period: "2026-Q3", forecastValue: 500000 });
    expect(result.period).toBe("2026-Q3");
  });

  it("should realign territory", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.salesTerritory.findFirst).mockResolvedValue({ id: "t1", parentId: "parent-1", managerId: "old-mgr" } as never);
    vi.mocked(prisma.salesTerritory.update).mockResolvedValue({ id: "t1" } as never);
    const result = await service.realignTerritory("tenant-1", "org-1", { territoryId: "t1", newManagerId: "new-mgr", reason: "Reorg" }, "user-1");
    expect(result).toBeDefined();
  });

  it("should return territory analytics", async () => {
    vi.mocked(prisma.salesTerritory.count).mockResolvedValue(5);
    vi.mocked(prisma.salesTeamMember.count).mockResolvedValue(20);
    vi.mocked(prisma.territoryAssignmentRule.count).mockResolvedValue(8);
    vi.mocked(prisma.salesTerritoryForecast.count).mockResolvedValue(12);
    vi.mocked(prisma.salesTerritoryForecast.findMany).mockResolvedValue([{ pipelineValue: 1000000, forecastValue: 800000 }] as never);
    const result = await service.getTerritoryAnalytics("tenant-1");
    expect(result.totalTerritories).toBe(5);
    expect(result.totalMembers).toBe(20);
  });
});
