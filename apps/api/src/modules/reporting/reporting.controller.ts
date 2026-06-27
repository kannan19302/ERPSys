import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ReportingService } from './reporting.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

  @ApiOperation({ summary: 'Get widgets' })
  @Permissions('reporting.read')
  @Get('widgets')
  @Permissions('finance.report.read')
  async getWidgets(@Req() req: AuthenticatedRequest) {
    return this.service.getWidgets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create widget' })
  @Permissions('reporting.create')
  @Post('widgets')
  @Permissions('finance.report.read')
  async createWidget(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { dashboardId: string; title: string; chartType: string; queryConfig: string; position: string }
  ) {
    return this.service.createWidget(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get views' })
  @Permissions('reporting.read')
  @Get('views')
  @Permissions('finance.report.read')
  async getViews(@Req() req: AuthenticatedRequest) {
    return this.service.getViews(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create view' })
  @Permissions('reporting.create')
  @Post('views')
  @Permissions('finance.report.read')
  async createView(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; queryConfig: string; isScheduled?: boolean; scheduleCron?: string; recipientEmails?: string }
  ) {
    return this.service.createView(req.user.tenantId, dto);
  }
}
