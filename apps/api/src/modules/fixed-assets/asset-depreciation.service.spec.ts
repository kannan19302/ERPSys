import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssetDepreciationService } from "./asset-depreciation.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => ({
  prisma: {
    assetDepreciationSchedule: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("AssetDepreciationService", () => {
  let service: AssetDepreciationService;

  beforeEach(() => {
    service = new AssetDepreciationService();
    vi.clearAllMocks();
  });

  it("should return depreciation schedules", async () => {
    (prisma.assetDepreciationSchedule.findMany as any).mockResolvedValue([
      { assetId: "a1", period: "2026-01" },
    ]);
    (prisma.assetDepreciationSchedule.count as any).mockResolvedValue(1);

    const res = await service.getSchedules("tenant1", {});
    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
  });

  it("should post schedule", async () => {
    (prisma.assetDepreciationSchedule.findFirst as any).mockResolvedValue({
      id: "ds1",
      isPosted: false,
    });
    (prisma.assetDepreciationSchedule.update as any).mockResolvedValue({
      id: "ds1",
      isPosted: true,
    });

    const res = await service.postSchedule("tenant1", "ds1");
    expect(res.isPosted).toBe(true);
  });
});
