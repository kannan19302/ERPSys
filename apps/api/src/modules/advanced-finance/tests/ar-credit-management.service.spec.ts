import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArCreditManagementService } from "../services/ar-credit-management.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      private _v: number;
      constructor(v: unknown) {
        this._v = Number(v);
      }
      toNumber() {
        return this._v;
      }
      valueOf() {
        return this._v;
      }
      toFixed(d: number) {
        return this._v.toFixed(d);
      }
    },
  },
}));

const mkColl = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
});

vi.mock("@unerp/database", () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    aRPromiseToPay: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    aRDispute: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    badDebtProvision: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    customerStatement: {
      findMany: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    payment: {
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-001";
const USER_ID = "user-001";

describe("ArCreditManagementService", () => {
  let service: ArCreditManagementService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ArCreditManagementService();
  });

  // ── listCustomerCreditProfiles ──────────────────────────────────────────────

  describe("listCustomerCreditProfiles", () => {
    it("returns credit profiles for all customers", async () => {
      const customers = [
        {
          id: "c1",
          name: "Alpha Corp",
          email: "a@test.com",
          creditLimit: null,
          creditHold: false,
          riskRating: "LOW",
          status: "ACTIVE",
        },
        {
          id: "c2",
          name: "Beta Inc",
          email: "b@test.com",
          creditLimit: null,
          creditHold: false,
          riskRating: "MEDIUM",
          status: "ACTIVE",
        },
      ];
      vi.mocked(prisma.customer.findMany).mockResolvedValue(customers as any);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({
        _sum: { totalAmount: 5000 },
      } as any);

      const result = await service.listCustomerCreditProfiles(TENANT);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Alpha Corp");
      expect(result[0].outstandingAmount).toBe(5000);
      expect(prisma.invoice.aggregate).toHaveBeenCalledTimes(2);
    });

    it("filters by search term", async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([] as any);

      await service.listCustomerCreditProfiles(TENANT, "Alpha");

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it("returns empty array when no customers exist", async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([] as any);

      const result = await service.listCustomerCreditProfiles(TENANT);

      expect(result).toEqual([]);
    });
  });

  // ── getCustomerCreditProfile ────────────────────────────────────────────────

  describe("getCustomerCreditProfile", () => {
    it("returns full credit profile for a customer", async () => {
      const customer = {
        id: "c1",
        name: "Alpha Corp",
        email: "a@test.com",
        phone: "123",
        creditLimit: null,
        creditHold: false,
        creditHoldReason: null,
        riskRating: "LOW",
        status: "ACTIVE",
      };
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(customer as any);
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({
        _sum: { totalAmount: 3000 },
      } as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        {
          id: "i1",
          invoiceNumber: "INV-001",
          status: "SENT",
          totalAmount: 3000,
          dueDate: new Date(),
        },
      ] as any);
      vi.mocked(prisma.aRPromiseToPay.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.aRDispute.findMany).mockResolvedValue([] as any);

      const result = await service.getCustomerCreditProfile(TENANT, "c1");

      expect(result.customer.name).toBe("Alpha Corp");
      expect(result.recentInvoices).toHaveLength(1);
      expect(result.activePromises).toEqual([]);
    });

    it("throws NotFoundException when customer does not exist", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(
        service.getCustomerCreditProfile(TENANT, "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateCreditLimit ───────────────────────────────────────────────────────

  describe("updateCreditLimit", () => {
    it("updates credit limit successfully", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "c1",
        name: "Test",
      } as any);
      vi.mocked(prisma.customer.update).mockResolvedValue({
        id: "c1",
        creditLimit: 50000,
      } as any);

      const result = await service.updateCreditLimit(
        TENANT,
        "c1",
        { creditLimit: 50000, reason: "Increased limit" },
        USER_ID,
      );

      expect(result).toBeDefined();
      expect(prisma.customer.update).toHaveBeenCalled();
    });

    it("throws NotFoundException when customer not found", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(
        service.updateCreditLimit(
          TENANT,
          "nonexistent",
          { creditLimit: 10000, reason: "Test" },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── placeCreditHold / releaseCreditHold ─────────────────────────────────────

  describe("placeCreditHold", () => {
    it("places customer on hold", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "c1",
        creditHold: false,
      } as any);
      vi.mocked(prisma.customer.update).mockResolvedValue({
        id: "c1",
        creditHold: true,
        creditHoldReason: "Overdue",
      } as any);

      const result = await service.placeCreditHold(
        TENANT,
        "c1",
        "Overdue",
        USER_ID,
      );

      expect(result).toBeDefined();
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditHold: true }),
        }),
      );
    });

    it("throws BadRequestException if already on hold", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "c1",
        creditHold: true,
      } as any);

      await expect(
        service.placeCreditHold(TENANT, "c1", "Overdue", USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws NotFoundException if customer not found", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      await expect(
        service.placeCreditHold(TENANT, "nonexistent", "Reason", USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("releaseCreditHold", () => {
    it("releases credit hold", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "c1",
        creditHold: true,
      } as any);
      vi.mocked(prisma.customer.update).mockResolvedValue({
        id: "c1",
        creditHold: false,
      } as any);

      const result = await service.releaseCreditHold(TENANT, "c1", USER_ID);

      expect(result).toBeDefined();
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ creditHold: false }),
        }),
      );
    });

    it("throws BadRequestException if not on hold", async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: "c1",
        creditHold: false,
      } as any);

      await expect(
        service.releaseCreditHold(TENANT, "c1", USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── listCustomersOnHold ────────────────────────────────────────────────────

  describe("listCustomersOnHold", () => {
    it("returns customers on credit hold", async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([
        { id: "c1", name: "On Hold Co", creditHold: true } as any,
      ]);

      const result = await service.listCustomersOnHold(TENANT);

      expect(result).toHaveLength(1);
      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, creditHold: true },
        }),
      );
    });

    it("returns empty array when none on hold", async () => {
      vi.mocked(prisma.customer.findMany).mockResolvedValue([] as any);

      const result = await service.listCustomersOnHold(TENANT);

      expect(result).toEqual([]);
    });
  });

  // ── listAgingSummary ────────────────────────────────────────────────────────

  describe("listAgingSummary", () => {
    it("returns aging buckets", async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        {
          id: "i1",
          totalAmount: 1000,
          dueDate: new Date(Date.now() - 45 * 86400000),
          customer: { name: "Test Co" },
        },
        {
          id: "i2",
          totalAmount: 2000,
          dueDate: new Date(Date.now() - 120 * 86400000),
          customer: { name: "Test Co" },
        },
      ] as any);

      const result = await service.listAgingSummary(TENANT);

      expect(result.buckets).toHaveLength(6);
      expect(result.totalOverdue).toBeGreaterThan(0);
    });

    it("returns zeroed buckets when no overdue invoices", async () => {
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([] as any);

      const result = await service.listAgingSummary(TENANT);

      expect(result.totalInvoices).toBe(0);
    });
  });

  // ── listCustomerStatements ──────────────────────────────────────────────────

  describe("listCustomerStatements", () => {
    it("returns statements", async () => {
      vi.mocked(prisma.customerStatement.findMany).mockResolvedValue([
        { id: "s1", customerId: "c1", periodEnd: new Date() } as any,
      ]);

      const result = await service.listCustomerStatements(TENANT, "c1");

      expect(result).toHaveLength(1);
    });

    it("returns all statements when no customerId filter", async () => {
      vi.mocked(prisma.customerStatement.findMany).mockResolvedValue([] as any);

      const result = await service.listCustomerStatements(TENANT);

      expect(result).toEqual([]);
    });
  });

  // ── computeBadDebtProvision ────────────────────────────────────────────────

  describe("computeBadDebtProvision", () => {
    it("creates a bad debt provision based on aging", async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        {
          id: "i1",
          totalAmount: 10000,
          dueDate: new Date(Date.now() - 400 * 86400000),
          customer: { name: "Old Co" },
        },
      ] as any);
      vi.mocked(prisma.badDebtProvision.create).mockResolvedValue({
        id: "prov-1",
        period: "2026-Q2",
        provisionAmount: 5000,
        status: "DRAFT",
      } as any);

      const result = await service.computeBadDebtProvision(TENANT);

      expect(result.id).toBe("prov-1");
      expect(prisma.badDebtProvision.create).toHaveBeenCalled();
    });

    it("creates a zero provision when no overdue invoices", async () => {
      vi.mocked(prisma.organization.findFirst).mockResolvedValue({
        id: "org-1",
      } as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.badDebtProvision.create).mockResolvedValue({
        id: "prov-0",
        period: "2026-Q2",
        provisionAmount: 0,
        status: "DRAFT",
      } as any);

      const result = await service.computeBadDebtProvision(TENANT);

      expect(result).toBeDefined();
    });
  });

  // ── getDsoTrend ─────────────────────────────────────────────────────────────

  describe("getDsoTrend", () => {
    it("returns DSO trend data points", async () => {
      vi.mocked(prisma.invoice.aggregate).mockResolvedValue({
        _sum: { totalAmount: 100000 },
        _count: { id: 10 },
      } as any);
      vi.mocked(prisma.payment.aggregate).mockResolvedValue({
        _sum: { amount: 80000 },
      } as any);

      const result = await service.getDsoTrend(TENANT, 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("dso");
    });
  });

  // ── getCollectorDashboard ───────────────────────────────────────────────────

  describe("getCollectorDashboard", () => {
    it("returns dashboard metrics", async () => {
      vi.mocked(prisma.invoice.count).mockResolvedValue(100);
      vi.mocked(prisma.invoice.count).mockResolvedValue(30);
      vi.mocked(prisma.aRPromiseToPay.count).mockResolvedValue(15);
      vi.mocked(prisma.aRDispute.count).mockResolvedValue(5);
      vi.mocked(prisma.badDebtProvision.aggregate).mockResolvedValue({
        _sum: { provisionAmount: 25000 },
      } as any);
      vi.mocked(prisma.customer.count).mockResolvedValue(3);

      // Re-mock invoice.count to return different values per call
      vi.mocked(prisma.invoice.count)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30);

      const result = await service.getCollectorDashboard(TENANT);

      expect(result.openInvoices).toBe(100);
      expect(result.overdueInvoices).toBe(30);
      expect(result.activePromises).toBe(15);
      expect(result.openDisputes).toBe(5);
      expect(result.totalProvision).toBe(25000);
      expect(result.customersOnHold).toBe(3);
    });
  });
});
