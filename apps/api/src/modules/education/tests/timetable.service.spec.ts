import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationTimetableService } from "../services/timetable.service";

const mockPrisma = vi.hoisted(() => ({
  educationTimetable: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationTimetableService", () => {
  let svc: EducationTimetableService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationTimetableService();
    vi.clearAllMocks();
  });

  it("should findAll timetables", async () => {
    mockPrisma.educationTimetable.findMany.mockResolvedValue([
      { id: "tt1", weekday: "MONDAY" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should findById with relations", async () => {
    mockPrisma.educationTimetable.findFirst.mockResolvedValue({
      id: "tt1",
      course: { name: "Math" },
    });
    const result = await svc.findById(tenantId, "tt1");
    expect(result.id).toBe("tt1");
  });

  it("should create timetable without conflict", async () => {
    mockPrisma.educationTimetable.findFirst.mockResolvedValue(null);
    mockPrisma.educationTimetable.create.mockResolvedValue({
      id: "tt1",
      weekday: "MONDAY",
    });
    const result = await svc.create(tenantId, {
      courseId: "c1",
      weekday: "MONDAY",
      startTime: "09:00",
      endTime: "10:00",
      room: "101",
    });
    expect(result.id).toBe("tt1");
  });

  it("should throw on room conflict", async () => {
    mockPrisma.educationTimetable.findFirst.mockResolvedValue({
      id: "conflict",
      room: "101",
    });
    await expect(
      svc.create(tenantId, {
        courseId: "c1",
        weekday: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        room: "101",
      }),
    ).rejects.toThrow("Room is already booked");
  });

  it("should getByDay", async () => {
    mockPrisma.educationTimetable.findMany.mockResolvedValue([{ id: "tt1" }]);
    const result = await svc.getByDay(tenantId, "MONDAY");
    expect(result).toHaveLength(1);
  });

  it("should getByCourse", async () => {
    mockPrisma.educationTimetable.findMany.mockResolvedValue([{ id: "tt1" }]);
    const result = await svc.getByCourse(tenantId, "c1");
    expect(result).toHaveLength(1);
  });
});
