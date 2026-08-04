import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ProcurementAnalyticsService } from "../procurement-analytics.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    purchaseOrder: { findMany: vi.fn(), groupBy: vi.fn() },
    purchaseOrderItem: { findMany: vi.fn() },
    vendor: { findMany: vi.fn() },
    supplierScorecard: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("ProcurementAnalyticsService", () => {
  let service: ProcurementAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcurementAnalyticsService],
    }).compile();
    service = module.get<ProcurementAnalyticsService>(
      ProcurementAnalyticsService,
    );
    vi.clearAllMocks();
  });

  it("should get dashboard with all sections", async () => {
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: "po-1",
        vendorId: "v1",
        vendor: { name: "Vendor A" },
        status: "APPROVED",
        totalAmount: 1000,
        orderDate: new Date("2026-01-15"),
        createdAt: new Date("2026-01-10"),
      },
    ]);
    (prisma.supplierScorecard.findMany as any).mockResolvedValue([
      {
        id: "sc-1",
        vendorId: "v1",
        periodStart: new Date("2026-01-01"),
        overallScore: 85,
        qualityScore: 90,
        deliveryScore: 80,
        fillRateScore: 85,
      },
    ]);
    (prisma.vendor.findMany as any).mockResolvedValue([
      { id: "v1", name: "Vendor A" },
    ]);
    (prisma.purchaseOrderItem.findMany as any).mockResolvedValue([
      {
        product: { name: "Widget", productCategory: { name: "Components" } },
        totalAmount: 500,
      },
    ]);
    (prisma.purchaseOrder.groupBy as any).mockResolvedValue([
      { vendorId: "v1", _sum: { totalAmount: 1000 }, _count: { id: 1 } },
    ]);

    const dash = await service.getDashboard("tenant-1");
    expect(dash).toHaveProperty("spendByVendor");
    expect(dash).toHaveProperty("spendByStatus");
    expect(dash).toHaveProperty("monthlyTrend");
    expect(dash).toHaveProperty("budgetOverview");
    expect(dash).toHaveProperty("vendorPerformance");
    expect(dash).toHaveProperty("scorecardStats");
  });

  it("should compute spend by vendor with percentages", async () => {
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: "po-1",
        vendorId: "v1",
        vendor: { name: "Vendor A" },
        totalAmount: 1000,
        status: "APPROVED",
        orderDate: new Date(),
        createdAt: new Date(),
      },
      {
        id: "po-2",
        vendorId: "v2",
        vendor: { name: "Vendor B" },
        totalAmount: 2000,
        status: "APPROVED",
        orderDate: new Date(),
        createdAt: new Date(),
      },
    ]);

    const result = await service.getSpendByVendor("tenant-1");
    expect(result).toHaveLength(2);
    expect(result[0].vendorName).toBe("Vendor B");
    expect(result[0].total).toBe(2000);
    expect(result[1].total).toBe(1000);
  });

  it("should compute spend by status", async () => {
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      {
        id: "po-1",
        status: "APPROVED",
        totalAmount: 1000,
        orderDate: new Date(),
        createdAt: new Date(),
      },
      {
        id: "po-2",
        status: "DRAFT",
        totalAmount: 500,
        orderDate: new Date(),
        createdAt: new Date(),
      },
    ]);

    const result = await service.getSpendByStatus("tenant-1");
    expect(result["APPROVED"].total).toBe(1000);
    expect(result["DRAFT"].total).toBe(500);
  });
});
