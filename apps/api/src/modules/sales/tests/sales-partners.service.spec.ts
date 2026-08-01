import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
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
    salesPartner: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    salesPartnerTier: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesPartnersService } from "../sales-partners.service";

describe("SalesPartnersService", () => {
  let service: SalesPartnersService;

  beforeEach(() => {
    service = new SalesPartnersService();
    vi.clearAllMocks();
  });

  describe("getPartners", () => {
    it("should return partners for tenant", async () => {
      const mockPartners = [
        {
          id: "p-1",
          name: "Partner A",
          status: "ACTIVE",
          type: "RESELLER",
          tier: { id: "t-1", name: "Gold", commissionRate: 10 },
        },
      ];
      vi.mocked(prisma.salesPartner.findMany).mockResolvedValue(
        mockPartners as never,
      );

      const result = await service.getPartners("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Partner A");
    });

    it("should filter partners by status", async () => {
      vi.mocked(prisma.salesPartner.findMany).mockResolvedValue([]);

      await service.getPartners("tenant-1", "ACTIVE");

      expect(prisma.salesPartner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ACTIVE" }),
        }),
      );
    });
  });

  describe("getPartnerById", () => {
    it("should return a partner by id", async () => {
      const mockPartner = { id: "p-1", name: "Partner A", tier: {} };
      vi.mocked(prisma.salesPartner.findFirst).mockResolvedValue(
        mockPartner as never,
      );

      const result = await service.getPartnerById("tenant-1", "p-1");

      expect(result.name).toBe("Partner A");
    });

    it("should throw NotFoundException when partner not found", async () => {
      vi.mocked(prisma.salesPartner.findFirst).mockResolvedValue(null);

      await expect(
        service.getPartnerById("tenant-1", "nonexistent"),
      ).rejects.toThrow("Partner not found");
    });
  });

  describe("createPartner", () => {
    it("should create a partner", async () => {
      vi.mocked(prisma.salesPartner.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.salesPartner.create).mockResolvedValue({
        id: "p-1",
        name: "New Partner",
      } as never);

      const result = await service.createPartner(
        "tenant-1",
        "org-1",
        { name: "New Partner" },
        "user-1",
      );

      expect(result).toBeDefined();
      expect(result.name).toBe("New Partner");
    });

    it("should throw when partner name already exists", async () => {
      vi.mocked(prisma.salesPartner.findUnique).mockResolvedValue({
        id: "existing",
      } as never);

      await expect(
        service.createPartner(
          "tenant-1",
          "org-1",
          { name: "Existing Name" },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("updatePartner", () => {
    it("should update a partner", async () => {
      vi.mocked(prisma.salesPartner.findFirst).mockResolvedValue({
        id: "p-1",
        name: "Old Name",
      } as never);
      vi.mocked(prisma.salesPartner.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.salesPartner.update).mockResolvedValue({
        id: "p-1",
        name: "Updated Name",
      } as never);

      const result = await service.updatePartner("tenant-1", "p-1", {
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
    });

    it("should throw NotFoundException when partner not found", async () => {
      vi.mocked(prisma.salesPartner.findFirst).mockResolvedValue(null);

      await expect(
        service.updatePartner("tenant-1", "nonexistent", { name: "X" }),
      ).rejects.toThrow("Partner not found");
    });
  });

  describe("deletePartner", () => {
    it("should soft-delete a partner", async () => {
      vi.mocked(prisma.salesPartner.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.salesPartner.update).mockResolvedValue({
        id: "p-1",
        deletedAt: new Date(),
      } as never);

      await service.deletePartner("tenant-1", "p-1");

      expect(prisma.salesPartner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
