// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CrmCpqService } from "../crm-cpq.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    productBundle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productBundleItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    pricingRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    quoteVersion: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    quoteMargin: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    discountApprovalMatrix: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";

const TENANT = "tenant-1";
const ORG = "org-1";

describe("CrmCpqService", () => {
  let service: CrmCpqService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCpqService();
    (
      prisma.organization.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: ORG });
  });

  // ── PRODUCT BUNDLES ─────────────────────────────────

  describe("getProductBundles", () => {
    it("returns paginated bundles", async () => {
      (
        prisma.productBundle.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "b1", name: "Starter Pack", items: [] }]);
      (
        prisma.productBundle.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(1);
      const result = await service.getProductBundles(TENANT, {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it("returns all bundles when no pagination", async () => {
      (
        prisma.productBundle.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "b1", name: "Pro Pack", items: [] }]);
      const result = await service.getProductBundles(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe("getProductBundleById", () => {
    it("returns bundle when found", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", name: "Starter", items: [] });
      const result = await service.getProductBundleById(TENANT, "b1");
      expect(result.id).toBe("b1");
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.getProductBundleById(TENANT, "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createProductBundle", () => {
    it("creates a bundle with given data", async () => {
      (
        prisma.productBundle.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "b-new", ...data }),
      );
      const result = await service.createProductBundle(TENANT, ORG, {
        name: "Enterprise",
        bundlePrice: 9999,
      });
      expect(result.name).toBe("Enterprise");
      expect(Number(result.bundlePrice)).toBe(9999);
    });
  });

  describe("updateProductBundle", () => {
    it("updates an existing bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", tenantId: TENANT, deletedAt: null });
      (
        prisma.productBundle.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", name: "Updated" });
      const result = await service.updateProductBundle(TENANT, "b1", {
        name: "Updated",
      });
      expect(result.name).toBe("Updated");
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.updateProductBundle(TENANT, "missing", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteProductBundle", () => {
    it("soft-deletes a bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", tenantId: TENANT, deletedAt: null });
      (
        prisma.productBundle.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", deletedAt: new Date() });
      const result = await service.deleteProductBundle(TENANT, "b1");
      expect(result.deletedAt).toBeTruthy();
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.deleteProductBundle(TENANT, "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── BUNDLE ITEMS ────────────────────────────────────

  describe("getBundleItems", () => {
    it("returns items for a bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", tenantId: TENANT, deletedAt: null });
      (
        prisma.productBundleItem.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: "i1", productId: "p1", quantity: 2, product: { name: "Widget" } },
      ]);
      const result = await service.getBundleItems(TENANT, "b1");
      expect(result).toHaveLength(1);
    });

    it("throws NotFoundException when bundle missing", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(service.getBundleItems(TENANT, "missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("addBundleItem", () => {
    it("adds an item to a bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", tenantId: TENANT, deletedAt: null });
      (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "p1",
        name: "Widget",
      });
      (
        prisma.productBundleItem.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      (
        prisma.productBundleItem.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "i1", ...data, product: { name: "Widget" } }),
      );
      const result = await service.addBundleItem(TENANT, "b1", {
        productId: "p1",
        quantity: 2,
      });
      expect(result.quantity).toBe(2);
    });

    it("rejects duplicate items", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "b1", tenantId: TENANT, deletedAt: null });
      (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "p1",
        name: "Widget",
      });
      (
        prisma.productBundleItem.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "existing" });
      await expect(
        service.addBundleItem(TENANT, "b1", { productId: "p1" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("removeBundleItem", () => {
    it("removes an item from a bundle", async () => {
      (
        prisma.productBundleItem.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "i1", bundleId: "b1", tenantId: TENANT });
      (
        prisma.productBundleItem.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "i1" });
      const result = await service.removeBundleItem(TENANT, "b1", "i1");
      expect(result.id).toBe("i1");
    });

    it("throws NotFoundException when item missing", async () => {
      (
        prisma.productBundleItem.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.removeBundleItem(TENANT, "b1", "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── PRICING RULES ───────────────────────────────────

  describe("getPricingRules", () => {
    it("returns paginated pricing rules", async () => {
      (
        prisma.pricingRule.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "r1", name: "Volume 10+" }]);
      (prisma.pricingRule.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        1,
      );
      const result = await service.getPricingRules(TENANT, {
        page: 1,
        limit: 10,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getPricingRuleById", () => {
    it("returns rule when found", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "r1", name: "Bulk Discount" });
      const result = await service.getPricingRuleById(TENANT, "r1");
      expect(result.name).toBe("Bulk Discount");
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.getPricingRuleById(TENANT, "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPricingRule", () => {
    it("creates a pricing rule", async () => {
      (
        prisma.pricingRule.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "r-new", ...data }),
      );
      const result = await service.createPricingRule(TENANT, ORG, {
        name: "Holiday Sale",
        ruleType: "PROMOTIONAL",
      });
      expect(result.name).toBe("Holiday Sale");
    });
  });

  describe("updatePricingRule", () => {
    it("updates an existing pricing rule", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "r1", tenantId: TENANT });
      (prisma.pricingRule.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        { id: "r1", name: "Updated Rule" },
      );
      const result = await service.updatePricingRule(TENANT, "r1", {
        name: "Updated Rule",
      });
      expect(result.name).toBe("Updated Rule");
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.updatePricingRule(TENANT, "missing", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("deletePricingRule", () => {
    it("deletes a pricing rule", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "r1", tenantId: TENANT });
      (prisma.pricingRule.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
        { id: "r1" },
      );
      const result = await service.deletePricingRule(TENANT, "r1");
      expect(result.id).toBe("r1");
    });

    it("throws NotFoundException when missing", async () => {
      (
        prisma.pricingRule.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.deletePricingRule(TENANT, "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── EVALUATE PRICING ────────────────────────────────

  describe("evaluatePricing", () => {
    it("applies volume discount rules", async () => {
      (
        prisma.pricingRule.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "r1",
          ruleType: "VOLUME_DISCOUNT",
          priority: 0,
          conditions: [{ field: "quantity", operator: "gte", value: 10 }],
          actions: [{ type: "discount_pct", value: 10 }],
          appliedTo: "PRODUCT",
          targetId: "p1",
        },
      ]);
      const result = await service.evaluatePricing(TENANT, {
        lineItems: [{ productId: "p1", quantity: 10, unitPrice: 100 }],
      });
      expect(result.lineItems[0].finalTotal).toBe(900);
      expect(result.lineItems[0].appliedRules).toContain("r1");
    });

    it("returns original price when no rules match", async () => {
      (
        prisma.pricingRule.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.evaluatePricing(TENANT, {
        lineItems: [{ productId: "p1", quantity: 1, unitPrice: 50 }],
      });
      expect(result.lineItems[0].finalTotal).toBe(50);
      expect(result.lineItems[0].savings).toBe(0);
    });
  });

  // ── BUNDLE PREVIEW ──────────────────────────────────

  describe("previewBundlePricing", () => {
    it("calculates bundle pricing summary", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "b1",
        name: "Starter",
        bundlePrice: 150,
        items: [
          {
            productId: "p1",
            quantity: 2,
            product: { name: "Widget", sellPrice: 100 },
          },
        ],
      });
      const result = await service.previewBundlePricing(TENANT, "b1");
      expect(result.individualTotal).toBe(200);
      expect(result.bundlePrice).toBe(150);
      expect(result.savings).toBe(50);
    });

    it("throws NotFoundException when bundle missing", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.previewBundlePricing(TENANT, "missing"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── BUNDLE VALIDATE ─────────────────────────────────

  describe("validateBundleRules", () => {
    it("returns valid for a well-configured bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "b1",
        name: "Good Bundle",
        isActive: true,
        items: [{ productId: "p1", quantity: 1, product: { name: "Widget" } }],
      });
      const result = await service.validateBundleRules(TENANT, "b1");
      expect(result.isValid).toBe(true);
    });

    it("returns issues for empty bundle", async () => {
      (
        prisma.productBundle.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "b1",
        name: "Empty Bundle",
        isActive: true,
        items: [],
      });
      const result = await service.validateBundleRules(TENANT, "b1");
      expect(result.isValid).toBe(false);
      expect(result.issues[0].type).toBe("EMPTY");
    });
  });

  // ── QUOTE MARGIN ────────────────────────────────────

  describe("getQuoteMargin", () => {
    it("returns latest margin for a quote", async () => {
      (
        prisma.quoteMargin.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "m1", totalCost: 100, totalPrice: 200 });
      const result = await service.getQuoteMargin(TENANT, "q1");
      expect(result.id).toBe("m1");
    });

    it("throws NotFoundException when no margin calculated", async () => {
      (
        prisma.quoteMargin.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(service.getQuoteMargin(TENANT, "q1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("calculateQuoteMargin", () => {
    it("calculates and stores margin", async () => {
      (
        prisma.quoteMargin.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "m1", ...data }),
      );
      const result = await service.calculateQuoteMargin(TENANT, "q1", {
        lineItems: [
          { costPrice: 50, sellPrice: 100, quantity: 2, label: "Widget" },
        ],
      });
      expect(Number(result.totalCost)).toBe(100);
      expect(Number(result.totalPrice)).toBe(200);
      expect(Number(result.marginAmount)).toBe(100);
      expect(Number(result.marginPct)).toBe(50);
    });
  });

  // ── QUOTE VERSIONS ──────────────────────────────────

  describe("getQuoteVersions", () => {
    it("returns versions in descending order", async () => {
      (
        prisma.quoteVersion.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: "v2", versionNumber: 2 },
        { id: "v1", versionNumber: 1 },
      ]);
      const result = await service.getQuoteVersions(TENANT, "q1");
      expect(result).toHaveLength(2);
    });
  });

  describe("createQuoteVersion", () => {
    it("creates version with incremented number", async () => {
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ versionNumber: 2 });
      (
        prisma.quoteVersion.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "v3", ...data }),
      );
      const result = await service.createQuoteVersion(TENANT, ORG, "q1", {
        subtotal: 1000,
        grandTotal: 950,
        createdBy: "user1",
      });
      expect(result.versionNumber).toBe(3);
      expect(result.subtotal).toBe(1000);
    });

    it("creates version 1 when no prior versions exist", async () => {
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      (
        prisma.quoteVersion.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "v1", ...data }),
      );
      const result = await service.createQuoteVersion(TENANT, ORG, "q1", {
        subtotal: 500,
        grandTotal: 500,
        createdBy: "user1",
      });
      expect(result.versionNumber).toBe(1);
    });
  });

  describe("compareQuoteVersions", () => {
    it("detects differences between versions", async () => {
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "va",
        subtotal: 1000,
        totalDiscount: 50,
        grandTotal: 950,
      });
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "vb",
        subtotal: 1200,
        totalDiscount: 100,
        grandTotal: 1100,
      });
      const result = await service.compareQuoteVersions(
        TENANT,
        "q1",
        "va",
        "vb",
      );
      expect(result.hasChanges).toBe(true);
      expect(result.differences).toHaveLength(3);
    });

    it("reports no changes when versions are identical", async () => {
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "va",
        subtotal: 1000,
        totalDiscount: 0,
        grandTotal: 1000,
      });
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValueOnce({
        id: "vb",
        subtotal: 1000,
        totalDiscount: 0,
        grandTotal: 1000,
      });
      const result = await service.compareQuoteVersions(
        TENANT,
        "q1",
        "va",
        "vb",
      );
      expect(result.hasChanges).toBe(false);
    });

    it("throws NotFoundException when version missing", async () => {
      (
        prisma.quoteVersion.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.compareQuoteVersions(TENANT, "q1", "bad", "bad2"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── QUOTE HISTORY ──────────────────────────────────

  describe("getQuoteHistory", () => {
    it("returns versions and margins for a quote", async () => {
      (
        prisma.quoteVersion.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "v1", versionNumber: 2 }]);
      (
        prisma.quoteMargin.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "m1" }]);
      const result = await service.getQuoteHistory(TENANT, "q1");
      expect(result.versionCount).toBe(1);
      expect(result.marginCount).toBe(1);
    });
  });

  // ── DISCOUNT MATRIX ─────────────────────────────────

  describe("getDiscountApprovalMatrix", () => {
    it("returns active matrix entries", async () => {
      (
        prisma.discountApprovalMatrix.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "d1",
          name: "Rep Discount",
          minDiscount: 5,
          maxDiscount: 10,
          approverRole: "MANAGER",
        },
      ]);
      const result = await service.getDiscountApprovalMatrix(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe("createDiscountApprovalMatrixEntry", () => {
    it("creates a matrix entry", async () => {
      (
        prisma.discountApprovalMatrix.create as ReturnType<typeof vi.fn>
      ).mockImplementation(({ data }) =>
        Promise.resolve({ id: "d-new", ...data }),
      );
      const result = await service.createDiscountApprovalMatrixEntry(TENANT, {
        name: "Sales Rep Limit",
        minDiscount: 0,
        maxDiscount: 15,
        approverRole: "SALES_MANAGER",
      });
      expect(result.name).toBe("Sales Rep Limit");
      expect(result.approverRole).toBe("SALES_MANAGER");
    });
  });
});
