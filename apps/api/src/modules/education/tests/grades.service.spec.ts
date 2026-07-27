import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationGradesService } from "../services/grades.service";

const mockPrisma = vi.hoisted(() => ({
  educationGradebook: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  educationGradeEntry: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  grade: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationGradesService", () => {
  let svc: EducationGradesService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationGradesService();
    vi.clearAllMocks();
  });

  it("should getGradebooks", async () => {
    mockPrisma.educationGradebook.findMany.mockResolvedValue([
      { id: "gb1", name: "Midterms" },
    ]);
    const result = await svc.getGradebooks(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should createGradebook", async () => {
    mockPrisma.educationGradebook.create.mockResolvedValue({
      id: "gb1",
      name: "Final Exam",
    });
    const result = await svc.createGradebook(tenantId, {
      courseId: "c1",
      name: "Final Exam",
    });
    expect(result.id).toBe("gb1");
  });

  it("should upsertGradeEntry", async () => {
    mockPrisma.educationGradeEntry.findFirst.mockResolvedValue(null);
    mockPrisma.educationGradeEntry.create.mockResolvedValue({
      id: "ge1",
      studentId: "s1",
      score: 85,
    });
    const result = await svc.upsertGradeEntry(tenantId, "gb1", {
      studentId: "s1",
      score: 85,
    });
    expect(result.score).toBe(85);
  });

  it("should getGradeEntries for a gradebook", async () => {
    mockPrisma.educationGradeEntry.findMany.mockResolvedValue([
      { id: "ge1", score: 90 },
    ]);
    const result = await svc.getGradeEntries(tenantId, "gb1");
    expect(result).toHaveLength(1);
  });

  it("should getStudentGradeSummary", async () => {
    mockPrisma.educationGradebook.findMany.mockResolvedValue([
      {
        id: "gb1",
        name: "Midterms",
        course: { name: "Math" },
        entries: [{ studentId: "s1", score: 85 }],
        maxScore: 100,
        weight: 1,
      },
    ]);
    const result = await svc.getStudentGradeSummary(tenantId, "s1");
    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(85);
  });
});
