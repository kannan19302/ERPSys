import { Test, TestingModule } from "@nestjs/testing";
import { RealEstateLeasingService } from "./real-estate-leasing.service";
import { prisma } from "@unerp/database";

describe("RealEstateLeasingService", () => {
  let svc: RealEstateLeasingService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealEstateLeasingService],
    }).compile();
    svc = module.get<RealEstateLeasingService>(RealEstateLeasingService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("leases", () => {
    it("getLeases returns paginated", async () => {
      jest
        .spyOn(prisma.realEstateLease, "findMany")
        .mockResolvedValue([{ id: "l1", tenantName: "John Doe" }] as any);
      jest.spyOn(prisma.realEstateLease, "count").mockResolvedValue(1);
      const result = await svc.getLeases(tenantId, { status: "ACTIVE" });
      expect(result.total).toBe(1);
    });
    it("createLease creates with auto payment schedule", async () => {
      jest
        .spyOn(prisma.realEstatePropertyUnit, "findFirst")
        .mockResolvedValue({ id: "u1", status: "VACANT" } as any);
      jest
        .spyOn(prisma.realEstatePropertyUnit, "update")
        .mockResolvedValue({} as any);
      jest.spyOn(prisma.realEstateLease, "create").mockResolvedValue({
        id: "l2",
        tenantName: "Jane",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2027-01-01"),
        paymentDueDay: 1,
        rentAmount: 1000,
        billingFrequency: "MONTHLY",
      } as any);
      jest
        .spyOn(prisma.realEstateLeasePayment, "findFirst")
        .mockResolvedValue(null);
      jest
        .spyOn(prisma.realEstateLeasePayment, "createMany")
        .mockResolvedValue({ count: 12 } as any);
      const result = await svc.createLease(tenantId, {
        propertyId: "p1",
        unitId: "u1",
        tenantName: "Jane",
        startDate: "2026-01-01",
        endDate: "2027-01-01",
        rentAmount: 1000,
      });
      expect(result).toBeDefined();
    });
    it("renewLease creates new lease and marks old as renewed", async () => {
      jest.spyOn(prisma.realEstateLease, "findFirst").mockResolvedValue({
        id: "l1",
        tenantId,
        propertyId: "p1",
        tenantName: "John",
      } as any);
      jest.spyOn(prisma.realEstateLease, "update").mockResolvedValue({} as any);
      jest
        .spyOn(prisma.realEstateLease, "create")
        .mockResolvedValue({ id: "l2", tenantName: "John" } as any);
      jest
        .spyOn(prisma.realEstateLeasePayment, "findFirst")
        .mockResolvedValue(null);
      jest
        .spyOn(prisma.realEstateLeasePayment, "createMany")
        .mockResolvedValue({ count: 12 } as any);
      const result = await svc.renewLease(tenantId, "l1", {
        endDate: new Date("2028-01-01"),
        rentAmount: 1100,
      });
      expect(result).toBeDefined();
    });
    it("terminateLease updates status and vacates unit", async () => {
      jest
        .spyOn(prisma.realEstateLease, "findFirst")
        .mockResolvedValue({ id: "l1", tenantId, unitId: "u1" } as any);
      jest
        .spyOn(prisma.realEstatePropertyUnit, "update")
        .mockResolvedValue({} as any);
      jest
        .spyOn(prisma.realEstateLeasePayment, "updateMany")
        .mockResolvedValue({ count: 2 } as any);
      jest
        .spyOn(prisma.realEstateLease, "update")
        .mockResolvedValue({ id: "l1", status: "TERMINATED" } as any);
      const result = await svc.terminateLease(tenantId, "l1", {});
      expect(result.status).toBe("TERMINATED");
    });
    it("getExpiringLeases returns leases ending soon", async () => {
      jest
        .spyOn(prisma.realEstateLease, "findMany")
        .mockResolvedValue([{ id: "l1", tenantName: "Expiring Soon" }] as any);
      const result = await svc.getExpiringLeases(tenantId, 30);
      expect(result).toHaveLength(1);
    });
  });

  describe("payments", () => {
    it("getPayments returns paginated", async () => {
      jest
        .spyOn(prisma.realEstateLeasePayment, "findMany")
        .mockResolvedValue([{ id: "pmt1", amount: 1000 }] as any);
      jest.spyOn(prisma.realEstateLeasePayment, "count").mockResolvedValue(1);
      const result = await svc.getPayments(tenantId, { status: "PENDING" });
      expect(result.total).toBe(1);
    });
    it("recordPayment updates payment", async () => {
      jest
        .spyOn(prisma.realEstateLeasePayment, "findFirst")
        .mockResolvedValue({ id: "pmt1", tenantId, amount: 1000 } as any);
      jest.spyOn(prisma.realEstateLeasePayment, "update").mockResolvedValue({
        id: "pmt1",
        status: "PAID",
        paidAmount: 1000,
      } as any);
      const result = await svc.recordPayment(tenantId, "pmt1", {
        paidAmount: 1000,
      });
      expect(result.status).toBe("PAID");
    });
  });

  describe("tenants", () => {
    it("getTenants filters by status", async () => {
      jest
        .spyOn(prisma.realEstateTenant, "findMany")
        .mockResolvedValue([{ id: "t1", name: "Tenant 1" }] as any);
      const result = await svc.getTenants(tenantId, { status: "ACTIVE" });
      expect(result).toHaveLength(1);
    });
  });
});
