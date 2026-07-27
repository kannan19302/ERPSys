import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcareSchedulesService } from "../services/schedules.service";

const mockPrisma = vi.hoisted(() => ({
  healthcareDoctorSchedule: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  healthcareAppointment: { findMany: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcareSchedulesService", () => {
  let svc: HealthcareSchedulesService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcareSchedulesService();
    vi.clearAllMocks();
  });

  it("should getDoctorSchedules", async () => {
    mockPrisma.healthcareDoctorSchedule.findMany.mockResolvedValue([
      { id: "ds1", dayOfWeek: 1 },
    ]);
    const result = await svc.getDoctorSchedules(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should createDoctorSchedule", async () => {
    mockPrisma.healthcareDoctorSchedule.findFirst.mockResolvedValue(null);
    mockPrisma.healthcareDoctorSchedule.create.mockResolvedValue({ id: "ds1" });
    const result = await svc.createDoctorSchedule(tenantId, {
      practitionerId: "pr1",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.id).toBe("ds1");
  });

  it("should getAvailableSlots", async () => {
    mockPrisma.healthcareDoctorSchedule.findFirst.mockResolvedValue({
      id: "ds1",
      startTime: "09:00",
      endTime: "17:00",
      slotDurationMin: 30,
    });
    mockPrisma.healthcareAppointment.findMany.mockResolvedValue([]);
    const result = await svc.getAvailableSlots(tenantId, "pr1", "2026-08-01");
    expect(result).toHaveProperty("schedule");
    expect(result).toHaveProperty("slots");
    expect(result.slots.length).toBeGreaterThan(0);
  });

  it("should updateDoctorSchedule", async () => {
    mockPrisma.healthcareDoctorSchedule.updateMany.mockResolvedValue({
      count: 1,
    });
    mockPrisma.healthcareDoctorSchedule.findFirst.mockResolvedValue({
      id: "ds1",
      dayOfWeek: 2,
    });
    const result = await svc.updateDoctorSchedule(tenantId, "ds1", {
      dayOfWeek: 2,
    });
    expect(result.dayOfWeek).toBe(2);
  });
});
