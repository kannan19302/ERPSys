// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FixedAssetsService } from "../fixed-assets.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

vi.mock("@prisma/client", () => {
  class Decimal {
    private value: number;
    constructor(val: unknown) {
      this.value = Number(val);
    }
    toNumber() {
      return this.value;
    }
    toString() {
      return String(this.value);
    }
    minus(other: any) {
      return new Decimal(this.value - Number(other));
    }
    plus(other: any) {
      return new Decimal(this.value + Number(other));
    }
    mul(other: any) {
      return new Decimal(this.value * Number(other));
    }
    div(other: any) {
      return new Decimal(this.value / Number(other));
    }
    greaterThan(other: any) {
      return this.value > Number(other);
    }
    lessThanOrEqualTo(other: any) {
      return this.value <= Number(other);
    }
  }
  return { Prisma: { Decimal, JsonNull: "JsonNull" } };
});

vi.mock("@unerp/database", () => ({
  prisma: {
    fixedAssetCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    fixedAsset: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    assetDepreciation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    assetTransferLog: { create: vi.fn() },
    assetMaintenanceLog: { create: vi.fn(), findMany: vi.fn() },
    fixedAssetDisposal: { findMany: vi.fn(), create: vi.fn() },
    fixedAssetAuditLog: { findMany: vi.fn(), create: vi.fn() },
    warehouse: { findFirst: vi.fn() },
    employee: { findFirst: vi.fn() },
    $transaction: vi.fn((fn: any) =>
      fn({
        journal: {
          create: vi.fn().mockResolvedValue({ id: "j-1", entryNumber: "JV-1" }),
        },
        journalEntry: { create: vi.fn() },
        assetDepreciation: {
          create: vi.fn().mockResolvedValue({ id: "dep-1" }),
        },
        fixedAsset: { update: vi.fn() },
        assetTransferLog: { create: vi.fn().mockResolvedValue({ id: "t-1" }) },
        assetMaintenanceLog: {
          create: vi.fn().mockResolvedValue({ id: "m-1" }),
        },
        fixedAssetDisposal: {
          create: vi.fn().mockResolvedValue({ id: "d-1" }),
        },
        fixedAssetAuditLog: { create: vi.fn() },
      }),
    ),
  },
}));

describe("FixedAssetsService", () => {
  let service: FixedAssetsService;

  beforeEach(() => {
    service = new FixedAssetsService();
    vi.clearAllMocks();
  });

  it("should get disposals", async () => {
    const mockDisposals = [{ id: "1", disposalType: "SALE", tenantId: "t1" }];
    (prisma.fixedAssetDisposal.findMany as any).mockResolvedValue(
      mockDisposals,
    );
    const result = await service.getDisposals("t1");
    expect(result).toEqual(mockDisposals);
  });

  it("should dispose asset", async () => {
    (prisma.fixedAsset.findFirst as any).mockResolvedValue({
      id: "a1",
      tenantId: "t1",
      status: "ACTIVE",
      currentValue: "1000",
      category: null,
      location: null,
      custodian: null,
      depreciations: [],
      transfers: [],
      maintenanceLogs: [],
    });
    const result = await service.disposeAsset("t1", "a1", "u1", {
      disposalDate: "2026-07-27",
      disposalType: "SALE",
      salePrice: 500,
      approvedBy: "u1",
    });
    expect(result).toBeDefined();
  });

  it("should get audit logs", async () => {
    const mockLogs = [{ id: "1", action: "UPDATED", tenantId: "t1" }];
    (prisma.fixedAssetAuditLog.findMany as any).mockResolvedValue(mockLogs);
    const result = await service.getAuditLogs("t1");
    expect(result).toEqual(mockLogs);
  });

  it("should get depreciation report", async () => {
    const mockEntries = [
      { id: "1", amount: "100", asset: { name: "Asset1" }, tenantId: "t1" },
    ];
    (prisma.assetDepreciation.findMany as any).mockResolvedValue(mockEntries);
    const result = await service.getDepreciationReport("t1", "2026-07");
    expect(result.entries).toEqual(mockEntries);
    expect(result.totalAmount).toBe(100);
  });

  it("should get asset summary", async () => {
    (prisma.fixedAsset.count as any)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(1);
    (prisma.fixedAsset.aggregate as any).mockResolvedValue({
      _sum: { purchaseValue: 50000 },
    });
    (prisma.assetDepreciation.aggregate as any).mockResolvedValue({
      _sum: { amount: 5000 },
    });
    const result = await service.getAssetSummary("t1");
    expect(result.totalAssets).toBe(10);
    expect(result.activeAssets).toBe(8);
    expect(result.disposedAssets).toBe(1);
  });
});
