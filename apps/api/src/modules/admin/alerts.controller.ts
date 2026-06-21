import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AlertsService } from './alerts.service';

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

@Controller('admin/alerts')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Permissions('admin.alerts.read')
  async getAlerts(
    @Req() req: AuthenticatedRequest,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.alertsService.getAlerts(req.user.tenantId, unreadOnly === 'true');
  }

  @Post(':id/read')
  @Permissions('admin.alerts.update')
  async markRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.alertsService.markRead(req.user.tenantId, id);
  }

  @Post(':id/dismiss')
  @Permissions('admin.alerts.update')
  async dismissAlert(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.alertsService.dismissAlert(req.user.tenantId, id);
  }

  @Post('mark-all-read')
  @Permissions('admin.alerts.update')
  async markAllRead(@Req() req: AuthenticatedRequest) {
    return this.alertsService.markAllRead(req.user.tenantId);
  }

  @Get('thresholds')
  @Permissions('admin.alerts.read')
  async getThresholds(@Req() req: AuthenticatedRequest) {
    return this.alertsService.getThresholds(req.user.tenantId);
  }

  @Post('thresholds')
  @Permissions('admin.alerts.update')
  async upsertThreshold(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      metric: string;
      operator: string;
      value: number;
      severity?: string;
      isActive?: boolean;
      notifyEmail?: boolean;
      cooldownMin?: number;
    },
  ) {
    return this.alertsService.upsertThreshold(req.user.tenantId, dto);
  }

  @Delete('thresholds/:id')
  @Permissions('admin.alerts.update')
  async deleteThreshold(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.alertsService.deleteThreshold(req.user.tenantId, id);
  }
}
