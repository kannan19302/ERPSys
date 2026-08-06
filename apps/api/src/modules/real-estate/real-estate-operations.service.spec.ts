import { Test, TestingModule } from "@nestjs/testing";
import { RealEstateOperationsService } from "./real-estate-operations.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("RealEstateOperationsService", () => {
  let svc: RealEstateOperationsService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealEstateOperationsService],
    }).compile();
    svc = module.get<RealEstateOperationsService>(RealEstateOperationsService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("maintenance", () => {
    it("getWorkOrders returns paginated", async () => {
      jest
        .spyOn(prisma.realEstateMaintenanceWorkOrder, "findMany")
        .mockResolvedValue([{ id: "wo1", description: "Fix leak" }] as any);
      jest
        .spyOn(prisma.realEstateMaintenanceWorkOrder, "count")
        .mockResolvedValue(1);
      const result = await svc.getWorkOrders(tenantId, { status: "OPEN" });
      expect(result.total).toBe(1);
    });
    it("assignWorkOrder updates vendor and status", async () => {
      jest
        .spyOn(prisma.realEstateMaintenanceWorkOrder, "findFirst")
        .mockResolvedValue({ id: "wo1", tenantId } as any);
      jest
        .spyOn(prisma.realEstateMaintenanceWorkOrder, "update")
        .mockResolvedValue({
          id: "wo1",
          vendorId: "v1",
          status: "ASSIGNED",
        } as any);
      const result = await svc.assignWorkOrder(tenantId, "wo1", "v1");
      expect(result.status).toBe("ASSIGNED");
    });
  });

  describe("vendors", () => {
    it("getVendors returns list", async () => {
      jest
        .spyOn(prisma.realEstateMaintenanceVendor, "findMany")
        .mockResolvedValue([{ id: "v1", name: "Vendor 1" }] as any);
      const result = await svc.getVendors(tenantId);
      expect(result).toHaveLength(1);
    });
  });

  describe("commissions", () => {
    it("getCommissionPlans returns plans", async () => {
      jest
        .spyOn(prisma.realEstateCommissionPlan, "findMany")
        .mockResolvedValue([{ id: "cp1", name: "Plan 1" }] as any);
      const result = await svc.getCommissionPlans(tenantId);
      expect(result).toHaveLength(1);
    });
    it("createCommissionPayout creates with split calculation", async () => {
      jest
        .spyOn(prisma.realEstateCommissionPlan, "findFirst")
        .mockResolvedValue({
          id: "cp1",
          commissionRate: 3,
          splitType: "EQUAL",
        } as any);
      jest
        .spyOn(prisma.realEstateCommissionPayout, "create")
        .mockResolvedValue({ id: "co1", amount: 1000 } as any);
      const result = await svc.createCommissionPayout(tenantId, {
        planId: "cp1",
        agentName: "Agent A",
        amount: 1000,
      });
      expect(result).toBeDefined();
    });
    it("approveCommissionPayout updates status", async () => {
      jest
        .spyOn(prisma.realEstateCommissionPayout, "findFirst")
        .mockResolvedValue({ id: "co1", tenantId } as any);
      jest
        .spyOn(prisma.realEstateCommissionPayout, "update")
        .mockResolvedValue({ id: "co1", status: "APPROVED" } as any);
      const result = await svc.approveCommissionPayout(tenantId, "co1");
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("valuations", () => {
    it("getValuations returns paginated", async () => {
      jest
        .spyOn(prisma.realEstatePropertyValuation, "findMany")
        .mockResolvedValue([{ id: "v1", appraisedValue: 500000 }] as any);
      jest
        .spyOn(prisma.realEstatePropertyValuation, "count")
        .mockResolvedValue(1);
      const result = await svc.getValuations(tenantId, { propertyId: "p1" });
      expect(result.total).toBe(1);
    });
    it("compareValuations returns growth metrics", async () => {
      jest
        .spyOn(prisma.realEstatePropertyValuation, "findMany")
        .mockResolvedValue([
          {
            id: "v1",
            appraisedValue: 400000,
            valuationDate: new Date("2025-01-01"),
            status: "FINAL",
          },
          {
            id: "v2",
            appraisedValue: 500000,
            valuationDate: new Date("2026-01-01"),
            status: "FINAL",
          },
        ] as any);
      const result = await svc.compareValuations(tenantId, "p1");
      expect(result.percentChange).toBeGreaterThan(0);
    });
  });
});
