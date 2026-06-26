import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { StorefrontService } from './storefront.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('storefront')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get('apps')
  async listApps(@Query() query: { category?: string; search?: string; pricing?: string; sortBy?: string; page?: string; limit?: string }) {
    return this.storefront.getStorefrontListings({
      category: query.category, search: query.search, pricing: query.pricing,
      sortBy: (query.sortBy as any) || 'POPULAR',
      page: Number(query.page) || 1, limit: Number(query.limit) || 20,
    });
  }

  @Get('apps/:slug')
  async getApp(@Param('slug') slug: string) {
    return this.storefront.getAppDetail(slug);
  }

  @Get('categories')
  async getCategories() {
    return this.storefront.getCategories();
  }

  @Get('featured')
  async getFeatured() {
    return this.storefront.getFeaturedApps();
  }

  @Get('vendor/:slug')
  async getVendorApps(@Param('slug') slug: string) {
    return this.storefront.getAppsByVendor(slug);
  }

  @Post('apps/:slug/review')
  async submitReview(@Req() req: AuthReq, @Param('slug') slug: string, @Body() body: { rating: number; title: string; body: string }) {
    return this.storefront.submitReview(req.user.tenantId, req.user.userId, slug, body);
  }

  @Get('developer/:vendorId')
  async getDeveloperDashboard(@Param('vendorId') vendorId: string) {
    return this.storefront.getDeveloperDashboard(vendorId);
  }
}
