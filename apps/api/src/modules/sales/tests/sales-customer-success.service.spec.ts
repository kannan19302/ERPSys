import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    customerSuccessPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customerSuccessMilestone: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesCustomerSuccessService } from "../sales-customer-success.service";

describe("SalesCustomerSuccessService", () => {
  let service: SalesCustomerSuccessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesCustomerSuccessService],
    }).compile();

    service = module.get<SalesCustomerSuccessService>(
      SalesCustomerSuccessService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPlans", () => {
    it("should return plans for a tenant", async () => {
      const mockPlans = [
        { id: "plan-1", name: "Enterprise Plan", healthScore: 90 },
      ];
      (prisma.customerSuccessPlan.findMany as any).mockResolvedValue(mockPlans);

      const result = await service.getPlans("tenant-1");
      expect(result).toEqual(mockPlans);
      expect(prisma.customerSuccessPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "tenant-1" } }),
      );
    });
  });

  describe("createPlan", () => {
    it("should create a customer success plan", async () => {
      const dto = {
        customerId: "cust-1",
        name: "Acme Success Plan",
        arr: 50000,
      };
      const mockCreated = { id: "plan-1", ...dto, healthScore: 100 };
      (prisma.customerSuccessPlan.create as any).mockResolvedValue(mockCreated);

      const result = await service.createPlan("tenant-1", dto);
      expect(result).toEqual(mockCreated);
      expect(prisma.customerSuccessPlan.create).toHaveBeenCalled();
    });
  });

  describe("getMetrics", () => {
    it("should calculate CS metrics correctly", async () => {
      const mockPlans = [
        {
          id: "p1",
          status: "ACTIVE",
          churnRiskLevel: "LOW",
          healthScore: 90,
          arr: 10000,
        },
        {
          id: "p2",
          status: "ACTIVE",
          churnRiskLevel: "HIGH",
          healthScore: 50,
          arr: 20000,
        },
      ];
      (prisma.customerSuccessPlan.findMany as any).mockResolvedValue(mockPlans);

      const metrics = await service.getMetrics("tenant-1");
      expect(metrics.totalPlans).toBe(2);
      expect(metrics.activePlans).toBe(2);
      expect(metrics.atRiskPlans).toBe(1);
      expect(metrics.avgHealthScore).toBe(70);
      expect(metrics.totalArr).toBe(30000);
    });
  });
});
