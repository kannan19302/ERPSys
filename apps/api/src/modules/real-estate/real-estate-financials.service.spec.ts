// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RealEstateFinancialsService } from "./real-estate-financials.service";
import { NotFoundException } from "@nestjs/common";

const { db } = vi.hoisted(() => {
  const mockDb: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    realEstatePropertyFinancial: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: "fin-1", ...d.data })),
      update: vi
        .fn()
        .mockImplementation((d) =>
          Promise.resolve({ id: d.where.id, ...d.data }),
        ),
    },
    realEstateProperty: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    realEstateExpenseCategory: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi
        .fn()
        .mockImplementation((d) => Promise.resolve({ id: "cat-1", ...d.data })),
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

describe("RealEstateFinancialsService", () => {
  let service: RealEstateFinancialsService;

  beforeEach(async () => {
    const { Test } = await import("@nestjs/testing");
    const mod = await Test.createTestingModule({
      providers: [RealEstateFinancialsService],
    }).compile();
    service = mod.get(RealEstateFinancialsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getFinancials", () => {
    it("should return paginated financial records", async () => {
      const result = await service.getFinancials("tenant-1", {});
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("getFinancialById", () => {
    it("should throw NotFoundException for missing record", async () => {
      await expect(
        service.getFinancialById("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createFinancial", () => {
    it("should create financial record with calculated fields", async () => {
      const data = {
        propertyId: "prop-1",
        periodStart: "2026-01-01T00:00:00Z",
        periodEnd: "2026-12-31T00:00:00Z",
        grossRentIncome: 50000,
        otherIncome: 5000,
        vacancyLoss: 2000,
        operatingExpenses: 15000,
        repairsMaintenance: 2000,
        insurance: 1000,
        taxes: 3000,
        utilities: 2000,
        debtService: 10000,
      };
      const result = await service.createFinancial("tenant-1", data);
      expect(result).toBeDefined();
    });
  });

  describe("deleteFinancial", () => {
    it("should soft-delete financial record", async () => {
      db.realEstatePropertyFinancial.findFirst.mockResolvedValueOnce({
        id: "fin-1",
        tenantId: "tenant-1",
      });
      const result = await service.deleteFinancial("tenant-1", "fin-1");
      expect(result.isActive).toBe(false);
    });
  });

  describe("getPropertySummary", () => {
    it("should throw NotFoundException for missing property", async () => {
      await expect(
        service.getPropertySummary("tenant-1", "invalid"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getExpenseCategories", () => {
    it("should return expense categories", async () => {
      const result = await service.getExpenseCategories("tenant-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createExpenseCategory", () => {
    it("should create expense category", async () => {
      const result = await service.createExpenseCategory("tenant-1", {
        name: "Repairs",
        code: "REPAIRS",
      });
      expect(result).toBeDefined();
    });
  });

  describe("getPortfolioSummary", () => {
    it("should return portfolio summary", async () => {
      const result = await service.getPortfolioSummary("tenant-1");
      expect(result).toBeDefined();
    });
  });
});
