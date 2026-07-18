import {
  Controller, Get, Post, Param, Query, Body, Headers,
  UseGuards, Req, HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { SkipTenantScope } from '../../../common/decorators/skip-tenant-scope.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { TenantLifecycleService } from './tenant-lifecycle.service';
import { offboardTenantSchema, exportTenantSchema } from './dto/tenant-lifecycle.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RbacGuard)
@SkipTenantScope()
export class TenantLifecycleController {
  constructor(private readonly tenantLifecycleService: TenantLifecycleService) {}

  @ApiOperation({ summary: 'Get tenant lifecycle status and history' })
  @Get(':id/lifecycle')
  @Permissions('admin.tenant.lifecycle.read')
  async getLifecycleStatus(@Param('id') tenantId: string) {
    return this.tenantLifecycleService.getLifecycleStatus(tenantId);
  }

  @ApiOperation({ summary: 'Export all tenant data' })
  @Post(':id/export')
  @Permissions('admin.tenant.export')
  async exportTenant(
    @Param('id') tenantId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const opts = exportTenantSchema.parse(body);
    return this.tenantLifecycleService.exportTenant(tenantId, opts);
  }

  @ApiOperation({ summary: 'Suspend tenant' })
  @Post(':id/suspend')
  @Permissions('admin.tenant.suspend')
  @TrackChanges('Tenant')
  @HttpCode(200)
  async suspendTenant(
    @Param('id') tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tenantLifecycleService.suspendTenant(tenantId, req.user?.userId);
  }

  @ApiOperation({ summary: 'Unsuspend tenant' })
  @Post(':id/unsuspend')
  @Permissions('admin.tenant.unsuspend')
  @TrackChanges('Tenant')
  @HttpCode(200)
  async unsuspendTenant(
    @Param('id') tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tenantLifecycleService.unsuspendTenant(tenantId, req.user?.userId);
  }

  @ApiOperation({ summary: 'Start tenant offboarding' })
  @Post(':id/offboard')
  @Permissions('admin.tenant.offboard')
  @TrackChanges('Tenant')
  @HttpCode(200)
  async offboardTenant(
    @Param('id') tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = offboardTenantSchema.parse(body);
    return this.tenantLifecycleService.offboardTenant(tenantId, dto.retentionDays, req.user?.userId);
  }

  @ApiOperation({ summary: 'Cancel pending offboarding' })
  @Post(':id/cancel-offboarding')
  @Permissions('admin.tenant.offboard')
  @TrackChanges('Tenant')
  @HttpCode(200)
  async cancelOffboarding(
    @Param('id') tenantId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.tenantLifecycleService.cancelOffboarding(tenantId, req.user?.userId);
  }

  @ApiOperation({ summary: 'Permanently purge tenant' })
  @Post(':id/purge')
  @Permissions('admin.tenant.purge')
  @TrackChanges('Tenant')
  @HttpCode(200)
  async purgeTenant(
    @Param('id') tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-confirm-purge') confirmPurge: string,
  ) {
    if (confirmPurge !== 'true') {
      const { ForbiddenException } = await import('@nestjs/common');
      throw new ForbiddenException('Must provide X-Confirm-Purge: true header to confirm purge');
    }
    return this.tenantLifecycleService.purgeTenant(tenantId, req.user?.userId);
  }

  @ApiOperation({ summary: 'List tenant export history' })
  @Get('lifecycle/export-history')
  @Permissions('admin.tenant.lifecycle.read')
  async getExportHistory(@Query('tenantId') tenantId: string) {
    if (!tenantId) {
      return { exports: [] };
    }
    return this.tenantLifecycleService.getExportHistory(tenantId);
  }
}
