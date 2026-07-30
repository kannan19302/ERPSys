// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { StoragePoliciesService } from "./storage-policies.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    storageAccessPolicy: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    storageLifecycleRule: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("StoragePoliciesService", () => {
  let service: StoragePoliciesService;

  beforeEach(() => {
    service = new StoragePoliciesService();
    vi.clearAllMocks();
  });

  it("should return access policies", async () => {
    (prisma.storageAccessPolicy.findMany as any).mockResolvedValue([
      { bucketName: "docs", roleOrUser: "ADMIN", permission: "ADMIN" },
    ]);

    const res = await service.getAccessPolicies("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should create lifecycle rule", async () => {
    (prisma.storageLifecycleRule.create as any).mockResolvedValue({
      id: "lr1",
      ruleName: "Archive after 30 days",
    });

    const res = await service.createLifecycleRule("tenant1", {
      bucketName: "logs",
      ruleName: "Archive after 30 days",
      transitionDays: 30,
      storageClass: "GLACIER",
    });
    expect(res.id).toBe("lr1");
  });
});
