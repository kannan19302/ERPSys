// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PwaPushService } from "./pwa-push.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    pwaPushSubscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("PwaPushService", () => {
  let service: PwaPushService;

  beforeEach(() => {
    service = new PwaPushService();
    vi.clearAllMocks();
  });

  it("should return active subscriptions", async () => {
    (prisma.pwaPushSubscription.findMany as any).mockResolvedValue([
      { userId: "u1", endpoint: "https://push.example.com/123" },
    ]);

    const res = await service.getSubscriptions("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should save push subscription", async () => {
    (prisma.pwaPushSubscription.findFirst as any).mockResolvedValue(null);
    (prisma.pwaPushSubscription.create as any).mockResolvedValue({
      id: "ps1",
      endpoint: "https://push.example.com/123",
    });

    const res = await service.saveSubscription("tenant1", "u1", {
      endpoint: "https://push.example.com/123",
      p256dhKey: "key1",
      authKey: "auth1",
    });
    expect(res.id).toBe("ps1");
  });
});
