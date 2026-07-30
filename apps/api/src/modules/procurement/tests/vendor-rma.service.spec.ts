// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { VendorRmaService } from "../vendor-rma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    vendorRmaRequest: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    vendorReturnShipment: {
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

describe("VendorRmaService", () => {
  let service: VendorRmaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorRmaService],
    }).compile();
    service = module.get<VendorRmaService>(VendorRmaService);
    vi.clearAllMocks();
  });

  it("should list RMAs", async () => {
    (prisma.vendorRmaRequest.findMany as any).mockResolvedValue([
      {
        id: "1",
        rmaNumber: "RMA-0001",
        vendor: { name: "Vendor A" },
        shipments: [],
      },
    ]);
    (prisma.vendorRmaRequest.count as any).mockResolvedValue(1);
    const result = await service.listRmas("tenant-1", {});
    expect(result.meta.total).toBe(1);
  });

  it("should create RMA", async () => {
    (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
    (prisma.vendorRmaRequest.count as any).mockResolvedValue(0);
    (prisma.vendorRmaRequest.create as any).mockResolvedValue({
      id: "new-rma",
      rmaNumber: "RMA-0001",
    });

    const result = await service.createRma(
      "tenant-1",
      "org-1",
      { purchaseReturnId: "pr-1", vendorId: "vendor-1" },
      "user-1",
    );
    expect(result.id).toBe("new-rma");
  });

  it("should transition RMA from PENDING to SUBMITTED", async () => {
    (prisma.vendorRmaRequest.findFirst as any).mockResolvedValue({
      id: "1",
      status: "PENDING",
    });
    (prisma.vendorRmaRequest.update as any).mockResolvedValue({
      id: "1",
      status: "SUBMITTED",
    });

    const result = await service.updateRmaStatus("tenant-1", "1", "SUBMITTED");
    expect(result.status).toBe("SUBMITTED");
  });

  it("should reject invalid RMA transitions", async () => {
    (prisma.vendorRmaRequest.findFirst as any).mockResolvedValue({
      id: "1",
      status: "COMPLETED",
    });
    await expect(
      service.updateRmaStatus("tenant-1", "1", "PENDING"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should create shipment", async () => {
    (prisma.vendorRmaRequest.findFirst as any).mockResolvedValue({
      id: "rma-1",
    });
    (prisma.vendorReturnShipment.count as any).mockResolvedValue(0);
    (prisma.vendorReturnShipment.create as any).mockResolvedValue({
      id: "new-shipment",
      shipmentNumber: "RMA-SHP-0001",
    });

    const result = await service.createShipment("tenant-1", {
      rmaRequestId: "rma-1",
      warehouseId: "wh-1",
    });
    expect(result.id).toBe("new-shipment");
  });

  it("should get stats", async () => {
    (prisma.vendorRmaRequest.findMany as any).mockResolvedValue([
      { status: "PENDING" },
      { status: "AUTHORIZED" },
    ]);
    (prisma.vendorReturnShipment.findMany as any).mockResolvedValue([
      { status: "SHIPPED", creditAmount: 500 },
    ]);
    const stats = await service.getStats("tenant-1");
    expect(stats.totalRmas).toBe(2);
    expect(stats.totalShipments).toBe(1);
    expect(stats.totalCredits).toBe(500);
  });
});
