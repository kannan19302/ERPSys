// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmPartnerDeepTwoService } from "../crm-partner-deep-two.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesPartner: { findFirst: vi.fn(), findMany: vi.fn() },
    salesPartnerContract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    salesPartnerTier: { findFirst: vi.fn(), findMany: vi.fn() },
    salesPartnerTierRequirement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    salesPartnerReferral: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    salesPartnerCertification: { findMany: vi.fn(), create: vi.fn() },
    salesPartnerTraining: { findMany: vi.fn(), create: vi.fn() },
    salesPartnerDealRegistration: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    salesPartnerMdfFund: { findMany: vi.fn(), aggregate: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmPartnerDeepTwoService", () => {
  let service: CrmPartnerDeepTwoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmPartnerDeepTwoService();
  });

  describe("getPartnerContracts", () => {
    it("returns contracts with partner info", async () => {
      (prisma.salesPartnerContract.findMany as any).mockResolvedValue([
        { id: "c-1", status: "ACTIVE", partner: { id: "p-1", name: "P1" } },
      ]);
      const r = await service.getPartnerContracts(TENANT);
      expect(r).toHaveLength(1);
    });

    it("filters by partnerId and status", async () => {
      (prisma.salesPartnerContract.findMany as any).mockResolvedValue([]);
      await service.getPartnerContracts(TENANT, "p-1", "ACTIVE");
      const args = (prisma.salesPartnerContract.findMany as any).mock
        .calls[0][0];
      expect(args.where.partnerId).toBe("p-1");
      expect(args.where.status).toBe("ACTIVE");
    });
  });

  describe("getPartnerContract", () => {
    it("throws NotFoundException when not found", async () => {
      (prisma.salesPartnerContract.findFirst as any).mockResolvedValue(null);
      await expect(service.getPartnerContract(TENANT, "x")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createPartnerContract", () => {
    it("throws BadRequestException when partner not found", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      const dto = {
        partnerId: "p-x",
        contractNumber: "CN-001",
        name: "C",
        type: "PARTNERSHIP" as const,
        startDate: new Date(),
        value: 0,
      };
      await expect(
        service.createPartnerContract(TENANT, ORG, dto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates contract when partner exists", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      const dto = {
        partnerId: "p-1",
        contractNumber: "CN-001",
        name: "Partner Agreement",
        type: "PARTNERSHIP" as const,
        startDate: new Date(),
        value: 50000,
        currency: "USD",
      };
      (prisma.salesPartnerContract.create as any).mockResolvedValue({
        id: "c-new",
        ...dto,
        partner: { id: "p-1", name: "P1" },
      });
      const r = await service.createPartnerContract(TENANT, ORG, dto);
      expect(r.id).toBe("c-new");
    });
  });

  describe("updatePartnerContract", () => {
    it("throws NotFound when missing", async () => {
      (prisma.salesPartnerContract.findFirst as any).mockResolvedValue(null);
      await expect(
        service.updatePartnerContract(TENANT, "x", { name: "New" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deletePartnerContract", () => {
    it("soft-deletes", async () => {
      (prisma.salesPartnerContract.findFirst as any).mockResolvedValue({
        id: "c-1",
      });
      (prisma.salesPartnerContract.update as any).mockResolvedValue({
        id: "c-1",
        deletedAt: new Date(),
      });
      const r = await service.deletePartnerContract(TENANT, "c-1");
      expect(r.deletedAt).toBeDefined();
    });
  });

  describe("getTierRequirements", () => {
    it("returns requirements", async () => {
      (prisma.salesPartnerTierRequirement.findMany as any).mockResolvedValue([
        { id: "tr-1", tier: { id: "t-1", name: "Gold" } },
      ]);
      const r = await service.getTierRequirements(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("createTierRequirement", () => {
    it("throws when tier not found", async () => {
      (prisma.salesPartnerTier.findFirst as any).mockResolvedValue(null);
      const dto = {
        tierId: "t-x",
        metric: "revenue",
        minValue: 100000,
        unit: "USD",
      };
      await expect(
        service.createTierRequirement(TENANT, dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("evaluatePartnerTier", () => {
    it("evaluates and returns tier qualification", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({
        id: "p-1",
        name: "P1",
        tier: { id: "t-1", name: "Silver" },
      });
      (prisma.salesPartnerTier.findMany as any).mockResolvedValue([
        {
          id: "t-1",
          name: "Gold",
          sortOrder: 10,
          requirements: [
            { metric: "wonDeals", minValue: 5, maxValue: null, weight: 1 },
          ],
        },
        {
          id: "t-2",
          name: "Platinum",
          sortOrder: 20,
          requirements: [
            { metric: "wonDeals", minValue: 20, maxValue: null, weight: 1 },
          ],
        },
      ]);
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue(
        Array.from({ length: 3 }, (_, i) => ({
          estimatedValue: 10000,
          status: "WON",
        })),
      );
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([]);
      const r = await service.evaluatePartnerTier(TENANT, "p-1");
      expect(r.partnerId).toBe("p-1");
      expect(r.metrics.wonDeals).toBe(3);
      expect(r.evaluations).toHaveLength(2);
    });
  });

  describe("getPartnerReferrals", () => {
    it("returns referrals", async () => {
      (prisma.salesPartnerReferral.findMany as any).mockResolvedValue([
        { id: "r-1", partner: { id: "p-1", name: "P1" } },
      ]);
      const r = await service.getPartnerReferrals(TENANT);
      expect(r).toHaveLength(1);
    });
  });

  describe("createPartnerReferral", () => {
    it("throws when partner not found", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      const dto = {
        partnerId: "p-x",
        companyName: "Co",
        contactName: "N",
        contactEmail: "a@b.com",
        estimatedValue: 0,
      };
      await expect(
        service.createPartnerReferral(TENANT, ORG, dto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getPartnerPerformanceMetrics", () => {
    it("throws NotFound when partner missing", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      await expect(
        service.getPartnerPerformanceMetrics(TENANT, "p-x"),
      ).rejects.toThrow(NotFoundException);
    });

    it("computes performance metrics", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue([
        { estimatedValue: 50000, status: "WON" },
        { estimatedValue: 30000, status: "WON" },
        { estimatedValue: 20000, status: "LOST" },
      ]);
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([
        { budgetAmount: 10000, spentAmount: 5000 },
      ]);
      (prisma.salesPartnerReferral.findMany as any).mockResolvedValue([
        { status: "CONVERTED" },
        { status: "NEW" },
      ]);
      (prisma.salesPartnerContract.findMany as any).mockResolvedValue([
        { status: "ACTIVE" },
        { status: "ACTIVE" },
      ]);
      const m = await service.getPartnerPerformanceMetrics(TENANT, "p-1");
      expect(m.wonDeals).toBe(2);
      expect(m.wonRate).toBeCloseTo(66.67, 0);
      expect(m.activeContracts).toBe(2);
    });
  });

  describe("calculatePartnerPerformance", () => {
    it("returns score with computedAt", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue(
        [],
      );
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([]);
      (prisma.salesPartnerReferral.findMany as any).mockResolvedValue([]);
      (prisma.salesPartnerContract.findMany as any).mockResolvedValue([]);
      const r = await service.calculatePartnerPerformance(TENANT, "p-1");
      expect(r.score).toBeDefined();
      expect(r.computedAt).toBeDefined();
    });
  });

  describe("getPartnerDashboard", () => {
    it("aggregates partner KPIs", async () => {
      (prisma.salesPartner.findMany as any).mockResolvedValue([
        { id: "p-1", name: "P1" },
      ]);
      (prisma.salesPartnerDealRegistration.count as any).mockResolvedValue(10);
      (prisma.salesPartnerDealRegistration.count as any)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4);
      (prisma.salesPartnerReferral.count as any).mockResolvedValue(5);
      (prisma.salesPartnerContract.count as any).mockResolvedValue(3);
      (prisma.salesPartnerMdfFund.aggregate as any).mockResolvedValue({
        _sum: { budgetAmount: 50000, spentAmount: 20000 },
      });
      (prisma.salesPartnerDealRegistration.aggregate as any).mockResolvedValue({
        _sum: { estimatedValue: 200000 },
      });
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue(
        [],
      );
      (prisma.salesPartnerMdfFund.findMany as any).mockResolvedValue([]);
      (prisma.salesPartnerReferral.findMany as any).mockResolvedValue([]);
      (prisma.salesPartnerContract.findMany as any).mockResolvedValue([]);
      const d = await service.getPartnerDashboard(TENANT);
      expect(d.totalPartners).toBe(1);
    });
  });

  describe("getPartnerCertifications", () => {
    it("throws NotFound when partner missing", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue(null);
      await expect(
        service.getPartnerCertifications(TENANT, "p-x"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getPartnerTrainingCompletion", () => {
    it("returns training stats", async () => {
      (prisma.salesPartner.findFirst as any).mockResolvedValue({ id: "p-1" });
      (prisma.salesPartnerTraining.findMany as any).mockResolvedValue([
        { status: "COMPLETED" },
        { status: "COMPLETED" },
        { status: "ENROLLED" },
      ]);
      const r = await service.getPartnerTrainingCompletion(TENANT, "p-1");
      expect(r.total).toBe(3);
      expect(r.completed).toBe(2);
      expect(r.completionRate).toBeCloseTo(66.67, 0);
    });
  });

  describe("getPartnerRevenueContribution", () => {
    it("returns revenue by partner", async () => {
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue([
        {
          partnerId: "p-1",
          estimatedValue: 100000,
          partner: { id: "p-1", name: "P1" },
          submittedAt: new Date(),
        },
      ]);
      const r = await service.getPartnerRevenueContribution(TENANT);
      expect(r.totalRevenue).toBe(100000);
    });
  });

  describe("getPartnerAttribution", () => {
    it("returns attributed deals", async () => {
      (prisma.salesPartnerDealRegistration.findMany as any).mockResolvedValue([
        {
          id: "dr-1",
          companyName: "Acme",
          estimatedValue: 50000,
          currency: "USD",
          partner: { id: "p-1", name: "P1" },
          submittedAt: new Date(),
        },
      ]);
      const r = await service.getPartnerAttribution(TENANT);
      expect(r.totalAttributedDeals).toBe(1);
    });
  });
});
