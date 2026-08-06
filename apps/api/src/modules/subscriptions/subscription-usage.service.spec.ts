import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionUsageService } from "./subscription-usage.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => ({
  prisma: {
    subscriptionUsageBilling: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("SubscriptionUsageService", () => {
  let service: SubscriptionUsageService;

  beforeEach(() => {
    service = new SubscriptionUsageService();
    vi.clearAllMocks();
  });

  it("should return usage records", async () => {
    (prisma.subscriptionUsageBilling.findMany as any).mockResolvedValue([
      { subscriptionId: "sub1", metricName: "API_CALLS", unitsConsumed: 500 },
    ]);
    (prisma.subscriptionUsageBilling.count as any).mockResolvedValue(1);

    const res = await service.getUsageRecords("tenant1", {});
    expect(res.data).toHaveLength(1);
  });

  it("should record usage", async () => {
    (prisma.subscriptionUsageBilling.create as any).mockResolvedValue({
      id: "ub1",
      subscriptionId: "sub1",
    });

    const res = await service.recordUsage("tenant1", {
      subscriptionId: "sub1",
      metricName: "STORAGE_GB",
      unitsConsumed: 10,
      billingPeriod: "2026-07",
    });
    expect(res.id).toBe("ub1");
  });
});
