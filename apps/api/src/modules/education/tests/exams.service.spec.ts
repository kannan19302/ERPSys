// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationExamsService } from "../services/exams.service";

const mockPrisma = vi.hoisted(() => ({
  educationExamSchedule: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  educationExamResult: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationExamsService", () => {
  let svc: EducationExamsService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationExamsService();
    vi.clearAllMocks();
  });

  it("should findAll exam schedules", async () => {
    mockPrisma.educationExamSchedule.findMany.mockResolvedValue([
      { id: "es1", title: "Midterms" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create exam schedule", async () => {
    mockPrisma.educationExamSchedule.create.mockResolvedValue({ id: "es1" });
    const result = await svc.create(tenantId, {
      courseId: "c1",
      title: "Final Exam",
      maxScore: 100,
    });
    expect(result.id).toBe("es1");
  });

  it("should addResult", async () => {
    mockPrisma.educationExamResult.findFirst.mockResolvedValue(null);
    mockPrisma.educationExamResult.create.mockResolvedValue({
      id: "er1",
      studentId: "s1",
      score: 85,
    });
    const result = await svc.addResult(tenantId, "es1", {
      studentId: "s1",
      score: 85,
    });
    expect(result.score).toBe(85);
  });

  it("should getResults for exam", async () => {
    mockPrisma.educationExamResult.findMany.mockResolvedValue([
      { id: "er1", score: 85 },
    ]);
    const result = await svc.getResults(tenantId, "es1");
    expect(result).toHaveLength(1);
  });
});
