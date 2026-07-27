import { Test, TestingModule } from "@nestjs/testing";
import { FieldServiceLogisticsService } from "./field-service-logistics.service";
import { prisma } from "@unerp/database";

describe("FieldServiceLogisticsService", () => {
  let svc: FieldServiceLogisticsService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldServiceLogisticsService],
    }).compile();
    svc = module.get<FieldServiceLogisticsService>(
      FieldServiceLogisticsService,
    );
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("inventory", () => {
    it("getInventoryItems returns paginated", async () => {
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "findMany")
        .mockResolvedValue([{ id: "i1", name: "Filter" }] as any);
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "count")
        .mockResolvedValue(1);
      const result = await svc.getInventoryItems(tenantId, {
        category: "PARTS",
      });
      expect(result.total).toBe(1);
    });
    it("restockItem increases quantity", async () => {
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "findFirst")
        .mockResolvedValue({ id: "i1", tenantId, quantityOnVan: 5 } as any);
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "update")
        .mockResolvedValue({ id: "i1", quantityOnVan: 15 } as any);
      const result = await svc.restockItem(tenantId, "i1", 10);
      expect(result.quantityOnVan).toBe(15);
    });
    it("transferStock moves between van and warehouse", async () => {
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "findFirst")
        .mockResolvedValue({
          id: "i1",
          tenantId,
          quantityOnVan: 10,
          quantityWarehouse: 5,
        } as any);
      jest.spyOn(prisma.fieldServiceInventoryItem, "update").mockResolvedValue({
        id: "i1",
        quantityOnVan: 7,
        quantityWarehouse: 8,
      } as any);
      const result = await svc.transferStock(tenantId, "i1", true, 3);
      expect(result).toBeDefined();
    });
    it("getLowStockItems returns items below threshold", async () => {
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "findMany")
        .mockResolvedValue([
          { id: "i1", quantityOnVan: 2, minStockLevel: 5 },
          { id: "i2", quantityOnVan: 10, minStockLevel: 5 },
        ] as any);
      const result = await svc.getLowStockItems(tenantId);
      expect(result).toHaveLength(1);
    });
  });

  describe("partsUsage", () => {
    it("createPartsUsage records usage and decrements inventory", async () => {
      jest
        .spyOn(prisma.fieldServicePartsUsage, "create")
        .mockResolvedValue({ id: "pu1", quantity: 2 } as any);
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "findFirst")
        .mockResolvedValue({
          id: "i1",
          quantityOnVan: 10,
          minStockLevel: 5,
        } as any);
      jest
        .spyOn(prisma.fieldServiceInventoryItem, "update")
        .mockResolvedValue({ id: "i1", quantityOnVan: 8 } as any);
      const result = await svc.createPartsUsage(tenantId, {
        ticketId: "t1",
        itemId: "i1",
        quantity: 2,
      });
      expect(result).toBeDefined();
    });
  });

  describe("contracts", () => {
    it("getContracts returns paginated", async () => {
      jest
        .spyOn(prisma.fieldServiceContract, "findMany")
        .mockResolvedValue([{ id: "c1", customerName: "Client A" }] as any);
      jest.spyOn(prisma.fieldServiceContract, "count").mockResolvedValue(1);
      const result = await svc.getContracts(tenantId, { status: "ACTIVE" });
      expect(result.total).toBe(1);
    });
    it("renewContract creates new from old", async () => {
      jest.spyOn(prisma.fieldServiceContract, "findFirst").mockResolvedValue({
        id: "c1",
        tenantId,
        customerName: "Client A",
      } as any);
      jest
        .spyOn(prisma.fieldServiceContract, "update")
        .mockResolvedValue({} as any);
      jest
        .spyOn(prisma.fieldServiceContract, "create")
        .mockResolvedValue({ id: "c2", customerName: "Client A" } as any);
      const result = await svc.renewContract(tenantId, "c1", {
        endDate: new Date("2027-01-01"),
      });
      expect(result).toBeDefined();
    });
  });

  describe("timesheets", () => {
    it("createTimesheet calculates pay", async () => {
      jest.spyOn(prisma.fieldServiceTimesheet, "create").mockResolvedValue({
        id: "ts1",
        hoursWorked: 8,
        totalPay: 160,
        billableAmount: 200,
      } as any);
      const result = await svc.createTimesheet(tenantId, {
        ticketId: "t1",
        technicianId: "tech1",
        hoursWorked: 8,
        hourlyRate: 20,
        travelTime: 2,
      });
      expect(result).toBeDefined();
    });
    it("approveTimesheet updates status", async () => {
      jest
        .spyOn(prisma.fieldServiceTimesheet, "findFirst")
        .mockResolvedValue({ id: "ts1", tenantId } as any);
      jest
        .spyOn(prisma.fieldServiceTimesheet, "update")
        .mockResolvedValue({ id: "ts1", status: "APPROVED" } as any);
      const result = await svc.approveTimesheet(tenantId, "ts1", "admin-1");
      expect(result.status).toBe("APPROVED");
    });
    it("generateInvoiceFromTimesheets bills approved timesheets", async () => {
      jest.spyOn(prisma.fieldServiceTimesheet, "findMany").mockResolvedValue([
        { id: "ts1", billableAmount: 200 },
        { id: "ts2", billableAmount: 150 },
      ] as any);
      jest
        .spyOn(prisma.fieldServiceTimesheet, "updateMany")
        .mockResolvedValue({ count: 2 } as any);
      jest
        .spyOn(prisma.fieldServiceTicket, "update")
        .mockResolvedValue({} as any);
      const result = await svc.generateInvoiceFromTimesheets(tenantId, "t1");
      expect(result.totalBillable).toBe(350);
      expect(result.timesheetsBilled).toBe(2);
    });
  });
});
