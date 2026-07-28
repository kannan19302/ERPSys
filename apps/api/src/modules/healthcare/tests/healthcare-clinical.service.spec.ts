import { describe, it, expect, beforeEach, vi } from "vitest";
import { HealthcareClinicalService } from "../healthcare-clinical.service";

describe("HealthcareClinicalService", () => {
  let service: HealthcareClinicalService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      healthcareClinicalNote: {
        findMany: vi.fn().mockResolvedValue([{ id: "note-1", patientId: "pat-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "note-1", ...data })),
      },
      healthcareTelemedicineSession: {
        findMany: vi.fn().mockResolvedValue([{ id: "session-1", patientId: "pat-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "session-1", ...data })),
      },
      healthcareMedicalBill: {
        findMany: vi.fn().mockResolvedValue([{ id: "bill-1", patientId: "pat-1" }]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "bill-1", ...data })),
      },
    };
    service = new HealthcareClinicalService(mockPrisma);
  });

  it("should list clinical notes for tenant", async () => {
    const result = await service.getClinicalNotes("tenant-1", { patientId: "pat-1" });
    expect(result).toHaveLength(1);
    expect(mockPrisma.healthcareClinicalNote.findMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1", patientId: "pat-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should create clinical note", async () => {
    const data = { patientId: "pat-1", doctorId: "doc-1", subjective: "Headache", objective: "Normal", assessment: "Migraine", plan: "Rest" };
    const result = await service.createClinicalNote("tenant-1", data);
    expect(result.patientId).toBe("pat-1");
    expect(result.tenantId).toBe("tenant-1");
  });

  it("should create telehealth session", async () => {
    const data = { patientId: "pat-1", doctorId: "doc-1", scheduledAt: "2026-08-01T10:00:00Z" };
    const result = await service.createTelehealthSession("tenant-1", data);
    expect(result.status).toBe("SCHEDULED");
  });

  it("should create medical bill", async () => {
    const data = { patientId: "pat-1", totalAmount: 150.0, dueDate: "2026-08-15" };
    const result = await service.createMedicalBill("tenant-1", data);
    expect(result.totalAmount).toBe(150.0);
    expect(result.status).toBe("UNPAID");
  });
});
