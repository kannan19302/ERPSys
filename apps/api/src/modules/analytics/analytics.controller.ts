import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboards')
  @Permissions('analytics.dashboard.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getDashboards(req.user.tenantId);
  }

  @Get('dashboards/:id')
  @Permissions('analytics.dashboard.read')
  async getDashboardById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.analyticsService.getDashboardById(req.user.tenantId, id);
  }

  @Post('dashboards')
  @Permissions('analytics.dashboard.create')
  async createDashboard(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; layout?: unknown }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.analyticsService.createDashboard(req.user.tenantId, orgId, dto);
  }

  @Get('reports')
  @Permissions('analytics.report.read')
  async getReports(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getReports(req.user.tenantId);
  }

  @Post('reports')
  @Permissions('analytics.report.create')
  async createReport(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; query?: unknown; type?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.analyticsService.createReport(req.user.tenantId, orgId, dto);
  }

  @Get('kpis')
  @Permissions('analytics.kpi.read')
  async getKPIs(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getKPIs(req.user.tenantId);
  }

  @Post('reports/:id/pivot')
  @Permissions('analytics.report.read')
  async executePivotQuery(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { rowFields: string[]; colFields: string[]; aggregations: string[] }
  ) {
    return this.analyticsService.executePivotQuery(req.user.tenantId, id, dto);
  }

  @Post('query/visual')
  @Permissions('analytics.report.read')
  async runSecureVisualQuery(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { selectFields: string[]; filterGroups: any[] }
  ) {
    return this.analyticsService.runSecureVisualQuery(req.user.tenantId, dto);
  }
}
