import { Controller, Get, Post, Put, Delete, Query, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { MarketplaceService } from './marketplace.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; name?: string };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/marketplace')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ─── App Browsing ───

  @ApiOperation({ summary: 'Get apps' })
  @Permissions('admin.read')
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
      limit: limit ? parseInt(limit) : undefined });
  }

  @ApiOperation({ summary: 'Get app' })
  @Permissions('admin.read')
  @Get('apps/:slug')
  @Permissions('admin.platform.read')
  async getApp(@Param('slug') slug: string) {
    return this.marketplaceService.getAppBySlug(slug);
  }

  @ApiOperation({ summary: 'Get related apps' })
  @Permissions('admin.read')
  @Get('apps/:slug/related')
  @Permissions('admin.platform.read')
  async getRelatedApps(@Param('slug') slug: string) {
    return this.marketplaceService.getRelatedApps(slug);
  }

  @ApiOperation({ summary: 'Get stats' })
  @Permissions('admin.read')
  @Get('stats')
  @Permissions('admin.platform.read')
  async getStats() {
    return this.marketplaceService.getStats();
  }

  // ─── Install / Uninstall ───

  @ApiOperation({ summary: 'Get installed apps' })
  @Permissions('admin.read')
  @Get('installed')
  @Permissions('admin.platform.read')
  async getInstalledApps(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getInstalledApps(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Install app' })
  @Permissions('admin.create')
  @Post('install/:slug')
  @Permissions('admin.platform.update')
  async installApp(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.installApp(req.user.tenantId, slug, req.user.userId);
  }

  @ApiOperation({ summary: 'Uninstall app' })
  @Permissions('admin.delete')
  @Delete('uninstall/:slug')
  @Permissions('admin.platform.update')
  async uninstallApp(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.uninstallApp(req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Get app config' })
  @Permissions('admin.read')
  @Get('installed/:slug/config')
  @Permissions('admin.platform.read')
  async getAppConfig(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.getAppConfig(req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Update app config' })
  @Permissions('admin.update')
  @Put('installed/:slug/config')
  @Permissions('admin.platform.update')
  async updateAppConfig(@Req() req: AuthenticatedRequest, @Param('slug') slug: string, @ZodBody(z.any()) body: { config: Record<string, any> }) {
    return this.marketplaceService.updateAppConfig(req.user.tenantId, slug, body.config);
  }

  // ─── Industry-app shell: modules + in-app admin console ───

  @ApiOperation({ summary: 'Get installed app modules' })
  @Permissions('admin.read')
  @Get('installed/:slug/modules')
  @Permissions('admin.platform.read')
  async getInstalledAppModules(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.getInstalledAppModules(req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Get installed app metrics' })
  @Permissions('admin.read')
  @Get('installed/:slug/metrics')
  @Permissions('admin.platform.read')
  async getInstalledAppMetrics(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.getInstalledAppMetrics(req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Set module enabled' })
  @Permissions('admin.update')
  @Put('installed/:slug/modules/:moduleSlug')
  @Permissions('admin.platform.update')
  async setModuleEnabled(@Req() req: AuthenticatedRequest, @Param('slug') slug: string, @Param('moduleSlug') moduleSlug: string, @ZodBody(z.any()) body: { enabled: boolean }) {
    return this.marketplaceService.setModuleEnabled(req.user.tenantId, slug, moduleSlug, body.enabled);
  }

  // ─── Reviews ───

  @ApiOperation({ summary: 'Get reviews' })
  @Permissions('admin.read')
  @Get('apps/:slug/reviews')
  @Permissions('admin.platform.read')
  async getReviews(@Param('slug') slug: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.marketplaceService.getReviews(slug, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
  }

  @ApiOperation({ summary: 'Create review' })
  @Permissions('admin.create')
  @Post('apps/:slug/reviews')
  @Permissions('admin.platform.update')
  async createReview(@Req() req: AuthenticatedRequest, @Param('slug') slug: string, @ZodBody(z.any()) body: { rating: number; title?: string; body?: string }) {
    return this.marketplaceService.createReview(slug, req.user.userId, req.user.name || req.user.email, req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update review' })
  @Permissions('admin.update')
  @Put('reviews/:id')
  @Permissions('admin.platform.update')
  async updateReview(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { rating?: number; title?: string; body?: string }) {
    return this.marketplaceService.updateReview(id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete review' })
  @Permissions('admin.delete')
  @Delete('reviews/:id')
  @Permissions('admin.platform.update')
  async deleteReview(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.deleteReview(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Mark review helpful' })
  @Permissions('admin.create')
  @Post('reviews/:id/helpful')
  @Permissions('admin.platform.read')
  async markReviewHelpful(@Param('id') id: string) {
    return this.marketplaceService.markReviewHelpful(id);
  }

  // ─── Changelogs ───

  @ApiOperation({ summary: 'Get changelogs' })
  @Permissions('admin.read')
  @Get('apps/:slug/changelog')
  @Permissions('admin.platform.read')
  async getChangelogs(@Param('slug') slug: string) {
    return this.marketplaceService.getChangelogs(slug);
  }

  // ─── Collections ───

  @ApiOperation({ summary: 'Get collections' })
  @Permissions('admin.read')
  @Get('collections')
  @Permissions('admin.platform.read')
  async getCollections() {
    return this.marketplaceService.getCollections();
  }

  @ApiOperation({ summary: 'Get collection' })
  @Permissions('admin.read')
  @Get('collections/:slug')
  @Permissions('admin.platform.read')
  async getCollection(@Param('slug') slug: string) {
    return this.marketplaceService.getCollectionBySlug(slug);
  }

  @ApiOperation({ summary: 'Create collection' })
  @Permissions('admin.create')
  @Post('collections')
  @Permissions('admin.platform.update')
  async createCollection(@ZodBody(z.any()) body: { name: string; slug: string; description?: string; icon?: string; coverImage?: string; featured?: boolean }) {
    return this.marketplaceService.createCollection(body);
  }

  @ApiOperation({ summary: 'Update collection' })
  @Permissions('admin.update')
  @Put('collections/:id')
  @Permissions('admin.platform.update')
  async updateCollection(@Param('id') id: string, @ZodBody(z.any()) body: { name?: string; description?: string; icon?: string; coverImage?: string; featured?: boolean; sortOrder?: number }) {
    return this.marketplaceService.updateCollection(id, body);
  }

  @ApiOperation({ summary: 'Delete collection' })
  @Permissions('admin.delete')
  @Delete('collections/:id')
  @Permissions('admin.platform.update')
  async deleteCollection(@Param('id') id: string) {
    return this.marketplaceService.deleteCollection(id);
  }

  @ApiOperation({ summary: 'Add app to collection' })
  @Permissions('admin.create')
  @Post('collections/:id/apps')
  @Permissions('admin.platform.update')
  async addAppToCollection(@Param('id') id: string, @ZodBody(z.any()) body: { appId: string; sortOrder?: number }) {
    return this.marketplaceService.addAppToCollection(id, body.appId, body.sortOrder);
  }

  @ApiOperation({ summary: 'Remove app from collection' })
  @Permissions('admin.delete')
  @Delete('collections/:collectionId/apps/:appId')
  @Permissions('admin.platform.update')
  async removeAppFromCollection(@Param('collectionId') collectionId: string, @Param('appId') appId: string) {
    return this.marketplaceService.removeAppFromCollection(collectionId, appId);
  }

  // ─── Favorites ───

  @ApiOperation({ summary: 'Get favorites' })
  @Permissions('admin.read')
  @Get('favorites')
  @Permissions('admin.platform.read')
  async getFavorites(@Req() req: AuthenticatedRequest) {
    return this.marketplaceService.getFavorites(req.user.userId);
  }

  @ApiOperation({ summary: 'Add favorite' })
  @Permissions('admin.create')
  @Post('favorites/:slug')
  @Permissions('admin.platform.read')
  async addFavorite(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.addFavorite(req.user.userId, req.user.tenantId, slug);
  }

  @ApiOperation({ summary: 'Remove favorite' })
  @Permissions('admin.delete')
  @Delete('favorites/:slug')
  @Permissions('admin.platform.read')
  async removeFavorite(@Req() req: AuthenticatedRequest, @Param('slug') slug: string) {
    return this.marketplaceService.removeFavorite(req.user.userId, slug);
  }

  // ─── Submissions ───

  @ApiOperation({ summary: 'Get submissions' })
  @Permissions('admin.read')
  @Get('submissions')
  @Permissions('admin.platform.read')
  async getSubmissions(@Query('status') status?: string) {
    return this.marketplaceService.getSubmissions(status);
  }

  @ApiOperation({ summary: 'Create submission' })
  @Permissions('admin.create')
  @Post('submissions')
  @Permissions('admin.platform.update')
  async createSubmission(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: {
    name: string; slug: string; description: string; longDescription?: string;
    category: string; icon?: string; version?: string; pricing?: string;
    price?: number; features?: any[]; screenshots?: any[]; tags?: string[];
    supportUrl?: string;
  }) {
    return this.marketplaceService.createSubmission(req.user.tenantId, req.user.userId, req.user.name || req.user.email, body);
  }

  @ApiOperation({ summary: 'Approve submission' })
  @Permissions('admin.update')
  @Put('submissions/:id/approve')
  @Permissions('admin.platform.update')
  async approveSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.marketplaceService.approveSubmission(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Reject submission' })
  @Permissions('admin.update')
  @Put('submissions/:id/reject')
  @Permissions('admin.platform.update')
  async rejectSubmission(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) body: { reviewNotes: string }) {
    return this.marketplaceService.rejectSubmission(id, req.user.userId, body.reviewNotes);
  }

  // ─── Seed ───

  @ApiOperation({ summary: 'Seed apps' })
  @Permissions('admin.create')
  @Post('seed')
  @Permissions('admin.platform.update')
  async seedApps() {
    return this.marketplaceService.seedDefaultApps();
  }
}
