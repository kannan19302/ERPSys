import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationCoursesService } from "../services/courses.service";

const mockPrisma = vi.hoisted(() => ({
  educationCourse: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  educationCourseModule: {
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  educationEnrollment: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationCoursesService", () => {
  let svc: EducationCoursesService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationCoursesService();
    vi.clearAllMocks();
  });

  it("should findAll courses", async () => {
    mockPrisma.educationCourse.findMany.mockResolvedValue([
      { id: "c1", name: "Math 101" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should findById with relations", async () => {
    mockPrisma.educationCourse.findFirst.mockResolvedValue({
      id: "c1",
      modules: [],
      gradebooks: [],
      enrollments: [],
      attendances: [],
      examSchedules: [],
      timetables: [],
    });
    const result = await svc.findById(tenantId, "c1");
    expect(result.id).toBe("c1");
  });

  it("should create course", async () => {
    mockPrisma.educationCourse.create.mockResolvedValue({
      id: "c1",
      modules: [],
    });
    const result = await svc.create(tenantId, {
      name: "Physics",
      code: "PHY101",
    });
    expect(result.id).toBe("c1");
  });

  it("should add module to course", async () => {
    mockPrisma.educationCourseModule.create.mockResolvedValue({
      id: "m1",
      title: "Module 1",
    });
    const result = await svc.addModule(tenantId, "c1", { title: "Module 1" });
    expect(result.title).toBe("Module 1");
  });

  it("should create enrollment", async () => {
    mockPrisma.educationEnrollment.create.mockResolvedValue({
      id: "e1",
      status: "ACTIVE",
    });
    const result = await svc.createEnrollment(tenantId, {
      studentId: "s1",
      courseId: "c1",
      academicYear: "2026",
    });
    expect(result.status).toBe("ACTIVE");
  });

  it("should get enrollments for course", async () => {
    mockPrisma.educationEnrollment.findMany.mockResolvedValue([
      { id: "e1", student: { firstName: "Alice" } },
    ]);
    const result = await svc.getEnrollments(tenantId, "c1");
    expect(result).toHaveLength(1);
  });

  it("should update enrollment status", async () => {
    mockPrisma.educationEnrollment.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.educationEnrollment.findFirst.mockResolvedValue({
      id: "e1",
      status: "COMPLETED",
    });
    const result = await svc.updateEnrollmentStatus(
      tenantId,
      "e1",
      "COMPLETED",
    );
    expect(result.status).toBe("COMPLETED");
  });
});
