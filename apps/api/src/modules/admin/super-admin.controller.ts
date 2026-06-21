import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuperAdminService } from './super-admin.service';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('tenants')
  @Permissions('system.tenant.read')
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @Get('tenants/:id')
  @Permissions('system.tenant.read')
  async getTenantDetail(@Param('id') id: string) {
    return this.superAdminService.getTenantDetail(id);
  }

  @Post('tenants')
  @Permissions('system.tenant.create')
  async provisionTenant(
    @Body() body: { name: string; slug: string; plan: string; adminEmail: string },
  ) {
    return this.superAdminService.provisionTenant(body);
  }

  @Patch('tenants/:id')
  @Permissions('system.tenant.update')
  async updateTenant(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.superAdminService.updateTenant(id, body);
  }

  @Get('admins')
  @Permissions('system.superadmin.access')
  async getAllAdmins() {
    return this.superAdminService.getAllAdmins();
  }

  @Get('analytics')
  @Permissions('system.analytics.read')
  async getAnalytics() {
    return this.superAdminService.getAnalytics();
  }

  @Get('health')
  @Permissions('system.health.read')
  async getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }
}
