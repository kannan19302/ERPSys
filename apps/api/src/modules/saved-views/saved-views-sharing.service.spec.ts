import { describe, it, expect, beforeEach, vi } from "vitest";
import { SavedViewsSharingService } from "./saved-views-sharing.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    savedViewShare: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("SavedViewsSharingService", () => {
  let service: SavedViewsSharingService;

  beforeEach(() => {
    service = new SavedViewsSharingService();
    vi.clearAllMocks();
  });

  it("should return shares for view", async () => {
    (prisma.savedViewShare.findMany as any).mockResolvedValue([
      { viewId: "v1", sharedWith: "role:SALES_MANAGER" },
    ]);

    const res = await service.getSharesForView("tenant1", "v1");
    expect(res).toHaveLength(1);
  });

  it("should share view", async () => {
    (prisma.savedViewShare.create as any).mockResolvedValue({
      id: "svs1",
      sharedWith: "user2",
    });

    const res = await service.shareView("tenant1", "v1", "user2");
    expect(res.id).toBe("svs1");
  });
});
