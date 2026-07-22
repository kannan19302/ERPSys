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
    contract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    contractBillingMilestone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
    customer: { findFirst: vi.fn() },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        contract: {
          create: vi.fn().mockResolvedValue({
            id: "c-2",
            contractNumber: "CTR-002-R42",
            status: "ACTIVE",
          }),
          update: vi.fn(),
        },
      }),
    ),
  },
}));

import { prisma } from "@unerp/database";
import { SalesContractsService } from "../sales-contracts.service";

describe("SalesContractsService", () => {
  let service: SalesContractsService;
  let mockEventEmitter: EventEmitter2;

  beforeEach(() => {
    mockEventEmitter = { emit: vi.fn() } as unknown as EventEmitter2;
    service = new SalesContractsService();
    vi.clearAllMocks();
  });

  describe("getContracts", () => {
    it("should return mapped sales contracts", async () => {
      const mockContracts = [
        {
          id: "c-1",
          contractNumber: "CTR-001",
          title: "Annual Support",
          status: "ACTIVE",
          value: { toString: () => "50000" },
          currency: "USD",
          startDate: new Date(),
          endDate: new Date(),
          autoRenew: true,
          customer: { name: "Customer A" },
        },
      ];
      vi.mocked(prisma.contract.findMany).mockResolvedValue(
        mockContracts as never,
      );

      const result = await service.getContracts("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.contractNumber).toBe("CTR-001");
      expect(result[0]?.customerName).toBe("Customer A");
      expect(result[0]?.value).toBe(50000);
    });

    it("should filter contracts by status", async () => {
      vi.mocked(prisma.contract.findMany).mockResolvedValue([]);

      await service.getContracts("tenant-1", "ACTIVE");

      expect(prisma.contract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ACTIVE" }),
        }),
      );
    });
  });

  describe("getContractById", () => {
    it("should return a contract by id", async () => {
      const mockContract = {
        id: "c-1",
        contractNumber: "CTR-001",
        customer: {},
        lineItems: [],
        billingMilestones: [],
        salesOrders: [],
      };
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(
        mockContract as never,
      );

      const result = await service.getContractById("tenant-1", "c-1");

      expect(result.contractNumber).toBe("CTR-001");
    });

    it("should throw NotFoundException when contract not found", async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);

      await expect(
        service.getContractById("tenant-1", "nonexistent"),
      ).rejects.toThrow("Sales contract not found");
    });
  });

  describe("createContract", () => {
    it("should create a sales contract", async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as never);
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "cust-1",
      } as never);
      vi.mocked(prisma.contract.create).mockResolvedValue({
        id: "c-1",
        contractNumber: "CTR-001",
      } as never);

      const dto = {
        contractNumber: "CTR-001",
        title: "Support Contract",
        customerId: "cust-1",
        value: 50000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      const result = await service.createContract(
        "tenant-1",
        "org-1",
        dto,
        "user-1",
      );

      expect(result).toBeDefined();
      expect(result.contractNumber).toBe("CTR-001");
    });

    it("should throw when customer not found", async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as never);
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const dto = {
        contractNumber: "CTR-002",
        customerId: "nonexistent",
        value: 1000,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      await expect(
        service.createContract("tenant-1", "org-1", dto, "user-1"),
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("updateContractStatus", () => {
    it("should update contract status and set approval fields on ACTIVE", async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: "c-1",
      } as never);
      vi.mocked(prisma.contract.update).mockResolvedValue({
        id: "c-1",
        status: "ACTIVE",
      } as never);

      const result = await service.updateContractStatus(
        "tenant-1",
        "c-1",
        "ACTIVE",
        "user-1",
      );

      expect(result.status).toBe("ACTIVE");
      expect(prisma.contract.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException when contract not found", async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue(null);

      await expect(
        service.updateContractStatus(
          "tenant-1",
          "nonexistent",
          "ACTIVE",
          "user-1",
        ),
      ).rejects.toThrow("Sales contract not found");
    });
  });

  describe("renewContract", () => {
    it("should renew a contract and create a new one", async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: "c-1",
        endDate,
        autoRenew: true,
        renewalTermMonths: 12,
        tenantId: "tenant-1",
        orgId: "org-1",
        contractNumber: "CTR-001",
        title: "Support",
        customerId: "cust-1",
        type: "SALES",
        value: 50000,
        currency: "USD",
        terms: "Standard",
      } as never);

      const result = await service.renewContract("tenant-1", "c-1", "user-1");

      expect(result).toBeDefined();
    });

    it("should throw when auto-renew is disabled", async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: "c-1",
        autoRenew: false,
      } as never);

      await expect(
        service.renewContract("tenant-1", "c-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getMilestones", () => {
    it("should return milestones for a contract", async () => {
      vi.mocked(prisma.contract.findFirst).mockResolvedValue({
        id: "c-1",
      } as never);
      vi.mocked(prisma.contractBillingMilestone.findMany).mockResolvedValue([
        { id: "m-1", title: "Milestone 1", status: "PENDING" },
      ] as never);

      const result = await service.getMilestones("tenant-1", "c-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.title).toBe("Milestone 1");
    });
  });

  describe("updateMilestoneStatus", () => {
    it("should update milestone status", async () => {
      vi.mocked(prisma.contractBillingMilestone.findFirst).mockResolvedValue({
        id: "m-1",
      } as never);
      vi.mocked(prisma.contractBillingMilestone.update).mockResolvedValue({
        id: "m-1",
        status: "COMPLETED",
      } as never);

      const result = await service.updateMilestoneStatus(
        "tenant-1",
        "m-1",
        "COMPLETED",
      );

      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("getContractDashboard", () => {
    it("should return dashboard stats", async () => {
      vi.mocked(prisma.contract.count).mockResolvedValueOnce(10);
      vi.mocked(prisma.contract.count).mockResolvedValueOnce(3);
      vi.mocked(prisma.contract.count).mockResolvedValueOnce(2);
      vi.mocked(prisma.contract.aggregate).mockResolvedValue({
        _sum: { value: 500000 },
      } as never);

      const result = await service.getContractDashboard("tenant-1");

      expect(result.totalActive).toBe(10);
      expect(result.totalValue).toBe(500000);
    });
  });
});
