import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcarePharmacyService } from "../services/pharmacy.service";

const mockPrisma = vi.hoisted(() => ({
  healthcarePharmacyBatch: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  healthcareDrug: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
  healthcareControlledSubstanceLog: { create: vi.fn(), findMany: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcarePharmacyService", () => {
  let svc: HealthcarePharmacyService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcarePharmacyService();
    vi.clearAllMocks();
  });

  it("should getInventory", async () => {
    mockPrisma.healthcareDrug.findMany.mockResolvedValue([
      { id: "d1", name: "Aspirin", batches: [] },
    ]);
    const result = await svc.getInventory(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should createBatch", async () => {
    mockPrisma.healthcarePharmacyBatch.create.mockResolvedValue({
      id: "b1",
      batchNumber: "B001",
    });
    const result = await svc.createBatch(tenantId, {
      drugId: "d1",
      batchNumber: "B001",
      quantity: 100,
    });
    expect(result.batchNumber).toBe("B001");
  });

  it("should dispenseDrug and reduce quantity", async () => {
    mockPrisma.healthcareDrug.findFirst.mockResolvedValueOnce({
      id: "d1",
      quantity: 50,
      isControlled: false,
    });
    mockPrisma.healthcareDrug.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.healthcareDrug.findFirst.mockResolvedValueOnce({
      id: "d1",
      quantity: 40,
      batches: [],
    });
    const result = await svc.dispenseDrug(tenantId, "d1", 10, "p1", "pr1");
    expect(result.quantity).toBe(40);
  });

  it("should throw when dispensing more than available", async () => {
    mockPrisma.healthcareDrug.findFirst.mockResolvedValue({
      id: "d1",
      quantity: 5,
    });
    await expect(
      svc.dispenseDrug(tenantId, "d1", 10, "p1", "pr1"),
    ).rejects.toThrow("Insufficient stock");
  });

  it("should adjustStock", async () => {
    mockPrisma.healthcareDrug.updateMany.mockResolvedValue({ count: 1 });
    await svc.adjustStock(tenantId, "d1", 25);
    expect(mockPrisma.healthcareDrug.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { increment: 25 } } }),
    );
  });

  it("should getNearExpiry", async () => {
    mockPrisma.healthcarePharmacyBatch.findMany.mockResolvedValue([
      { id: "b1", expiryDate: new Date("2026-08-01") },
    ]);
    const result = await svc.getNearExpiry(tenantId, 30);
    expect(result).toHaveLength(1);
  });

  it("should logControlledSubstance", async () => {
    mockPrisma.healthcareControlledSubstanceLog.create.mockResolvedValue({
      id: "csl1",
      action: "DISPENSE",
    });
    const result = await svc.logControlledSubstance(tenantId, {
      drugId: "d1",
      action: "DISPENSE",
    });
    expect(result.action).toBe("DISPENSE");
  });
});
