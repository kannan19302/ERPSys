import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArDeepService } from "../ar-deep.service";

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      invoice: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      customer: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      aRPromiseToPay: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      aRDispute: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

import { prisma } from "@unerp/database";

describe("ArDeepService", () => {
  let service: ArDeepService;

  beforeEach(() => {
    service = new ArDeepService();
    vi.clearAllMocks();
  });

  describe("getCollectionsStats", () => {
    it("should return collection stats with aging buckets", async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([
        {
          id: "1",
          totalAmount: 1000,
          paidAmount: 0,
          status: "SENT",
          dueDate: new Date("2026-06-01"),
        },
        {
          id: "2",
          totalAmount: 2000,
          paidAmount: 2000,
          status: "PAID",
          dueDate: new Date("2026-07-01"),
        },
        {
          id: "3",
          totalAmount: 500,
          paidAmount: 0,
          status: "SENT",
          dueDate: new Date("2026-07-20"),
        },
      ]);
      const result = await service.getCollectionsStats("tenant-1");
      expect(result).toHaveProperty("totalOverdue");
      expect(result).toHaveProperty("overdueCount");
      expect(result).toHaveProperty("agingBuckets");
    });
  });

  describe("setCreditLimit", () => {
    it("should update credit limit when customer exists", async () => {
      (prisma.customer.findFirst as any).mockResolvedValue({
        id: "c1",
        tenantId: "tenant-1",
      });
      (prisma.customer.update as any).mockResolvedValue({
        id: "c1",
        creditLimit: 50000,
      });
      const result = await service.setCreditLimit("tenant-1", "c1", 50000);
      expect(result).toEqual({ id: "c1", creditLimit: 50000 });
    });

    it("should throw when customer not found", async () => {
      (prisma.customer.findFirst as any).mockResolvedValue(null);
      await expect(
        service.setCreditLimit("tenant-1", "c1", 50000),
      ).rejects.toThrow();
    });
  });

  describe("getArAnalytics", () => {
    it("should compute AR analytics correctly", async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([
        {
          id: "1",
          totalAmount: 1000,
          paidAmount: 1000,
          status: "PAID",
          dueDate: new Date(),
        },
        {
          id: "2",
          totalAmount: 2000,
          paidAmount: 0,
          status: "SENT",
          dueDate: new Date(),
        },
      ]);
      const result = await service.getArAnalytics("tenant-1");
      expect(result.totalBilled).toBe(3000);
      expect(result.totalPaid).toBe(1000);
      expect(result.totalReceivables).toBe(2000);
      expect(result.collectionRate).toBe("33.3");
    });
  });
});
