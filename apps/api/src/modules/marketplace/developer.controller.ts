import { Controller, Get, Post, Put, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { VendorService } from './vendor.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; name?: string };
}

/**
 * Developer portal API for third-party vendors to publish apps, plus admin review
 * endpoints. Mounted under /api/v1/developer.
 */
@ApiTags('marketplace')
@ApiBearerAuth()
@Controller('developer')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DeveloperController {
  constructor(private readonly vendors: VendorService) {}

  // ─── Vendor (developer account) ───

  @ApiOperation({ summary: 'My vendor' })
  @Permissions('marketplace.read')
  @Get('me')
  @Permissions('admin.platform.read')
  async myVendor(@Req() req: AuthenticatedRequest) {
    return this.vendors.getOrCreateMyVendor(req.user.userId, req.user.tenantId, { name: req.user.name, contactEmail: req.user.email });
  }

  @ApiOperation({ summary: 'Update my vendor' })
  @Permissions('marketplace.update')
  @Put('me')
  @Permissions('admin.platform.update')
  async updateMyVendor(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { name?: string; contactEmail?: string; websiteUrl?: string; description?: string }) {
    const vendor = await this.vendors.getOrCreateMyVendor(req.user.userId, req.user.tenantId, { name: req.user.name, contactEmail: req.user.email });
    return this.vendors.updateVendor(vendor.id, body);
  }

  // ─── My apps (packages) ───

  @ApiOperation({ summary: 'My apps' })
  @Permissions('marketplace.read')
  @Get('apps')
  @Permissions('admin.platform.read')
  async myApps(@Req() req: AuthenticatedRequest) {
    const vendor = await this.vendors.getOrCreateMyVendor(req.user.userId, req.user.tenantId, { name: req.user.name, contactEmail: req.user.email });
    return this.vendors.listPackages(vendor.id);
  }

  @ApiOperation({ summary: 'Create app' })
  @Permissions('marketplace.create')
  @Post('apps')
  @Permissions('admin.platform.update')
  async createApp(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { name: string; description?: string; longDescription?: string; category: string; icon?: string; pricing?: string; price?: number; tags?: string[]; screenshots?: any[] }) {
    const vendor = await this.vendors.getOrCreateMyVendor(req.user.userId, req.user.tenantId, { name: req.user.name, contactEmail: req.user.email });
    return this.vendors.createPackage(vendor.id, body);
  }

  // ─── Bundles (versions) ───

  @ApiOperation({ summary: 'Create bundle' })
  @Permissions('marketplace.create')
  @Post('apps/:packageId/bundles')
  @Permissions('admin.platform.update')
  async createBundle(@Param('packageId') packageId: string, @ZodBody(z.any()) body: { manifest: any; channel?: string; changelog?: string }) {
    return this.vendors.createBundle(packageId, body.manifest, { channel: body.channel, changelog: body.changelog });
  }

  @ApiOperation({ summary: 'Submit' })
  @Permissions('marketplace.update')
  @Put('bundles/:bundleId/submit')
  @Permissions('admin.platform.update')
  async submit(@Param('bundleId') bundleId: string) {
    return this.vendors.submitForReview(bundleId);
  }

  // ─── Admin review queue ───

  @ApiOperation({ summary: 'Pending' })
  @Permissions('marketplace.read')
  @Get('review/pending')
  @Permissions('admin.platform.update')
  async pending() {
    return this.vendors.listPendingBundles();
  }

  @ApiOperation({ summary: 'Approve' })
  @Permissions('marketplace.update')
  @Put('review/:bundleId/approve')
  @Permissions('admin.platform.update')
  async approve(@Req() req: AuthenticatedRequest, @Param('bundleId') bundleId: string) {
    return this.vendors.approveBundle(bundleId, req.user.userId);
  }

  @ApiOperation({ summary: 'Reject' })
  @Permissions('marketplace.update')
  @Put('review/:bundleId/reject')
  @Permissions('admin.platform.update')
  async reject(@Req() req: AuthenticatedRequest, @Param('bundleId') bundleId: string, @ZodBody(z.any()) body: { reviewNotes: string }) {
    return this.vendors.rejectBundle(bundleId, req.user.userId, body.reviewNotes);
  }

  @ApiOperation({ summary: 'Rollback' })
  @Permissions('marketplace.update')
  @Put('apps/:packageId/rollback')
  @Permissions('admin.platform.update')
  async rollback(@Req() req: AuthenticatedRequest, @Param('packageId') packageId: string, @ZodBody(z.any()) body: { bundleId: string }) {
    return this.vendors.rollbackPackage(packageId, body.bundleId, req.user.userId);
  }
}
