import { describe, it, expect, vi, beforeEach } from "vitest";
import { ColdChainService } from "../services/cold-chain.service";

vi.mock("@unerp/database", () => {
  const mockDb = {
    coldChainShipment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    coldChainTemperatureLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    coldChainExcursion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    coldChainRequirement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  };
  return { prisma: mockDb };
});

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const mockPrisma = prisma as any;

describe("ColdChainService", () => {
  let service: ColdChainService;
  const tenantId = "tenant-1";

  beforeEach(() => {
    service = new ColdChainService();
    vi.clearAllMocks();
  });

  describe("listShipments", () => {
    it("should return paginated shipment list", async () => {
      mockPrisma.coldChainShipment.findMany.mockResolvedValue([
        {
          id: "s-1",
          shipmentRef: "CC-001",
          status: "IN_TRANSIT",
          temperatureLogs: [],
          ccExcursions: [],
        },
      ]);
      mockPrisma.coldChainShipment.count.mockResolvedValue(1);

      const result = await service.listShipments(tenantId, {
        page: 1,
        limit: 20,
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(mockPrisma.coldChainShipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
    });

    it("should filter by status", async () => {
      mockPrisma.coldChainShipment.findMany.mockResolvedValue([]);
      mockPrisma.coldChainShipment.count.mockResolvedValue(0);

      await service.listShipments(tenantId, { status: "PLANNED" });
      expect(mockPrisma.coldChainShipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PLANNED" }),
        }),
      );
    });
  });

  describe("getShipment / createShipment", () => {
    it("should throw NotFoundException for missing shipment", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue(null);
      await expect(service.getShipment(tenantId, "bad-id")).rejects.toThrow(
        "not found",
      );
    });

    it("should create and return a shipment", async () => {
      const input = {
        shipmentRef: "CC-001",
        requiredTempMin: 2,
        requiredTempMax: 8,
      };
      const created = { id: "s-1", ...input, tenantId, createdBy: "user-1" };
      mockPrisma.coldChainShipment.create.mockResolvedValue(created);

      const result = await service.createShipment(tenantId, input, "user-1");
      expect(result.id).toBe("s-1");
      expect(mockPrisma.coldChainShipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shipmentRef: "CC-001" }),
        }),
      );
    });
  });

  describe("departShipment / arriveShipment", () => {
    it("should depart a PLANNED shipment", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        status: "PLANNED",
      });
      mockPrisma.coldChainShipment.update.mockResolvedValue({
        id: "s-1",
        status: "IN_TRANSIT",
      });

      const result = await service.departShipment(tenantId, "s-1");
      expect(result.status).toBe("IN_TRANSIT");
    });

    it("should reject depart if not PLANNED", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        status: "ARRIVED",
      });
      await expect(service.departShipment(tenantId, "s-1")).rejects.toThrow(
        "Only PLANNED",
      );
    });

    it("should arrive an IN_TRANSIT shipment", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        status: "IN_TRANSIT",
      });
      mockPrisma.coldChainShipment.update.mockResolvedValue({
        id: "s-1",
        status: "ARRIVED",
      });

      const result = await service.arriveShipment(tenantId, "s-1");
      expect(result.status).toBe("ARRIVED");
    });
  });

  describe("logTemperature", () => {
    it("should create a temperature log", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        requiredTempMax: 8,
        requiredTempMin: 2,
      });
      mockPrisma.coldChainTemperatureLog.create.mockResolvedValue({
        id: "tl-1",
        temperature: 5,
      });
      mockPrisma.coldChainExcursion.create = vi.fn();

      const result = await service.logTemperature(tenantId, "s-1", {
        temperature: 5,
      });
      expect(result.temperature).toBe(5);
    });

    it("should trigger excursion when temp exceeds max", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        requiredTempMax: 8,
        requiredTempMin: 2,
      });
      mockPrisma.coldChainTemperatureLog.create.mockResolvedValue({
        id: "tl-2",
        temperature: 12,
      });
      mockPrisma.coldChainExcursion.create = vi
        .fn()
        .mockResolvedValue({ id: "ex-1" });
      mockPrisma.coldChainShipment.update.mockResolvedValue({});

      await service.logTemperature(tenantId, "s-1", { temperature: 9 });
      expect(mockPrisma.coldChainExcursion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ excursionType: "HIGH_TEMP" }),
        }),
      );
      const call = mockPrisma.coldChainExcursion.create.mock.calls[0][0];
      expect(call.data.severity).toBe("HIGH");
    });

    it("should trigger excursion when temp drops below min", async () => {
      mockPrisma.coldChainShipment.findFirst.mockResolvedValue({
        id: "s-1",
        requiredTempMax: 8,
        requiredTempMin: 2,
      });
      mockPrisma.coldChainTemperatureLog.create.mockResolvedValue({
        id: "tl-3",
        temperature: -1,
      });
      mockPrisma.coldChainExcursion.create = vi
        .fn()
        .mockResolvedValue({ id: "ex-2" });
      mockPrisma.coldChainShipment.update.mockResolvedValue({});

      await service.logTemperature(tenantId, "s-1", { temperature: -1 });
      expect(mockPrisma.coldChainExcursion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ excursionType: "LOW_TEMP" }),
        }),
      );
    });
  });

  describe("excursion management", () => {
    it("should list excursions", async () => {
      mockPrisma.coldChainExcursion.findMany.mockResolvedValue([
        { id: "ex-1", excursionType: "HIGH_TEMP", severity: "CRITICAL" },
      ]);
      mockPrisma.coldChainExcursion.count.mockResolvedValue(1);

      const result = await service.listExcursions(tenantId, {});
      expect(result.data).toHaveLength(1);
    });

    it("should resolve an excursion", async () => {
      mockPrisma.coldChainExcursion.findFirst.mockResolvedValue({
        id: "ex-1",
        resolvedAt: null,
      });
      mockPrisma.coldChainExcursion.update.mockResolvedValue({
        id: "ex-1",
        resolvedAt: new Date(),
      });

      const result = await service.resolveExcursion(tenantId, "ex-1", {
        action: "Quarantine batch",
        dispositionDecision: "DISPOSED",
        approvedBy: "user-1",
      });
      expect(result.resolvedAt).toBeDefined();
    });

    it("should reject resolving already-resolved excursion", async () => {
      mockPrisma.coldChainExcursion.findFirst.mockResolvedValue({
        id: "ex-1",
        resolvedAt: new Date(),
      });
      await expect(
        service.resolveExcursion(tenantId, "ex-1", {
          action: "ok",
          dispositionDecision: "ok",
          approvedBy: "user-1",
        }),
      ).rejects.toThrow("already resolved");
    });
  });

  describe("dashboard & analytics", () => {
    it("should return dashboard data", async () => {
      mockPrisma.coldChainShipment.count.mockResolvedValue(5);
      mockPrisma.coldChainExcursion.count.mockResolvedValue(3);
      mockPrisma.coldChainTemperatureLog.findMany.mockResolvedValue([]);

      const dash = await service.getDashboard(tenantId);
      expect(dash.activeShipments).toBe(5);
      expect(dash.totalShipments).toBe(5);
      expect(dash.totalExcursions).toBe(3);
    });

    it("should return fleet analytics", async () => {
      mockPrisma.coldChainShipment.findMany.mockResolvedValue([
        {
          id: "s-1",
          status: "IN_TRANSIT",
          totalExcursions: 1,
          temperatureLogs: [{}],
          ccExcursions: [{}],
        },
        {
          id: "s-2",
          status: "ARRIVED",
          totalExcursions: 0,
          temperatureLogs: [],
          ccExcursions: [],
        },
      ]);

      const analytics = await service.getFleetAnalytics(tenantId);
      expect(analytics.totalShipments).toBe(2);
      expect(analytics.complianceRate).toBe(50);
      expect(analytics.statusBreakdown.inTransit).toBe(1);
      expect(analytics.statusBreakdown.arrived).toBe(1);
    });

    it("should return sensor analytics", async () => {
      mockPrisma.coldChainTemperatureLog.findMany.mockResolvedValue([
        { temperature: 5, deviceId: "d-1" },
        { temperature: 7, deviceId: "d-1" },
        { temperature: 6, deviceId: "d-2" },
      ]);

      const analytics = await service.getSensorAnalytics(tenantId);
      expect(analytics.totalReadings).toBe(3);
      expect(analytics.averageTemperature).toBe(6);
      expect(analytics.minTemperature).toBe(5);
      expect(analytics.maxTemperature).toBe(7);
      expect(analytics.uniqueDevices).toBe(2);
    });

    it("should return compliance report", async () => {
      mockPrisma.coldChainShipment.findMany.mockResolvedValue([
        { id: "s-1", totalExcursions: 0, ccExcursions: [] },
        {
          id: "s-2",
          totalExcursions: 2,
          ccExcursions: [
            { excursionType: "HIGH_TEMP" },
            { excursionType: "HIGH_TEMP" },
          ],
        },
      ]);

      const report = await service.getComplianceReport(tenantId, {});
      expect(report.totalShipments).toBe(2);
      expect(report.compliantShipments).toBe(1);
      expect(report.complianceRate).toBe(50);
    });
  });

  describe("requirements", () => {
    it("should create a cold chain requirement", async () => {
      const input = { productId: "p-1", minTempCelsius: 2, maxTempCelsius: 8 };
      mockPrisma.coldChainRequirement.create.mockResolvedValue({
        id: "r-1",
        ...input,
      });

      const result = await service.createRequirement(tenantId, input);
      expect(result.id).toBe("r-1");
    });

    it("should list requirements", async () => {
      mockPrisma.coldChainRequirement.findMany.mockResolvedValue([]);
      mockPrisma.coldChainRequirement.count.mockResolvedValue(0);

      const result = await service.listRequirements(tenantId, {});
      expect(result.total).toBe(0);
    });
  });
});
