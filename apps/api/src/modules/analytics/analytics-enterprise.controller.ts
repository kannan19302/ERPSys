import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsEnterpriseService } from "./analytics-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("analytics-enterprise")
@ApiBearerAuth()
@Controller("analytics/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsEnterpriseController {
  constructor(private readonly service: AnalyticsEnterpriseService) {}

  @ApiOperation({
    summary: "Cross-entity composite report from multiple source modules",
  })
  @Post("multi-source-report")
  @Permissions("analytics.report.create")
  async getMultiSourceReport(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: { entities: string[]; dimensions: string[]; measures: string[] },
  ) {
    return this.service.getMultiSourceReport(
      req.user.tenantId,
      body.entities,
      body.dimensions,
      body.measures,
    );
  }

  @ApiOperation({
    summary: "Hierarchical drill-down analysis with breadcrumb trail",
  })
  @Get("drill-down/:reportId")
  @Permissions("analytics.report.read")
  async getDrillDownAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param("reportId") reportId: string,
    @Query("path") path: string,
  ) {
    return this.service.getDrillDownAnalysis(req.user.tenantId, reportId, path);
  }

  @ApiOperation({ summary: "What-if scenario comparison analysis" })
  @Post("what-if")
  @Permissions("analytics.report.create")
  async getWhatIfAnalysis(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      modelId: string;
      scenarios: { name: string; adjustments: Record<string, number> }[];
    },
  ) {
    return this.service.getWhatIfAnalysis(
      req.user.tenantId,
      body.modelId,
      body.scenarios,
    );
  }

  @ApiOperation({ summary: "Time-series forecast with confidence intervals" })
  @Get("forecast/:metric")
  @Permissions("analytics.report.read")
  async getForecastModel(
    @Req() req: AuthenticatedRequest,
    @Param("metric") metric: string,
    @Query("horizon") horizon?: string,
    @Query("method") method?: string,
  ) {
    return this.service.getForecastModel(
      req.user.tenantId,
      metric,
      horizon || "MONTHLY",
      method || "linear",
    );
  }

  @ApiOperation({
    summary: "Safe ad-hoc query execution with field-level access control",
  })
  @Post("ad-hoc-query")
  @Permissions("analytics.report.create")
  async getAdHocQuery(
    @Req() req: AuthenticatedRequest,
    @Body() body: { query: string },
  ) {
    return this.service.getAdHocQuery(req.user.tenantId, body.query);
  }

  @ApiOperation({ summary: "Export full dashboard as PDF with all charts" })
  @Get("dashboard-export/:dashboardId")
  @Permissions("analytics.dashboard.read")
  async getDashboardExport(
    @Req() req: AuthenticatedRequest,
    @Param("dashboardId") dashboardId: string,
    @Query("format") format?: string,
  ) {
    return this.service.getDashboardExport(
      req.user.tenantId,
      dashboardId,
      format || "pdf",
    );
  }

  @ApiOperation({
    summary: "AI-generated natural language insights on key metrics",
  })
  @Get("insights")
  @Permissions("analytics.report.read")
  async getAutomatedInsights(
    @Req() req: AuthenticatedRequest,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getAutomatedInsights(
      req.user.tenantId,
      dateRange || "MONTHLY",
    );
  }

  @ApiOperation({
    summary: "Data quality completeness, consistency, timeliness metrics",
  })
  @Get("data-quality")
  @Permissions("analytics.report.read")
  async getDataQualityDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getDataQualityDashboard(req.user.tenantId);
  }

  @ApiOperation({
    summary: "Configurable anomaly detection rules and thresholds",
  })
  @Get("anomaly-alert-config")
  @Permissions("analytics.settings.read")
  async getAnomalyAlertConfig(@Req() req: AuthenticatedRequest) {
    return this.service.getAnomalyAlertConfig(req.user.tenantId);
  }

  @ApiOperation({ summary: "Compare metrics against industry benchmarks" })
  @Get("benchmark")
  @Permissions("analytics.report.read")
  async getBenchmarkComparison(
    @Req() req: AuthenticatedRequest,
    @Query("metric") metric: string,
    @Query("industry") industry: string,
  ) {
    return this.service.getBenchmarkComparison(
      req.user.tenantId,
      metric,
      industry,
    );
  }
}
