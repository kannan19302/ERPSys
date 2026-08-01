import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter2 } from "@nestjs/event-emitter";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    salesOrder: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    quotation: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    contract: {
      count: vi.fn(),
    },
    salesReturn: {
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    salesOrderItem: {
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesAnalyticsService } from "../sales-analytics.service";

describe("SalesAnalyticsService", () => {
  let service: SalesAnalyticsService;

  beforeEach(() => {
    service = new SalesAnalyticsService();
    vi.clearAllMocks();
  });

  describe("getRevenueAnalytics", () => {
    it("should return revenue analytics with breakdowns", async () => {
      vi.mocked(prisma.salesOrder.groupBy).mockResolvedValue([
        {
          salesChannel: "B2B",
          _sum: { totalAmount: 80000 },
          _count: { id: 8 },
        },
        {
          salesChannel: "B2C",
          _sum: { totalAmount: 20000 },
          _count: { id: 12 },
        },
      ] as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 100000 },
        _count: { id: 20 },
      } as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValueOnce({
        _sum: { totalAmount: 100000 },
        _count: { id: 20 },
      } as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValueOnce({
        _sum: { totalAmount: 35000 },
      } as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValueOnce({
        _sum: { totalAmount: 30000 },
      } as never);

      const result = await service.getRevenueAnalytics("tenant-1");

      expect(result.totalRevenue).toBe(100000);
      expect(result.byChannel).toHaveLength(2);
    });
  });

  describe("getWinLossAnalytics", () => {
    it("should return win/loss analytics", async () => {
      vi.mocked(prisma.quotation.groupBy).mockResolvedValue([
        {
          status: "ACCEPTED",
          _count: { id: 10 },
          _sum: { totalAmount: 50000 },
        },
        { status: "REJECTED", _count: { id: 5 }, _sum: { totalAmount: 15000 } },
        { status: "DRAFT", _count: { id: 8 }, _sum: { totalAmount: 30000 } },
      ] as never);

      const result = await service.getWinLossAnalytics("tenant-1");

      expect(result.won).toBe(10);
      expect(result.lost).toBe(5);
      expect(result.winRate).toBeGreaterThan(0);
    });
  });

  describe("getSalesFunnel", () => {
    it("should return funnel stage counts", async () => {
      vi.mocked(prisma.customer.count).mockResolvedValue(100);
      vi.mocked(prisma.quotation.count).mockResolvedValue(40);
      vi.mocked(prisma.salesOrder.count).mockResolvedValueOnce(25);
      vi.mocked(prisma.salesOrder.count).mockResolvedValueOnce(15);

      const result = await service.getSalesFunnel("tenant-1");

      expect(result.leads).toBe(100);
      expect(result.quotations).toBe(40);
      expect(result.orders).toBe(25);
      expect(result.delivered).toBe(15);
    });
  });

  describe("getOrderCycleTime", () => {
    it("should return cycle time stats", async () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      vi.mocked(prisma.salesOrder.findMany).mockResolvedValue([
        {
          id: "so-1",
          orderDate: tenDaysAgo,
          deliveryNotes: [{ deliveredDate: now }],
        },
      ] as never);

      const result = await service.getOrderCycleTime("tenant-1");

      expect(result.sampleSize).toBe(1);
      expect(result.averageDays).toBeGreaterThan(0);
    });
  });

  describe("getTopCustomers", () => {
    it("should return top customers by revenue", async () => {
      vi.mocked(prisma.salesOrder.groupBy).mockResolvedValue([
        {
          customerId: "cust-1",
          _sum: { totalAmount: 50000 },
          _count: { id: 5 },
        },
        {
          customerId: "cust-2",
          _sum: { totalAmount: 30000 },
          _count: { id: 3 },
        },
      ] as never);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([
        { id: "cust-1", name: "Big Corp" },
        { id: "cust-2", name: "Small Co" },
      ] as never);

      const result = await service.getTopCustomers("tenant-1");

      expect(result).toHaveLength(2);
      expect(result[0]?.customerName).toBe("Big Corp");
      expect(result[0]?.revenue).toBe(50000);
    });
  });

  describe("getTopProducts", () => {
    it("should return top products by revenue", async () => {
      vi.mocked(prisma.salesOrder.findMany).mockResolvedValue([
        { id: "so-1" },
      ] as never);
      vi.mocked(prisma.salesOrderItem.groupBy).mockResolvedValue([
        {
          productId: "prod-1",
          _sum: { quantity: 50, totalAmount: 10000 },
          _count: { id: 10 },
        },
      ] as never);
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: "prod-1", name: "Widget", sku: "WGT-001" },
      ] as never);

      const result = await service.getTopProducts("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.productName).toBe("Widget");
    });
  });

  describe("getKpiSummary", () => {
    it("should return KPI summary", async () => {
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 200000 },
        _count: { id: 50 },
      } as never);
      vi.mocked(prisma.salesOrder.count).mockResolvedValue(60);
      vi.mocked(prisma.quotation.count).mockResolvedValue(80);
      vi.mocked(prisma.quotation.groupBy).mockResolvedValue([
        {
          status: "ACCEPTED",
          _count: { id: 20 },
          _sum: { totalAmount: 80000 },
        },
      ] as never);
      vi.mocked(prisma.contract.count).mockResolvedValue(15);
      vi.mocked(prisma.salesReturn.count).mockResolvedValue(3);

      const result = await service.getKpiSummary("tenant-1");

      expect(result.totalRevenue).toBe(200000);
      expect(result.totalOrders).toBe(60);
      expect(result.activeContracts).toBe(15);
      expect(result.pendingReturns).toBe(3);
    });
  });
});
