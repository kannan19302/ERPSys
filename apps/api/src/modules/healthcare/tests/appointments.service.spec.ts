// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcareAppointmentsService } from "../services/appointments.service";

const mockPrisma = vi.hoisted(() => ({
  healthcareAppointment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  healthcareAppointmentSchedule: { create: vi.fn(), findMany: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcareAppointmentsService", () => {
  let svc: HealthcareAppointmentsService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcareAppointmentsService();
    vi.clearAllMocks();
  });

  it("should findAll appointments", async () => {
    mockPrisma.healthcareAppointment.findMany.mockResolvedValue([
      { id: "a1", status: "SCHEDULED" },
    ]);
    const result = await svc.findAll(tenantId, { status: "SCHEDULED" });
    expect(result).toHaveLength(1);
  });

  it("should create appointment with conflict detection", async () => {
    mockPrisma.healthcareAppointment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "a1", status: "SCHEDULED" });
    mockPrisma.healthcareAppointment.create.mockResolvedValue({
      id: "a1",
      status: "SCHEDULED",
    });
    const result = await svc.create(tenantId, {
      practitionerId: "pr1",
      startTime: "2026-08-01T09:00:00Z",
      endTime: "2026-08-01T09:30:00Z",
    });
    expect(result.status).toBe("SCHEDULED");
  });

  it("should throw on scheduling conflict", async () => {
    mockPrisma.healthcareAppointment.findFirst.mockResolvedValue({
      id: "conflict",
    });
    await expect(
      svc.create(tenantId, {
        practitionerId: "pr1",
        startTime: "2026-08-01T09:00:00Z",
        endTime: "2026-08-01T09:30:00Z",
      }),
    ).rejects.toThrow("conflicting appointment");
  });

  it("should cancel appointment", async () => {
    mockPrisma.healthcareAppointment.updateMany.mockResolvedValue({ count: 1 });
    await svc.cancel(tenantId, "a1", "Patient cancelled");
    expect(mockPrisma.healthcareAppointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "CANCELLED", notes: "Patient cancelled" },
      }),
    );
  });

  it("should complete appointment", async () => {
    mockPrisma.healthcareAppointment.updateMany.mockResolvedValue({ count: 1 });
    await svc.complete(tenantId, "a1");
    expect(mockPrisma.healthcareAppointment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } }),
    );
  });

  it("should get upcoming appointments", async () => {
    mockPrisma.healthcareAppointment.findMany.mockResolvedValue([
      { id: "a1", status: "SCHEDULED" },
    ]);
    const result = await svc.getUpcoming(tenantId, 7);
    expect(result).toHaveLength(1);
  });

  it("should get schedule for a practitioner on a date", async () => {
    mockPrisma.healthcareAppointment.findMany.mockResolvedValue([{ id: "a1" }]);
    const result = await svc.getSchedule(tenantId, "pr1", "2026-08-01");
    expect(result).toHaveLength(1);
  });

  it("should create schedule template", async () => {
    mockPrisma.healthcareAppointmentSchedule.create.mockResolvedValue({
      id: "st1",
    });
    const result = await svc.createScheduleTemplate(tenantId, {
      patientId: "p1",
      practitionerId: "pr1",
    });
    expect(result.id).toBe("st1");
  });

  it("should get schedule templates", async () => {
    mockPrisma.healthcareAppointmentSchedule.findMany.mockResolvedValue([
      { id: "st1" },
    ]);
    const result = await svc.getScheduleTemplates(tenantId);
    expect(result).toHaveLength(1);
  });
});
