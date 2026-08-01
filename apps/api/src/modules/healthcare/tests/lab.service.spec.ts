import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcareLabService } from "../services/lab.service";

const mockPrisma = vi.hoisted(() => ({
  healthcareLabOrder: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  healthcareLabResult: { create: vi.fn() },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcareLabService", () => {
  let svc: HealthcareLabService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcareLabService();
    vi.clearAllMocks();
  });

  it("should findAll lab orders", async () => {
    mockPrisma.healthcareLabOrder.findMany.mockResolvedValue([
      { id: "lo1", status: "ORDERED" },
    ]);
    const result = await svc.findAll(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should create lab order", async () => {
    mockPrisma.healthcareLabOrder.create.mockResolvedValue({
      id: "lo1",
      status: "ORDERED",
    });
    const result = await svc.create(tenantId, {
      patientId: "p1",
      testName: "CBC",
    });
    expect(result.status).toBe("ORDERED");
  });

  it("should addResult", async () => {
    mockPrisma.healthcareLabResult.create.mockResolvedValue({
      id: "lr1",
      value: "5.2",
    });
    const result = await svc.addResult(tenantId, "lo1", { value: "5.2" });
    expect(result.value).toBe("5.2");
  });

  it("should updateStatus", async () => {
    mockPrisma.healthcareLabOrder.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.healthcareLabOrder.findFirst.mockResolvedValue({
      id: "lo1",
      status: "COMPLETED",
    });
    const result = await svc.updateStatus(tenantId, "lo1", "COMPLETED");
    expect(result.status).toBe("COMPLETED");
  });

  it("should getPending", async () => {
    mockPrisma.healthcareLabOrder.findMany.mockResolvedValue([
      { id: "lo1", status: "ORDERED" },
    ]);
    const result = await svc.getPending(tenantId);
    expect(result).toHaveLength(1);
  });
});
