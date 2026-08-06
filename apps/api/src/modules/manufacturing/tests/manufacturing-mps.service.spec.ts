import { describe, it, expect, vi, beforeEach } from "vitest";
import { ManufacturingMpsService } from "../manufacturing-mps.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    masterProductionSchedule: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mpsEntry: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("ManufacturingMpsService", () => {
  let service: ManufacturingMpsService;
  const tenantId = "tenant-1";

  beforeEach(() => {
    service = new ManufacturingMpsService();
    vi.clearAllMocks();
  });

  describe("createMps", () => {
    it("should create an MPS schedule with entries", async () => {
      const dto = {
        name: "Q3 Production Plan",
        planningHorizon: 12,
        planningUnit: "WEEKS" as const,
        entries: [
          { productId: "prod-1", period: "2026-W31", forecastDemand: 100 },
        ],
      };

      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue(
        null,
      );
      (prisma.masterProductionSchedule.create as any).mockResolvedValue({
        id: "mps-1",
        tenantId,
        name: dto.name,
        planningHorizon: dto.planningHorizon,
        entries: [{ id: "entry-1", ...dto.entries[0], tenantId }],
      });

      const result = await service.createMps(tenantId, dto);

      expect(prisma.masterProductionSchedule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            name: dto.name,
          }),
        }),
      );
      expect(result.id).toBe("mps-1");
    });

    it("should reject duplicate MPS names", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue({
        id: "existing",
      });

      await expect(
        service.createMps(tenantId, {
          name: "Q3 Production Plan",
          planningHorizon: 12,
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("getMpsList", () => {
    it("should return all MPS schedules for tenant", async () => {
      const mockSchedules = [
        { id: "mps-1", name: "Plan A", entries: [] },
        { id: "mps-2", name: "Plan B", entries: [] },
      ];
      (prisma.masterProductionSchedule.findMany as any).mockResolvedValue(
        mockSchedules,
      );

      const result = await service.getMpsList(tenantId);

      expect(result).toHaveLength(2);
      expect(prisma.masterProductionSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
        }),
      );
    });
  });

  describe("getMpsById", () => {
    it("should return MPS by id", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue({
        id: "mps-1",
        tenantId,
        entries: [],
      });

      const result = await service.getMpsById(tenantId, "mps-1");

      expect(result.id).toBe("mps-1");
    });

    it("should throw if not found", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue(
        null,
      );

      await expect(service.getMpsById(tenantId, "missing")).rejects.toThrow(
        "MPS not found",
      );
    });
  });

  describe("approveMps", () => {
    it("should approve a DRAFT MPS", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue({
        id: "mps-1",
        tenantId,
        status: "DRAFT",
      });
      (prisma.masterProductionSchedule.update as any).mockResolvedValue({
        id: "mps-1",
        status: "APPROVED",
      });

      const result = await service.approveMps(
        tenantId,
        "mps-1",
        "user@test.com",
      );

      expect(prisma.masterProductionSchedule.update).toHaveBeenCalled();
      expect(result.status).toBe("APPROVED");
    });

    it("should reject approving non-DRAFT MPS", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue({
        id: "mps-1",
        tenantId,
        status: "APPROVED",
      });

      await expect(
        service.approveMps(tenantId, "mps-1", "user@test.com"),
      ).rejects.toThrow("Only DRAFT MPS");
    });
  });

  describe("updateMpsEntry", () => {
    it("should update MPS entry fields", async () => {
      (prisma.mpsEntry.findFirst as any).mockResolvedValue({
        id: "entry-1",
        tenantId,
        projectedInventory: 50,
      });
      (prisma.mpsEntry.update as any).mockResolvedValue({
        id: "entry-1",
        forecastDemand: 200,
      });

      const result = await service.updateMpsEntry(tenantId, "entry-1", {
        forecastDemand: 200,
      });

      expect(prisma.mpsEntry.update).toHaveBeenCalled();
      expect(result.id).toBe("entry-1");
    });
  });

  describe("getMpsDashboard", () => {
    it("should return aggregated dashboard data", async () => {
      (prisma.masterProductionSchedule.findMany as any).mockResolvedValue([
        {
          id: "mps-1",
          status: "APPROVED",
          entries: [{ forecastDemand: 100 }, { forecastDemand: 200 }],
        },
        {
          id: "mps-2",
          status: "DRAFT",
          entries: [{ forecastDemand: 50 }],
        },
      ]);

      const result = await service.getMpsDashboard(tenantId);

      expect(result.totalSchedules).toBe(2);
      expect(result.approvedSchedules).toBe(1);
      expect(result.totalEntries).toBe(3);
      expect(result.totalForecast).toBe(350);
    });
  });

  describe("calculateAvaialableToPromise", () => {
    it("should calculate ATP across MPS entries", async () => {
      (prisma.masterProductionSchedule.findFirst as any).mockResolvedValue({
        id: "mps-1",
        tenantId,
        entries: [
          {
            id: "e1",
            plannedProd: 100,
            actualDemand: 80,
            forecastDemand: 80,
            projectedInventory: null,
            availableToPromise: null,
          },
          {
            id: "e2",
            plannedProd: 100,
            actualDemand: 120,
            forecastDemand: 120,
            projectedInventory: null,
            availableToPromise: null,
          },
        ],
      });
      (prisma.mpsEntry.update as any).mockResolvedValue({});

      const result = await service.calculateAvaialableToPromise(
        tenantId,
        "mps-1",
      );

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].projectedInventory).toBe(20);
      expect(result.entries[0].availableToPromise).toBe(20);
    });
  });
});
