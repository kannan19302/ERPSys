import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import {
  UpsertStorefrontConfigDto,
  CreateStorefrontCategoryDto,
  UpdateStorefrontCategoryDto,
  CreateProductListingDto,
  UpdateProductListingDto,
} from './dto/ecommerce.dto';

/**
 * Admin-side (tenant-authenticated, RBAC-gated) service for the E-Commerce
 * Storefront module. Owns StorefrontConfig/StorefrontCategory/ProductListing
 * CRUD. See .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Flow A.
 *
 * `ProductListing` is a thin publish/price-override layer over the existing
 * Inventory `Product` model — this service reads `Product` directly (the same
 * established pattern `sales.service.ts` uses for `Customer`) purely to
 * validate that a `productId` belongs to the same tenant before linking, and
 * to join product fields for the admin listing view. It never writes to
 * `Product`.
 */
@Injectable()
export class EcommerceAdminService {
  // ─── StorefrontConfig ────────────────────────────────

  async getConfig(tenantId: string) {
    const config = await prisma.storefrontConfig.findUnique({ where: { tenantId } });
    return config; // null is a valid "not configured yet" response for the admin UI
  }

  async upsertConfig(tenantId: string, dto: UpsertStorefrontConfigDto) {
    const existingBySlug = await prisma.storefrontConfig.findUnique({ where: { storeSlug: dto.storeSlug } });
    if (existingBySlug && existingBySlug.tenantId !== tenantId) {
      throw new BadRequestException(`Store slug "${dto.storeSlug}" is already in use.`);
    }

    return prisma.storefrontConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        storeName: dto.storeName,
        storeSlug: dto.storeSlug,
        isEnabled: dto.isEnabled,
        currency: dto.currency,
        contactEmail: dto.contactEmail || null,
        logoUrl: dto.logoUrl || null,
        primaryColor: dto.primaryColor || null,
      },
      update: {
        storeName: dto.storeName,
        storeSlug: dto.storeSlug,
        isEnabled: dto.isEnabled,
        currency: dto.currency,
        contactEmail: dto.contactEmail || null,
        logoUrl: dto.logoUrl || null,
        primaryColor: dto.primaryColor || null,
      },
    });
  }

  // ─── StorefrontCategory ──────────────────────────────

  async getCategories(tenantId: string) {
    return prisma.storefrontCategory.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategoryById(tenantId: string, id: string) {
    const category = await prisma.storefrontCategory.findFirst({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Storefront category not found');
    return category;
  }

  async createCategory(tenantId: string, dto: CreateStorefrontCategoryDto) {
    const existing = await prisma.storefrontCategory.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });
    if (existing) throw new BadRequestException(`Category slug "${dto.slug}" already exists.`);

    return prisma.storefrontCategory.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateStorefrontCategoryDto) {
    await this.getCategoryById(tenantId, id);

    if (dto.slug) {
      const existing = await prisma.storefrontCategory.findUnique({
        where: { tenantId_slug: { tenantId, slug: dto.slug } },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Category slug "${dto.slug}" already exists.`);
      }
    }

    return prisma.storefrontCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.getCategoryById(tenantId, id);
    // Unassign listings before deleting the category, rather than cascading a
    // hard-delete onto ProductListing rows that admins likely still want.
    await prisma.productListing.updateMany({
      where: { tenantId, categoryId: id },
      data: { categoryId: null },
    });
    return prisma.storefrontCategory.delete({ where: { id } });
  }

  // ─── ProductListing ──────────────────────────────────

  async getListings(tenantId: string) {
    const listings = await prisma.productListing.findMany({
      where: { tenantId },
      include: { product: true, category: true },
      orderBy: { sortOrder: 'asc' },
    });

    return listings.map((listing) => ({
      id: listing.id,
      productId: listing.productId,
      productName: listing.displayName || listing.product.name,
      productSku: listing.product.sku,
      categoryId: listing.categoryId,
      categoryName: listing.category?.name || null,
      isPublished: listing.isPublished,
      basePrice: Number(listing.product.sellPrice),
      priceOverride: listing.priceOverride ? Number(listing.priceOverride) : null,
      effectivePrice: listing.priceOverride ? Number(listing.priceOverride) : Number(listing.product.sellPrice),
      sortOrder: listing.sortOrder,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }));
  }

  async getListingById(tenantId: string, id: string) {
    const listing = await prisma.productListing.findFirst({
      where: { id, tenantId },
      include: { product: true, category: true },
    });
    if (!listing) throw new NotFoundException('Product listing not found');
    return listing;
  }

  async createListing(tenantId: string, dto: CreateProductListingDto) {
    // Validate productId belongs to the same tenant's Product before linking —
    // required by .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 3.1 ("Admin side").
    const product = await prisma.product.findFirst({ where: { id: dto.productId, tenantId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found for this tenant');

    if (dto.categoryId) {
      const category = await prisma.storefrontCategory.findFirst({ where: { id: dto.categoryId, tenantId } });
      if (!category) throw new NotFoundException('Storefront category not found');
    }

    const existing = await prisma.productListing.findUnique({
      where: { tenantId_productId: { tenantId, productId: dto.productId } },
    });
    if (existing) throw new BadRequestException('This product is already listed on the storefront.');

    return prisma.productListing.create({
      data: {
        tenantId,
        productId: dto.productId,
        categoryId: dto.categoryId || null,
        isPublished: dto.isPublished,
        displayName: dto.displayName || null,
        description: dto.description || null,
        priceOverride: dto.priceOverride ?? null,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async updateListing(tenantId: string, id: string, dto: UpdateProductListingDto) {
    const listing = await prisma.productListing.findFirst({ where: { id, tenantId } });
    if (!listing) throw new NotFoundException('Product listing not found');

    if (dto.categoryId) {
      const category = await prisma.storefrontCategory.findFirst({ where: { id: dto.categoryId, tenantId } });
      if (!category) throw new NotFoundException('Storefront category not found');
    }

    return prisma.productListing.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priceOverride !== undefined && { priceOverride: dto.priceOverride }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteListing(tenantId: string, id: string) {
    const listing = await prisma.productListing.findFirst({ where: { id, tenantId } });
    if (!listing) throw new NotFoundException('Product listing not found');
    return prisma.productListing.delete({ where: { id } });
  }
}
