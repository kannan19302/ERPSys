import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApiRateLimitsService } from "./api-rate-limits.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => ({
  prisma: {
    apiRateLimitRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("ApiRateLimitsService", () => {
  let service: ApiRateLimitsService;

  beforeEach(() => {
    service = new ApiRateLimitsService();
    vi.clearAllMocks();
  });

  it("should return rate limit rules", async () => {
    (prisma.apiRateLimitRule.findMany as any).mockResolvedValue([
      { endpointPath: "/api/v1/sales/*", limitPerMinute: 60 },
    ]);

    const res = await service.getRateLimitRules("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should create rate limit rule", async () => {
    (prisma.apiRateLimitRule.create as any).mockResolvedValue({
      id: "rl1",
      endpointPath: "/api/v1/crm/*",
    });

    const res = await service.createRateLimitRule("tenant1", {
      name: "CRM Standard Tier",
      endpointPath: "/api/v1/crm/*",
    });
    expect(res.id).toBe("rl1");
  });
});
