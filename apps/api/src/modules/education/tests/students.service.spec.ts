// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationStudentsService } from "../services/students.service";

const mockPrisma = vi.hoisted(() => ({
  educationStudent: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  educationStudentParent: { deleteMany: vi.fn(), createMany: vi.fn() },
  educationParent: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationStudentsService", () => {
  let svc: EducationStudentsService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationStudentsService();
    vi.clearAllMocks();
  });

  it("should findAll students", async () => {
    mockPrisma.educationStudent.findMany.mockResolvedValue([
      { id: "s1", firstName: "Alice" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should findById with relations", async () => {
    mockPrisma.educationStudent.findFirst.mockResolvedValue({
      id: "s1",
      enrollments: [],
      parents: [],
      fees: [],
      feeInvoices: [],
    });
    const result = await svc.findById(tenantId, "s1");
    expect(result.id).toBe("s1");
  });

  it("should create student with parents", async () => {
    mockPrisma.educationStudent.create.mockResolvedValue({
      id: "s1",
      parents: [],
    });
    const result = await svc.create(tenantId, {
      firstName: "Bob",
      parents: ["parent1"],
    });
    expect(result.id).toBe("s1");
  });

  it("should update student", async () => {
    mockPrisma.educationStudent.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.educationStudent.findFirst.mockResolvedValue({
      id: "s1",
      firstName: "Bob Updated",
    });
    const result = await svc.update(tenantId, "s1", {
      firstName: "Bob Updated",
    });
    expect(result.firstName).toBe("Bob Updated");
  });

  it("should delete (soft) student", async () => {
    mockPrisma.educationStudent.updateMany.mockResolvedValue({ count: 1 });
    await svc.delete(tenantId, "s1");
    expect(mockPrisma.educationStudent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false, status: "WITHDRAWN" },
      }),
    );
  });

  it("should search students", async () => {
    mockPrisma.educationStudent.findMany.mockResolvedValue([{ id: "s1" }]);
    const result = await svc.search(tenantId, "Alice");
    expect(result).toHaveLength(1);
  });

  it("should get parents", async () => {
    mockPrisma.educationParent.findMany.mockResolvedValue([
      { id: "p1", firstName: "John" },
    ]);
    const result = await svc.getParents(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create parent", async () => {
    mockPrisma.educationParent.create.mockResolvedValue({ id: "p1" });
    const result = await svc.createParent(tenantId, { firstName: "Jane" });
    expect(result.id).toBe("p1");
  });
});
