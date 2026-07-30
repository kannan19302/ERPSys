// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmDealAnalyticsDeepService } from "./crm-deal-analytics-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / deal-analytics-deep")
@ApiBearerAuth()
@Controller("crm/deal-analytics-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmDealAnalyticsDeepController {
  constructor(private readonly svc: CrmDealAnalyticsDeepService) {}

  @Get("velocity")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal velocity analysis" })
  async getDealVelocity(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealVelocityAnalysis(req.user.tenantId) };
  }

  @Get("stage-duration")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get stage duration breakdown" })
  async getStageDuration(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getStageDurationBreakdown(req.user.tenantId),
    };
  }

  @Get("value-distribution")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal value distribution by bucket" })
  async getValueDistribution(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealValueDistribution(req.user.tenantId) };
  }

  @Get("win-rate")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get win rate by stage" })
  async getWinRate(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getWinRateByStage(req.user.tenantId) };
  }

  @Get("loss-reasons")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get loss reason breakdown" })
  async getLossReasons(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getLossReasonBreakdown(req.user.tenantId) };
  }

  @Get("sales-cycle-by-product")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get sales cycle duration by product" })
  async getSalesCycleByProduct(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSalesCycleByProduct(req.user.tenantId) };
  }

  @Get("forecast-accuracy")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get forecast accuracy analysis" })
  async getForecastAccuracy(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getForecastAccuracyAnalysis(req.user.tenantId),
    };
  }

  @Get("pipeline-health")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get pipeline health score" })
  async getPipelineHealth(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPipelineHealthScore(req.user.tenantId) };
  }

  @Get("funnel")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal conversion funnel" })
  async getConversionFunnel(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealConversionFunnel(req.user.tenantId) };
  }

  @Get("top-reps")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get top performing sales representatives" })
  async getTopReps(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getTopRepsByRevenue(req.user.tenantId) };
  }

  @Get("deals-by-source")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal size by source" })
  async getDealsBySource(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealSizeBySource(req.user.tenantId) };
  }

  @Get("revenue-trend")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get monthly closed revenue trend" })
  async getRevenueTrend(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMonthlyClosedRevenuetrend(req.user.tenantId),
    };
  }

  @Get("pipeline-coverage")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get pipeline coverage ratio" })
  async getPipelineCoverage(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPipelineCoverage(req.user.tenantId) };
  }

  @Get("stage-conversion-rates")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get stage-to-stage conversion rates" })
  async getStageConversionRates(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getStageConversionRates(req.user.tenantId) };
  }

  @Get("deal-age")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal age distribution" })
  async getDealAge(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealAgeDistribution(req.user.tenantId) };
  }

  @Get("weighted-forecast")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get weighted forecast by stage probability" })
  async getWeightedForecast(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getWeightedForecastByStage(req.user.tenantId),
    };
  }

  @Get("close-rate-trend")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get close rate trend over last 6 months" })
  async getCloseRateTrend(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCloseRateTrend(req.user.tenantId) };
  }

  @Get("by-industry")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deals grouped by industry vertical" })
  async getDealsByIndustry(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getDealsByIndustryVertical(req.user.tenantId),
    };
  }

  @Get("cross-sell-upsell")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get cross-sell and upsell opportunities" })
  async getCrossSellUpsell(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCrossSellUpsellOpportunities(req.user.tenantId),
    };
  }

  @Get("sales-cycle-benchmark")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get sales cycle benchmarks vs industry" })
  async getSalesCycleBenchmark(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSalesCycleBenchmark(req.user.tenantId) };
  }

  @Get("at-risk")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get at-risk deals requiring attention" })
  async getAtRiskDeals(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAtRiskDeals(req.user.tenantId) };
  }

  @Get("creation-trend")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal creation trend over time" })
  async getDealCreationTrend(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealCreationTrend(req.user.tenantId) };
  }

  @Get("pipeline-by-assignee")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get pipeline value by assignee" })
  async getPipelineByAssignee(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPipelineByAssignee(req.user.tenantId) };
  }

  @Get("revenue-leakage")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get revenue leakage from lost deals analysis" })
  async getRevenueLeakage(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRevenueLeakageAnalysis(req.user.tenantId),
    };
  }

  @Get("negotiation-success")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get negotiation success rate" })
  async getNegotiationSuccess(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getNegotiationSuccessRate(req.user.tenantId),
    };
  }

  @Get("quota-attainment")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get quota attainment by rep" })
  async getQuotaAttainment(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getQuotaAttainmentByRep(req.user.tenantId) };
  }

  @Get("probability-scoring")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal probability scoring" })
  async getProbabilityScoring(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getDealProbabilityScoring(req.user.tenantId),
    };
  }

  @Get("team-quota-rollup")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get team quota rollup for current year" })
  async getTeamQuotaRollup(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getTeamQuotaRollup(req.user.tenantId) };
  }

  @Get("velocity-by-channel")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal velocity broken down by channel" })
  async getVelocityByChannel(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealVelocityByChannel(req.user.tenantId) };
  }

  @Get("scorecard")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal analytics scorecard summary" })
  async getScorecardSummary(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getScorecardSummary(req.user.tenantId) };
  }

  @Get("historical-forecast-accuracy")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get historical forecast accuracy data" })
  async getHistoricalForecastAccuracy(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getHistoricalForecastAccuracy(req.user.tenantId),
    };
  }

  @Get("competitor-win-loss")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get win/loss analysis vs competitors" })
  async getCompetitorWinLoss(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCompetitorWinLoss(req.user.tenantId) };
  }

  @Get("risk-heatmap")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get deal risk heatmap" })
  async getDealRiskHeatmap(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealRiskHeatmap(req.user.tenantId) };
  }

  @Get("engagement-distribution")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get contact engagement score distribution" })
  async getEngagementDistribution(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getEngagementScoreDistribution(req.user.tenantId),
    };
  }

  @Get("dashboard")
  @Permissions("crm.deal.analytics.read")
  @ApiOperation({ summary: "Get full deal analytics dashboard" })
  async getDealAnalyticsDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getDealAnalyticsDashboard(req.user.tenantId),
    };
  }
}
