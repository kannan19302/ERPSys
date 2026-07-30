// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PeopleCompetenciesService } from "./people-competencies.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    peopleCompetency: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PeopleCompetenciesService", () => {
  let service: PeopleCompetenciesService;

  beforeEach(() => {
    service = new PeopleCompetenciesService();
    vi.clearAllMocks();
  });

  it("should get competencies with pagination", async () => {
    (prisma.peopleCompetency.findMany as any).mockResolvedValue([
      { id: "c1", name: "TypeScript" },
    ]);
    (prisma.peopleCompetency.count as any).mockResolvedValue(1);

    const res = await service.getCompetencies("tenant1", {
      page: 1,
      limit: 10,
    });
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("should create competency", async () => {
    (prisma.peopleCompetency.create as any).mockResolvedValue({
      id: "c1",
      name: "Leadership",
      tenantId: "tenant1",
    });

    const res = await service.createCompetency("tenant1", {
      name: "Leadership",
    });
    expect(res.id).toBe("c1");
  });
});
