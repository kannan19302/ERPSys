import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { StorefrontService } from './storefront.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('storefront')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @ApiOperation({ summary: 'List apps' })
  @Permissions('marketplace.read')
  @Get('apps')
  async listApps(@Query() query: { category?: string; search?: string; pricing?: string; sortBy?: string; page?: string; limit?: string }) {
    return this.storefront.getStorefrontListings({
      category: query.category, search: query.search, pricing: query.pricing,
      sortBy: (query.sortBy as any) || 'POPULAR',
      page: Number(query.page) || 1, limit: Number(query.limit) || 20 });
  }

  @ApiOperation({ summary: 'Get app' })
  @Permissions('marketplace.read')
  @Get('apps/:slug')
  async getApp(@Param('slug') slug: string) {
    return this.storefront.getAppDetail(slug);
  }

  @ApiOperation({ summary: 'Get categories' })
  @Permissions('marketplace.read')
  @Get('categories')
  async getCategories() {
    return this.storefront.getCategories();
  }

  @ApiOperation({ summary: 'Get featured' })
  @Permissions('marketplace.read')
  @Get('featured')
  async getFeatured() {
    return this.storefront.getFeaturedApps();
  }

  @ApiOperation({ summary: 'Get vendor apps' })
  @Permissions('marketplace.read')
  @Get('vendor/:slug')
  async getVendorApps(@Param('slug') slug: string) {
    return this.storefront.getAppsByVendor(slug);
  }

  @ApiOperation({ summary: 'Submit review' })
  @Permissions('marketplace.create')
  @Post('apps/:slug/review')
  async submitReview(@Req() req: AuthReq, @Param('slug') slug: string, @ZodBody(z.any()) body: { rating: number; title: string; body: string }) {
    return this.storefront.submitReview(req.user.tenantId, req.user.userId, slug, body);
  }

  @ApiOperation({ summary: 'Get developer dashboard' })
  @Permissions('marketplace.read')
  @Get('developer/:vendorId')
  async getDeveloperDashboard(@Param('vendorId') vendorId: string) {
    return this.storefront.getDeveloperDashboard(vendorId);
  }
}
