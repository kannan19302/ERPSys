import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApDeepService } from "../ap-deep.service";

const mockTx = {
  paymentBatch: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  paymentBatchLine: {
    create: vi.fn(),
  },
};

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      $transaction: vi.fn((cb: any) => cb(mockTx)),
      invoice: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      paymentBatch: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      paymentBatchLine: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      supplier: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

import { prisma } from "@unerp/database";

describe("ApDeepService", () => {
  let service: ApDeepService;

  beforeEach(() => {
    service = new ApDeepService();
    vi.clearAllMocks();
  });

  describe("getMatchingStats", () => {
    it("should return matching stats", async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([
        { id: "1", totalAmount: 1000, paidAmount: 1000, status: "PAID" },
        { id: "2", totalAmount: 500, paidAmount: 0, status: "SENT" },
        { id: "3", totalAmount: 200, paidAmount: 0, status: "DRAFT" },
      ]);
      const result = await service.getMatchingStats("tenant-1");
      expect(result.totalMatchable).toBe(3);
      expect(result.matched).toBe(1);
      expect(result.unmatched).toBe(2);
    });
  });

  describe("createPaymentBatch", () => {
    it("should create a payment batch with lines", async () => {
      (mockTx.paymentBatch.create as any).mockResolvedValue({
        id: "batch-1",
        batchNumber: "BATCH-001",
        status: "DRAFT",
        tenantId: "tenant-1",
      });
      (mockTx.paymentBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        batchNumber: "BATCH-001",
        status: "DRAFT",
        lines: [],
      });
      const result = await service.createPaymentBatch("tenant-1", {
        batchNumber: "BATCH-001",
        createdBy: "user-1",
        lines: [
          {
            invoiceId: "inv-1",
            amount: 1000,
            scheduledPaymentDate: "2026-08-01",
          },
        ],
      });
      expect(result.id).toBe("batch-1");
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("submitPaymentBatch", () => {
    it("should submit batch when in DRAFT status", async () => {
      (prisma.paymentBatch.findFirst as any).mockResolvedValue({
        id: "batch-1",
        status: "DRAFT",
        tenantId: "tenant-1",
      });
      (prisma.paymentBatch.update as any).mockResolvedValue({
        id: "batch-1",
        status: "SUBMITTED",
      });
      const result = await service.submitPaymentBatch(
        "tenant-1",
        "batch-1",
        "user-1",
      );
      expect(result.status).toBe("SUBMITTED");
    });

    it("should throw when batch not found", async () => {
      (prisma.paymentBatch.findFirst as any).mockResolvedValue(null);
      await expect(
        service.submitPaymentBatch("tenant-1", "batch-1", "user-1"),
      ).rejects.toThrow();
    });
  });
});
