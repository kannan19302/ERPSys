import { Test, TestingModule } from "@nestjs/testing";
import { FieldServiceTicketsService } from "./field-service-tickets.service";
import { prisma } from "@unerp/database";

describe("FieldServiceTicketsService", () => {
  let svc: FieldServiceTicketsService;
  const tenantId = "tenant-1";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldServiceTicketsService],
    }).compile();
    svc = module.get<FieldServiceTicketsService>(FieldServiceTicketsService);
  });

  it("should be defined", () => {
    expect(svc).toBeDefined();
  });

  describe("tickets", () => {
    it("getTickets returns paginated", async () => {
      jest
        .spyOn(prisma.fieldServiceTicket, "findMany")
        .mockResolvedValue([{ id: "t1", title: "Fix AC" }] as any);
      jest.spyOn(prisma.fieldServiceTicket, "count").mockResolvedValue(1);
      const result = await svc.getTickets(tenantId, { status: "OPEN" });
      expect(result.total).toBe(1);
    });
    it("createTicket assigns default SLA", async () => {
      jest
        .spyOn(prisma.fieldServiceSla, "findFirst")
        .mockResolvedValue({ id: "sla1", resolutionTimeMin: 240 } as any);
      jest.spyOn(prisma.fieldServiceTicket, "create").mockResolvedValue({
        id: "t2",
        title: "New Ticket",
        slaId: "sla1",
      } as any);
      const result = await svc.createTicket(tenantId, {
        title: "New Ticket",
        priority: "HIGH",
      });
      expect(result.slaId).toBe("sla1");
    });
    it("assignTicket creates dispatch and updates status", async () => {
      jest
        .spyOn(prisma.fieldServiceTicket, "findFirst")
        .mockResolvedValue({ id: "t1", tenantId } as any);
      jest.spyOn(prisma.fieldServiceDispatch, "create").mockResolvedValue({
        id: "d1",
        technicianId: "tech1",
        status: "SCHEDULED",
      } as any);
      jest
        .spyOn(prisma.fieldServiceTicket, "update")
        .mockResolvedValue({ id: "t1", status: "ASSIGNED" } as any);
      const result = await svc.assignTicket(tenantId, "t1", "tech1");
      expect(result.status).toBe("SCHEDULED");
    });
    it("closeTicket sets status and completion date", async () => {
      jest
        .spyOn(prisma.fieldServiceTicket, "findFirst")
        .mockResolvedValue({ id: "t1", tenantId } as any);
      jest.spyOn(prisma.fieldServiceTicket, "update").mockResolvedValue({
        id: "t1",
        status: "CLOSED",
        resolution: "Fixed",
      } as any);
      const result = await svc.closeTicket(tenantId, "t1", {
        resolution: "Fixed",
      });
      expect(result.status).toBe("CLOSED");
    });
  });

  describe("SLAs", () => {
    it("getSlas returns list", async () => {
      jest
        .spyOn(prisma.fieldServiceSla, "findMany")
        .mockResolvedValue([{ id: "sla1", name: "Gold SLA" }] as any);
      const result = await svc.getSlas(tenantId);
      expect(result).toHaveLength(1);
    });
    it("createSla sets isDefault correctly", async () => {
      jest
        .spyOn(prisma.fieldServiceSla, "updateMany")
        .mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.fieldServiceSla, "create").mockResolvedValue({
        id: "sla2",
        name: "Default SLA",
        isDefault: true,
      } as any);
      const result = await svc.createSla(tenantId, {
        name: "Default SLA",
        isDefault: true,
        responseTimeMin: 60,
        resolutionTimeMin: 240,
      });
      expect(result.isDefault).toBe(true);
    });
    it("checkSlaCompliance calculates rate", async () => {
      jest
        .spyOn(prisma.fieldServiceSla, "findFirst")
        .mockResolvedValue({ id: "sla1" } as any);
      jest.spyOn(prisma.fieldServiceTicket, "findMany").mockResolvedValue([
        { id: "t1", slaBreached: false },
        { id: "t2", slaBreached: true },
      ] as any);
      const result = await svc.checkSlaCompliance(tenantId, "sla1");
      expect(result.complianceRate).toBe(50);
    });
  });

  describe("checklists", () => {
    it("getChecklists returns templates", async () => {
      jest
        .spyOn(prisma.fieldServiceChecklist, "findMany")
        .mockResolvedValue([{ id: "cl1", name: "Safety Check" }] as any);
      const result = await svc.getChecklists(tenantId);
      expect(result).toHaveLength(1);
    });
  });
});
