import { describe, it, expect, beforeEach, vi } from "vitest";
import { StorageBucketsService } from "./storage-buckets.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    storageBucketConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("StorageBucketsService", () => {
  let service: StorageBucketsService;

  beforeEach(() => {
    service = new StorageBucketsService();
    vi.clearAllMocks();
  });

  it("should return buckets", async () => {
    (prisma.storageBucketConfig.findMany as any).mockResolvedValue([
      { bucketName: "tenant-documents", provider: "S3" },
    ]);

    const res = await service.getBuckets("tenant1");
    expect(res).toHaveLength(1);
  });

  it("should create bucket", async () => {
    (prisma.storageBucketConfig.create as any).mockResolvedValue({
      id: "b1",
      bucketName: "invoices-archive",
    });

    const res = await service.createBucket("tenant1", {
      bucketName: "invoices-archive",
      provider: "S3",
    });
    expect(res.id).toBe("b1");
  });
});
