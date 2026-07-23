import { Controller, Get, Post, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsExpansionService } from './analytics-expansion.service';
import { ReportFilterSchema, DashboardWidgetSchema, KpiValueSchema, ScheduledExportSchema } from './dto/analytics-expansion.dto';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('analytics-expansion')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsExpansionController {
  constructor(private readonly service: AnalyticsExpansionService) {}

  // ── Report Filters ──
  @ApiOperation({ summary: 'Get report filters' })
  @Get('reports/:reportId/filters')
  @Permissions('analytics.report-filter.read')
  async getReportFilters(@Req() req: AuthenticatedRequest, @Param('reportId') reportId: string) {
    return this.service.getReportFilters(req.user.tenantId, reportId);
  }

  @ApiOperation({ summary: 'Create report filter' })
  @Post('report-filters')
  @Permissions('analytics.report-filter.create')
  async createReportFilter(@Req() req: AuthenticatedRequest, @ZodBody(ReportFilterSchema) dto: unknown) {
    return this.service.createReportFilter(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Delete report filter' })
  @Delete('report-filters/:id')
  @Permissions('analytics.report-filter.delete')
  async deleteReportFilter(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteReportFilter(req.user.tenantId, id);
  }

  // ── Dashboard Widgets ──
  @ApiOperation({ summary: 'Get dashboard widgets' })
  @Get('dashboards/:dashboardId/widgets')
  @Permissions('analytics.dashboard-widget.read')
  async getDashboardWidgets(@Req() req: AuthenticatedRequest, @Param('dashboardId') dashboardId: string) {
    return this.service.getDashboardWidgets(req.user.tenantId, dashboardId);
  }

  @ApiOperation({ summary: 'Create dashboard widget' })
  @Post('dashboard-widgets')
  @Permissions('analytics.dashboard-widget.create')
  async createDashboardWidget(@Req() req: AuthenticatedRequest, @ZodBody(DashboardWidgetSchema) dto: unknown) {
    return this.service.createDashboardWidget(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update dashboard widget' })
  @Put('dashboard-widgets/:id')
  @Permissions('analytics.dashboard-widget.update')
  async updateDashboardWidget(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(DashboardWidgetSchema.partial()) dto: unknown) {
    return this.service.updateDashboardWidget(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete dashboard widget' })
  @Delete('dashboard-widgets/:id')
  @Permissions('analytics.dashboard-widget.delete')
  async deleteDashboardWidget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteDashboardWidget(req.user.tenantId, id);
  }

  // ── KPI Values ──
  @ApiOperation({ summary: 'Get KPI historical values' })
  @Get('kpis/:kpiId/values')
  @Permissions('analytics.kpi-value.read')
  async getKpiValues(@Req() req: AuthenticatedRequest, @Param('kpiId') kpiId: string) {
    return this.service.getKpiValues(req.user.tenantId, kpiId);
  }

  @ApiOperation({ summary: 'Record KPI value' })
  @Post('kpi-values')
  @Permissions('analytics.kpi-value.create')
  async recordKpiValue(@Req() req: AuthenticatedRequest, @ZodBody(KpiValueSchema) dto: unknown) {
    return this.service.recordKpiValue(req.user.tenantId, dto as any);
  }

  // ── Scheduled Exports ──
  @ApiOperation({ summary: 'Get scheduled exports' })
  @Get('scheduled-exports')
  @Permissions('analytics.scheduled-export.read')
  async getScheduledExports(@Req() req: AuthenticatedRequest) {
    return this.service.getScheduledExports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create scheduled export' })
  @Post('scheduled-exports')
  @Permissions('analytics.scheduled-export.create')
  async createScheduledExport(@Req() req: AuthenticatedRequest, @ZodBody(ScheduledExportSchema) dto: unknown) {
    return this.service.createScheduledExport(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update scheduled export' })
  @Put('scheduled-exports/:id')
  @Permissions('analytics.scheduled-export.update')
  async updateScheduledExport(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(ScheduledExportSchema.partial()) dto: unknown) {
    return this.service.updateScheduledExport(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete scheduled export' })
  @Delete('scheduled-exports/:id')
  @Permissions('analytics.scheduled-export.delete')
  async deleteScheduledExport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteScheduledExport(req.user.tenantId, id);
  }
}
