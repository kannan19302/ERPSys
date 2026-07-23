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
    productBundle: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    crossSellRule: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    upsellRule: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    product: { findFirst: vi.fn() },
    organization: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { SalesCpqExtensionService } from "../sales-cpq-extension.service";

describe("SalesCpqExtensionService", () => {
  let service: SalesCpqExtensionService;

  beforeEach(() => { service = new SalesCpqExtensionService(); vi.clearAllMocks(); });

  it("should list bundles", async () => {
    vi.mocked(prisma.productBundle.findMany).mockResolvedValue([{ id: "b1", name: "Starter Kit", _count: { items: 3 } }] as never);
    const result = await service.getBundles("tenant-1");
    expect(result).toHaveLength(1);
  });

  it("should get bundle by id", async () => {
    vi.mocked(prisma.productBundle.findFirst).mockResolvedValue({ id: "b1", name: "Starter Kit", items: [] } as never);
    const result = await service.getBundleById("tenant-1", "b1");
    expect(result.name).toBe("Starter Kit");
  });

  it("should create bundle", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.productBundle.create).mockResolvedValue({ id: "b1", name: "New Bundle", items: [] } as never);
    const dto = { name: "New Bundle", bundlePrice: 199, items: [{ productId: "p1", quantity: 1 }, { productId: "p2", quantity: 2 }] };
    const result = await service.createBundle("tenant-1", "org-1", dto);
    expect(result.name).toBe("New Bundle");
  });

  it("should create cross-sell rule", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.crossSellRule.create).mockResolvedValue({ id: "cs-1" } as never);
    const result = await service.createCrossSellRule("tenant-1", "org-1", { productId: "p1", recommendedProductId: "p2" });
    expect(result).toBeDefined();
  });

  it("should create upsell rule", async () => {
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: "org-1" } as never);
    vi.mocked(prisma.upsellRule.create).mockResolvedValue({ id: "us-1" } as never);
    const result = await service.createUpsellRule("tenant-1", "org-1", { productId: "p1", upgradeProductId: "p3" });
    expect(result).toBeDefined();
  });

  it("should get guided selling recommendations", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: "p1", name: "Widget" } as never);
    vi.mocked(prisma.crossSellRule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.upsellRule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.productBundle.findMany).mockResolvedValue([]);
    const result = await service.getGuidedSellingRecommendations("tenant-1", "p1");
    expect(result.productName).toBe("Widget");
  });

  it("should validate configuration", async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: "p1" } as never);
    const result = await service.validateConfiguration("tenant-1", "p1", { quantity: 5, selectedOptions: { SUPPORT_LEVEL: "premium" } });
    expect(result.valid).toBe(true);
  });
});
