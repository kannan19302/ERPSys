// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcarePrescriptionsService } from "../services/prescriptions.service";

const mockPrisma = vi.hoisted(() => ({
  healthcarePrescription: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  healthcarePrescriptionItem: { deleteMany: vi.fn(), createMany: vi.fn() },
  healthcareDrug: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcarePrescriptionsService", () => {
  let svc: HealthcarePrescriptionsService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcarePrescriptionsService();
    vi.clearAllMocks();
  });

  it("should findAll prescriptions", async () => {
    mockPrisma.healthcarePrescription.findMany.mockResolvedValue([
      { id: "rx1", status: "ACTIVE" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create prescription with items", async () => {
    mockPrisma.healthcarePrescription.create.mockResolvedValue({
      id: "rx1",
      items: [],
    });
    const result = await svc.create(tenantId, {
      patientId: "p1",
      items: [{ drugName: "Amoxicillin", dosage: "500mg" }],
    });
    expect(result.id).toBe("rx1");
  });

  it("should void prescription", async () => {
    mockPrisma.healthcarePrescription.updateMany.mockResolvedValue({
      count: 1,
    });
    await svc.voidPrescription(tenantId, "rx1");
    expect(mockPrisma.healthcarePrescription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "VOIDED" } }),
    );
  });

  it("should fill prescription", async () => {
    mockPrisma.healthcarePrescription.updateMany.mockResolvedValue({
      count: 1,
    });
    await svc.fillPrescription(tenantId, "rx1");
    expect(mockPrisma.healthcarePrescription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FILLED" } }),
    );
  });

  it("should get active prescriptions by patient", async () => {
    mockPrisma.healthcarePrescription.findMany.mockResolvedValue([
      { id: "rx1", status: "ACTIVE" },
    ]);
    const result = await svc.getActiveByPatient(tenantId, "p1");
    expect(result).toHaveLength(1);
  });

  it("should get drugs with batches", async () => {
    mockPrisma.healthcareDrug.findMany.mockResolvedValue([
      { id: "d1", name: "Aspirin", batches: [] },
    ]);
    const result = await svc.getDrugs(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create drug", async () => {
    mockPrisma.healthcareDrug.create.mockResolvedValue({ id: "d1" });
    const result = await svc.createDrug(tenantId, { name: "Ibuprofen" });
    expect(result.id).toBe("d1");
  });

  it("should update drug", async () => {
    mockPrisma.healthcareDrug.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.healthcareDrug.findFirst.mockResolvedValue({
      id: "d1",
      name: "Ibuprofen",
    });
    const result = await svc.updateDrug(tenantId, "d1", {
      name: "Ibuprofen 200mg",
    });
    expect(result.name).toBe("Ibuprofen");
  });
});
