import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnalyticsService } from './analytics.service';
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

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get dashboards' })
  @Get('dashboards')
  @Permissions('analytics.dashboard.read')
  async getDashboards(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getDashboards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get dashboard by id' })
  @Get('dashboards/:id')
  @Permissions('analytics.dashboard.read')
  async getDashboardById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.analyticsService.getDashboardById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create dashboard' })
  @Post('dashboards')
  @Permissions('analytics.dashboard.create')
  async createDashboard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; description?: string; layout?: unknown }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.analyticsService.createDashboard(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get reports' })
  @Get('reports')
  @Permissions('analytics.report.read')
  async getReports(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create report' })
  @Post('reports')
  @Permissions('analytics.report.create')
  async createReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; description?: string; query?: unknown; type?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.analyticsService.createReport(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get k p is' })
  @Get('kpis')
  @Permissions('analytics.kpi.read')
  async getKPIs(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getKPIs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get kpi drilldown' })
  @Get('kpis/:code/drilldown')
  @Permissions('analytics.kpi.read')
  async getKpiDrilldown(@Req() req: AuthenticatedRequest, @Param('code') code: string) {
    return this.analyticsService.getKpiDrilldown(req.user.tenantId, code);
  }

  @ApiOperation({ summary: 'Get insights' })
  @Get('insights')
  @Permissions('analytics.report.read')
  async getInsights(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getInsights(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Export dataset' })
  @Get('export/:dataset')
  @Permissions('analytics.report.read')
  async exportDataset(@Req() req: AuthenticatedRequest, @Param('dataset') dataset: string) {
    return this.analyticsService.exportDataset(req.user.tenantId, dataset);
  }

  @ApiOperation({ summary: 'Update dashboard' })
  @Patch('dashboards/:id')
  @Permissions('analytics.dashboard.create')
  async updateDashboard(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { name?: string; description?: string; layout?: unknown }
  ) {
    return this.analyticsService.updateDashboard(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Execute pivot query' })
  @Post('reports/:id/pivot')
  @Permissions('analytics.report.read')
  async executePivotQuery(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { rowFields: string[]; colFields: string[]; aggregations: string[] }
  ) {
    return this.analyticsService.executePivotQuery(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Run secure visual query' })
  @Post('query/visual')
  @Permissions('analytics.report.read')
  async runSecureVisualQuery(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { selectFields: string[]; filterGroups: any[] }
  ) {
    return this.analyticsService.runSecureVisualQuery(req.user.tenantId, dto);
  }
}
