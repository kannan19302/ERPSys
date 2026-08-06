import { describe, it, expect, vi, beforeEach } from "vitest";
import { RealEstateLeaseRenewalService } from "./real-estate-lease-renewal.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    realEstateLease: { findMany: vi.fn().mockResolvedValue([]) },
    realEstateProperty: { findMany: vi.fn().mockResolvedValue([]) },
    realEstateLeaseRenewal: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: "renew-1", ...d.data }),
        ),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    realEstateRentEscalation: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: "esc-1", ...d.data })),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    $transaction: vi.fn().mockImplementation(async (cb: any) =>
      cb({
        realEstateLeaseRenewal: { update: vi.fn().mockResolvedValue({}) },
        realEstateLease: { update: vi.fn().mockResolvedValue({}) },
        realEstateRentEscalation: { update: vi.fn().mockResolvedValue({}) },
      }),
    ),
  };
  return { db: mockDb };
});

vi.mock("@unerp/database", () => ({ prisma: db }));

describe("RealEstateLeaseRenewalService", () => {
  let service: RealEstateLeaseRenewalService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [RealEstateLeaseRenewalService],
    }).compile();
    service = mod.get(RealEstateLeaseRenewalService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getRenewals", () => {
    it("should return paginated renewals", async () => {
      const result = await service.getRenewals("tenant-1", {});
      expect(result).toBeDefined();
    });
  });

  describe("createRenewal", () => {
    it("should create lease renewal", async () => {
      const data = {
        leaseId: "lease-1",
        propertyId: "prop-1",
        tenantName: "John",
        currentRent: 1000,
        proposedRent: 1100,
        currentEndDate: "2026-12-31T00:00:00Z",
        proposedStartDate: "2027-01-01T00:00:00Z",
        proposedEndDate: "2028-01-01T00:00:00Z",
        renewalTermMonths: 12,
      };
      const result = await service.createRenewal("tenant-1", data);
      expect(result).toBeDefined();
    });
  });

  describe("approveRenewal", () => {
    it("should throw NotFoundException for missing renewal", async () => {
      await expect(
        service.approveRenewal("tenant-1", "invalid", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for non-draft renewal", async () => {
      db.realEstateLeaseRenewal.findFirst.mockResolvedValueOnce({
        id: "renew-1",
        status: "EXECUTED",
      });
      await expect(
        service.approveRenewal("tenant-1", "renew-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should approve draft renewal", async () => {
      db.realEstateLeaseRenewal.findFirst.mockResolvedValueOnce({
        id: "renew-1",
        status: "DRAFT",
      });
      const result = await service.approveRenewal(
        "tenant-1",
        "renew-1",
        "user-1",
      );
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("executeRenewal", () => {
    it("should throw NotFoundException for missing renewal", async () => {
      await expect(
        service.executeRenewal("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should execute approved renewal", async () => {
      db.realEstateLeaseRenewal.findFirst
        .mockResolvedValueOnce({
          id: "renew-1",
          tenantId: "tenant-1",
          status: "APPROVED",
          leaseId: "lease-1",
          proposedRent: 1100,
          proposedEndDate: new Date("2028-01-01"),
          proposedStartDate: new Date("2027-01-01"),
        })
        .mockResolvedValueOnce({ id: "renew-1", status: "EXECUTED" });
      const result = await service.executeRenewal("tenant-1", "renew-1");
      expect(result).toBeDefined();
    });
  });

  describe("getRentEscalations", () => {
    it("should return escalations", async () => {
      const result = await service.getRentEscalations("tenant-1", {});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("applyEscalation", () => {
    it("should apply percentage escalation", async () => {
      db.realEstateRentEscalation.findFirst.mockResolvedValueOnce({
        id: "esc-1",
        tenantId: "tenant-1",
        status: "ACTIVE",
        escalationType: "PERCENTAGE",
        escalationRate: 5,
        currentRent: 1000,
        baseRent: 1000,
        capRate: null,
        floorRate: null,
        frequencyMonths: 12,
        leaseId: "lease-1",
      });
      const result = await service.applyEscalation("tenant-1", "esc-1");
      expect(result).toBeDefined();
    });
  });
});
