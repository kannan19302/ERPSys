// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EducationAcademicService } from "../education-academic.service";

describe("EducationAcademicService", () => {
  let service: EducationAcademicService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      educationReportCard: {
        findMany: vi.fn().mockResolvedValue([{ id: "rc-1", studentId: "std-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "rc-1", ...data })),
      },
      educationScholarship: {
        findMany: vi.fn().mockResolvedValue([{ id: "sch-1", studentId: "std-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "sch-1", ...data })),
      },
      educationAssignmentSubmission: {
        findMany: vi.fn().mockResolvedValue([{ id: "sub-1", studentId: "std-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "sub-1", ...data })),
      },
    };
    service = new EducationAcademicService(mockPrisma);
  });

  it("should list report cards for tenant", async () => {
    const result = await service.getReportCards("tenant-1", { studentId: "std-1" });
    expect(result).toHaveLength(1);
  });

  it("should create report card", async () => {
    const data = { studentId: "std-1", term: "Fall", gpa: 3.8 };
    const result = await service.createReportCard("tenant-1", data);
    expect(result.gpa).toBe(3.8);
    expect(result.status).toBe("DRAFT");
  });

  it("should create scholarship", async () => {
    const data = { studentId: "std-1", name: "Merit Award", provider: "State Board", amount: 5000 };
    const result = await service.createScholarship("tenant-1", data);
    expect(result.amount).toBe(5000);
  });

  it("should submit assignment", async () => {
    const data = { assignmentId: "asg-1", studentId: "std-1", content: "Essay submission" };
    const result = await service.submitAssignment("tenant-1", data);
    expect(result.status).toBe("SUBMITTED");
  });
});
