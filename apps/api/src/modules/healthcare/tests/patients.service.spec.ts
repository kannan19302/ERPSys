import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcarePatientsService } from "../services/patients.service";

const mockPrisma = vi.hoisted(() => ({
  healthcarePatient: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  healthcarePatientAllergy: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  healthcareVital: { findMany: vi.fn(), create: vi.fn() },
  healthcareMedicalRecord: { findMany: vi.fn(), create: vi.fn() },
  healthcareEncounter: { findMany: vi.fn(), create: vi.fn() },
  healthcarePractitioner: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcarePatientsService", () => {
  let svc: HealthcarePatientsService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcarePatientsService();
    vi.clearAllMocks();
  });

  it("should findAll patients", async () => {
    mockPrisma.healthcarePatient.findMany.mockResolvedValue([
      { id: "p1", firstName: "John" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
    expect(mockPrisma.healthcarePatient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId } }),
    );
  });

  it("should findById patient", async () => {
    mockPrisma.healthcarePatient.findFirst.mockResolvedValue({
      id: "p1",
      firstName: "Jane",
    });
    const result = await svc.findById(tenantId, "p1");
    expect(result.firstName).toBe("Jane");
  });

  it("should create a patient", async () => {
    mockPrisma.healthcarePatient.create.mockResolvedValue({
      id: "p1",
      firstName: "New",
    });
    const result = await svc.create(tenantId, { firstName: "New" });
    expect(result.firstName).toBe("New");
    expect(mockPrisma.healthcarePatient.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { firstName: "New", tenantId } }),
    );
  });

  it("should search patients", async () => {
    mockPrisma.healthcarePatient.findMany.mockResolvedValue([
      { id: "p1", firstName: "John" },
    ]);
    const result = await svc.search(tenantId, "John");
    expect(result).toHaveLength(1);
  });

  it("should add and remove allergies", async () => {
    mockPrisma.healthcarePatientAllergy.create.mockResolvedValue({
      id: "a1",
      allergen: "Peanuts",
    });
    const result = await svc.addAllergy(tenantId, "p1", {
      allergen: "Peanuts",
    });
    expect(result.allergen).toBe("Peanuts");

    mockPrisma.healthcarePatientAllergy.updateMany.mockResolvedValue({
      count: 1,
    });
    await svc.removeAllergy(tenantId, "a1");
    expect(mockPrisma.healthcarePatientAllergy.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it("should record vital signs", async () => {
    mockPrisma.healthcareVital.create.mockResolvedValue({
      id: "v1",
      systolic: 120,
    });
    const result = await svc.recordVital(tenantId, "p1", { systolic: 120 });
    expect(result.systolic).toBe(120);
  });

  it("should create medical record", async () => {
    mockPrisma.healthcareMedicalRecord.create.mockResolvedValue({
      id: "mr1",
      title: "Progress Note",
    });
    const result = await svc.createMedicalRecord(tenantId, "p1", {
      title: "Progress Note",
      recordType: "PROGRESS_NOTE",
    });
    expect(result.title).toBe("Progress Note");
  });

  it("should create practitioner", async () => {
    mockPrisma.healthcarePractitioner.create.mockResolvedValue({
      id: "pr1",
      specialty: "Cardiology",
    });
    const result = await svc.createPractitioner(tenantId, {
      specialty: "Cardiology",
    });
    expect(result.specialty).toBe("Cardiology");
  });

  it("should get practitioners", async () => {
    mockPrisma.healthcarePractitioner.findMany.mockResolvedValue([
      { id: "pr1" },
    ]);
    const result = await svc.getPractitioners(tenantId);
    expect(result).toHaveLength(1);
  });
});
