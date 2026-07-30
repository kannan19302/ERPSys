// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SupplierPerformanceService } from "../services/supplier-performance.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    supplierScorecard: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    supplierPerformanceKpi: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    supplierAssessment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    supplierRiskProfile: {
      findFirst: vi.fn(),
    },
    supplierNcr: {
      findMany: vi.fn(),
    },
    vendor: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

describe("SupplierPerformanceService", () => {
  let service: SupplierPerformanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierPerformanceService],
    }).compile();
    service = module.get<SupplierPerformanceService>(SupplierPerformanceService);
    vi.clearAllMocks();
  });

  describe("listScorecards", () => {
    it("should return scorecards scoped to tenant", async () => {
      const mockData = [
        { id: "1", vendor: { name: "Vendor A", email: "a@test.com" }, overallScore: 85 },
      ];
      (prisma.supplierScorecard.findMany as any).mockResolvedValue(mockData);

      const result = await service.listScorecards("tenant-1");
      expect(result).toEqual(mockData);
      expect(prisma.supplierScorecard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "tenant-1" } }),
      );
    });

    it("should filter by supplierId", async () => {
      (prisma.supplierScorecard.findMany as any).mockResolvedValue([]);
      await service.listScorecards("tenant-1", "vendor-1");
      expect(prisma.supplierScorecard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "tenant-1", vendorId: "vendor-1" } }),
      );
    });
  });

  describe("getScorecard", () => {
    it("should return scorecard by id", async () => {
      const mock = { id: "sc-1", vendor: { name: "Vendor A" }, overallScore: 90 };
      (prisma.supplierScorecard.findFirst as any).mockResolvedValue(mock);

      const result = await service.getScorecard("tenant-1", "sc-1");
      expect(result.id).toBe("sc-1");
    });

    it("should throw NotFoundException when not found", async () => {
      (prisma.supplierScorecard.findFirst as any).mockResolvedValue(null);
      await expect(service.getScorecard("tenant-1", "bad-id")).rejects.toThrow(NotFoundException);
    });
  });

  describe("createScorecard", () => {
    it("should create a scorecard", async () => {
      (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
      (prisma.supplierScorecard.findFirst as any).mockResolvedValue(null);
      (prisma.supplierScorecard.create as any).mockResolvedValue({
        id: "new-sc",
        vendor: { name: "Vendor A" },
        overallScore: 88,
      });

      const result = await service.createScorecard("tenant-1", {
        vendorId: "vendor-1",
        periodStart: "2026-01-01",
        periodEnd: "2026-06-30",
        overallScore: 88,
      }, "user-1");

      expect(result.id).toBe("new-sc");
      expect(result.overallScore).toBe(88);
    });

    it("should throw NotFoundException if vendor missing", async () => {
      (prisma.vendor.findFirst as any).mockResolvedValue(null);
      await expect(service.createScorecard("tenant-1", {
        vendorId: "bad-vendor",
        periodStart: "2026-01-01",
        periodEnd: "2026-06-30",
      }, "user-1")).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if duplicate period", async () => {
      (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
      (prisma.supplierScorecard.findFirst as any).mockResolvedValue({ id: "existing" });

      await expect(service.createScorecard("tenant-1", {
        vendorId: "vendor-1",
        periodStart: "2026-01-01",
        periodEnd: "2026-06-30",
      }, "user-1")).rejects.toThrow(BadRequestException);
    });
  });

  describe("getSupplierRiskProfile", () => {
    it("should return risk profile with factors and alerts", async () => {
      const mock = {
        id: "rp-1",
        vendorId: "vendor-1",
        overallRiskScore: 35,
        riskCategory: "LOW",
        factors: [{ id: "f-1", factorType: "FINANCIAL", score: 30 }],
        alerts: [{ id: "a-1", alertType: "PAYMENT_DELAY", status: "OPEN" }],
      };
      (prisma.supplierRiskProfile.findFirst as any).mockResolvedValue(mock);

      const result = await service.getSupplierRiskProfile("tenant-1", "vendor-1");
      expect(result.id).toBe("rp-1");
      expect(result.factors).toHaveLength(1);
      expect(result.alerts).toHaveLength(1);
    });

    it("should throw NotFoundException when no risk profile", async () => {
      (prisma.supplierRiskProfile.findFirst as any).mockResolvedValue(null);
      await expect(service.getSupplierRiskProfile("tenant-1", "vendor-1")).rejects.toThrow(NotFoundException);
    });
  });
});
