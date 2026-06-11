import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReportingService } from './reporting.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('reporting')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @Get('widgets')
  @Permissions('finance.report.read')
  async getWidgets(@Req() req: AuthenticatedRequest) {
    return this.service.getWidgets(req.user.tenantId);
  }

  @Post('widgets')
  @Permissions('finance.report.read')
  async createWidget(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { dashboardId: string; title: string; chartType: string; queryConfig: string; position: string }
  ) {
    return this.service.createWidget(req.user.tenantId, dto);
  }

  @Get('views')
  @Permissions('finance.report.read')
  async getViews(@Req() req: AuthenticatedRequest) {
    return this.service.getViews(req.user.tenantId);
  }

  @Post('views')
  @Permissions('finance.report.read')
  async createView(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; queryConfig: string; isScheduled?: boolean; scheduleCron?: string; recipientEmails?: string }
  ) {
    return this.service.createView(req.user.tenantId, dto);
  }
}
