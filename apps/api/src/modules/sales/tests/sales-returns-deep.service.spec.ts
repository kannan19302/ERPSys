import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesReturnOrderDeep: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { SalesReturnsDeepService } from "../sales-returns-deep.service";

describe("SalesReturnsDeepService", () => {
  let service: SalesReturnsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesReturnsDeepService],
    }).compile();

    service = module.get<SalesReturnsDeepService>(SalesReturnsDeepService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getReturns", () => {
    it("should return sales returns", async () => {
      const mockReturns = [
        { id: "ret-1", returnNumber: "RET-2026-0001", status: "REQUESTED" },
      ];
      (prisma.salesReturnOrderDeep.findMany as any).mockResolvedValue(
        mockReturns,
      );

      const result = await service.getReturns("tenant-1");
      expect(result).toEqual(mockReturns);
      expect(prisma.salesReturnOrderDeep.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "tenant-1" } }),
      );
    });
  });

  describe("createReturn", () => {
    it("should create a return order", async () => {
      (prisma.salesReturnOrderDeep.count as any).mockResolvedValue(0);
      const dto = {
        customerId: "cust-1",
        reason: "DEFECTIVE",
        totalRefundAmount: 250,
      };
      const mockCreated = {
        id: "ret-1",
        returnNumber: "RET-2026-0001",
        ...dto,
      };
      (prisma.salesReturnOrderDeep.create as any).mockResolvedValue(
        mockCreated,
      );

      const result = await service.createReturn("tenant-1", dto);
      expect(result).toEqual(mockCreated);
      expect(prisma.salesReturnOrderDeep.create).toHaveBeenCalled();
    });
  });

  describe("getReturnAnalytics", () => {
    it("should calculate return analytics correctly", async () => {
      const mockReturns = [
        {
          id: "r1",
          status: "REQUESTED",
          reason: "DEFECTIVE",
          totalRefundAmount: 100,
        },
        {
          id: "r2",
          status: "REFUNDED",
          reason: "BUYER_REMORSE",
          totalRefundAmount: 300,
        },
      ];
      (prisma.salesReturnOrderDeep.findMany as any).mockResolvedValue(
        mockReturns,
      );

      const analytics = await service.getReturnAnalytics("tenant-1");
      expect(analytics.totalReturns).toBe(2);
      expect(analytics.pendingReturns).toBe(1);
      expect(analytics.totalRefunded).toBe(300);
      expect(analytics.reasonBreakdown.DEFECTIVE).toBe(1);
      expect(analytics.reasonBreakdown.BUYER_REMORSE).toBe(1);
    });
  });
});
