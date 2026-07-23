import { Controller, Get, Post, Put, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { EcommerceExpansionService } from './ecommerce-expansion.service';
import {
  CreateEcommerceStoreSchema, UpdateEcommerceStoreSchema, CreateEcommerceCategorySchema, UpdateEcommerceCategorySchema,
  CreateEcommerceProductListingSchema, UpdateEcommerceProductListingSchema, CreateEcommerceCouponSchema,
  CreateEcommerceShippingZoneSchema, CreateEcommerceShippingRateSchema, CreateEcommerceTaxClassSchema,
  CreateEcommerceTaxRateSchema, CreateEcommerceStoreSettingSchema, CreateEcommerceStoreThemeSchema, CreateEcommerceReviewSchema,
} from './dto/ecommerce-expansion.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('ecommerce-admin')
@ApiBearerAuth()
@Controller('ecommerce')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EcommerceExpansionController {
  constructor(private readonly expansionService: EcommerceExpansionService) {}

  // ═══ STORES ═══

  @Get('exp/stores')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'List stores' })
  async getStores(@Req() req: AuthenticatedRequest) {
    return this.expansionService.getStores(req.user.tenantId);
  }

  @Get('exp/stores/:id')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'Get store' })
  async getStoreById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.getStoreById(req.user.tenantId, id);
  }

  @Post('exp/stores')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create store' })
  async createStore(@Req() req: AuthenticatedRequest, @ZodBody(CreateEcommerceStoreSchema) dto: any) {
    return this.expansionService.createStore(req.user.tenantId, dto);
  }

  @Put('exp/stores/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Update store' })
  async updateStore(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(UpdateEcommerceStoreSchema) dto: any) {
    return this.expansionService.updateStore(req.user.tenantId, id, dto);
  }

  @Delete('exp/stores/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Deactivate store' })
  async deleteStore(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.deleteStore(req.user.tenantId, id);
  }

  // ═══ CATEGORIES ═══

  @Get('exp/:storeId/categories')
  @Permissions('ecommerce.category.read')
  @ApiOperation({ summary: 'List categories' })
  async getCategories(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getCategories(req.user.tenantId, storeId);
  }

  @Get('exp/:storeId/categories/:id')
  @Permissions('ecommerce.category.read')
  @ApiOperation({ summary: 'Get category' })
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string) {
    return this.expansionService.getCategoryById(req.user.tenantId, id);
  }

  @Post('exp/:storeId/categories')
  @Permissions('ecommerce.category.create')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceCategorySchema) dto: any) {
    return this.expansionService.createCategory(req.user.tenantId, storeId, dto);
  }

  @Put('exp/:storeId/categories/:id')
  @Permissions('ecommerce.category.update')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string, @ZodBody(UpdateEcommerceCategorySchema) dto: any) {
    return this.expansionService.updateCategory(req.user.tenantId, id, dto);
  }

  @Delete('exp/:storeId/categories/:id')
  @Permissions('ecommerce.category.delete')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string) {
    return this.expansionService.deleteCategory(req.user.tenantId, id);
  }

  // ═══ PRODUCT LISTINGS ═══

  @Get('exp/:storeId/listings')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'List product listings' })
  async getListings(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Query() query: any) {
    return this.expansionService.getListings(req.user.tenantId, storeId, query);
  }

  @Get('exp/:storeId/listings/:id')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'Get listing' })
  async getListingById(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string) {
    return this.expansionService.getListingById(req.user.tenantId, id);
  }

  @Post('exp/:storeId/listings')
  @Permissions('ecommerce.listing.create')
  @ApiOperation({ summary: 'Create product listing' })
  async createListing(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceProductListingSchema) dto: any) {
    return this.expansionService.createListing(req.user.tenantId, storeId, dto);
  }

  @Put('exp/:storeId/listings/:id')
  @Permissions('ecommerce.listing.update')
  @ApiOperation({ summary: 'Update listing' })
  async updateListing(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string, @ZodBody(UpdateEcommerceProductListingSchema) dto: any) {
    return this.expansionService.updateListing(req.user.tenantId, id, dto);
  }

  @Delete('exp/:storeId/listings/:id')
  @Permissions('ecommerce.listing.delete')
  @ApiOperation({ summary: 'Delete listing' })
  async deleteListing(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string) {
    return this.expansionService.deleteListing(req.user.tenantId, id);
  }

  // ═══ VARIANTS & INVENTORY ═══

  @Post('exp/listings/:listingId/variants')
  @Permissions('ecommerce.listing.update')
  @ApiOperation({ summary: 'Create variant' })
  async createVariant(@Req() req: AuthenticatedRequest, @Param('listingId') listingId: string, @ZodBody(z.object({ sku: z.string(), title: z.string(), attributes: z.record(z.any()).optional(), price: z.number(), compareAtPrice: z.number().optional(), costPrice: z.number().optional(), weight: z.number().optional(), quantity: z.number().int().default(0) })) dto: any) {
    return this.expansionService.createVariant(req.user.tenantId, listingId, dto);
  }

  @Put('exp/variants/:id')
  @Permissions('ecommerce.listing.update')
  @ApiOperation({ summary: 'Update variant' })
  async updateVariant(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ sku: z.string().optional(), title: z.string().optional(), price: z.number().optional(), compareAtPrice: z.number().optional(), isActive: z.boolean().optional() })) dto: any) {
    return this.expansionService.updateVariant(req.user.tenantId, id, dto);
  }

  @Put('exp/variants/:variantId/inventory')
  @Permissions('ecommerce.listing.update')
  @ApiOperation({ summary: 'Update inventory quantity' })
  async updateInventory(@Req() req: AuthenticatedRequest, @Param('variantId') variantId: string, @ZodBody(z.object({ quantity: z.number().int() })) dto: any) {
    return this.expansionService.updateInventory(req.user.tenantId, variantId, dto.quantity);
  }

  // ═══ COUPONS ═══

  @Get('exp/:storeId/coupons')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'List coupons' })
  async getCoupons(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getCoupons(req.user.tenantId, storeId);
  }

  @Post('exp/:storeId/coupons')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'Create coupon' })
  async createCoupon(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceCouponSchema) dto: any) {
    return this.expansionService.createCoupon(req.user.tenantId, storeId, dto);
  }

  @Put('exp/coupons/:id')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'Update coupon' })
  async updateCoupon(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateEcommerceCouponSchema.partial()) dto: any) {
    return this.expansionService.updateCoupon(req.user.tenantId, id, dto);
  }

  @Delete('exp/coupons/:id')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'Delete coupon' })
  async deleteCoupon(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.deleteCoupon(req.user.tenantId, id);
  }

  // ═══ SHIPPING ZONES ═══

  @Get('exp/:storeId/shipping-zones')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'List shipping zones' })
  async getShippingZones(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getShippingZones(req.user.tenantId, storeId);
  }

  @Post('exp/:storeId/shipping-zones')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create shipping zone' })
  async createShippingZone(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceShippingZoneSchema) dto: any) {
    return this.expansionService.createShippingZone(req.user.tenantId, storeId, dto);
  }

  @Put('exp/shipping-zones/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Update shipping zone' })
  async updateShippingZone(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateEcommerceShippingZoneSchema.partial()) dto: any) {
    return this.expansionService.updateShippingZone(req.user.tenantId, id, dto);
  }

  @Delete('exp/shipping-zones/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Delete shipping zone' })
  async deleteShippingZone(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.deleteShippingZone(req.user.tenantId, id);
  }

  @Post('exp/shipping-rates')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create shipping rate' })
  async createShippingRate(@Req() req: AuthenticatedRequest, @ZodBody(CreateEcommerceShippingRateSchema) dto: any) {
    return this.expansionService.createShippingRate(req.user.tenantId, dto);
  }

  @Put('exp/shipping-rates/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Update shipping rate' })
  async updateShippingRate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateEcommerceShippingRateSchema.partial()) dto: any) {
    return this.expansionService.updateShippingRate(req.user.tenantId, id, dto);
  }

  @Delete('exp/shipping-rates/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Delete shipping rate' })
  async deleteShippingRate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.deleteShippingRate(req.user.tenantId, id);
  }

  // ═══ TAX ═══

  @Get('exp/:storeId/tax-classes')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'List tax classes' })
  async getTaxClasses(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getTaxClasses(req.user.tenantId, storeId);
  }

  @Post('exp/:storeId/tax-classes')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create tax class' })
  async createTaxClass(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceTaxClassSchema) dto: any) {
    return this.expansionService.createTaxClass(req.user.tenantId, storeId, dto);
  }

  @Post('exp/tax-rates')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create tax rate' })
  async createTaxRate(@Req() req: AuthenticatedRequest, @ZodBody(CreateEcommerceTaxRateSchema) dto: any) {
    return this.expansionService.createTaxRate(req.user.tenantId, dto);
  }

  @Put('exp/tax-rates/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Update tax rate' })
  async updateTaxRate(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(CreateEcommerceTaxRateSchema.partial()) dto: any) {
    return this.expansionService.updateTaxRate(req.user.tenantId, id, dto);
  }

  @Delete('exp/tax-rates/:id')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Delete tax rate' })
  async deleteTaxRate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.deleteTaxRate(req.user.tenantId, id);
  }

  // ═══ STORE SETTINGS ═══

  @Get('exp/:storeId/settings')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'List store settings' })
  async getStoreSettings(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getStoreSettings(req.user.tenantId, storeId);
  }

  @Put('exp/:storeId/settings')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Upsert store setting' })
  async upsertStoreSetting(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceStoreSettingSchema) dto: any) {
    return this.expansionService.upsertStoreSetting(req.user.tenantId, storeId, dto);
  }

  @Delete('exp/:storeId/settings/:key')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Delete store setting' })
  async deleteStoreSetting(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('key') key: string) {
    return this.expansionService.deleteStoreSetting(req.user.tenantId, storeId, key);
  }

  // ═══ THEMES ═══

  @Get('exp/:storeId/themes')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'List store themes' })
  async getThemes(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string) {
    return this.expansionService.getThemes(req.user.tenantId, storeId);
  }

  @Post('exp/:storeId/themes')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Create store theme' })
  async createTheme(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @ZodBody(CreateEcommerceStoreThemeSchema) dto: any) {
    return this.expansionService.createTheme(req.user.tenantId, storeId, dto);
  }

  @Post('exp/:storeId/themes/:id/activate')
  @Permissions('ecommerce.storefront.manage')
  @ApiOperation({ summary: 'Activate theme' })
  async activateTheme(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Param('id') id: string) {
    return this.expansionService.activateTheme(req.user.tenantId, storeId, id);
  }

  // ═══ REVIEWS ═══

  @Get('exp/:storeId/listings/:listingId/reviews')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'List reviews for a listing' })
  async getReviews(@Req() req: AuthenticatedRequest, @Param('listingId') listingId: string, @Query() query: any) {
    return this.expansionService.getReviews(req.user.tenantId, listingId, query);
  }

  @Post('exp/reviews')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'Create a review' })
  async createReview(@Req() req: AuthenticatedRequest, @ZodBody(CreateEcommerceReviewSchema) dto: any) {
    return this.expansionService.createReview(req.user.tenantId, dto, req.user.userId, req.user.email);
  }

  @Post('exp/reviews/:id/moderate')
  @Permissions('ecommerce.listing.update')
  @ApiOperation({ summary: 'Moderate review approval' })
  async moderateReview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ approved: z.boolean() })) dto: any) {
    return this.expansionService.moderateReview(req.user.tenantId, id, dto.approved);
  }

  // ═══ ORDERS ═══

  @Get('exp/:storeId/orders')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'List store orders' })
  async getOrders(@Req() req: AuthenticatedRequest, @Param('storeId') storeId: string, @Query() query: any) {
    return this.expansionService.getOrders(req.user.tenantId, storeId, query);
  }

  @Get('exp/orders/:id')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'Get order by id' })
  async getOrderById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expansionService.getOrderById(req.user.tenantId, id);
  }

  @Patch('exp/orders/:id/status')
  @Permissions('ecommerce.order.read')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.object({ status: z.string() })) dto: any) {
    return this.expansionService.updateOrderStatus(req.user.tenantId, id, dto.status);
  }
}
