import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { PlatformService } from './platform.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/platform')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiOperation({ summary: 'Get modules' })
  @Get('modules')
  @Permissions('admin.platform.read')
  async getModules(@Req() req: AuthenticatedRequest) {
    return this.platformService.getModules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Toggle module' })
  @Post('modules/:name/toggle')
  @Permissions('admin.platform.update')
  async toggleModule(
    @Req() req: AuthenticatedRequest,
    @Param('name') name: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.platformService.toggleModule(req.user.tenantId, name, enabled);
  }

  @ApiOperation({ summary: 'Get feature flags' })
  @Get('feature-flags')
  @Permissions('admin.platform.read')
  async getFeatureFlags(@Req() req: AuthenticatedRequest) {
    return this.platformService.getFeatureFlags(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save feature flag' })
  @Post('feature-flags/:key/toggle')
  @Permissions('admin.platform.update')
  async saveFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param('key') key: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.platformService.saveFeatureFlag(req.user.tenantId, key, enabled);
  }

  @ApiOperation({ summary: 'Get custom domains' })
  @Get('domains')
  @Permissions('admin.platform.read')
  async getCustomDomains(@Req() req: AuthenticatedRequest) {
    return this.platformService.getCustomDomains(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Add custom domain' })
  @Post('domains')
  @Permissions('admin.platform.update')
  async addCustomDomain(
    @Req() req: AuthenticatedRequest,
    @Body('domain') domain: string,
  ) {
    return this.platformService.addCustomDomain(req.user.tenantId, domain);
  }

  @ApiOperation({ summary: 'Get environments' })
  @Get('environments')
  @Permissions('admin.platform.read')
  async getEnvironments(@Req() req: AuthenticatedRequest) {
    return this.platformService.getEnvironments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Sync environment' })
  @Post('environments/:type/sync')
  @Permissions('admin.platform.update')
  async syncEnvironment(
    @Req() req: AuthenticatedRequest,
    @Param('type') type: string,
  ) {
    return this.platformService.syncEnvironment(req.user.tenantId, type);
  }

  @ApiOperation({ summary: 'Get maintenance mode' })
  @Get('maintenance')
  @Permissions('admin.platform.read')
  async getMaintenanceMode(@Req() req: AuthenticatedRequest) {
    return this.platformService.getMaintenanceMode(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save maintenance mode' })
  @Post('maintenance')
  @Permissions('admin.platform.update')
  async saveMaintenanceMode(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { enabled: boolean; message: string },
  ) {
    return this.platformService.saveMaintenanceMode(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get smtp config' })
  @Get('smtp')
  @Permissions('admin.platform.read')
  async getSmtpConfig(@Req() req: AuthenticatedRequest) {
    return this.platformService.getSmtpConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save smtp config' })
  @Post('smtp')
  @Permissions('admin.platform.update')
  async saveSmtpConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: any,
  ) {
    return this.platformService.saveSmtpConfig(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get login customizer' })
  @Get('login-customizer')
  @Permissions('admin.platform.read')
  async getLoginCustomizer(@Req() req: AuthenticatedRequest) {
    return this.platformService.getLoginCustomizer(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save login customizer' })
  @Post('login-customizer')
  @Permissions('admin.platform.update')
  async saveLoginCustomizer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: any,
  ) {
    return this.platformService.saveLoginCustomizer(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get email templates' })
  @Get('email-templates')
  @Permissions('admin.platform.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.platformService.getEmailTemplates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save email template' })
  @Post('email-templates')
  @Permissions('admin.platform.update')
  async saveEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { id?: string; name: string; category: string; subject: string; body: string; isActive?: boolean },
  ) {
    return this.platformService.saveEmailTemplate(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Delete email template' })
  @Delete('email-templates/:id')
  @Permissions('admin.platform.update')
  async deleteEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.platformService.deleteEmailTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get usage analytics' })
  @Get('usage-analytics')
  @Permissions('admin.platform.read')
  async getUsageAnalytics(@Req() req: AuthenticatedRequest) {
    return this.platformService.getUsageAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get white label settings' })
  @Get('white-label')
  @Permissions('admin.platform.read')
  async getWhiteLabelSettings(@Req() req: AuthenticatedRequest) {
    return this.platformService.getWhiteLabelSettings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save white label settings' })
  @Post('white-label')
  @Permissions('admin.platform.update')
  async saveWhiteLabelSettings(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: any) {
    return this.platformService.saveWhiteLabelSettings(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get system updates' })
  @Get('updates')
  @Permissions('admin.platform.read')
  async getSystemUpdates(@Req() req: AuthenticatedRequest) {
    return this.platformService.getSystemUpdates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Check for updates' })
  @Post('check-updates')
  @Permissions('admin.platform.update')
  async checkForUpdates(@Req() req: AuthenticatedRequest) {
    return this.platformService.checkForUpdates(req.user.tenantId);
  }
}
