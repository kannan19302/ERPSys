import { describe, it, expect, vi, beforeEach } from "vitest";
import { RealEstateMaintenanceService } from "./real-estate-maintenance.service";
import { NotFoundException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    realEstateProperty: { findMany: vi.fn().mockResolvedValue([]) },
    realEstateMaintenanceRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
      create: vi
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: "req-1", ...d.data })),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    realEstateMaintenanceVendor: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: "vendor-1", ...d.data }),
        ),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
  };
  return { db: mockDb };
});

vi.mock("@unerp/database", () => ({ prisma: db }));

describe("RealEstateMaintenanceService", () => {
  let service: RealEstateMaintenanceService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [RealEstateMaintenanceService],
    }).compile();
    service = mod.get(RealEstateMaintenanceService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getRequests", () => {
    it("should return paginated requests", async () => {
      const result = await service.getRequests("tenant-1", {});
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("getRequestById", () => {
    it("should throw NotFoundException for missing request", async () => {
      await expect(
        service.getRequestById("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createRequest", () => {
    it("should create a new request", async () => {
      const data = {
        propertyId: "prop-1",
        title: "Fix leak",
        description: "Kitchen sink",
      };
      const result = await service.createRequest("tenant-1", data);
      expect(result).toBeDefined();
    });
  });

  describe("deleteRequest", () => {
    it("should soft-delete request", async () => {
      db.realEstateMaintenanceRequest.findFirst.mockResolvedValueOnce({
        id: "req-1",
        tenantId: "tenant-1",
      });
      const result = await service.deleteRequest("tenant-1", "req-1");
      expect(result.isActive).toBe(false);
    });
  });

  describe("getRequestStats", () => {
    it("should return statistics", async () => {
      const result = await service.getRequestStats("tenant-1");
      expect(result).toBeDefined();
      expect(typeof result.open).toBe("number");
    });
  });

  describe("getVendorById", () => {
    it("should throw NotFoundException for missing vendor", async () => {
      await expect(
        service.getVendorById("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
