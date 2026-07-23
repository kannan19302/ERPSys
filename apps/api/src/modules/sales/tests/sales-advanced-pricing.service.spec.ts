import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal { constructor(value: unknown) { return Number(value); } },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    customerPriceList: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    customerPriceListItem: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    contractPricingOverride: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    floorPriceOverride: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    product: { findFirst: vi.fn() },
    contract: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesAdvancedPricingService } from "../sales-advanced-pricing.service";

describe("SalesAdvancedPricingService", () => {
  let service: SalesAdvancedPricingService;

  beforeEach(() => { service = new SalesAdvancedPricingService(); vi.clearAllMocks(); });

  it("should list customer price lists", async () => {
    vi.mocked(prisma.customerPriceList.findMany).mockResolvedValue([{ id: "pl-1", name: "Acme Corp Pricing", _count: { items: 5 } }] as never);
    const result = await service.getCustomerPriceLists("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("should create customer price list", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.customerPriceList.create).mockResolvedValue({ id: "pl-1", name: "Custom Pricing" } as never);
    const dto = { customerId: "c1", name: "Custom Pricing", items: [{ productId: "p1", unitPrice: 50 }] };
    const result = await service.createCustomerPriceList("tenant-1", "org-1", dto);
    expect(result.name).toBe("Custom Pricing");
  });

  it("should add price list item", async () => {
    vi.mocked(prisma.customerPriceList.findFirst).mockResolvedValue({ id: "pl-1" } as never);
    vi.mocked(prisma.customerPriceListItem.create).mockResolvedValue({ id: "pli-1" } as never);
    const result = await service.addPriceListItem("tenant-1", "pl-1", { productId: "p1", unitPrice: 45 });
    expect(result).toBeDefined();
  });

  it("should create contract pricing override", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.contract.findFirst).mockResolvedValue({ id: "ct-1" } as never);
    vi.mocked(prisma.contractPricingOverride.create).mockResolvedValue({ id: "cpo-1" } as never);
    const dto = { contractId: "ct-1", productId: "p1", unitPrice: 100, effectiveDate: new Date().toISOString() };
    const result = await service.createContractPricing("tenant-1", "org-1", dto);
    expect(result).toBeDefined();
  });

  it("should create and approve floor price", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.floorPriceOverride.create).mockResolvedValue({ id: "fp-1", floorPrice: 10 } as never);
    vi.mocked(prisma.floorPriceOverride.findFirst).mockResolvedValue({ id: "fp-1", isActive: false } as never);
    const created = await service.createFloorPrice("tenant-1", "org-1", { productId: "p1", floorPrice: 10 });
    vi.mocked(prisma.floorPriceOverride.findFirst).mockResolvedValue({ id: "fp-1", isActive: false } as never);
    const approved = await service.approveFloorPrice("tenant-1", "fp-1", true, "user-1");
    expect(created).toBeDefined();
  });

  it("should calculate tiered price", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: "p1", sellPrice: 100, costPrice: 60 } as never);
    const result = await service.calculateTieredPrice("tenant-1", { productId: "p1", quantity: 100 });
    expect(result.basePrice).toBe(100);
    expect(result.discountPct).toBe(7);
    expect(result.needsApproval).toBe(false);
  });

  it("should return pricing analytics", async () => {
    vi.mocked(prisma.customerPriceList.count).mockResolvedValue(3);
    vi.mocked(prisma.contractPricingOverride.count).mockResolvedValue(2);
    vi.mocked(prisma.floorPriceOverride.count).mockResolvedValue(5);
    const result = await service.getPricingAnalytics("tenant-1");
    expect(result.activePriceLists).toBe(3);
    expect(result.activeFloorPrices).toBe(5);
  });
});
