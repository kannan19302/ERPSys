import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesAdvancedPricingService {
  async getCustomerPriceLists(tenantId: string, customerId?: string) {
    const where: Prisma.CustomerPriceListWhereInput = { tenantId, deletedAt: null };
    if (customerId) where.customerId = customerId;
    return prisma.customerPriceList.findMany({ where, include: { _count: { select: { items: true } } }, orderBy: { createdAt: "desc" } });
  }

  async getCustomerPriceListById(tenantId: string, id: string) {
    const pl = await prisma.customerPriceList.findFirst({ where: { id, tenantId, deletedAt: null }, include: { items: true } });
    if (!pl) throw new NotFoundException("Customer price list not found");
    return pl;
  }

  async createCustomerPriceList(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.customerPriceList.create({
      data: {
        tenantId, orgId: resolvedOrgId, customerId: dto.customerId,
        name: dto.name, description: dto.description || null,
        currency: dto.currency || "USD",
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        items: dto.items?.length ? { create: dto.items.map((i: any) => ({ tenantId, productId: i.productId, unitPrice: new Prisma.Decimal(i.unitPrice), minQuantity: new Prisma.Decimal(i.minQuantity || 1) })) } : undefined,
      },
      include: { items: true },
    });
  }

  async updateCustomerPriceList(tenantId: string, id: string, dto: any) {
    const existing = await prisma.customerPriceList.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Customer price list not found");
    const data: Prisma.CustomerPriceListUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.validFrom !== undefined) data.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validTo !== undefined) data.validTo = dto.validTo ? new Date(dto.validTo) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.customerPriceList.update({ where: { id }, data, include: { items: true } });
  }

  async deleteCustomerPriceList(tenantId: string, id: string) {
    const existing = await prisma.customerPriceList.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Customer price list not found");
    return prisma.customerPriceList.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addPriceListItem(tenantId: string, priceListId: string, dto: any) {
    const pl = await prisma.customerPriceList.findFirst({ where: { id: priceListId, tenantId } });
    if (!pl) throw new NotFoundException("Customer price list not found");
    return prisma.customerPriceListItem.create({ data: { tenantId, priceListId, productId: dto.productId, unitPrice: new Prisma.Decimal(dto.unitPrice), minQuantity: new Prisma.Decimal(dto.minQuantity || 1) } });
  }

  async removePriceListItem(tenantId: string, itemId: string) {
    const item = await prisma.customerPriceListItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new NotFoundException("Price list item not found");
    return prisma.customerPriceListItem.delete({ where: { id: itemId } });
  }

  async getContractPricing(tenantId: string, contractId?: string) {
    const where: Prisma.ContractPricingOverrideWhereInput = { tenantId };
    if (contractId) where.contractId = contractId;
    return prisma.contractPricingOverride.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async createContractPricing(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    const contract = await prisma.contract.findFirst({ where: { id: dto.contractId, tenantId } });
    if (!contract) throw new NotFoundException("Contract not found");
    return prisma.contractPricingOverride.create({
      data: {
        tenantId, orgId: resolvedOrgId, contractId: dto.contractId,
        productId: dto.productId, unitPrice: new Prisma.Decimal(dto.unitPrice),
        discountPct: new Prisma.Decimal(dto.discountPct || 0),
        effectiveDate: new Date(dto.effectiveDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });
  }

  async updateContractPricing(tenantId: string, id: string, dto: any) {
    const existing = await prisma.contractPricingOverride.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Contract pricing not found");
    const data: Prisma.ContractPricingOverrideUpdateInput = {};
    if (dto.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(dto.unitPrice);
    if (dto.discountPct !== undefined) data.discountPct = new Prisma.Decimal(dto.discountPct);
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.contractPricingOverride.update({ where: { id }, data });
  }

  async deleteContractPricing(tenantId: string, id: string) {
    const existing = await prisma.contractPricingOverride.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Contract pricing not found");
    return prisma.contractPricingOverride.delete({ where: { id } });
  }

  async getFloorPrices(tenantId: string, productId?: string) {
    const where: Prisma.FloorPriceOverrideWhereInput = { tenantId };
    if (productId) where.productId = productId;
    return prisma.floorPriceOverride.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async createFloorPrice(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.floorPriceOverride.create({
      data: { tenantId, orgId: resolvedOrgId, productId: dto.productId, customerId: dto.customerId || null, floorPrice: new Prisma.Decimal(dto.floorPrice), currency: dto.currency || "USD" },
    });
  }

  async updateFloorPrice(tenantId: string, id: string, dto: any) {
    const existing = await prisma.floorPriceOverride.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Floor price not found");
    const data: Prisma.FloorPriceOverrideUpdateInput = {};
    if (dto.floorPrice !== undefined) data.floorPrice = new Prisma.Decimal(dto.floorPrice);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.floorPriceOverride.update({ where: { id }, data });
  }

  async approveFloorPrice(tenantId: string, id: string, approved: boolean, userId: string) {
    const floor = await prisma.floorPriceOverride.findFirst({ where: { id, tenantId } });
    if (!floor) throw new NotFoundException("Floor price not found");
    return prisma.floorPriceOverride.update({ where: { id }, data: { isActive: approved, approvedBy: approved ? userId : null, approvedAt: approved ? new Date() : null } });
  }

  async calculateTieredPrice(tenantId: string, dto: any) {
    const product = await prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException("Product not found");

    const basePrice = Number(product.sellPrice || product.costPrice || 0);
    let finalUnitPrice = basePrice;
    let discountPct = 0;
    let appliedRule = "STANDARD";
    let priceListName = "";
    let contractName = "";

    // Volume tiered discount
    if (dto.quantity >= 1000) { discountPct = 15; appliedRule = "TIER_1000+"; }
    else if (dto.quantity >= 500) { discountPct = 12; appliedRule = "TIER_500+"; }
    else if (dto.quantity >= 250) { discountPct = 10; appliedRule = "TIER_250+"; }
    else if (dto.quantity >= 100) { discountPct = 7; appliedRule = "TIER_100+"; }
    else if (dto.quantity >= 50) { discountPct = 5; appliedRule = "TIER_50+"; }

    // Customer-specific price list
    if (dto.customerId && !dto.priceListId) {
      const priceList = await prisma.customerPriceList.findFirst({
        where: { tenantId, customerId: dto.customerId, isActive: true, deletedAt: null },
        include: { items: { where: { productId: dto.productId }, orderBy: { minQuantity: "desc" } } },
      });
      if (priceList?.items.length) {
        const matched = priceList.items.find((i) => Number(i.minQuantity) <= dto.quantity) || priceList.items[priceList.items.length - 1];
        if (matched && Number(matched.unitPrice) < finalUnitPrice) {
          finalUnitPrice = Number(matched.unitPrice);
          priceListName = priceList.name;
          appliedRule = "CUSTOMER_PRICE_LIST";
        }
      }
    }

    // Specific price list lookup
    if (dto.priceListId) {
      const entry = await prisma.customerPriceListItem.findFirst({
        where: { priceListId: dto.priceListId, productId: dto.productId, minQuantity: { lte: dto.quantity } },
        orderBy: { minQuantity: "desc" },
      });
      if (entry && Number(entry.unitPrice) < finalUnitPrice) {
        finalUnitPrice = Number(entry.unitPrice);
        appliedRule = "PRICE_LIST_OVERRIDE";
      }
    }

    // Contract pricing
    if (dto.customerId) {
      const contractPricing = await prisma.contractPricingOverride.findFirst({
        where: { tenantId, productId: dto.productId, isActive: true, expiryDate: { gte: new Date() } },
      });
      if (contractPricing && Number(contractPricing.unitPrice) < finalUnitPrice) {
        finalUnitPrice = Number(contractPricing.unitPrice);
        contractName = contractPricing.id;
        appliedRule = "CONTRACT_PRICING";
      }
    }

    // Floor price check
    const floor = await prisma.floorPriceOverride.findFirst({
      where: { tenantId, productId: dto.productId, isActive: true, customerId: dto.customerId || null },
    });
    const floorPrice = floor ? Number(floor.floorPrice) : null;
    if (floorPrice && finalUnitPrice < floorPrice) {
      return { needsApproval: true, message: `Price ${finalUnitPrice} below floor ${floorPrice}`, basePrice, finalUnitPrice: floorPrice, floorPrice, discountPct, appliedRule: "FLOOR_PRICING_APPROVAL_REQUIRED", priceListName, contractName };
    }

    finalUnitPrice = Math.round(finalUnitPrice * 100) / 100;
    return { basePrice, finalUnitPrice, discountPct, totalPrice: Math.round(finalUnitPrice * dto.quantity * 100) / 100, appliedRule, priceListName, contractName, floorPrice, needsApproval: false };
  }

  async getPricingAnalytics(tenantId: string) {
    const [priceLists, overrides, floors] = await Promise.all([
      prisma.customerPriceList.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      prisma.contractPricingOverride.count({ where: { tenantId, isActive: true } }),
      prisma.floorPriceOverride.count({ where: { tenantId, isActive: true } }),
    ]);
    return { activePriceLists: priceLists, activeContractOverrides: overrides, activeFloorPrices: floors };
  }
}
