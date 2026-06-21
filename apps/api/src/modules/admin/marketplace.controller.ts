import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { MarketplaceService } from './marketplace.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; name?: string };
}

@Controller('admin/marketplace')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ─── App Browsing ───

  @Get('apps')
  @Permissions('admin.platform.read')
  async getApps(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('pricing') pricing?: string,
    @Query('featured') featured?: string,
    @Query('sort') sort?: 'popular' | 'rating' | 'newest' | 'price_asc' | 'price_desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getApps({
      category,
      search,
      pricing,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      sort,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('apps/:slug')
  @Permissions('admin.platform.read')
  async getApp(@Param('slug') slug: string) {
    return this.marketplaceService.getAppBySlug(slug);
  }

  @Get('apps/:slug/related')
  @Permissions('admin.platform.read')
  async getRelatedApps(@Param('slug') slug: string) {
    return this.marketplaceService.getRelatedApps(slug);
  }

  @Get('stats')
  @Permissions('admin.platform.read')
  async getStats() {
    return this.marketplaceService.getStats();
  }

  // ─── Install / Uninstall ───

  @Get('installed')
  @Permissions('admin.platform.read')
  async getInstalledApps(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getInstalledApps(req.user.tenantId);
  }

  @Post('install/:slug')
  @Permissions('admin.platform.update')
  async installApp(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.installApp(req.user.tenantId, slug, req.user.userId);
  }

  @Delete('uninstall/:slug')
  @Permissions('admin.platform.update')
  async uninstallApp(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.uninstallApp(req.user.tenantId, slug);
  }

  @Get('installed/:slug/config')
  @Permissions('admin.platform.read')
  async getAppConfig(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.getAppConfig(req.user.tenantId, slug);
  }

  @Put('installed/:slug/config')
  @Permissions('admin.platform.update')
  async updateAppConfig(@Req() req: AuthenticatedRequest, @Param('slug') slug: string, @Body() body: { config: Record<string, any> }) {
    return this.marketplaceService.updateAppConfig(req.user.tenantId, slug, body.config);
  }

  // ─── Reviews ───

  @Get('apps/:slug/reviews')
  @Permissions('admin.platform.read')
  async getReviews(@Param('slug') slug: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.getReviews(slug, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
  }

  @Post('apps/:slug/reviews')
  @Permissions('admin.platform.update')
  async createReview(@Req() req: AuthenticatedRequest, @Param('slug') slug: string, @Body() body: { rating: number; title?: string; body?: string }) {
    return this.marketplaceService.createReview(slug, req.user.userId, req.user.name || req.user.email, req.user.tenantId, body);
  }

  @Put('reviews/:id')
  @Permissions('admin.platform.update')
  async updateReview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { rating?: number; title?: string; body?: string }) {
    return this.marketplaceService.updateReview(id, req.user.userId, body);
  }

  @Delete('reviews/:id')
  @Permissions('admin.platform.update')
  async deleteReview(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.deleteReview(id, req.user.userId);
  }

  @Post('reviews/:id/helpful')
  @Permissions('admin.platform.read')
  async markReviewHelpful(@Param('id') id: string) {
    return this.marketplaceService.markReviewHelpful(id);
  }

  // ─── Changelogs ───

  @Get('apps/:slug/changelog')
  @Permissions('admin.platform.read')
  async getChangelogs(@Param('slug') slug: string) {
    return this.marketplaceService.getChangelogs(slug);
  }

  // ─── Collections ───

  @Get('collections')
  @Permissions('admin.platform.read')
  async getCollections() {
    return this.marketplaceService.getCollections();
  }

  @Get('collections/:slug')
  @Permissions('admin.platform.read')
  async getCollection(@Param('slug') slug: string) {
    return this.marketplaceService.getCollectionBySlug(slug);
  }

  @Post('collections')
  @Permissions('admin.platform.update')
  async createCollection(@Body() body: { name: string; slug: string; description?: string; icon?: string; coverImage?: string; featured?: boolean }) {
    return this.marketplaceService.createCollection(body);
  }

  @Put('collections/:id')
  @Permissions('admin.platform.update')
  async updateCollection(@Param('id') id: string, @Body() body: { name?: string; description?: string; icon?: string; coverImage?: string; featured?: boolean; sortOrder?: number }) {
    return this.marketplaceService.updateCollection(id, body);
  }

  @Delete('collections/:id')
  @Permissions('admin.platform.update')
  async deleteCollection(@Param('id') id: string) {
    return this.marketplaceService.deleteCollection(id);
  }

  @Post('collections/:id/apps')
  @Permissions('admin.platform.update')
  async addAppToCollection(@Param('id') id: string, @Body() body: { appId: string; sortOrder?: number }) {
    return this.marketplaceService.addAppToCollection(id, body.appId, body.sortOrder);
  }

  @Delete('collections/:collectionId/apps/:appId')
  @Permissions('admin.platform.update')
  async removeAppFromCollection(@Param('collectionId') collectionId: string, @Param('appId') appId: string) {
    return this.marketplaceService.removeAppFromCollection(collectionId, appId);
  }

  // ─── Favorites ───

  @Get('favorites')
  @Permissions('admin.platform.read')
  async getFavorites(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getFavorites(req.user.userId);
  }

  @Post('favorites/:slug')
  @Permissions('admin.platform.read')
  async addFavorite(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.addFavorite(req.user.userId, req.user.tenantId, slug);
  }

  @Delete('favorites/:slug')
  @Permissions('admin.platform.read')
  async removeFavorite(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.removeFavorite(req.user.userId, slug);
  }

  // ─── Submissions ───

  @Get('submissions')
  @Permissions('admin.platform.read')
  async getSubmissions(@Query('status') status?: string) {
    return this.marketplaceService.getSubmissions(status);
  }

  @Post('submissions')
  @Permissions('admin.platform.update')
  async createSubmission(@Req() req: AuthenticatedRequest, @Body() body: {
    name: string; slug: string; description: string; longDescription?: string;
    category: string; icon?: string; version?: string; pricing?: string;
    price?: number; features?: any[]; screenshots?: any[]; tags?: string[];
    supportUrl?: string;
  }) {
    return this.marketplaceService.createSubmission(req.user.tenantId, req.user.userId, req.user.name || req.user.email, body);
  }

  @Put('submissions/:id/approve')
  @Permissions('admin.platform.update')
  async approveSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.approveSubmission(id, req.user.userId);
  }

  @Put('submissions/:id/reject')
  @Permissions('admin.platform.update')
  async rejectSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { reviewNotes: string }) {
    return this.marketplaceService.rejectSubmission(id, req.user.userId, body.reviewNotes);
  }

  // ─── Seed ───

  @Post('seed')
  @Permissions('admin.platform.update')
  async seedApps() {
    return this.marketplaceService.seedDefaultApps();
  }
}
