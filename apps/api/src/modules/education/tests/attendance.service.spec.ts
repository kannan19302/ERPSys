import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationAttendanceService } from "../services/attendance.service";

const mockPrisma = vi.hoisted(() => ({
  educationAttendance: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  educationAttendanceRecord: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationAttendanceService", () => {
  let svc: EducationAttendanceService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationAttendanceService();
    vi.clearAllMocks();
  });

  it("should getSessions", async () => {
    mockPrisma.educationAttendance.findMany.mockResolvedValue([
      { id: "a1", date: "2026-08-01" },
    ]);
    const result = await svc.getSessions(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should createSession", async () => {
    mockPrisma.educationAttendance.create.mockResolvedValue({ id: "a1" });
    const result = await svc.createSession(tenantId, {
      courseId: "c1",
      date: "2026-08-01",
    });
    expect(result.id).toBe("a1");
  });

  it("should markAttendance", async () => {
    mockPrisma.educationAttendance.findFirst.mockResolvedValueOnce({
      id: "a1",
      courseId: "c1",
      date: "2026-08-01",
    });
    mockPrisma.educationAttendanceRecord.findFirst.mockResolvedValue(null);
    mockPrisma.educationAttendanceRecord.create.mockResolvedValue({
      id: "ar1",
      status: "PRESENT",
    });
    mockPrisma.educationAttendance.findFirst.mockResolvedValueOnce({
      id: "a1",
      records: [{ status: "PRESENT", student: { firstName: "Alice" } }],
    });
    const result = await svc.markAttendance(tenantId, "a1", [
      { studentId: "s1", status: "PRESENT" },
    ]);
    expect(result.id).toBe("a1");
  });

  it("should getStudentSummary", async () => {
    mockPrisma.educationAttendanceRecord.findMany.mockResolvedValue(
      [
        { courseId: "c1", status: "PRESENT" },
        { courseId: "c1", status: "PRESENT" },
        { courseId: "c1", status: "ABSENT" },
      ].map((r) => ({ ...r, course: { id: r.courseId, name: "Math" } })),
    );
    const result = await svc.getStudentSummary(tenantId, "s1");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].present).toBe(2);
    expect(result[0].absent).toBe(1);
    expect(result[0].total).toBe(3);
  });
});
