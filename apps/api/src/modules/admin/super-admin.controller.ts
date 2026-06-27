import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SuperAdminService } from './super-admin.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @ApiOperation({ summary: 'Get tenants' })
  @Permissions('admin.read')
  @Get('tenants')
  @Permissions('system.tenant.read')
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @ApiOperation({ summary: 'Get tenant detail' })
  @Permissions('admin.read')
  @Get('tenants/:id')
  @Permissions('system.tenant.read')
  async getTenantDetail(@Param('id') id: string) {
    return this.superAdminService.getTenantDetail(id);
  }

  @ApiOperation({ summary: 'Provision tenant' })
  @Permissions('admin.create')
  @Post('tenants')
  @Permissions('system.tenant.create')
  async provisionTenant(
    @ZodBody(z.any()) body: { name: string; slug: string; plan: string; adminEmail: string },
  ) {
    return this.superAdminService.provisionTenant(body);
  }

  @ApiOperation({ summary: 'Update tenant' })
  @Permissions('admin.update')
  @Patch('tenants/:id')
  @Permissions('system.tenant.update')
  async updateTenant(
    @Param('id') id: string,
    @ZodBody(z.any()) body: Record<string, unknown>,
  ) {
    return this.superAdminService.updateTenant(id, body);
  }

  @ApiOperation({ summary: 'Get all admins' })
  @Permissions('admin.read')
  @Get('admins')
  @Permissions('system.superadmin.access')
  async getAllAdmins() {
    return this.superAdminService.getAllAdmins();
  }

  @ApiOperation({ summary: 'Get analytics' })
  @Permissions('admin.read')
  @Get('analytics')
  @Permissions('system.analytics.read')
  async getAnalytics() {
    return this.superAdminService.getAnalytics();
  }

  @ApiOperation({ summary: 'Get system health' })
  @Permissions('admin.read')
  @Get('health')
  @Permissions('system.health.read')
  async getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }
}
