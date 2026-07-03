import { Controller, Get, Post, Patch, Put, Delete, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { EcommerceAdminService } from './ecommerce-admin.service';
import {
  upsertStorefrontConfigSchema,
  UpsertStorefrontConfigDto,
  createStorefrontCategorySchema,
  CreateStorefrontCategoryDto,
  updateStorefrontCategorySchema,
  UpdateStorefrontCategoryDto,
  createProductListingSchema,
  CreateProductListingDto,
  updateProductListingSchema,
  UpdateProductListingDto,
} from './dto/ecommerce.dto';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

/**
 * Admin-side controller for the E-Commerce Storefront module (module #33).
 * JWT + RBAC gated, tenant-scoped. Public/anonymous storefront routes live in
 * `ecommerce-public.controller.ts` behind `PublicTenantResolverGuard` instead
 * — see that file's header comment for the documented exception to Rule 15.
 */
@ApiTags('ecommerce-admin')
@ApiBearerAuth()
@Controller('ecommerce')
@UseGuards(JwtAuthGuard, RbacGuard)
export class EcommerceAdminController {
  constructor(private readonly adminService: EcommerceAdminService) {}

  // ─── StorefrontConfig ────────────────────────────────

  @Get('config')
  @Permissions('ecommerce.storefront.read')
  @ApiOperation({ summary: 'Get this tenant\'s storefront configuration' })
  async getConfig(@Req() req: AuthenticatedRequest) {
    return this.adminService.getConfig(req.user.tenantId);
  }

  @Put('config')
  @Permissions('ecommerce.storefront.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('StorefrontConfig')
  @ApiOperation({ summary: 'Create or update this tenant\'s storefront configuration (upsert)' })
  async upsertConfig(@Req() req: AuthenticatedRequest, @ZodBody(upsertStorefrontConfigSchema) dto: UpsertStorefrontConfigDto) {
    return this.adminService.upsertConfig(req.user.tenantId, dto);
  }

  // ─── StorefrontCategory ──────────────────────────────

  @Get('categories')
  @Permissions('ecommerce.category.read')
  @ApiOperation({ summary: 'List storefront categories' })
  async getCategories(@Req() req: AuthenticatedRequest) {
    return this.adminService.getCategories(req.user.tenantId);
  }

  @Get('categories/:id')
  @Permissions('ecommerce.category.read')
  @ApiOperation({ summary: 'Get a storefront category by id' })
  async getCategoryById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.getCategoryById(req.user.tenantId, id);
  }

  @Post('categories')
  @Permissions('ecommerce.category.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('StorefrontCategory')
  @ApiOperation({ summary: 'Create a storefront category' })
  async createCategory(@Req() req: AuthenticatedRequest, @ZodBody(createStorefrontCategorySchema) dto: CreateStorefrontCategoryDto) {
    return this.adminService.createCategory(req.user.tenantId, dto);
  }

  @Patch('categories/:id')
  @Permissions('ecommerce.category.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('StorefrontCategory', 'id')
  @ApiOperation({ summary: 'Update a storefront category' })
  async updateCategory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateStorefrontCategorySchema) dto: UpdateStorefrontCategoryDto,
  ) {
    return this.adminService.updateCategory(req.user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Permissions('ecommerce.category.delete')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('StorefrontCategory', 'id')
  @ApiOperation({ summary: 'Delete a storefront category' })
  async deleteCategory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteCategory(req.user.tenantId, id);
  }

  // ─── ProductListing ──────────────────────────────────

  @Get('listings')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'List storefront product listings (joined with Product + Category)' })
  async getListings(@Req() req: AuthenticatedRequest) {
    return this.adminService.getListings(req.user.tenantId);
  }

  @Get('listings/:id')
  @Permissions('ecommerce.listing.read')
  @ApiOperation({ summary: 'Get a storefront product listing by id' })
  async getListingById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.getListingById(req.user.tenantId, id);
  }

  @Post('listings')
  @Permissions('ecommerce.listing.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ProductListing')
  @ApiOperation({ summary: 'Publish an existing Inventory Product to the storefront' })
  async createListing(@Req() req: AuthenticatedRequest, @ZodBody(createProductListingSchema) dto: CreateProductListingDto) {
    return this.adminService.createListing(req.user.tenantId, dto);
  }

  @Patch('listings/:id')
  @Permissions('ecommerce.listing.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ProductListing', 'id')
  @ApiOperation({ summary: 'Update a storefront listing (publish toggle, price override, category, sort)' })
  async updateListing(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateProductListingSchema) dto: UpdateProductListingDto,
  ) {
    return this.adminService.updateListing(req.user.tenantId, id, dto);
  }

  @Delete('listings/:id')
  @Permissions('ecommerce.listing.delete')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ProductListing', 'id')
  @ApiOperation({ summary: 'Unpublish/remove a storefront listing' })
  async deleteListing(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.adminService.deleteListing(req.user.tenantId, id);
  }
}
