// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApiQuotasService } from "./api-quotas.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    apiQuotaPolicy: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("ApiQuotasService", () => {
  let service: ApiQuotasService;

  beforeEach(() => {
    service = new ApiQuotasService();
    vi.clearAllMocks();
  });

  it("should return quota policies", async () => {
    (prisma.apiQuotaPolicy.findMany as any).mockResolvedValue([
      { clientAppId: "app-101", dailyCallQuota: 10000 },
    ]);

    const res = await service.getQuotaPolicies("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should increment call counters", async () => {
    (prisma.apiQuotaPolicy.findFirst as any).mockResolvedValue({
      id: "qp1",
      clientAppId: "app-101",
    });
    (prisma.apiQuotaPolicy.update as any).mockResolvedValue({
      id: "qp1",
      callsToday: 1,
    });

    const res = await service.recordApiCall("tenant1", "app-101");
    expect(res).toBeDefined();
  });
});
