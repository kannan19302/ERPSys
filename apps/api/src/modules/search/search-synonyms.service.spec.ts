import { describe, it, expect, beforeEach, vi } from "vitest";
import { SearchSynonymsService } from "./search-synonyms.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => ({
  prisma: {
    searchSynonymGroup: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("SearchSynonymsService", () => {
  let service: SearchSynonymsService;

  beforeEach(() => {
    service = new SearchSynonymsService();
    vi.clearAllMocks();
  });

  it("should return synonym groups", async () => {
    (prisma.searchSynonymGroup.findMany as any).mockResolvedValue([
      { name: "Orders", synonyms: ["PO", "Order", "Purchase"] },
    ]);

    const res = await service.getSynonymGroups("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should create synonym group", async () => {
    (prisma.searchSynonymGroup.create as any).mockResolvedValue({
      id: "sg1",
      name: "Procurement",
    });

    const res = await service.createSynonymGroup("tenant1", {
      name: "Procurement",
      synonyms: ["PO", "Buying"],
    });
    expect(res.id).toBe("sg1");
  });
});
