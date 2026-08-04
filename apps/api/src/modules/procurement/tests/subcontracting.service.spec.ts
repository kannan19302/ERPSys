import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SubcontractingService } from "../subcontracting.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    subcontractingOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subcontractingMaterial: { findFirst: vi.fn(), update: vi.fn() },
    vendor: { findFirst: vi.fn() },
    product: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("SubcontractingService", () => {
  let service: SubcontractingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubcontractingService],
    }).compile();
    service = module.get<SubcontractingService>(SubcontractingService);
    vi.clearAllMocks();
  });

  it("should list subcontracting orders", async () => {
    const mockOrders = [
      {
        id: "1",
        vendor: { name: "Vendor A" },
        product: { name: "Product A", sku: "SKU1" },
        materials: [],
      },
    ];
    (prisma.subcontractingOrder.findMany as any).mockResolvedValue(mockOrders);
    (prisma.subcontractingOrder.count as any).mockResolvedValue(1);

    const result = await service.list("tenant-1", {});
    expect(result.data).toEqual(mockOrders);
    expect(result.meta.total).toBe(1);
  });

  it("should get subcontracting order by id", async () => {
    const mockOrder = {
      id: "1",
      vendor: { name: "Vendor A" },
      product: { name: "Product A" },
      materials: [],
    };
    (prisma.subcontractingOrder.findFirst as any).mockResolvedValue(mockOrder);

    const result = await service.getById("tenant-1", "1");
    expect(result.id).toBe("1");
  });

  it("should throw NotFoundException for missing order", async () => {
    (prisma.subcontractingOrder.findFirst as any).mockResolvedValue(null);
    await expect(service.getById("tenant-1", "nonexistent")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should create a subcontracting order", async () => {
    (prisma.vendor.findFirst as any).mockResolvedValue({ id: "vendor-1" });
    (prisma.product.findFirst as any).mockResolvedValue({ id: "product-1" });
    (prisma.subcontractingOrder.create as any).mockResolvedValue({
      id: "new-order",
      vendor: { name: "Vendor A" },
      product: { name: "Product A" },
    });

    const result = await service.create("tenant-1", {
      vendorId: "vendor-1",
      productId: "product-1",
      quantity: 10,
      unitCost: 50,
    });
    expect(result.id).toBe("new-order");
  });
});
