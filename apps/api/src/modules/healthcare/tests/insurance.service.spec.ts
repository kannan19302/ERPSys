// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthcareInsuranceService } from "../services/insurance.service";

const mockPrisma = vi.hoisted(() => ({
  healthcareInsurancePolicy: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
  healthcareInsuranceClaim: {
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

describe("HealthcareInsuranceService", () => {
  let svc: HealthcareInsuranceService;
  const tenantId = "tenant_1";

  beforeEach(() => {
    svc = new HealthcareInsuranceService();
    vi.clearAllMocks();
  });

  it("should findAllPolicies", async () => {
    mockPrisma.healthcareInsurancePolicy.findMany.mockResolvedValue([
      { id: "ip1", policyNumber: "POL-001" },
    ]);
    const result = await svc.findAllPolicies(tenantId);
    expect(result).toHaveLength(1);
  });

  it("should findPolicyById", async () => {
    mockPrisma.healthcareInsurancePolicy.findFirst.mockResolvedValue({
      id: "ip1",
    });
    const result = await svc.findPolicyById(tenantId, "ip1");
    expect(result.id).toBe("ip1");
  });

  it("should createPolicy", async () => {
    mockPrisma.healthcareInsurancePolicy.create.mockResolvedValue({
      id: "ip1",
      provider: "Blue Cross",
    });
    const result = await svc.createPolicy(tenantId, {
      patientId: "p1",
      provider: "Blue Cross",
      policyNumber: "POL-001",
    });
    expect(result.provider).toBe("Blue Cross");
  });

  it("should updatePolicy", async () => {
    mockPrisma.healthcareInsurancePolicy.updateMany.mockResolvedValue({
      count: 1,
    });
    mockPrisma.healthcareInsurancePolicy.findFirst.mockResolvedValue({
      id: "ip1",
      policyNumber: "POL-002",
    });
    const result = await svc.updatePolicy(tenantId, "ip1", {
      policyNumber: "POL-002",
    });
    expect(result.policyNumber).toBe("POL-002");
  });

  it("should createClaim", async () => {
    mockPrisma.healthcareInsuranceClaim.create.mockResolvedValue({
      id: "cl1",
      status: "SUBMITTED",
    });
    const result = await svc.createClaim(tenantId, {
      policyId: "ip1",
      billedAmount: 500,
    });
    expect(result.status).toBe("SUBMITTED");
  });

  it("should updateClaimStatus", async () => {
    mockPrisma.healthcareInsuranceClaim.updateMany.mockResolvedValue({
      count: 1,
    });
    mockPrisma.healthcareInsuranceClaim.findFirst.mockResolvedValue({
      id: "cl1",
      status: "APPROVED",
    });
    const result = await svc.updateClaimStatus(tenantId, "cl1", "APPROVED");
    expect(result.status).toBe("APPROVED");
  });

  it("should getPatientPolicies", async () => {
    mockPrisma.healthcareInsurancePolicy.findMany.mockResolvedValue([
      { id: "ip1", policyNumber: "POL-001" },
    ]);
    const result = await svc.getPatientPolicies(tenantId, "p1");
    expect(result).toHaveLength(1);
  });
});
