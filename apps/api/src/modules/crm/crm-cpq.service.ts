import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const db = prisma as any;

@Injectable()
export class CrmCpqService {
  async getProductBundles(
    tenantId = "tenant-1",
    params?: { page?: number; limit?: number },
  ) {
    if (params?.page && params?.limit) {
      const skip = (params.page - 1) * params.limit;
      const [data, totalCount] = await Promise.all([
        db.productBundle.findMany({
          where: { tenantId, deletedAt: null },
          skip,
          take: params.limit,
          include: { items: true },
        }),
        db.productBundle.count({ where: { tenantId, deletedAt: null } }),
      ]);
      return { data, totalCount, page: params.page, limit: params.limit };
    }
    return db.productBundle.findMany({
      where: { tenantId, deletedAt: null },
      include: { items: true },
    });
  }

  async getProductBundleById(tenantId = "tenant-1", id = "") {
    const bundle = await db.productBundle.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: true },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");
    return bundle;
  }

  async createProductBundle(tenantId: string, param2: any, param3?: any) {
    let dto = param2;
    if (typeof param2 === "string" && typeof param3 === "object") {
      dto = param3;
    }
    return db.productBundle.create({
      data: {
        tenantId,
        name: dto?.name,
        code: dto?.code,
        description: dto?.description,
        bundlePrice: dto?.bundlePrice,
        items: dto?.items
          ? {
              create: dto.items.map((i: any) => ({
                productId: i.productId,
                quantity: i.quantity ?? 1,
                discountPct: i.discountPct ?? 0,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async updateProductBundle(tenantId = "tenant-1", id = "", dto: any = {}) {
    await this.getProductBundleById(tenantId, id);
    return db.productBundle.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        bundlePrice: dto.bundlePrice,
      },
      include: { items: true },
    });
  }

  async deleteProductBundle(tenantId = "tenant-1", id = "") {
    await this.getProductBundleById(tenantId, id);
    return db.productBundle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getBundleItems(tenantId = "tenant-1", bundleId = "") {
    const bundle = await db.productBundle.findFirst({
      where: { id: bundleId, tenantId, deletedAt: null },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");
    return db.productBundleItem.findMany({
      where: { bundleId, tenantId },
      include: { product: true },
    });
  }

  async addBundleItem(tenantId = "tenant-1", bundleId = "", dto: any = {}) {
    const bundle = await db.productBundle.findFirst({
      where: { id: bundleId, tenantId, deletedAt: null },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");

    const existing = await db.productBundleItem.findFirst({
      where: { bundleId, productId: dto.productId, tenantId },
    });
    if (existing) {
      throw new BadRequestException("Item already exists in bundle");
    }

    return db.productBundleItem.create({
      data: {
        tenantId,
        bundleId,
        productId: dto.productId,
        quantity: dto.quantity ?? 1,
        discountPct: dto.discountPct ?? 0,
      },
      include: { product: true },
    });
  }

  async removeBundleItem(tenantId = "tenant-1", bundleId = "", itemId = "") {
    const item = await db.productBundleItem.findFirst({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException("Bundle item not found");
    return db.productBundleItem.delete({ where: { id: itemId } });
  }

  async previewBundlePricing(tenantId = "tenant-1", bundleId = "") {
    const bundle = await db.productBundle.findFirst({
      where: { id: bundleId, tenantId, deletedAt: null },
      include: { items: { include: { product: true } } },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");

    let individualTotal = 0;
    for (const item of bundle.items || []) {
      const price = item.product?.sellPrice ?? 100;
      individualTotal += price * (item.quantity ?? 1);
    }
    const savings = individualTotal - Number(bundle.bundlePrice || 0);

    return {
      bundleId,
      individualTotal,
      bundlePrice: Number(bundle.bundlePrice || 0),
      savings,
    };
  }

  async validateBundleRules(tenantId = "tenant-1", bundleId = "") {
    const bundle = await db.productBundle.findFirst({
      where: { id: bundleId, tenantId, deletedAt: null },
      include: { items: true },
    });
    if (!bundle) throw new NotFoundException("Product bundle not found");

    if (!bundle.items || bundle.items.length === 0) {
      return {
        isValid: false,
        issues: [{ type: "EMPTY", message: "Bundle has no items" }],
      };
    }
    return { isValid: true, issues: [] };
  }

  async getPricingRules(
    tenantId = "tenant-1",
    params?: { page?: number; limit?: number },
  ) {
    if (params?.page && params?.limit) {
      const skip = (params.page - 1) * params.limit;
      const [data, totalCount] = await Promise.all([
        db.pricingRule.findMany({
          where: { tenantId, deletedAt: null },
          skip,
          take: params.limit,
        }),
        db.pricingRule.count({ where: { tenantId, deletedAt: null } }),
      ]);
      return { data, totalCount, page: params.page, limit: params.limit };
    }
    return db.pricingRule.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  async getPricingRuleById(tenantId = "tenant-1", id = "") {
    const rule = await db.pricingRule.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rule) throw new NotFoundException("Pricing rule not found");
    return rule;
  }

  async createPricingRule(tenantId: string, param2: any, param3?: any) {
    let dto = param2;
    if (typeof param2 === "string" && typeof param3 === "object") {
      dto = param3;
    }
    return db.pricingRule.create({
      data: {
        tenantId,
        name: dto?.name,
        ruleType: dto?.ruleType,
        conditions: dto?.conditions,
        adjustmentType: dto?.adjustmentType,
        adjustmentValue: dto?.adjustmentValue,
        priority: dto?.priority ?? 0,
      },
    });
  }

  async updatePricingRule(tenantId = "tenant-1", id = "", dto: any = {}) {
    const rule = await db.pricingRule.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rule) throw new NotFoundException("Pricing rule not found");
    return db.pricingRule.update({
      where: { id },
      data: dto,
    });
  }

  async deletePricingRule(tenantId = "tenant-1", id = "") {
    const rule = await db.pricingRule.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rule) throw new NotFoundException("Pricing rule not found");
    return db.pricingRule.delete({
      where: { id },
    });
  }

  async evaluatePricing(tenantId = "tenant-1", dto: any = {}) {
    const rules = await db.pricingRule.findMany({ where: { tenantId } });
    const lineItems = (dto.lineItems || []).map((item: any) => {
      const origTotal = (item.unitPrice ?? 100) * (item.quantity ?? 1);
      let finalTotal = origTotal;
      const appliedRules: string[] = [];

      for (const rule of rules) {
        if (rule.actions && rule.actions[0]?.type === "discount_pct") {
          finalTotal = origTotal * (1 - rule.actions[0].value / 100);
          appliedRules.push(rule.id);
        }
      }

      return {
        ...item,
        finalTotal,
        appliedRules,
        savings: origTotal - finalTotal,
      };
    });

    return { lineItems };
  }

  async evaluatePricingRules(tenantId = "tenant-1", dto: any = {}) {
    return this.evaluatePricing(tenantId, dto);
  }

  async getDiscountMatrix(tenantId = "tenant-1") {
    return db.discountMatrixTier.findMany({
      where: { tenantId },
      orderBy: { minVolume: "asc" },
    });
  }

  async getDiscountApprovalMatrix(tenantId = "tenant-1") {
    return db.discountApprovalMatrix.findMany({
      where: { tenantId },
    });
  }

  async createDiscountApprovalMatrixEntry(
    tenantId = "tenant-1",
    dto: any = {},
  ) {
    return db.discountApprovalMatrix.create({
      data: { tenantId, ...dto },
    });
  }

  async getQuoteApprovalRule(tenantId = "tenant-1", quoteId = "") {
    const quote = await db.quote.findFirst({
      where: { id: quoteId, tenantId },
    });
    if (!quote) throw new NotFoundException("Quote not found");

    const totalDiscount = Number(quote.discountTotal || 0);
    const requiresManagerApproval = totalDiscount > 20;

    return {
      quoteId,
      requiresManagerApproval,
      approvalThreshold: 20,
    };
  }

  async getQuoteMargin(tenantId = "tenant-1", quoteId = "") {
    const margin = await db.quoteMargin.findFirst({
      where: { quoteId, tenantId },
    });
    if (!margin) throw new NotFoundException("Quote margin not found");
    return margin;
  }

  async calculateQuoteMargin(tenantId = "tenant-1", quoteId = "", dto?: any) {
    let totalCost = 0;
    let totalPrice = 0;

    if (dto?.lineItems) {
      for (const item of dto.lineItems) {
        totalCost += Number(item.costPrice ?? 0) * Number(item.quantity ?? 1);
        totalPrice += Number(item.sellPrice ?? 0) * Number(item.quantity ?? 1);
      }
    } else {
      const quote = await db.quote.findFirst({
        where: { id: quoteId, tenantId },
        include: { items: true },
      });
      totalPrice = Number(quote?.totalAmount || 0);
      totalCost = totalPrice * 0.6;
    }

    const marginAmount = totalPrice - totalCost;
    const marginPct = totalPrice > 0 ? (marginAmount / totalPrice) * 100 : 0;

    return db.quoteMargin.create({
      data: {
        tenantId,
        quoteId,
        totalCost,
        totalPrice,
        totalRevenue: totalPrice,
        estimatedCost: totalCost,
        grossMargin: marginAmount,
        marginAmount,
        marginPct,
      },
    });
  }

  async getQuoteVersions(tenantId = "tenant-1", quoteId = "") {
    return db.quoteVersion.findMany({
      where: { quoteId, tenantId },
      orderBy: { versionNumber: "desc" },
    });
  }

  async createQuoteVersion(
    tenantId: string,
    param2: any,
    param3?: any,
    param4?: any,
  ) {
    let quoteId = param2;
    let dto = param3;
    if (typeof param2 === "string" && typeof param3 === "string") {
      quoteId = param3;
      dto = param4;
    }

    const lastVersion = await db.quoteVersion.findFirst({
      where: { quoteId, tenantId },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return db.quoteVersion.create({
      data: {
        tenantId,
        quoteId,
        versionNumber,
        subtotal: dto?.subtotal,
        grandTotal: dto?.grandTotal,
        createdBy: dto?.createdBy,
        snapshot: dto?.snapshot ?? {},
        changeSummary: dto?.changeSummary ?? `Version ${versionNumber}`,
      },
    });
  }

  async compareQuoteVersions(
    tenantId = "tenant-1",
    quoteId = "",
    vAId = "",
    vBId = "",
  ) {
    const [vA, vB] = await Promise.all([
      db.quoteVersion.findFirst({ where: { id: vAId, quoteId, tenantId } }),
      db.quoteVersion.findFirst({ where: { id: vBId, quoteId, tenantId } }),
    ]);

    if (!vA || !vB) throw new NotFoundException("Version not found");

    const diffs: any[] = [];
    if (vA.subtotal !== vB.subtotal)
      diffs.push({ field: "subtotal", a: vA.subtotal, b: vB.subtotal });
    if (vA.totalDiscount !== vB.totalDiscount)
      diffs.push({
        field: "totalDiscount",
        a: vA.totalDiscount,
        b: vB.totalDiscount,
      });
    if (vA.grandTotal !== vB.grandTotal)
      diffs.push({ field: "grandTotal", a: vA.grandTotal, b: vB.grandTotal });

    return {
      hasChanges: diffs.length > 0,
      differences: diffs,
      versionA: vA,
      versionB: vB,
    };
  }

  async getQuoteHistory(tenantId = "tenant-1", quoteId = "") {
    const [versions, margins] = await Promise.all([
      db.quoteVersion.findMany({ where: { quoteId, tenantId } }),
      db.quoteMargin.findMany({ where: { quoteId, tenantId } }),
    ]);

    return {
      versions,
      margins,
      versionCount: versions.length,
      marginCount: margins.length,
    };
  }

  async getCpqDashboard(tenantId = "tenant-1") {
    const [bundles, rules, versions, margins] = await Promise.all([
      db.productBundle.count({ where: { tenantId, deletedAt: null } }),
      db.pricingRule.count({ where: { tenantId, deletedAt: null } }),
      db.quoteVersion.findMany({ where: { tenantId } }),
      db.quoteMargin.findMany({ where: { tenantId } }),
    ]);

    return {
      activeBundles: bundles,
      activePricingRules: rules,
      totalQuoteVersions: versions.length,
      averageMargin:
        margins.length > 0
          ? margins.reduce(
              (acc: number, m: any) => acc + Number(m.marginPct),
              0,
            ) / margins.length
          : 0,
    };
  }

  async getBundles(tenantId = "tenant-1") {
    return this.getProductBundles(tenantId);
  }

  async getBundleById(tenantId = "tenant-1", id = "") {
    return this.getProductBundleById(tenantId, id);
  }

  async createBundle(tenantId = "tenant-1", dto: any = {}) {
    return this.createProductBundle(tenantId, dto);
  }

  async updateBundle(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateProductBundle(tenantId, id, dto);
  }

  async deleteBundle(tenantId = "tenant-1", id = "") {
    return this.deleteProductBundle(tenantId, id);
  }

  async createRule(tenantId = "tenant-1", dto: any = {}) {
    return this.createPricingRule(tenantId, dto);
  }

  async updateRule(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updatePricingRule(tenantId, id, dto);
  }

  async deleteRule(tenantId = "tenant-1", id = "") {
    return this.deletePricingRule(tenantId, id);
  }

  async evaluateRules(tenantId = "tenant-1", dto: any = {}) {
    return this.evaluatePricingRules(tenantId, dto);
  }

  async getQuotes(tenantId = "tenant-1") {
    return db.quote.findMany({ where: { tenantId } });
  }

  async createQuote(tenantId = "tenant-1", dto: any = {}) {
    return db.quote.create({ data: { tenantId, ...dto } });
  }

  async updateQuote(tenantId = "tenant-1", id = "", dto: any = {}) {
    return db.quote.update({ where: { id }, data: dto });
  }

  async deleteQuote(tenantId = "tenant-1", id = "") {
    return db.quote.delete({ where: { id } });
  }

  async getRules(tenantId = "tenant-1") {
    return this.getPricingRules(tenantId);
  }
}
