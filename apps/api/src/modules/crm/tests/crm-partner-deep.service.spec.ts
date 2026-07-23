import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmPartnerDeepService } from "../crm-partner-deep.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesPartner: {
      findFirst: vi.fn(),
    },
    salesPartnerDealRegistration: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    salesPartnerMdfFund: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmPartnerDeepService", () => {
  let service: CrmPartnerDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmPartnerDeepService();
  });

  describe("getDealRegistrations", () => {
    it("returns deal registrations with partner info", async () => {
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue([
        {
          id: "dr-1",
          status: "SUBMITTED",
          partner: { id: "p-1", name: "Partner Co", tierId: null },
        },
      ]);
      const results = await service.getDealRegistrations(TENANT);
      expect(results).toHaveLength(1);
    });

    it("filters by partnerId and status", async () => {
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue(
        [],
      );
      await service.getDealRegistrations(TENANT, "p-1", "APPROVED");
      const callArgs = (prisma.salesPartnerDealRegistration.findMany as any)
        .mock.calls[0][0];
      expect(callArgs.where.partnerId).toBe("p-1");
      expect(callArgs.where.status).toBe("APPROVED");
    });
  });

  describe("getDealRegistration", () => {
    it("throws NotFoundException when not found", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue(
        null,
      );
      await expect(service.getDealRegistration(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns registration with partner and tier", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue({
        id: "dr-1",
        status: "SUBMITTED",
        partner: { id: "p-1", name: "Partner Co", tier: null },
      });
      const result = await service.getDealRegistration(TENANT, "dr-1");
      expect(result.status).toBe("SUBMITTED");
    });
  });

  describe("createDealRegistration", () => {
    it("throws BadRequestException when partner not found", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      const dto = {
        partnerId: "p-x",
        companyName: "Co",
        contactName: "N",
        contactEmail: "a@b.com",
        estimatedValue: 0,
        currency: "USD",
      };
      await expect(
        service.createDealRegistration(TENANT, ORG, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates a deal registration when partner exists", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      const dto = {
        partnerId: "p-1",
        companyName: "Acme Inc",
        contactName: "John",
        contactEmail: "john@acme.com",
        estimatedValue: 50000,
        currency: "USD",
      };
      (prisma.salesPartnerDealRegistration.create as any).mockResolvedValue({
        id: "dr-new",
        ...dto,
        partner: { id: "p-1", name: "Partner Co" },
      });
      const result = await service.createDealRegistration(TENANT, ORG, dto);
      expect(result.id).toBe("dr-new");
    });
  });

  describe("approveDealRegistration", () => {
    it("rejects approval when status is not SUBMITTED", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue({
        id: "dr-1",
        status: "APPROVED",
      });
      await expect(
        service.approveDealRegistration(TENANT, "dr-1", "admin"),
      ).rejects.toThrow(BadRequestException);
    });

    it("approves a SUBMITTED registration", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue({
        id: "dr-1",
        status: "SUBMITTED",
      });
      (prisma.salesPartnerDealRegistration.update as any).mockResolvedValue({
        id: "dr-1",
        status: "APPROVED",
      });
      const result = await service.approveDealRegistration(
        TENANT,
        "dr-1",
        "admin",
      );
      expect(prisma.salesPartnerDealRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "APPROVED",
            approvedBy: "admin",
            approvedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("rejectDealRegistration", () => {
    it("rejects rejection when status is not SUBMITTED", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue({
        id: "dr-1",
        status: "APPROVED",
      });
      await expect(
        service.rejectDealRegistration(TENANT, "dr-1", "Bad"),
      ).rejects.toThrow(BadRequestException);
    });

    it("rejects a SUBMITTED registration", async () => {
      (prisma.salesPartnerDealRegistration.findFirst as any).mockResolvedValue({
        id: "dr-1",
        status: "SUBMITTED",
      });
      (prisma.salesPartnerDealRegistration.update as any).mockResolvedValue({
        id: "dr-1",
        status: "REJECTED",
      });
      const result = await service.rejectDealRegistration(
        TENANT,
        "dr-1",
        "Incomplete info",
      );
      expect(prisma.salesPartnerDealRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "REJECTED",
            rejectionReason: "Incomplete info",
          }),
        }),
      );
      expect(result.status).toBe("REJECTED");
    });
  });

  describe("getDealRegistrationStats", () => {
    it("returns counts by status and total estimated value", async () => {
      (prisma.salesPartnerDealRegistration.count as any)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);
      (prisma.salesPartnerDealRegistration.aggregate as any).mockResolvedValue({
        _sum: { estimatedValue: 200000 },
      });
      const stats = await service.getDealRegistrationStats(TENANT);
      expect(stats.submitted).toBe(5);
      expect(stats.totalEstimatedValue).toBe(200000);
    });
  });

  describe("MdfFund CRUD", () => {
    it("getMdfFund returns funds with partner info", async () => {
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([
        { id: "f-1", partner: { id: "p-1", name: "P1" } },
      ]);
      const results = await service.getMdfFunds(TENANT);
      expect(results).toHaveLength(1);
    });

    it("getMdfFund throws NotFoundException", async () => {
      (prisma.salesPartnerMdfFund.findFirst as any).mockResolvedValue(null);
      await expect(service.getMdfFund(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("createMdfFund validates partner existence", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      const dto = {
        partnerId: "p-x",
        name: "Fund",
        budgetAmount: 1000,
        currency: "USD",
        fundType: "MDF" as const,
        startDate: new Date(),
        endDate: new Date(),
        approvalRequired: true,
      };
      await expect(service.createMdfFund(TENANT, ORG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("createMdfFund creates fund when partner exists", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      const dto = {
        partnerId: "p-1",
        name: "Q1 Campaign",
        budgetAmount: 5000,
        currency: "USD",
        fundType: "MDF" as const,
        startDate: new Date(),
        endDate: new Date(),
        approvalRequired: true,
      };
      (prisma.salesPartnerMdfFund.create as any).mockResolvedValue({
        id: "f-new",
        ...dto,
        partner: { id: "p-1", name: "P1" },
      });
      const result = await service.createMdfFund(TENANT, ORG, dto);
      expect(result.id).toBe("f-new");
    });

    it("updateMdfFund throws NotFound", async () => {
      (prisma.salesPartnerMdfFund.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updateMdfFund(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("deleteMdfFund soft-deletes", async () => {
      (prisma.salesPartnerMdfFund.findFirst as any).mockResolvedValue({
        id: "f-1",
      });
      (prisma.salesPartnerMdfFund.update as any).mockResolvedValue({
        id: "f-1",
        deletedAt: new Date(),
      });
      const result = await service.deleteMdfFund(TENANT, "f-1");
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("getMdfFundStats", () => {
    it("aggregates active and closed fund stats", async () => {
      (prisma.salesPartnerMdfFund.aggregate as any).mockResolvedValueOnce({
        _count: 3,
        _sum: { budgetAmount: 30000, spentAmount: 10000 },
      });
      (prisma.salesPartnerMdfFund.aggregate as any).mockResolvedValueOnce({
        _count: 2,
        _sum: { budgetAmount: 15000, spentAmount: 15000 },
      });
      const stats = await service.getMdfFundStats(TENANT);
      expect(stats.activeFunds).toBe(3);
      expect(stats.totalBudget).toBe(45000);
    });
  });

  describe("getPartnerPerformance", () => {
    it("throws NotFound when partner not found", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      await expect(
        service.getPartnerPerformance(TENANT, "p-x"),
      ).rejects.toThrow(NotFoundException);
    });

    it("computes win rate and MDF utilization", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue([
        { estimatedValue: new Prisma.Decimal(100000), status: "WON" },
        { estimatedValue: new Prisma.Decimal(50000), status: "WON" },
        { estimatedValue: new Prisma.Decimal(20000), status: "LOST" },
      ]);
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([
        {
          budgetAmount: new Prisma.Decimal(10000),
          spentAmount: new Prisma.Decimal(6000),
        },
        {
          budgetAmount: new Prisma.Decimal(5000),
          spentAmount: new Prisma.Decimal(5000),
        },
      ]);
      const perf = await service.getPartnerPerformance(TENANT, "p-1");
      expect(perf.totalDealRegistrations).toBe(3);
      expect(perf.wonDeals).toBe(2);
      expect(perf.wonRate).toBeCloseTo(66.67, 0);
      expect(perf.totalDealValue).toBe(170000);
      expect(perf.totalMdfBudget).toBe(15000);
      expect(perf.mdfUtilizationRate).toBeCloseTo(73.33, 0);
    });
  });
});
