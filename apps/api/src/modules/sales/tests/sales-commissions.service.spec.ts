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
    commissionPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    commissionPayout: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    commissionPlanTier: {
      findMany: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
    salesOrder: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesCommissionsService } from "../sales-commissions.service";

describe("SalesCommissionsService", () => {
  let service: SalesCommissionsService;

  beforeEach(() => {
    service = new SalesCommissionsService();
    vi.clearAllMocks();
  });

  describe("getCommissionPlans", () => {
    it("should return commission plans for tenant", async () => {
      const mockPlans = [
        {
          id: "plan-1",
          name: "Q3 Incentive",
          isActive: true,
          _count: { tiers: 3, payouts: 10 },
        },
      ];
      vi.mocked(prisma.commissionPlan.findMany).mockResolvedValue(
        mockPlans as never,
      );

      const result = await service.getCommissionPlans("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Q3 Incentive");
      expect(result[0]?._count.tiers).toBe(3);
    });
  });

  describe("getPlanById", () => {
    it("should return a plan by id", async () => {
      const mockPlan = {
        id: "plan-1",
        name: "Q3 Incentive",
        tiers: [],
        spiffs: [],
      };
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue(
        mockPlan as never,
      );

      const result = await service.getPlanById("tenant-1", "plan-1");

      expect(result.name).toBe("Q3 Incentive");
    });

    it("should throw NotFoundException when plan not found", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue(null);

      await expect(
        service.getPlanById("tenant-1", "nonexistent"),
      ).rejects.toThrow("Commission plan not found");
    });
  });

  describe("createPlan", () => {
    it("should create a commission plan with tiers", async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as never);
      vi.mocked(prisma.commissionPlan.create).mockResolvedValue({
        id: "plan-1",
        name: "New Plan",
        tiers: [],
      } as never);

      const dto = {
        name: "New Plan",
        effectiveStart: new Date().toISOString(),
        tiers: [{ minAttainmentPct: 0, commissionRate: 5, sortOrder: 0 }],
      };

      const result = await service.createPlan("tenant-1", "org-1", dto);

      expect(result.name).toBe("New Plan");
    });
  });

  describe("updatePlan", () => {
    it("should update a plan", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue({
        id: "plan-1",
      } as never);
      vi.mocked(prisma.commissionPlan.update).mockResolvedValue({
        id: "plan-1",
        name: "Updated Plan",
        tiers: [],
      } as never);

      const result = await service.updatePlan("tenant-1", "plan-1", {
        name: "Updated Plan",
      });

      expect(result.name).toBe("Updated Plan");
    });

    it("should throw NotFoundException when plan not found", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue(null);

      await expect(
        service.updatePlan("tenant-1", "nonexistent", { name: "X" }),
      ).rejects.toThrow("Commission plan not found");
    });
  });

  describe("deletePlan", () => {
    it("should soft-delete a plan", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue({
        id: "plan-1",
      } as never);
      vi.mocked(prisma.commissionPlan.update).mockResolvedValue({
        id: "plan-1",
        deletedAt: new Date(),
      } as never);

      await service.deletePlan("tenant-1", "plan-1");

      expect(prisma.commissionPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "plan-1" },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("getPayouts", () => {
    it("should return payouts filtered by tenant", async () => {
      const mockPayouts = [
        {
          id: "po-1",
          period: "2026-Q3",
          totalPayout: 5000,
          plan: { id: "plan-1", name: "Q3 Plan" },
        },
      ];
      vi.mocked(prisma.commissionPayout.findMany).mockResolvedValue(
        mockPayouts as never,
      );

      const result = await service.getPayouts("tenant-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.period).toBe("2026-Q3");
    });
  });

  describe("getPayoutById", () => {
    it("should return a payout by id", async () => {
      const mockPayout = {
        id: "po-1",
        totalPayout: 5000,
        plan: { id: "plan-1", name: "Q3" },
        spiffLines: [],
      };
      vi.mocked(prisma.commissionPayout.findFirst).mockResolvedValue(
        mockPayout as never,
      );

      const result = await service.getPayoutById("tenant-1", "po-1");

      expect(result.id).toBe("po-1");
    });
  });

  describe("approvePayout", () => {
    it("should approve a draft payout", async () => {
      vi.mocked(prisma.commissionPayout.findFirst).mockResolvedValue({
        id: "po-1",
        status: "DRAFT",
      } as never);
      vi.mocked(prisma.commissionPayout.update).mockResolvedValue({
        id: "po-1",
        status: "APPROVED",
      } as never);

      const result = await service.approvePayout("tenant-1", "po-1", "user-1");

      expect(result.status).toBe("APPROVED");
    });

    it("should throw when payout is not in DRAFT status", async () => {
      vi.mocked(prisma.commissionPayout.findFirst).mockResolvedValue({
        id: "po-1",
        status: "PAID",
      } as never);

      await expect(
        service.approvePayout("tenant-1", "po-1", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getCommissionDashboard", () => {
    it("should return dashboard stats", async () => {
      vi.mocked(prisma.commissionPayout.aggregate).mockResolvedValue({
        _sum: { totalPayout: 100000 },
      } as never);
      vi.mocked(prisma.commissionPayout.count).mockResolvedValue(5);
      vi.mocked(prisma.commissionPlan.count).mockResolvedValue(4);

      const result = await service.getCommissionDashboard("tenant-1");

      expect(result.totalApprovedPayouts).toBe(100000);
      expect(result.pendingApprovals).toBe(5);
      expect(result.activePlansCount).toBe(4);
    });
  });

  describe("calculatePayouts", () => {
    it("should calculate payouts based on sales orders", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue({
        id: "plan-1",
        orgId: "org-1",
        tiers: [
          {
            minAttainmentPct: 0,
            maxAttainmentPct: null,
            commissionRate: 10,
            sortOrder: 0,
          },
        ],
      } as never);
      vi.mocked(prisma.salesOrder.findMany).mockResolvedValue([
        { totalAmount: 10000 },
      ] as never);
      vi.mocked(prisma.commissionPayout.create).mockResolvedValue({
        id: "po-1",
        totalPayout: 1000,
        plan: { id: "plan-1", name: "Plan" },
      } as never);

      const result = await service.calculatePayouts(
        "tenant-1",
        "plan-1",
        "2026-Q3",
      );

      expect(result).toBeDefined();
    });

    it("should throw when plan has no tiers", async () => {
      vi.mocked(prisma.commissionPlan.findFirst).mockResolvedValue({
        id: "plan-1",
        tiers: [],
      } as never);

      await expect(
        service.calculatePayouts("tenant-1", "plan-1", "2026-Q3"),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
