import { Controller, Get, Post, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { PlatformService } from './platform.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/platform')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('modules')
  @Permissions('admin.platform.read')
  async getModules(@Req() req: AuthenticatedRequest) {
    return this.platformService.getModules(req.user.tenantId);
  }

  @Post('modules/:name/toggle')
  @Permissions('admin.platform.update')
  async toggleModule(
    @Req() req: AuthenticatedRequest,
    @Param('name') name: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.platformService.toggleModule(req.user.tenantId, name, enabled);
  }

  @Get('feature-flags')
  @Permissions('admin.platform.read')
  async getFeatureFlags(@Req() req: AuthenticatedRequest) {
    return this.platformService.getFeatureFlags(req.user.tenantId);
  }

  @Post('feature-flags/:key/toggle')
  @Permissions('admin.platform.update')
  async saveFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param('key') key: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.platformService.saveFeatureFlag(req.user.tenantId, key, enabled);
  }

  @Get('domains')
  @Permissions('admin.platform.read')
  async getCustomDomains(@Req() req: AuthenticatedRequest) {
    return this.platformService.getCustomDomains(req.user.tenantId);
  }

  @Post('domains')
  @Permissions('admin.platform.update')
  async addCustomDomain(
    @Req() req: AuthenticatedRequest,
    @Body('domain') domain: string,
  ) {
    return this.platformService.addCustomDomain(req.user.tenantId, domain);
  }

  @Get('environments')
  @Permissions('admin.platform.read')
  async getEnvironments(@Req() req: AuthenticatedRequest) {
    return this.platformService.getEnvironments(req.user.tenantId);
  }

  @Post('environments/:type/sync')
  @Permissions('admin.platform.update')
  async syncEnvironment(
    @Req() req: AuthenticatedRequest,
    @Param('type') type: string,
  ) {
    return this.platformService.syncEnvironment(req.user.tenantId, type);
  }

  @Get('maintenance')
  @Permissions('admin.platform.read')
  async getMaintenanceMode(@Req() req: AuthenticatedRequest) {
    return this.platformService.getMaintenanceMode(req.user.tenantId);
  }

  @Post('maintenance')
  @Permissions('admin.platform.update')
  async saveMaintenanceMode(
    @Req() req: AuthenticatedRequest,
    @Body() body: { enabled: boolean; message: string },
  ) {
    return this.platformService.saveMaintenanceMode(req.user.tenantId, body);
  }

  @Get('smtp')
  @Permissions('admin.platform.read')
  async getSmtpConfig(@Req() req: AuthenticatedRequest) {
    return this.platformService.getSmtpConfig(req.user.tenantId);
  }

  @Post('smtp')
  @Permissions('admin.platform.update')
  async saveSmtpConfig(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.platformService.saveSmtpConfig(req.user.tenantId, body);
  }

  @Get('login-customizer')
  @Permissions('admin.platform.read')
  async getLoginCustomizer(@Req() req: AuthenticatedRequest) {
    return this.platformService.getLoginCustomizer(req.user.tenantId);
  }

  @Post('login-customizer')
  @Permissions('admin.platform.update')
  async saveLoginCustomizer(
    @Req() req: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.platformService.saveLoginCustomizer(req.user.tenantId, body);
  }

  @Get('email-templates')
  @Permissions('admin.platform.read')
  async getEmailTemplates(@Req() req: AuthenticatedRequest) {
    return this.platformService.getEmailTemplates(req.user.tenantId);
  }

  @Post('email-templates')
  @Permissions('admin.platform.update')
  async saveEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @Body() body: { id?: string; name: string; category: string; subject: string; body: string; isActive?: boolean },
  ) {
    return this.platformService.saveEmailTemplate(req.user.tenantId, body);
  }

  @Delete('email-templates/:id')
  @Permissions('admin.platform.update')
  async deleteEmailTemplate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.platformService.deleteEmailTemplate(req.user.tenantId, id);
  }

  @Get('usage-analytics')
  @Permissions('admin.platform.read')
  async getUsageAnalytics(@Req() req: AuthenticatedRequest) {
    return this.platformService.getUsageAnalytics(req.user.tenantId);
  }

  @Get('updates')
  @Permissions('admin.platform.read')
  async getSystemUpdates() {
    return this.platformService.getSystemUpdates();
  }
}
