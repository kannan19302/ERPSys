import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesCpqExtensionService {
  async getBundles(tenantId: string) {
    return prisma.productBundle.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBundleById(tenantId: string, id: string) {
    const bundle = await prisma.productBundle.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: { include: { product: { select: { id: true, name: true, sku: true, sellPrice: true } } }, orderBy: { sortOrder: "asc" } } },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");
    return bundle;
  }

  async createBundle(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.productBundle.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null,
        bundlePrice: new Prisma.Decimal(dto.bundlePrice),
        currency: dto.currency || "USD",
        savingsPct: new Prisma.Decimal(dto.savingsPct || 0),
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        items: { create: dto.items.map((i: any, idx: number) => ({ tenantId, productId: i.productId, quantity: i.quantity || 1, sortOrder: idx })) },
      },
      include: { items: true },
    });
  }

  async updateBundle(tenantId: string, id: string, dto: any) {
    const existing = await prisma.productBundle.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Product bundle not found");
    const data: Prisma.ProductBundleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.bundlePrice !== undefined) data.bundlePrice = new Prisma.Decimal(dto.bundlePrice);
    if (dto.savingsPct !== undefined) data.savingsPct = new Prisma.Decimal(dto.savingsPct);
    if (dto.validFrom !== undefined) data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validTo !== undefined) data.validTo = dto.validTo ? new Date(dto.validTo) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.productBundle.update({ where: { id }, data, include: { items: true } });
  }

  async deleteBundle(tenantId: string, id: string) {
    const existing = await prisma.productBundle.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Product bundle not found");
    return prisma.productBundle.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCrossSellRules(tenantId: string, productId?: string) {
    const where: Prisma.CrossSellRuleWhereInput = { tenantId };
    if (productId) where.productId = productId;
    return prisma.crossSellRule.findMany({ where, orderBy: { strength: "desc" } });
  }

  async createCrossSellRule(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.crossSellRule.create({
      data: { tenantId, orgId: resolvedOrgId, productId: dto.productId, recommendedProductId: dto.recommendedProductId, strength: dto.strength || 50 },
    });
  }

  async deleteCrossSellRule(tenantId: string, id: string) {
    const existing = await prisma.crossSellRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Cross-sell rule not found");
    return prisma.crossSellRule.delete({ where: { id } });
  }

  async getUpsellRules(tenantId: string, productId?: string) {
    const where: Prisma.UpsellRuleWhereInput = { tenantId };
    if (productId) where.productId = productId;
    return prisma.upsellRule.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async createUpsellRule(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.upsellRule.create({
      data: { tenantId, orgId: resolvedOrgId, productId: dto.productId, upgradeProductId: dto.upgradeProductId, description: dto.description || null, priceDelta: new Prisma.Decimal(dto.priceDelta || 0) },
    });
  }

  async deleteUpsellRule(tenantId: string, id: string) {
    const existing = await prisma.upsellRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Upsell rule not found");
    return prisma.upsellRule.delete({ where: { id } });
  }

  async getGuidedSellingRecommendations(tenantId: string, productId: string) {
    const [product, crossSells, upsells, bundles] = await Promise.all([
      prisma.product.findFirst({ where: { id: productId, tenantId } }),
      prisma.crossSellRule.findMany({ where: { tenantId, productId, isActive: true }, orderBy: { strength: "desc" }, take: 5 }),
      prisma.upsellRule.findMany({ where: { tenantId, productId, isActive: true }, take: 5 }),
      prisma.productBundle.findMany({
        where: { tenantId, deletedAt: null, isActive: true, items: { some: { productId } } },
        include: { items: { include: { product: { select: { id: true, name: true } } } } },
        take: 5,
      }),
    ]);
    if (!product) throw new NotFoundException("Product not found");
    return { productId, productName: product.name, crossSellRecommendations: crossSells, upsellRecommendations: upsells, bundleRecommendations: bundles };
  }

  async validateConfiguration(tenantId: string, productId: string, dto: any) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException("Product not found");
    const errors: string[] = [];
    const warnings: string[] = [];
    if (dto.quantity && dto.quantity > 10000) warnings.push("Large quantity may require special handling");
    if (dto.selectedOptions) {
      const validOptions = ["SUPPORT_LEVEL", "IMPLEMENTATION", "TRAINING", "ADDON"];
      for (const key of Object.keys(dto.selectedOptions)) {
        if (!validOptions.includes(key)) errors.push(`Unknown option group: ${key}`);
      }
    }
    return { valid: errors.length === 0, errors, warnings, productId };
  }
}
