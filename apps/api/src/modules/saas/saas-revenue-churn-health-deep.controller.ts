import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import {
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  CurrentUser,
} from "@unerp/core";
import { SaasRevenueChurnHealthDeepService } from "./saas-revenue-churn-health-deep.service";

@ApiTags("SaaS Revenue & Churn Health")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("saas/revenue-churn-health")
export class SaasRevenueChurnHealthDeepController {
  constructor(private readonly service: SaasRevenueChurnHealthDeepService) {}

  // 1. MRR/ARR Revenue Analytics
  @Get("revenue/mrr")
  @ApiOperation({ summary: "Get MRR analytics" })
  @Permissions("saas.revenue.read")
  async getMrrAnalytics(
    @CurrentUser() user: any,
    @Query("timeframe") timeframe: string,
  ) {
    return this.service.getMrrAnalytics(user.tenantId, timeframe);
  }

  @Get("revenue/arr")
  @ApiOperation({ summary: "Get ARR analytics" })
  @Permissions("saas.revenue.read")
  async getArrAnalytics(@CurrentUser() user: any) {
    return this.service.getArrAnalytics(user.tenantId);
  }

  @Get("revenue/cohort-retention")
  @ApiOperation({ summary: "Get cohort retention matrix" })
  @Permissions("saas.revenue.read")
  async getCohortRetentionMatrix(@CurrentUser() user: any) {
    return this.service.getCohortRetentionMatrix(user.tenantId);
  }

  @Get("revenue/ltv-cac")
  @ApiOperation({ summary: "Get LTV CAC metrics" })
  @Permissions("saas.revenue.read")
  async getLtvCacMetrics(@CurrentUser() user: any) {
    return this.service.getLtvCacMetrics(user.tenantId);
  }

  @Get("revenue/net-retention")
  @ApiOperation({ summary: "Get net revenue retention" })
  @Permissions("saas.revenue.read")
  async getNetRevenueRetention(@CurrentUser() user: any) {
    return this.service.getNetRevenueRetention(user.tenantId);
  }

  @Get("revenue/forecast")
  @ApiOperation({ summary: "Forecast SaaS revenue" })
  @Permissions("saas.revenue.read")
  async forecastRevenue(
    @CurrentUser() user: any,
    @Query("periods") periods: number,
  ) {
    return this.service.forecastRevenue(user.tenantId, Number(periods) || 6);
  }

  // 2. Health & Churn
  @Get("health/score/:targetTenantId")
  @ApiOperation({ summary: "Calculate tenant health score" })
  @Permissions("saas.health.read")
  async calculateTenantHealthScore(
    @CurrentUser() user: any,
    @Param("targetTenantId") targetTenantId: string,
  ) {
    return this.service.calculateTenantHealthScore(
      user.tenantId,
      targetTenantId,
    );
  }

  @Get("health/dimensions")
  @ApiOperation({ summary: "Get tenant health dimensions" })
  @Permissions("saas.health.read")
  async getTenantHealthDimensions(@CurrentUser() user: any) {
    return this.service.getTenantHealthDimensions(user.tenantId);
  }

  @Get("churn/predict/:targetTenantId")
  @ApiOperation({ summary: "Predict churn probability" })
  @Permissions("saas.health.read")
  async predictChurnProbability(
    @CurrentUser() user: any,
    @Param("targetTenantId") targetTenantId: string,
  ) {
    return this.service.predictChurnProbability(user.tenantId, targetTenantId);
  }

  @Post("churn/playbook/trigger")
  @ApiOperation({ summary: "Trigger churn mitigation playbook" })
  @Permissions("saas.health.update")
  async triggerChurnMitigationPlaybook(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.service.triggerChurnMitigationPlaybook(
      user.tenantId,
      body?.targetTenantId,
      body?.playbookId,
    );
  }

  @Get("churn/at-risk-tenants")
  @ApiOperation({ summary: "Get tenants at risk" })
  @Permissions("saas.health.read")
  async getTenantsAtRisk(@CurrentUser() user: any) {
    return this.service.getTenantsAtRisk(user.tenantId);
  }

  @Get("trials/conversion-funnel")
  @ApiOperation({ summary: "Get trial conversion funnel" })
  @Permissions("saas.trials.read")
  async getTrialConversionFunnel(@CurrentUser() user: any) {
    return this.service.getTrialConversionFunnel(user.tenantId);
  }
}
