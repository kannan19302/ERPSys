// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchConfigService } from "./search-config.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    searchIndexConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("SearchConfigService", () => {
  let service: SearchConfigService;

  beforeEach(() => {
    service = new SearchConfigService();
    vi.clearAllMocks();
  });

  it("should return index configs", async () => {
    (prisma.searchIndexConfig.findMany as any).mockResolvedValue([
      { entityType: "Customer", searchableFields: ["name", "email"] },
    ]);

    const res = await service.getIndexConfigs("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should upsert index config", async () => {
    (prisma.searchIndexConfig.upsert as any).mockResolvedValue({
      entityType: "Product",
      searchableFields: ["name", "sku"],
    });

    const res = await service.upsertIndexConfig("tenant1", "Product", {
      searchableFields: ["name", "sku"],
    });
    expect(res.entityType).toBe("Product");
  });
});
