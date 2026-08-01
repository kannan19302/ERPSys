import { describe, it, expect, beforeEach, vi } from "vitest";
import { SavedViewsFiltersService } from "./saved-views-filters.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    savedViewFilterRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    savedViewPreference: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("SavedViewsFiltersService", () => {
  let service: SavedViewsFiltersService;

  beforeEach(() => {
    service = new SavedViewsFiltersService();
    vi.clearAllMocks();
  });

  it("should return filter rules for view", async () => {
    (prisma.savedViewFilterRule.findMany as any).mockResolvedValue([
      { field: "status", operator: "EQUALS", value: "ACTIVE" },
    ]);

    const res = await service.getFilterRules("tenant1", "v1");
    expect(res).toHaveLength(1);
  });

  it("should set preferred view", async () => {
    (prisma.savedViewPreference.upsert as any).mockResolvedValue({
      moduleName: "sales",
      defaultViewId: "v1",
    });

    const res = await service.setPreferredView("tenant1", "u1", "sales", "v1");
    expect(res.defaultViewId).toBe("v1");
  });
});
