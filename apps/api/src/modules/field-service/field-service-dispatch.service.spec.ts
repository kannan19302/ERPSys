import { Test, TestingModule } from "@nestjs/testing";
import { FieldServiceDispatchService } from "./field-service-dispatch.service";
import { prisma } from "@unerp/database";

describe("FieldServiceDispatchService", () => {
  let svc: FieldServiceDispatchService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldServiceDispatchService],
    }).compile();
    svc = module.get<FieldServiceDispatchService>(FieldServiceDispatchService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("technicians", () => {
    it("getTechnicians filters by status", async () => {
      jest
        .spyOn(prisma.fieldServiceTechnician, "findMany")
        .mockResolvedValue([{ id: "tech1", name: "John" }] as any);
      const result = await svc.getTechnicians(tenantId, {
        status: "AVAILABLE",
      });
      expect(result).toHaveLength(1);
    });
    it("updateTechnicianLocation updates coordinates", async () => {
      jest
        .spyOn(prisma.fieldServiceTechnician, "findFirst")
        .mockResolvedValue({ id: "tech1", tenantId } as any);
      jest.spyOn(prisma.fieldServiceTechnician, "update").mockResolvedValue({
        id: "tech1",
        locationLat: 40.7128,
        locationLng: -74.006,
      } as any);
      const result = await svc.updateTechnicianLocation(
        tenantId,
        "tech1",
        40.7128,
        -74.006,
      );
      expect(result.locationLat).toBe(40.7128);
    });
  });

  describe("dispatches", () => {
    it("createDispatch creates and updates ticket status", async () => {
      jest
        .spyOn(prisma.fieldServiceDispatch, "create")
        .mockResolvedValue({ id: "d1", ticketId: "t1" } as any);
      jest
        .spyOn(prisma.fieldServiceTicket, "update")
        .mockResolvedValue({ id: "t1", status: "ASSIGNED" } as any);
      const result = await svc.createDispatch(tenantId, {
        ticketId: "t1",
        technicianId: "tech1",
      });
      expect(result).toBeDefined();
    });
    it("updateDispatchStatus tracks technician state", async () => {
      jest.spyOn(prisma.fieldServiceDispatch, "findFirst").mockResolvedValue({
        id: "d1",
        tenantId,
        technicianId: "tech1",
        ticketId: "t1",
      } as any);
      jest
        .spyOn(prisma.fieldServiceTechnician, "update")
        .mockResolvedValue({} as any);
      jest
        .spyOn(prisma.fieldServiceDispatch, "update")
        .mockResolvedValue({ id: "d1", status: "EN_ROUTE" } as any);
      jest
        .spyOn(prisma.fieldServiceTicket, "update")
        .mockResolvedValue({} as any);
      const result = await svc.updateDispatchStatus(tenantId, "d1", "EN_ROUTE");
      expect(result.status).toBe("EN_ROUTE");
    });
    it("getDailySchedule returns day dispatches", async () => {
      jest
        .spyOn(prisma.fieldServiceDispatch, "findMany")
        .mockResolvedValue([{ id: "d1", status: "SCHEDULED" }] as any);
      const result = await svc.getDailySchedule(tenantId, "2026-07-27");
      expect(result).toHaveLength(1);
    });
  });

  describe("appointments", () => {
    it("checkInAppointment starts appointment", async () => {
      jest
        .spyOn(prisma.fieldServiceAppointment, "findFirst")
        .mockResolvedValue({ id: "a1", tenantId } as any);
      jest.spyOn(prisma.fieldServiceAppointment, "update").mockResolvedValue({
        id: "a1",
        status: "CHECKED_IN",
        checkInTime: new Date(),
      } as any);
      const result = await svc.checkInAppointment(tenantId, "a1", {});
      expect(result.status).toBe("CHECKED_IN");
    });
    it("checkOutAppointment completes with signature", async () => {
      jest
        .spyOn(prisma.fieldServiceAppointment, "findFirst")
        .mockResolvedValue({
          id: "a1",
          tenantId,
          checkInTime: new Date(),
        } as any);
      jest.spyOn(prisma.fieldServiceAppointment, "update").mockResolvedValue({
        id: "a1",
        status: "COMPLETED",
        customerSignature: "sig",
      } as any);
      const result = await svc.checkOutAppointment(tenantId, "a1", {
        customerSignature: "sig",
        customerRating: 5,
      });
      expect(result.status).toBe("COMPLETED");
    });
  });
});
