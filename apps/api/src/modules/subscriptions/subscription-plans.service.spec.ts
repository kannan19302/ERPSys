import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => ({
  prisma: {
    subscriptionPlanTier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("SubscriptionPlansService", () => {
  let service: SubscriptionPlansService;

  beforeEach(() => {
    service = new SubscriptionPlansService();
    vi.clearAllMocks();
  });

  it("should return plan tiers", async () => {
    (prisma.subscriptionPlanTier.findMany as any).mockResolvedValue([
      { name: "Pro Plan", monthlyPrice: 49 },
    ]);

    const res = await service.getPlanTiers("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should create plan tier", async () => {
    (prisma.subscriptionPlanTier.create as any).mockResolvedValue({
      id: "pt1",
      name: "Enterprise",
    });

    const res = await service.createPlanTier("tenant1", {
      name: "Enterprise",
      code: "ENT",
      monthlyPrice: 299,
      annualPrice: 2990,
    });
    expect(res.id).toBe("pt1");
  });
});
