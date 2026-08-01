import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssetOperationsService } from "../asset-operations.service";

describe("AssetOperationsService", () => {
  let service: AssetOperationsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      fixedAssetInsurancePolicy: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "pol-1", assetId: "ast-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "pol-1", ...data }),
          ),
      },
      fixedAssetRevaluation: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "rev-1", assetId: "ast-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "rev-1", ...data }),
          ),
      },
      fixedAssetPhysicalAudit: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ id: "aud-1", assetId: "ast-1" }]),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: "aud-1", ...data }),
          ),
      },
    };
    service = new AssetOperationsService(mockPrisma);
  });

  it("should list insurance policies", async () => {
    const result = await service.getInsurancePolicies("tenant-1", {
      assetId: "ast-1",
    });
    expect(result).toHaveLength(1);
  });

  it("should create insurance policy", async () => {
    const data = {
      assetId: "ast-1",
      insurer: "Allianz",
      coverageAmount: 100000,
      premiumAmount: 1200,
      startDate: "2026-01-01",
      endDate: "2027-01-01",
    };
    const result = await service.createInsurancePolicy("tenant-1", data);
    expect(result.insurer).toBe("Allianz");
    expect(result.status).toBe("ACTIVE");
  });

  it("should create asset revaluation", async () => {
    const data = {
      assetId: "ast-1",
      oldValue: 50000,
      newValue: 65000,
      revaluedBy: "Auditor Smith",
      reason: "Market Appreciation",
    };
    const result = await service.createAssetRevaluation("tenant-1", data);
    expect(result.newValue).toBe(65000);
  });

  it("should create physical audit record", async () => {
    const data = {
      auditName: "2026 Annual Audit",
      assetId: "ast-1",
      expectedLocation: "Building A",
      foundLocation: "Building A",
      auditedBy: "John",
    };
    const result = await service.createPhysicalAudit("tenant-1", data);
    expect(result.condition).toBe("GOOD");
  });
});
