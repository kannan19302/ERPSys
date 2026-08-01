import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SupplierNcrCarService } from "../supplier-ncr-car.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    supplierNcr: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    supplierCarRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    vendor: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

describe("SupplierNcrCarService", () => {
  let service: SupplierNcrCarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierNcrCarService],
    }).compile();
    service = module.get<SupplierNcrCarService>(SupplierNcrCarService);
    vi.clearAllMocks();
  });

  it("should list NCRs", async () => {
    (prisma.supplierNcr.findMany as any).mockResolvedValue([
      {
        id: "1",
        ncrNumber: "NCR-00001",
        vendor: { name: "Vendor A" },
        carRequests: [],
      },
    ]);
    (prisma.supplierNcr.count as any).mockResolvedValue(1);
    const result = await service.listNcrs("tenant-1", {});
    expect(result.meta.total).toBe(1);
  });

  it("should create NCR", async () => {
    (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
    (prisma.supplierNcr.count as any).mockResolvedValue(0);
    (prisma.supplierNcr.create as any).mockResolvedValue({
      id: "new-ncr",
      ncrNumber: "NCR-00001",
    });

    const result = await service.createNcr(
      "tenant-1",
      {
        vendorId: "vendor-1",
        defectType: "DIMENSIONAL",
        defectQty: 5,
        totalQty: 100,
        description: "Test defect",
      },
      "user-1",
    );
    expect(result.id).toBe("new-ncr");
  });

  it("should create CAR from NCR", async () => {
    (prisma.supplierNcr.findFirst as any).mockResolvedValue({
      id: "ncr-1",
      vendorId: "vendor-1",
    });
    (prisma.supplierCarRequest.count as any).mockResolvedValue(0);
    (prisma.supplierNcr.update as any).mockResolvedValue({});
    (prisma.supplierCarRequest.create as any).mockResolvedValue({
      id: "new-car",
      carNumber: "CAR-00001",
    });

    const result = await service.createCarFromNcr("tenant-1", "ncr-1", {
      rootCause: "Process error",
      correctiveAction: "Update SOP",
    });
    expect(result.id).toBe("new-car");
  });

  it("should reject invalid NCR transitions", async () => {
    (prisma.supplierNcr.findFirst as any).mockResolvedValue({
      id: "1",
      status: "CLOSED",
    });
    await expect(
      service.updateNcrStatus("tenant-1", "1", "CAR_RAISED"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should get stats with severity breakdown", async () => {
    (prisma.supplierNcr.findMany as any).mockResolvedValue([
      { status: "OPEN", severity: "CRITICAL" },
      { status: "CLOSED", severity: "MINOR" },
      { status: "OPEN", severity: "MAJOR" },
    ]);
    (prisma.supplierCarRequest.findMany as any).mockResolvedValue([]);
    const stats = await service.getStats("tenant-1");
    expect(stats.totalNcrs).toBe(3);
    expect(stats.ncrBySeverity.CRITICAL).toBe(1);
  });
});
