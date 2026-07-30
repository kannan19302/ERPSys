// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PwaSyncService } from "./pwa-sync.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    pwaOfflineSyncQueue: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PwaSyncService", () => {
  let service: PwaSyncService;

  beforeEach(() => {
    service = new PwaSyncService();
    vi.clearAllMocks();
  });

  it("should return user sync queue", async () => {
    (prisma.pwaOfflineSyncQueue.findMany as any).mockResolvedValue([
      { actionType: "CREATE_ORDER", status: "PENDING" },
    ]);

    const res = await service.getSyncQueue("tenant1", "u1");
    expect(res).toHaveLength(1);
  });

  it("should enqueue offline action", async () => {
    (prisma.pwaOfflineSyncQueue.create as any).mockResolvedValue({
      id: "sq1",
      actionType: "CLOCK_IN",
    });

    const res = await service.enqueueOfflineAction("tenant1", "u1", {
      actionType: "CLOCK_IN",
      payload: { time: "2026-07-27T10:00:00Z" },
    });
    expect(res.id).toBe("sq1");
  });
});
