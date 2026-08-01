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
    quotation: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    salesOrder: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesForecastingService } from "../sales-forecasting.service";

describe("SalesForecastingService", () => {
  let service: SalesForecastingService;

  beforeEach(() => {
    service = new SalesForecastingService();
    vi.clearAllMocks();
  });

  describe("getForecast", () => {
    it("should return forecast for the current period", async () => {
      vi.mocked(prisma.quotation.findMany).mockResolvedValue([
        { totalAmount: 10000 },
        { totalAmount: 20000 },
      ] as never);
      vi.mocked(prisma.quotation.groupBy).mockResolvedValue([
        { status: "ACCEPTED", _count: { id: 10 } },
      ] as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 50000 },
      } as never);

      const result = await service.getForecast("tenant-1");

      expect(result.pipelineValue).toBeGreaterThan(0);
      expect(result.expectedValue).toBeGreaterThanOrEqual(0);
      expect(result.period).toBeDefined();
    });
  });

  describe("getForecastVsActual", () => {
    it("should compare forecast vs actual revenue", async () => {
      vi.mocked(prisma.quotation.aggregate).mockResolvedValue({
        _sum: { totalAmount: 30000 },
      } as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 25000 },
      } as never);
      vi.mocked(prisma.quotation.findMany).mockResolvedValue([
        { totalAmount: 5000 },
      ] as never);
      vi.mocked(prisma.quotation.groupBy).mockResolvedValue([
        { status: "ACCEPTED", _count: { id: 5 } },
      ] as never);

      const result = await service.getForecastVsActual("tenant-1", "2026-Q3");

      expect(result.period).toBe("2026-Q3");
      expect(result.actualValue).toBe(25000);
      expect(result.forecastedValue).toBeGreaterThan(0);
    });
  });

  describe("getPipelineForecast", () => {
    it("should return pipeline forecast by stage", async () => {
      vi.mocked(prisma.quotation.findMany).mockResolvedValue([
        { status: "DRAFT", totalAmount: 10000 },
        { status: "SENT", totalAmount: 20000 },
        { status: "ACCEPTED", totalAmount: 50000 },
      ] as never);

      const result = await service.getPipelineForecast("tenant-1");

      expect(result.stages).toHaveLength(3);
      expect(result.totalWeightedValue).toBeGreaterThan(0);

      const draftStage = result.stages.find((s: any) => s.stage === "DRAFT");
      expect(draftStage?.probability).toBe(0.1);
    });
  });

  describe("getForecastHistory", () => {
    it("should return historical forecasts with accuracy", async () => {
      vi.mocked(prisma.quotation.aggregate).mockResolvedValue({
        _sum: { totalAmount: 20000 },
      } as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 18000 },
      } as never);
      vi.mocked(prisma.quotation.findMany).mockResolvedValue([
        { totalAmount: 8000 },
      ] as never);
      vi.mocked(prisma.quotation.groupBy).mockResolvedValue([
        { status: "ACCEPTED", _count: { id: 4 } },
      ] as never);

      const result = await service.getForecastHistory("tenant-1", 2);

      expect(result).toHaveLength(2);
      expect(result[0]?.period).toBeDefined();
      expect(result[0]?.accuracy).toBeGreaterThanOrEqual(0);
    });
  });
});
