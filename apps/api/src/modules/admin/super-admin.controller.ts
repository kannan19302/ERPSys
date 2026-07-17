import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SkipTenantScope } from '../../common/decorators/skip-tenant-scope.decorator';
import { SuperAdminService } from './super-admin.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

// Deliberately cross-tenant: this controller aggregates data across every
// tenant for the platform operator (e.g. `prisma.user.count()` platform-wide).
// It is gated by `system.tenant.*` permissions, not tenant membership.
@ApiTags('admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RbacGuard)
@SkipTenantScope()
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @ApiOperation({ summary: 'Get tenants' })
  @Get('tenants')
  @Permissions('system.tenant.read')
  async getTenants() {
    return this.superAdminService.getTenants();
  }

  @ApiOperation({ summary: 'Get tenant detail' })
  @Get('tenants/:id')
  @Permissions('system.tenant.read')
  async getTenantDetail(@Param('id') id: string) {
    return this.superAdminService.getTenantDetail(id);
  }

  @ApiOperation({ summary: 'Provision tenant' })
  @Post('tenants')
  @Permissions('system.tenant.create')
  async provisionTenant(
    @ZodBody(z.any()) body: { name: string; slug: string; plan: string; adminEmail: string },
  ) {
    return this.superAdminService.provisionTenant(body);
  }

  @ApiOperation({ summary: 'Update tenant' })
  @Patch('tenants/:id')
  @Permissions('system.tenant.update')
  async updateTenant(
    @Param('id') id: string,
    @ZodBody(z.any()) body: Record<string, unknown>,
  ) {
    return this.superAdminService.updateTenant(id, body);
  }

  @ApiOperation({ summary: 'Get all admins' })
  @Get('admins')
  @Permissions('system.superadmin.access')
  async getAllAdmins() {
    return this.superAdminService.getAllAdmins();
  }

  @ApiOperation({ summary: 'Get analytics' })
  @Get('analytics')
  @Permissions('system.analytics.read')
  async getAnalytics() {
    return this.superAdminService.getAnalytics();
  }

  @ApiOperation({ summary: 'Get system health' })
  @Get('health')
  @Permissions('system.health.read')
  async getSystemHealth() {
    return this.superAdminService.getSystemHealth();
  }
}
