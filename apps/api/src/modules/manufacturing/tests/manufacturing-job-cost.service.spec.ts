import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManufacturingJobCostService } from "../manufacturing-job-cost.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    workOrder: { findFirst: vi.fn() },
    jobCostSheet: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mfgCostEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    standardCost: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

describe("ManufacturingJobCostService", () => {
  let service: ManufacturingJobCostService;
  const tenantId = "tenant-1";

  beforeEach(() => {
    service = new ManufacturingJobCostService();
    vi.clearAllMocks();
  });

  describe("createJobCostSheet", () => {
    it("should create a job cost sheet", async () => {
      (prisma.workOrder.findFirst as any).mockResolvedValue({
        id: "wo-1",
        tenantId,
      });
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue(null);
      (prisma.jobCostSheet.create as any).mockResolvedValue({
        id: "sheet-1",
        tenantId,
        workOrderId: "wo-1",
        totalPlannedCost: 1500,
        costEntries: [],
      });

      const result = await service.createJobCostSheet(tenantId, {
        workOrderId: "wo-1",
        plannedMaterialCost: 1000,
        plannedLaborCost: 300,
        plannedOverheadCost: 200,
      });

      expect(prisma.jobCostSheet.create).toHaveBeenCalled();
      expect(result.totalPlannedCost).toBe(1500);
    });

    it("should reject if work order not found", async () => {
      (prisma.workOrder.findFirst as any).mockResolvedValue(null);

      await expect(
        service.createJobCostSheet(tenantId, {
          workOrderId: "missing",
        }),
      ).rejects.toThrow("Work order not found");
    });

    it("should reject duplicate cost sheets", async () => {
      (prisma.workOrder.findFirst as any).mockResolvedValue({
        id: "wo-1",
        tenantId,
      });
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue({
        id: "existing",
      });

      await expect(
        service.createJobCostSheet(tenantId, {
          workOrderId: "wo-1",
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("getJobCostSheets", () => {
    it("should return all sheets", async () => {
      (prisma.jobCostSheet.findMany as any).mockResolvedValue([
        { id: "s1", costEntries: [] },
        { id: "s2", costEntries: [] },
      ]);

      const result = await service.getJobCostSheets(tenantId);

      expect(result).toHaveLength(2);
    });
  });

  describe("getJobCostSheetById", () => {
    it("should return sheet by id", async () => {
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue({
        id: "s1",
        tenantId,
        costEntries: [],
      });

      const result = await service.getJobCostSheetById(tenantId, "s1");

      expect(result.id).toBe("s1");
    });

    it("should throw if not found", async () => {
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue(null);

      await expect(
        service.getJobCostSheetById(tenantId, "missing"),
      ).rejects.toThrow("not found");
    });
  });

  describe("addCostEntry", () => {
    it("should add a cost entry and recalculate", async () => {
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue({
        id: "s1",
        tenantId,
        totalPlannedCost: 5000,
      });
      (prisma.mfgCostEntry.create as any).mockResolvedValue({
        id: "entry-1",
        amount: 500,
        costType: "MATERIAL",
      });
      (prisma.mfgCostEntry.findMany as any).mockResolvedValue([
        { costType: "MATERIAL", amount: 1000 },
        { costType: "LABOR", amount: 500 },
      ]);
      (prisma.jobCostSheet.update as any).mockResolvedValue({});

      const result = await service.addCostEntry(tenantId, "s1", {
        costType: "MATERIAL",
        amount: 1000,
      });

      expect(result.id).toBe("entry-1");
      expect(prisma.jobCostSheet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "s1" },
          data: expect.objectContaining({
            actualMaterialCost: 1000,
            actualLaborCost: 500,
          }),
        }),
      );
    });
  });

  describe("closeCostSheet", () => {
    it("should close a cost sheet", async () => {
      (prisma.jobCostSheet.findFirst as any).mockResolvedValue({
        id: "s1",
        tenantId,
        totalPlannedCost: 5000,
      });
      (prisma.mfgCostEntry.findMany as any).mockResolvedValue([]);
      (prisma.jobCostSheet.update as any).mockResolvedValue({
        id: "s1",
        closedAt: new Date(),
        costEntries: [],
      });

      const result = await service.closeCostSheet(tenantId, "s1");

      expect(prisma.jobCostSheet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "s1" },
          data: expect.objectContaining({ closedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("createStandardCost", () => {
    it("should create a standard cost and deactivate previous", async () => {
      (prisma.standardCost.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.standardCost.create as any).mockResolvedValue({
        id: "sc-1",
        tenantId,
        productId: "prod-1",
        materialCost: 500,
        laborCost: 200,
        overheadCost: 100,
        totalCost: 800,
      });

      const result = await service.createStandardCost(tenantId, {
        productId: "prod-1",
        effectiveFrom: "2026-01-01",
        materialCost: 500,
        laborCost: 200,
        overheadCost: 100,
      });

      expect(prisma.standardCost.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, productId: "prod-1", isActive: true },
        }),
      );
      expect(result.totalCost).toBe(800);
    });
  });

  describe("getStandardCosts", () => {
    it("should return standard costs", async () => {
      (prisma.standardCost.findMany as any).mockResolvedValue([
        { id: "sc-1", productId: "prod-1" },
      ]);

      const result = await service.getStandardCosts(tenantId, "prod-1");

      expect(result).toHaveLength(1);
      expect(prisma.standardCost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, productId: "prod-1" },
        }),
      );
    });
  });

  describe("getJobCostDashboard", () => {
    it("should return aggregated dashboard data", async () => {
      (prisma.jobCostSheet.findMany as any).mockResolvedValue([
        {
          totalPlannedCost: 5000,
          totalActualCost: 4800,
          closedAt: new Date(),
          costEntries: [],
        },
        {
          totalPlannedCost: 3000,
          totalActualCost: 3300,
          closedAt: null,
          costEntries: [],
        },
      ]);

      const result = await service.getJobCostDashboard(tenantId);

      expect(result.totalSheets).toBe(2);
      expect(result.openSheets).toBe(1);
      expect(result.closedSheets).toBe(1);
      expect(result.totalPlannedCost).toBe(8000);
      expect(result.totalActualCost).toBe(8100);
    });
  });
});
