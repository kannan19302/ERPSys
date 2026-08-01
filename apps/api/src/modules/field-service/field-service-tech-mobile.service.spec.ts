import { describe, it, expect, vi, beforeEach } from "vitest";
import { FieldServiceTechMobileService } from "./field-service-tech-mobile.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    fieldServiceTechnicianDashboard: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: "dash-1", ...d.data }),
        ),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    fieldServiceTechnician: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({
        id: "tech-1",
        name: "John",
        currentStatus: "AVAILABLE",
        isActive: true,
      }),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    fieldServiceDispatch: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { db: mockDb };
});

vi.mock("@unerp/database", () => ({ prisma: db }));

describe("FieldServiceTechMobileService", () => {
  let service: FieldServiceTechMobileService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [FieldServiceTechMobileService],
    }).compile();
    service = mod.get(FieldServiceTechMobileService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getDashboard", () => {
    it("should return technician dashboard data", async () => {
      const result = await service.getDashboard("tenant-1", "tech-1");
      expect(result).toBeDefined();
      expect(result.technician).toBeDefined();
    });

    it("should throw NotFoundException for missing technician", async () => {
      db.fieldServiceTechnician.findFirst.mockResolvedValueOnce(null);
      await expect(service.getDashboard("tenant-1", "invalid")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getTodayJobs", () => {
    it("should return today's dispatches", async () => {
      const result = await service.getTodayJobs("tenant-1", "tech-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("updateDashboard", () => {
    it("should throw NotFoundException for missing dashboard", async () => {
      await expect(
        service.updateDashboard("tenant-1", "invalid", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("upsertDashboard", () => {
    it("should create new dashboard record when none exists", async () => {
      const result = await service.upsertDashboard("tenant-1", {
        technicianId: "tech-1",
        totalJobs: 10,
      });
      expect(result).toBeDefined();
    });
  });

  describe("updateTechnicianStatus", () => {
    it("should update technician status", async () => {
      const result = await service.updateTechnicianStatus(
        "tenant-1",
        "tech-1",
        "BUSY",
      );
      expect(result.currentStatus).toBe("BUSY");
    });

    it("should throw BadRequestException for invalid status", async () => {
      await expect(
        service.updateTechnicianStatus("tenant-1", "tech-1", "INVALID"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException for missing technician", async () => {
      db.fieldServiceTechnician.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.updateTechnicianStatus("tenant-1", "invalid", "BUSY"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
