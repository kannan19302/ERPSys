import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SupplierScorecardService } from "../supplier-scorecard.service";
import { NotFoundException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    supplierScorecard: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    vendor: { findFirst: vi.fn() },
    purchaseReceipt: { findMany: vi.fn() },
    purchaseOrderItem: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

describe("SupplierScorecardService (extra)", () => {
  let service: SupplierScorecardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierScorecardService],
    }).compile();
    service = module.get<SupplierScorecardService>(SupplierScorecardService);
    vi.clearAllMocks();
  });

  it("should enforce tenant isolation on getById", async () => {
    prisma.supplierScorecard.findFirst.mockResolvedValue(null);
    await expect(service.getById("tenant-2", "1")).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.supplierScorecard.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "1", tenantId: "tenant-2" } }),
    );
  });

  it("should throw NotFoundException when computing scorecard for missing vendor", async () => {
    prisma.vendor.findFirst.mockResolvedValue(null);
    await expect(
      service.computeAndSave(
        "tenant-1",
        "missing-vendor",
        "2026-01-01",
        "2026-06-30",
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("should compute scorecard with no receipts (default scores)", async () => {
    prisma.vendor.findFirst.mockResolvedValue({ id: "vendor-1" });
    prisma.purchaseReceipt.findMany.mockResolvedValue([]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([]);
    prisma.supplierScorecard.create.mockResolvedValue({
      id: "sc-default",
      overallScore: 100,
      qualityScore: 100,
      deliveryScore: 100,
      fillRateScore: 100,
    });

    const result = await service.computeAndSave(
      "tenant-1",
      "vendor-1",
      "2026-01-01",
      "2026-06-30",
    );
    expect(result.overallScore).toBe(100);
  });

  it("should compute scorecard with defect rates affecting quality", async () => {
    prisma.vendor.findFirst.mockResolvedValue({ id: "vendor-1" });
    prisma.purchaseReceipt.findMany.mockResolvedValue([
      {
        id: "rec-1",
        receivedDate: new Date("2026-02-01"),
        purchaseOrder: {
          orderDate: new Date("2026-02-05"),
          poNumber: "PO-001",
        },
        lineItems: [{ acceptedQty: 8, rejectedQty: 2 }],
      },
    ]);
    prisma.purchaseOrderItem.findMany.mockResolvedValue([
      { quantity: 10, receivedQty: 10, purchaseOrder: { status: "RECEIVED" } },
    ]);
    prisma.supplierScorecard.create.mockResolvedValue({
      id: "sc-defect",
      overallScore: 84,
      qualityScore: 80,
      deliveryScore: 100,
      fillRateScore: 100,
    });

    const result = await service.computeAndSave(
      "tenant-1",
      "vendor-1",
      "2026-01-01",
      "2026-06-30",
    );
    expect(result.qualityScore).toBe(80);
  });

  it("should get scorecards by vendor with tenant isolation", async () => {
    prisma.supplierScorecard.findMany.mockResolvedValue([{ id: "1" }]);
    prisma.supplierScorecard.count.mockResolvedValue(1);

    const result = await service.getScorecardsByVendor(
      "tenant-1",
      "vendor-1",
      {},
    );
    expect(result.meta.total).toBe(1);
    expect(prisma.supplierScorecard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1", vendorId: "vendor-1" },
      }),
    );
  });

  it("should get scorecards by date range", async () => {
    prisma.supplierScorecard.findMany.mockResolvedValue([
      { id: "1", vendor: { name: "Vendor A" } },
    ]);
    prisma.supplierScorecard.count.mockResolvedValue(1);

    const result = await service.getScorecardsByDateRange(
      "tenant-1",
      "2026-01-01",
      "2026-06-30",
      {},
    );
    expect(result.meta.total).toBe(1);
  });

  it("should compare vendors", async () => {
    prisma.supplierScorecard.findMany.mockResolvedValue([
      {
        id: "1",
        vendorId: "v1",
        vendor: { name: "Vendor A" },
        periodStart: new Date("2026-03-01"),
        periodEnd: new Date("2026-06-30"),
        overallScore: 80,
        qualityScore: 85,
        deliveryScore: 75,
        fillRateScore: 80,
        onTimeDeliveries: 8,
        lateDeliveries: 2,
        defectiveUnits: 5,
      },
      {
        id: "2",
        vendorId: "v2",
        vendor: { name: "Vendor B" },
        periodStart: new Date("2026-03-01"),
        periodEnd: new Date("2026-06-30"),
        overallScore: 90,
        qualityScore: 95,
        deliveryScore: 85,
        fillRateScore: 90,
        onTimeDeliveries: 10,
        lateDeliveries: 0,
        defectiveUnits: 1,
      },
    ]);

    const comparison = await service.compareVendors("tenant-1", ["v1", "v2"]);
    expect(comparison.count).toBe(2);
    expect(comparison.comparison).toHaveLength(2);
    expect(comparison.comparison[0].vendorName).toBe("Vendor B");
    expect(comparison.comparison[0].overallScore).toBeGreaterThan(
      comparison.comparison[1].overallScore,
    );
  });

  it("should handle empty scorecards in stats", async () => {
    prisma.supplierScorecard.findMany.mockResolvedValue([]);
    const stats = await service.getStats("tenant-1");
    expect(stats.totalScorecards).toBe(0);
    expect(stats.vendorsScored).toBe(0);
    expect(stats.averageOverallScore).toBe(0);
  });
});
