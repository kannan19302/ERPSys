import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { buildPaginationValues, paginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class EcommerceExpansionService {
  private get p(): any { return prisma; }

  // ═══ STORES ═══

  async getStores(tenantId: string) {
    return this.p.ecommerceStore.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  }

  async getStoreById(tenantId: string, id: string) {
    const store = await this.p.ecommerceStore.findFirst({ where: { id, tenantId } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async createStore(tenantId: string, dto: any) {
    const existing = await this.p.ecommerceStore.findFirst({ where: { tenantId, slug: dto.slug } });
    if (existing) throw new BadRequestException('Store with this slug already exists');
    return this.p.ecommerceStore.create({ data: { tenantId, ...dto } });
  }

  async updateStore(tenantId: string, id: string, dto: any) {
    const store = await this.p.ecommerceStore.findFirst({ where: { id, tenantId } });
    if (!store) throw new NotFoundException('Store not found');
    return this.p.ecommerceStore.update({ where: { id }, data: dto });
  }

  async deleteStore(tenantId: string, id: string) {
    const store = await this.p.ecommerceStore.findFirst({ where: { id, tenantId } });
    if (!store) throw new NotFoundException('Store not found');
    return this.p.ecommerceStore.update({ where: { id }, data: { isActive: false } });
  }

  // ═══ CATEGORIES ═══

  async getCategories(tenantId: string, storeId: string) {
    return this.p.ecommerceCategory.findMany({ where: { tenantId, storeId }, orderBy: { sortOrder: 'asc' }, include: { children: true } });
  }

  async getCategoryById(tenantId: string, id: string) {
    const cat = await this.p.ecommerceCategory.findFirst({ where: { id, tenantId }, include: { children: true, parent: true } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async createCategory(tenantId: string, storeId: string, dto: any) {
    const existing = await this.p.ecommerceCategory.findFirst({ where: { tenantId, storeId, slug: dto.slug } });
    if (existing) throw new BadRequestException('Category with this slug already exists');
    return this.p.ecommerceCategory.create({ data: { tenantId, storeId, ...dto } });
  }

  async updateCategory(tenantId: string, id: string, dto: any) {
    const cat = await this.p.ecommerceCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.p.ecommerceCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(tenantId: string, id: string) {
    const cat = await this.p.ecommerceCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.p.ecommerceCategory.update({ where: { id }, data: { isActive: false } });
  }

  // ═══ PRODUCT LISTINGS ═══

  async getListings(tenantId: string, storeId: string, query: { categoryId?: string; isActive?: string; isFeatured?: string; search?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId, storeId };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive) where.isActive = query.isActive === 'true';
    if (query.isFeatured) where.isFeatured = query.isFeatured === 'true';
    if (query.search) { where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }]; }
    const [data, total] = await Promise.all([
      this.p.ecommerceProductListing.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }], skip, take, include: { variants: { include: { inventory: true } }, category: true, _count: { select: { reviews: true } } } }),
      this.p.ecommerceProductListing.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getListingById(tenantId: string, id: string) {
    const listing = await this.p.ecommerceProductListing.findFirst({
      where: { id, tenantId },
      include: { variants: { include: { inventory: true } }, category: true, reviews: { include: { media: true } } },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async createListing(tenantId: string, storeId: string, dto: any) {
    const existing = await this.p.ecommerceProductListing.findFirst({ where: { tenantId, storeId, slug: dto.slug } });
    if (existing) throw new BadRequestException('Listing with this slug already exists');
    return this.p.$transaction(async (tx: any) => {
      const listing = await tx.ecommerceProductListing.create({
        data: { tenantId, storeId, productId: dto.productId, categoryId: dto.categoryId || null, title: dto.title, slug: dto.slug, description: dto.description || null, shortDescription: dto.shortDescription || null, media: dto.media || [], tags: dto.tags || [], isFeatured: dto.isFeatured || false, sortOrder: dto.sortOrder || 0, metaTitle: dto.metaTitle || null, metaDescription: dto.metaDescription || null },
      });
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          const variant = await tx.ecommerceProductVariant.create({
            data: { tenantId, listingId: listing.id, sku: v.sku, title: v.title, attributes: v.attributes || {}, price: new Prisma.Decimal(v.price), compareAtPrice: v.compareAtPrice ? new Prisma.Decimal(v.compareAtPrice) : null, costPrice: v.costPrice ? new Prisma.Decimal(v.costPrice) : null, weight: v.weight ? new Prisma.Decimal(v.weight) : null },
          });
          await tx.ecommerceInventory.create({ data: { tenantId, variantId: variant.id, quantity: v.quantity || 0 } });
        }
      }
      return tx.ecommerceProductListing.findFirst({ where: { id: listing.id }, include: { variants: { include: { inventory: true } } } });
    });
  }

  async updateListing(tenantId: string, id: string, dto: any) {
    const listing = await this.p.ecommerceProductListing.findFirst({ where: { id, tenantId } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.p.ecommerceProductListing.update({ where: { id }, data: dto });
  }

  async deleteListing(tenantId: string, id: string) {
    const listing = await this.p.ecommerceProductListing.findFirst({ where: { id, tenantId } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.p.ecommerceProductListing.update({ where: { id }, data: { isActive: false } });
  }

  // ═══ VARIANTS ═══

  async createVariant(tenantId: string, listingId: string, dto: any) {
    return this.p.$transaction(async (tx: any) => {
      const variant = await tx.ecommerceProductVariant.create({
        data: { tenantId, listingId, sku: dto.sku, title: dto.title, attributes: dto.attributes || {}, price: new Prisma.Decimal(dto.price), compareAtPrice: dto.compareAtPrice ? new Prisma.Decimal(dto.compareAtPrice) : null, costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null, weight: dto.weight ? new Prisma.Decimal(dto.weight) : null },
      });
      await tx.ecommerceInventory.create({ data: { tenantId, variantId: variant.id, quantity: dto.quantity || 0 } });
      return variant;
    });
  }

  async updateVariant(tenantId: string, id: string, dto: any) {
    const variant = await this.p.ecommerceProductVariant.findFirst({ where: { id, tenantId } });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.p.ecommerceProductVariant.update({ where: { id }, data: dto });
  }

  async updateInventory(tenantId: string, variantId: string, quantity: number) {
    const inv = await this.p.ecommerceInventory.findFirst({ where: { tenantId, variantId } });
    if (!inv) throw new NotFoundException('Inventory record not found');
    return this.p.ecommerceInventory.update({ where: { id: inv.id }, data: { quantity } });
  }

  // ═══ COUPONS ═══

  async getCoupons(tenantId: string, storeId: string) {
    return this.p.ecommerceCoupon.findMany({ where: { tenantId, storeId }, orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(tenantId: string, storeId: string, dto: any) {
    const existing = await this.p.ecommerceCoupon.findFirst({ where: { tenantId, storeId, code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Coupon code already exists');
    return this.p.ecommerceCoupon.create({
      data: { tenantId, storeId, code: dto.code.toUpperCase(), description: dto.description || null, type: dto.type, value: new Prisma.Decimal(dto.value), minOrderAmount: dto.minOrderAmount ? new Prisma.Decimal(dto.minOrderAmount) : null, maxDiscount: dto.maxDiscount ? new Prisma.Decimal(dto.maxDiscount) : null, usageLimit: dto.usageLimit || null, perCustomerLimit: dto.perCustomerLimit || null, validFrom: dto.validFrom ? new Date(dto.validFrom) : null, validTo: dto.validTo ? new Date(dto.validTo) : null },
    });
  }

  async updateCoupon(tenantId: string, id: string, dto: any) {
    const coupon = await this.p.ecommerceCoupon.findFirst({ where: { id, tenantId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.p.ecommerceCoupon.update({ where: { id }, data: dto });
  }

  async deleteCoupon(tenantId: string, id: string) {
    const coupon = await this.p.ecommerceCoupon.findFirst({ where: { id, tenantId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.p.ecommerceCoupon.delete({ where: { id } });
  }

  // ═══ SHIPPING ZONES & RATES ═══

  async getShippingZones(tenantId: string, storeId: string) {
    return this.p.ecommerceShippingZone.findMany({ where: { tenantId, storeId }, orderBy: { sortOrder: 'asc' }, include: { rates: true } });
  }

  async createShippingZone(tenantId: string, storeId: string, dto: any) {
    return this.p.ecommerceShippingZone.create({ data: { tenantId, storeId, ...dto } });
  }

  async updateShippingZone(tenantId: string, id: string, dto: any) {
    const zone = await this.p.ecommerceShippingZone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return this.p.ecommerceShippingZone.update({ where: { id }, data: dto });
  }

  async deleteShippingZone(tenantId: string, id: string) {
    const zone = await this.p.ecommerceShippingZone.findFirst({ where: { id, tenantId } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return this.p.ecommerceShippingZone.delete({ where: { id } });
  }

  async createShippingRate(tenantId: string, dto: any) {
    return this.p.ecommerceShippingRate.create({ data: { tenantId, ...dto, baseRate: new Prisma.Decimal(dto.baseRate), perUnitRate: dto.perUnitRate ? new Prisma.Decimal(dto.perUnitRate) : null } });
  }

  async updateShippingRate(tenantId: string, id: string, dto: any) {
    const rate = await this.p.ecommerceShippingRate.findFirst({ where: { id, tenantId } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return this.p.ecommerceShippingRate.update({ where: { id }, data: dto });
  }

  async deleteShippingRate(tenantId: string, id: string) {
    const rate = await this.p.ecommerceShippingRate.findFirst({ where: { id, tenantId } });
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return this.p.ecommerceShippingRate.delete({ where: { id } });
  }

  // ═══ TAX CLASSES & RATES ═══

  async getTaxClasses(tenantId: string, storeId: string) {
    return this.p.ecommerceTaxClass.findMany({ where: { tenantId, storeId }, include: { rates: true }, orderBy: { name: 'asc' } });
  }

  async createTaxClass(tenantId: string, storeId: string, dto: any) {
    if (dto.isDefault) { await this.p.ecommerceTaxClass.updateMany({ where: { tenantId, storeId }, data: { isDefault: false } }); }
    return this.p.ecommerceTaxClass.create({ data: { tenantId, storeId, ...dto } });
  }

  async createTaxRate(tenantId: string, dto: any) {
    return this.p.ecommerceTaxRate.create({ data: { tenantId, ...dto, rate: new Prisma.Decimal(dto.rate) } });
  }

  async updateTaxRate(tenantId: string, id: string, dto: any) {
    const rate = await this.p.ecommerceTaxRate.findFirst({ where: { id, tenantId } });
    if (!rate) throw new NotFoundException('Tax rate not found');
    return this.p.ecommerceTaxRate.update({ where: { id }, data: dto });
  }

  async deleteTaxRate(tenantId: string, id: string) {
    const rate = await this.p.ecommerceTaxRate.findFirst({ where: { id, tenantId } });
    if (!rate) throw new NotFoundException('Tax rate not found');
    return this.p.ecommerceTaxRate.delete({ where: { id } });
  }

  // ═══ STORE SETTINGS ═══

  async getStoreSettings(tenantId: string, storeId: string) {
    return this.p.ecommerceStoreSetting.findMany({ where: { tenantId, storeId } });
  }

  async upsertStoreSetting(tenantId: string, storeId: string, dto: any) {
    return this.p.ecommerceStoreSetting.upsert({
      where: { storeId_key: { storeId, key: dto.key } },
      create: { tenantId, storeId, key: dto.key, value: dto.value },
      update: { value: dto.value },
    });
  }

  async deleteStoreSetting(tenantId: string, storeId: string, key: string) {
    const setting = await this.p.ecommerceStoreSetting.findFirst({ where: { tenantId, storeId, key } });
    if (!setting) throw new NotFoundException('Setting not found');
    return this.p.ecommerceStoreSetting.delete({ where: { id: setting.id } });
  }

  // ═══ THEMES ═══

  async getThemes(tenantId: string, storeId: string) {
    return this.p.ecommerceStoreTheme.findMany({ where: { tenantId, storeId } });
  }

  async createTheme(tenantId: string, storeId: string, dto: any) {
    if (dto.isActive) { await this.p.ecommerceStoreTheme.updateMany({ where: { tenantId, storeId }, data: { isActive: false } }); }
    return this.p.ecommerceStoreTheme.create({ data: { tenantId, storeId, ...dto, config: dto.config || {} } });
  }

  async activateTheme(tenantId: string, storeId: string, id: string) {
    const theme = await this.p.ecommerceStoreTheme.findFirst({ where: { id, tenantId, storeId } });
    if (!theme) throw new NotFoundException('Theme not found');
    await this.p.ecommerceStoreTheme.updateMany({ where: { tenantId, storeId }, data: { isActive: false } });
    return this.p.ecommerceStoreTheme.update({ where: { id }, data: { isActive: true } });
  }

  // ═══ REVIEWS ═══

  async getReviews(tenantId: string, listingId: string, query: { page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId, listingId, isApproved: true };
    const [data, total] = await Promise.all([
      this.p.ecommerceReview.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { media: true } }),
      this.p.ecommerceReview.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async createReview(tenantId: string, dto: any, customerId?: string, customerName?: string) {
    return this.p.$transaction(async (tx: any) => {
      const review = await tx.ecommerceReview.create({
        data: { tenantId, listingId: dto.listingId, orderId: dto.orderId || null, customerId: customerId || null, customerName: customerName || null, rating: dto.rating, title: dto.title || null, comment: dto.comment || null, isVerified: !!dto.orderId },
      });
      if (dto.media && dto.media.length > 0) {
        await tx.ecommerceReviewMedia.createMany({
          data: dto.media.map((m: any) => ({ tenantId, reviewId: review.id, url: m.url, type: m.type || 'IMAGE' })),
        });
      }
      return tx.ecommerceReview.findFirst({ where: { id: review.id }, include: { media: true } });
    });
  }

  async moderateReview(tenantId: string, id: string, approved: boolean) {
    const review = await this.p.ecommerceReview.findFirst({ where: { id, tenantId } });
    if (!review) throw new NotFoundException('Review not found');
    return this.p.ecommerceReview.update({ where: { id }, data: { isApproved: approved } });
  }

  // ═══ ORDERS ═══

  async getOrders(tenantId: string, storeId: string, query: { status?: string; search?: string; page?: number; limit?: number }) {
    const { skip, take } = buildPaginationValues(query);
    const where: any = { tenantId, storeId };
    if (query.status) where.status = query.status;
    if (query.search) { where.OR = [{ orderNumber: { contains: query.search, mode: 'insensitive' } }, { customerName: { contains: query.search, mode: 'insensitive' } }, { customerEmail: { contains: query.search, mode: 'insensitive' } }]; }
    const [data, total] = await Promise.all([
      this.p.ecommerceOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take, include: { items: true, payments: true, shipments: true } }),
      this.p.ecommerceOrder.count({ where }),
    ]);
    return paginatedResult(data, total, { page: query.page || 1, limit: query.limit || 25 });
  }

  async getOrderById(tenantId: string, id: string) {
    const order = await this.p.ecommerceOrder.findFirst({
      where: { id, tenantId },
      include: { items: true, payments: true, shipments: true, returns: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(tenantId: string, id: string, status: string) {
    const order = await this.p.ecommerceOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    const updateData: any = { status };
    if (status === 'CANCELLED') { updateData.cancelledAt = new Date(); }
    if (status === 'DELIVERED') { updateData.deliveredAt = new Date(); }
    return this.p.ecommerceOrder.update({ where: { id }, data: updateData });
  }
}
