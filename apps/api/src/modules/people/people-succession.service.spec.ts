import { describe, it, expect, beforeEach, vi } from "vitest";
import { PeopleSuccessionService } from "./people-succession.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    peopleSuccessionPlan: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PeopleSuccessionService", () => {
  let service: PeopleSuccessionService;

  beforeEach(() => {
    service = new PeopleSuccessionService();
    vi.clearAllMocks();
  });

  it("should list succession plans", async () => {
    (prisma.peopleSuccessionPlan.findMany as any).mockResolvedValue([
      { id: "sp1", positionTitle: "CTO" },
    ]);
    (prisma.peopleSuccessionPlan.count as any).mockResolvedValue(1);

    const res = await service.getSuccessionPlans("tenant1", {});
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("should create succession plan", async () => {
    (prisma.peopleSuccessionPlan.create as any).mockResolvedValue({
      id: "sp1",
      positionTitle: "VP Engineering",
    });

    const res = await service.createSuccessionPlan("tenant1", {
      positionTitle: "VP Engineering",
    });
    expect(res.id).toBe("sp1");
  });
});
