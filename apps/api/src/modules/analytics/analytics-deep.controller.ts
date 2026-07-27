import { Controller, Get, Post, Put, Patch, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsDeepService } from './analytics-deep.service';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createKpiSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  formula: z.string().min(1),
  target: z.number().optional(),
  unit: z.string().optional(),
  visualization: z.enum(["NUMBER", "GAUGE", "BAR", "LINE", "PIE"]).default("NUMBER"),
  category: z.string().optional(),
  sourceTable: z.string().optional(),
  sourceColumn: z.string().optional(),
  config: z.record(z.unknown()).optional(),
});

const updateKpiSchema = createKpiSchema.partial();

const createDashboardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  layout: z.any().optional(),
  filters: z.any().optional(),
  widgets: z.any().optional(),
});

const updateDashboardSchema = createDashboardSchema.partial();

const createBiMetricSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  sourceTable: z.string().min(1),
  sourceColumn: z.string().min(1),
  aggregation: z.enum(["SUM", "COUNT", "AVG", "MIN", "MAX", "DISTINCT_COUNT"]).default("SUM"),
  dataType: z.enum(["NUMBER", "CURRENCY", "PERCENTAGE", "STRING", "DATE"]).default("NUMBER"),
  unit: z.string().optional(),
  category: z.string().optional(),
  formula: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateBiMetricSchema = createBiMetricSchema.partial();

const createExportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dataset: z.string().min(1),
  format: z.enum(["CSV", "XLSX", "JSON", "PDF"]).default("CSV"),
  schedule: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]).default("DAILY"),
  recipients: z.array(z.string().email()).default([]),
  filters: z.any().optional(),
});

@ApiTags('analytics-deep')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsDeepController {
  constructor(private readonly service: AnalyticsDeepService) {}

  @ApiOperation({ summary: 'List KPI definitions' })
  @Get('kpi-definitions')
  @Permissions('analytics.kpi-definition.read')
  async getKpiDefinitions(@Req() req: AuthenticatedRequest, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.service.getKpiDefinitions(req.user.tenantId, { page, limit, search: query.search, category: query.category });
  }

  @ApiOperation({ summary: 'Get KPI definition' })
  @Get('kpi-definitions/:id')
  @Permissions('analytics.kpi-definition.read')
  async getKpiDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getKpiDefinition(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create KPI definition' })
  @Post('kpi-definitions')
  @Permissions('analytics.kpi-definition.create')
  async createKpiDefinition(@Req() req: AuthenticatedRequest, @ZodBody(createKpiSchema) dto: unknown) {
    return this.service.createKpiDefinition(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update KPI definition' })
  @Patch('kpi-definitions/:id')
  @Permissions('analytics.kpi-definition.update')
  async updateKpiDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateKpiSchema) dto: unknown) {
    return this.service.updateKpiDefinition(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete KPI definition' })
  @Delete('kpi-definitions/:id')
  @Permissions('analytics.kpi-definition.delete')
  async deleteKpiDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteKpiDefinition(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get trend analysis for a KPI' })
  @Get('trends/:kpiDefinitionId')
  @Permissions('analytics.trend.read')
  async getTrendAnalysis(@Req() req: AuthenticatedRequest, @Param('kpiDefinitionId') kpiDefinitionId: string) {
    return this.service.getTrendAnalysis(req.user.tenantId, kpiDefinitionId);
  }

  @ApiOperation({ summary: 'Compute trend analysis' })
  @Post('trends/:kpiDefinitionId/compute')
  @Permissions('analytics.trend.compute')
  async computeTrendAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param('kpiDefinitionId') kpiDefinitionId: string,
    @Query('period') period: string,
  ) {
    const p = (period === "QUARTERLY" || period === "YEARLY" ? period : "MONTHLY") as "MONTHLY" | "QUARTERLY" | "YEARLY";
    return this.service.computeTrendAnalysis(req.user.tenantId, kpiDefinitionId, p);
  }

  @ApiOperation({ summary: 'List scheduled exports' })
  @Get('scheduled-exports-deep')
  @Permissions('analytics.scheduled-export.read')
  async getScheduledExports(@Req() req: AuthenticatedRequest) {
    return this.service.getScheduledExports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create scheduled export' })
  @Post('scheduled-exports-deep')
  @Permissions('analytics.scheduled-export.create')
  async createScheduledExport(@Req() req: AuthenticatedRequest, @ZodBody(createExportSchema) dto: unknown) {
    return this.service.createScheduledExport(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update scheduled export' })
  @Patch('scheduled-exports-deep/:id')
  @Permissions('analytics.scheduled-export.update')
  async updateScheduledExport(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(createExportSchema.partial()) dto: unknown) {
    return this.service.updateScheduledExport(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete scheduled export' })
  @Delete('scheduled-exports-deep/:id')
  @Permissions('analytics.scheduled-export.delete')
  async deleteScheduledExport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteScheduledExport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List cross-filter dashboards' })
  @Get('cross-filter-dashboards')
  @Permissions('analytics.dashboard.read')
  async getCrossFilterDashboards(@Req() req: AuthenticatedRequest) {
    return this.service.getCrossFilterDashboards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get cross-filter dashboard' })
  @Get('cross-filter-dashboards/:id')
  @Permissions('analytics.dashboard.read')
  async getCrossFilterDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getCrossFilterDashboard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create cross-filter dashboard' })
  @Post('cross-filter-dashboards')
  @Permissions('analytics.dashboard.create')
  async createCrossFilterDashboard(@Req() req: AuthenticatedRequest, @ZodBody(createDashboardSchema) dto: unknown) {
    return this.service.createCrossFilterDashboard(req.user.tenantId, dto as any, req.user.userId);
  }

  @ApiOperation({ summary: 'Update cross-filter dashboard' })
  @Put('cross-filter-dashboards/:id')
  @Permissions('analytics.dashboard.update')
  async updateCrossFilterDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateDashboardSchema) dto: unknown) {
    return this.service.updateCrossFilterDashboard(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete cross-filter dashboard' })
  @Delete('cross-filter-dashboards/:id')
  @Permissions('analytics.dashboard.delete')
  async deleteCrossFilterDashboard(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteCrossFilterDashboard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List BI metric catalog' })
  @Get('bi-metric-catalog')
  @Permissions('analytics.bi-metric.read')
  async getBiMetricCatalog(@Req() req: AuthenticatedRequest, @Query() query: Record<string, string>) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    return this.service.getBiMetricCatalog(req.user.tenantId, { page, limit, search: query.search, category: query.category });
  }

  @ApiOperation({ summary: 'Get BI metric definition' })
  @Get('bi-metric-catalog/:id')
  @Permissions('analytics.bi-metric.read')
  async getBiMetricDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getBiMetricDefinition(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create BI metric definition' })
  @Post('bi-metric-catalog')
  @Permissions('analytics.bi-metric.create')
  async createBiMetricDefinition(@Req() req: AuthenticatedRequest, @ZodBody(createBiMetricSchema) dto: unknown) {
    return this.service.createBiMetricDefinition(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: 'Update BI metric definition' })
  @Patch('bi-metric-catalog/:id')
  @Permissions('analytics.bi-metric.update')
  async updateBiMetricDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateBiMetricSchema) dto: unknown) {
    return this.service.updateBiMetricDefinition(req.user.tenantId, id, dto as any);
  }

  @ApiOperation({ summary: 'Delete BI metric definition' })
  @Delete('bi-metric-catalog/:id')
  @Permissions('analytics.bi-metric.delete')
  async deleteBiMetricDefinition(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteBiMetricDefinition(req.user.tenantId, id);
  }
}
