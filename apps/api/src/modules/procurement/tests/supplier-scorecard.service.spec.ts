// @ts-nocheck
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

describe("SupplierScorecardService", () => {
  let service: SupplierScorecardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierScorecardService],
    }).compile();
    service = module.get<SupplierScorecardService>(SupplierScorecardService);
    vi.clearAllMocks();
  });

  it("should list supplier scorecards", async () => {
    const mockItems = [
      {
        id: "1",
        vendor: { name: "Vendor A" },
        overallScore: 85,
        periodStart: new Date(),
      },
    ];
    (prisma.supplierScorecard.findMany as any).mockResolvedValue(mockItems);
    (prisma.supplierScorecard.count as any).mockResolvedValue(1);

    const result = await service.list("tenant-1", {});
    expect(result.data).toEqual(mockItems);
    expect(result.meta.total).toBe(1);
  });

  it("should get scorecard by id", async () => {
    const mockScorecard = {
      id: "1",
      vendor: { name: "Vendor A" },
      overallScore: 90,
    };
    (prisma.supplierScorecard.findFirst as any).mockResolvedValue(
      mockScorecard,
    );

    const result = await service.getById("tenant-1", "1");
    expect(result.id).toBe("1");
  });

  it("should throw NotFoundException for missing scorecard", async () => {
    (prisma.supplierScorecard.findFirst as any).mockResolvedValue(null);
    await expect(service.getById("tenant-1", "nonexistent")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should compute and save a scorecard", async () => {
    (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
    (prisma.purchaseReceipt.findMany as any).mockResolvedValue([
      {
        id: "rec-1",
        receivedDate: new Date("2026-01-15"),
        purchaseOrder: {
          orderDate: new Date("2026-01-20"),
          poNumber: "PO-001",
        },
        lineItems: [{ acceptedQty: 10, rejectedQty: 1 }],
      },
    ]);
    (prisma.purchaseOrderItem.findMany as any).mockResolvedValue([
      { quantity: 10, receivedQty: 9, purchaseOrder: { status: "RECEIVED" } },
    ]);
    (prisma.supplierScorecard.create as any).mockResolvedValue({
      id: "new-sc",
      vendor: { name: "Vendor A" },
      overallScore: 88,
      qualityScore: 90,
      deliveryScore: 100,
      fillRateScore: 90,
    });

    const result = await service.computeAndSave(
      "tenant-1",
      "vendor-1",
      "2026-01-01",
      "2026-06-30",
    );
    expect(result.id).toBe("new-sc");
    expect(result.overallScore).toBe(88);
  });

  it("should get stats", async () => {
    (prisma.supplierScorecard.findMany as any).mockResolvedValue([
      {
        vendorId: "v1",
        overallScore: 90,
        qualityScore: 95,
        deliveryScore: 85,
        fillRateScore: 90,
        vendor: { name: "Vendor A" },
      },
      {
        vendorId: "v2",
        overallScore: 80,
        qualityScore: 85,
        deliveryScore: 75,
        fillRateScore: 80,
        vendor: { name: "Vendor B" },
      },
    ]);

    const stats = await service.getStats("tenant-1");
    expect(stats.totalScorecards).toBe(2);
    expect(stats.averageOverallScore).toBe(85);
  });
});
