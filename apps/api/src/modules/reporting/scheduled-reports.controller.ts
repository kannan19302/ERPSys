import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ScheduledReportsService } from './scheduled-reports.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('reporting/scheduled')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ScheduledReportsController {
  constructor(private readonly scheduledReportsService: ScheduledReportsService) {}

  @Get()
  @Permissions('finance.report.read')
  async getScheduledReports(@Req() req: AuthenticatedRequest) {
    return this.scheduledReportsService.getScheduledReports(req.user.tenantId);
  }

  @Post()
  @Permissions('finance.report.read')
  async createScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      name: string;
      reportType: string;
      schedule: string;
      recipients?: string[];
      filters?: Record<string, unknown>;
      format?: string;
    },
  ) {
    return this.scheduledReportsService.createScheduledReport(req.user.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @Permissions('finance.report.read')
  async updateScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      reportType?: string;
      schedule?: string;
      recipients?: string[];
      filters?: Record<string, unknown>;
      format?: string;
      isActive?: boolean;
    },
  ) {
    return this.scheduledReportsService.updateScheduledReport(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('finance.report.read')
  async deleteScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.scheduledReportsService.deleteScheduledReport(req.user.tenantId, id);
  }

  @Post(':id/run')
  @Permissions('finance.report.read')
  async runScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.scheduledReportsService.runScheduledReport(req.user.tenantId, id);
  }
}
