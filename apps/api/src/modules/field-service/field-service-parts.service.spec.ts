import { describe, it, expect, vi, beforeEach } from "vitest";
import { FieldServicePartsService } from "./field-service-parts.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    fieldServicePartRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: "pr-1", ...d.data })),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    fieldServiceVanStock: Object.assign(
      {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi
          .fn()
          .mockImplementation((d) =>
            Promise.resolve({ id: "vs-1", ...d.create }),
          ),
        update: vi
          .fn()
          .mockImplementation((d) =>
            Promise.resolve({ id: d.where.id, ...d.data }),
          ),
      },
      { fields: { reorderPoint: 5 } },
    ),
  };
  return { db: mockDb };
});

vi.mock("@unerp/database", () => ({ prisma: db }));

describe("FieldServicePartsService", () => {
  let service: FieldServicePartsService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [FieldServicePartsService],
    }).compile();
    service = mod.get(FieldServicePartsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPartRequests", () => {
    it("should return paginated part requests", async () => {
      const result = await service.getPartRequests("tenant-1", {});
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("createPartRequest", () => {
    it("should create part request with total price", async () => {
      const data = {
        technicianId: "tech-1",
        itemId: "item-1",
        itemName: "Filter",
        quantityRequested: 2,
        unitPrice: 25,
      };
      const result = await service.createPartRequest("tenant-1", data);
      expect(result).toBeDefined();
    });
  });

  describe("approvePartRequest", () => {
    it("should throw NotFoundException for missing request", async () => {
      await expect(
        service.approvePartRequest("tenant-1", "invalid", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for non-pending request", async () => {
      db.fieldServicePartRequest.findFirst.mockResolvedValueOnce({
        id: "pr-1",
        status: "APPROVED",
      });
      await expect(
        service.approvePartRequest("tenant-1", "pr-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should approve pending request", async () => {
      db.fieldServicePartRequest.findFirst.mockResolvedValueOnce({
        id: "pr-1",
        tenantId: "tenant-1",
        status: "PENDING",
        quantityRequested: 3,
      });
      const result = await service.approvePartRequest(
        "tenant-1",
        "pr-1",
        "user-1",
      );
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("getVanStock", () => {
    it("should return van stock items", async () => {
      const result = await service.getVanStock("tenant-1", {});
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("adjustVanStockQuantity", () => {
    it("should throw BadRequestException for negative quantity", async () => {
      db.fieldServiceVanStock.findFirst.mockResolvedValueOnce({
        id: "vs-1",
        tenantId: "tenant-1",
        quantityOnVan: 5,
      });
      await expect(
        service.adjustVanStockQuantity("tenant-1", "vs-1", -1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getLowStockAlerts", () => {
    it("should return low stock items", async () => {
      const result = await service.getLowStockAlerts("tenant-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
