import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinanceDemoDataService } from "../finance-demo-data.service";
import { BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        constructor(public value: unknown) {}
      },
    },
  };
});

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      tenant: {
        findUnique: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      demoDataRecord: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      invoice: {
        create: vi.fn(),
        delete: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb({
          customer: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "cust-demo-1" }),
          },
          invoice: {
            create: vi
              .fn()
              .mockImplementation(async (args) => ({
                id: `inv-${Math.random()}`,
                ...args.data,
              })),
          },
          payment: {
            create: vi
              .fn()
              .mockImplementation(async (args) => ({
                id: `pay-${Math.random()}`,
                ...args.data,
              })),
          },
          demoDataRecord: {
            create: vi.fn().mockResolvedValue({ id: "rec-1" }),
          },
        });
      }),
    },
  };
});

describe("FinanceDemoDataService", () => {
  let service: FinanceDemoDataService;

  beforeEach(() => {
    service = new FinanceDemoDataService();
    vi.clearAllMocks();
  });

  describe("getDemoStatus", () => {
    it("should return loaded: false when no demo records exist", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant-1",
      } as never);
      vi.mocked(prisma.demoDataRecord.groupBy).mockResolvedValue([] as never);

      const status = await service.getDemoStatus("tenant-1");

      expect(status.loaded).toBe(false);
      expect(status.totalRecords).toBe(0);
      expect(status.module).toBe("finance");
    });

    it("should return loaded: true when demo records exist", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant-1",
      } as never);
      vi.mocked(prisma.demoDataRecord.groupBy).mockResolvedValue([
        { entityType: "invoice", _count: { id: 5 } },
        { entityType: "payment", _count: { id: 2 } },
      ] as never);

      const status = await service.getDemoStatus("tenant-1");

      expect(status.loaded).toBe(true);
      expect(status.totalRecords).toBe(7);
      expect(status.entityCounts.invoice).toBe(5);
    });
  });

  describe("loadFinanceDemoData", () => {
    it("should seed finance demo data successfully", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant-1",
      } as never);
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as never);
      vi.mocked(prisma.demoDataRecord.groupBy).mockResolvedValue([] as never);

      const result = await service.loadFinanceDemoData("tenant-1", "org-1");

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw BadRequestException if demo data is already loaded", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant-1",
      } as never);
      vi.mocked(prisma.demoDataRecord.groupBy).mockResolvedValue([
        { entityType: "invoice", _count: { id: 5 } },
      ] as never);

      await expect(service.loadFinanceDemoData("tenant-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("unloadFinanceDemoData", () => {
    it("should unload demo records safely", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.demoDataRecord.findMany).mockResolvedValue([
        { id: "rec-1", entityType: "invoice", entityId: "inv-1" },
        { id: "rec-2", entityType: "payment", entityId: "pay-1" },
      ] as never);

      const result = await service.unloadFinanceDemoData("tenant-1");

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(prisma.demoDataRecord.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: "tenant-1", module: "finance" },
      });
    });

    it("should handle unload gracefully when no records exist", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.demoDataRecord.findMany).mockResolvedValue([] as never);

      const result = await service.unloadFinanceDemoData("tenant-1");

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });
  });
});
