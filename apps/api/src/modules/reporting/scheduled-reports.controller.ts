import { Controller, Get, Post, Patch, Delete, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ScheduledReportsService } from './scheduled-reports.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting/scheduled')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ScheduledReportsController {
  constructor(private readonly scheduledReportsService: ScheduledReportsService) {}

  @ApiOperation({ summary: 'Get scheduled reports' })
  @Get()
  @Permissions('finance.report.read')
  async getScheduledReports(@Req() req: AuthenticatedRequest) {
    return this.scheduledReportsService.getScheduledReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create scheduled report' })
  @Post()
  @Permissions('finance.report.read')
  async createScheduledReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Update scheduled report' })
  @Patch(':id')
  @Permissions('finance.report.read')
  async updateScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Delete scheduled report' })
  @Delete(':id')
  @Permissions('finance.report.read')
  async deleteScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.scheduledReportsService.deleteScheduledReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Run scheduled report' })
  @Post(':id/run')
  @Permissions('finance.report.read')
  async runScheduledReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.scheduledReportsService.runScheduledReport(req.user.tenantId, id);
  }
}
