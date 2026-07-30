// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EducationFeesService } from "../services/fees.service";

const mockPrisma = vi.hoisted(() => ({
  educationFeeStructure: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  studentFee: { findMany: vi.fn(), create: vi.fn() },
  educationFeeInvoice: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  educationFeePayment: {
    create: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("EducationFeesService", () => {
  let svc: EducationFeesService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new EducationFeesService();
    vi.clearAllMocks();
  });

  it("should get fee structures", async () => {
    mockPrisma.educationFeeStructure.findMany.mockResolvedValue([
      { id: "fs1", name: "Tuition" },
    ]);
    const result = await svc.getFeeStructures(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create fee structure", async () => {
    mockPrisma.educationFeeStructure.create.mockResolvedValue({ id: "fs1" });
    const result = await svc.createFeeStructure(tenantId, {
      name: "Lab Fee",
      amount: 100,
    });
    expect(result.id).toBe("fs1");
  });

  it("should assign student fee", async () => {
    mockPrisma.studentFee.create.mockResolvedValue({ id: "sf1" });
    const result = await svc.assignStudentFee(tenantId, {
      studentId: "s1",
      feeStructureId: "fs1",
      amount: 500,
    });
    expect(result.id).toBe("sf1");
  });

  it("should create invoice", async () => {
    mockPrisma.educationFeeInvoice.create.mockResolvedValue({
      id: "inv1",
      totalAmount: 500,
    });
    const result = await svc.createInvoice(tenantId, {
      studentId: "s1",
      invoiceNumber: "INV-001",
      totalAmount: 500,
    });
    expect(result.totalAmount).toBe(500);
  });

  it("should record payment and update invoice status", async () => {
    mockPrisma.educationFeePayment.create.mockResolvedValue({
      id: "pmt1",
      amount: 500,
    });
    mockPrisma.educationFeeInvoice.findFirst.mockResolvedValue({
      id: "inv1",
      totalAmount: 500,
    });
    mockPrisma.educationFeePayment.aggregate.mockResolvedValue({
      _sum: { amount: 500 },
    });
    mockPrisma.educationFeeInvoice.updateMany.mockResolvedValue({ count: 1 });
    const result = await svc.recordPayment(tenantId, "inv1", {
      amount: 500,
      method: "CASH",
    });
    expect(result.id).toBe("pmt1");
    expect(mockPrisma.educationFeeInvoice.updateMany).toHaveBeenCalled();
  });

  it("should get payment history", async () => {
    mockPrisma.educationFeePayment.findMany.mockResolvedValue([
      { id: "pmt1", amount: 500 },
    ]);
    const result = await svc.getPaymentHistory(tenantId);
    expect(result).toHaveLength(1);
  });
});
