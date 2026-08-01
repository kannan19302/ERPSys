import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmEnterpriseService } from "./crm-enterprise.service";

@Controller("crm/enterprise")
@UseGuards(TenantGuard, RbacGuard)
export class CrmEnterpriseController {
  constructor(private readonly service: CrmEnterpriseService) {}

  @Get("forecast")
  @Permissions("crm.opportunity.read")
  async getSalesForecast(
    @Req() req: any,
    @Query("period") period?: string,
    @Query("methodology") methodology?: string,
  ) {
    return this.service.getSalesForecast(req.tenantId, period, methodology);
  }

  @Get("pipeline-analytics")
  @Permissions("crm.opportunity.read")
  async getPipelineAnalytics(
    @Req() req: any,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getPipelineAnalytics(req.tenantId, dateRange);
  }

  @Get("clv/:customerId")
  @Permissions("crm.customer.read")
  async getCustomerLifetimeValue(
    @Req() req: any,
    @Param("customerId") customerId: string,
  ) {
    return this.service.getCustomerLifetimeValue(req.tenantId, customerId);
  }

  @Get("churn-risk/:customerId")
  @Permissions("crm.customer.read")
  async getChurnPrediction(
    @Req() req: any,
    @Param("customerId") customerId: string,
  ) {
    return this.service.getChurnPrediction(req.tenantId, customerId);
  }

  @Get("health-score/:customerId")
  @Permissions("crm.customer.read")
  async getCustomerHealthScore(
    @Req() req: any,
    @Param("customerId") customerId: string,
  ) {
    return this.service.getCustomerHealthScore(req.tenantId, customerId);
  }

  @Get("dashboard-kpis")
  @Permissions("crm.opportunity.read")
  async getCrmExecutiveDashboard(@Req() req: any) {
    return this.service.getCrmExecutiveDashboard(req.tenantId);
  }

  @Get("lead-scoring-matrix")
  @Permissions("crm.lead.read")
  async getLeadScoringMatrix(@Req() req: any) {
    return this.service.getLeadScoringMatrix(req.tenantId);
  }

  @Get("territory-coverage/:territoryId")
  @Permissions("crm.opportunity.read")
  async getTerritoryCoverage(
    @Req() req: any,
    @Param("territoryId") territoryId: string,
  ) {
    return this.service.getTerritoryCoverage(req.tenantId, territoryId);
  }

  @Get("win-loss")
  @Permissions("crm.opportunity.read")
  async getWinLossAnalysis(
    @Req() req: any,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getWinLossAnalysis(req.tenantId, dateRange);
  }

  @Get("activity-effectiveness")
  @Permissions("crm.activity.read")
  async getActivityEffectiveness(
    @Req() req: any,
    @Query("activityType") activityType?: string,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getActivityEffectiveness(
      req.tenantId,
      activityType,
      dateRange,
    );
  }

  @Get("export/:reportType")
  @Permissions("crm.report.export")
  async exportCrmReport(
    @Req() req: any,
    @Param("reportType") reportType: string,
    @Query("format") format: string,
    @Query() params: any,
  ) {
    return this.service.exportCrmReport(
      req.tenantId,
      reportType,
      format || "json",
      params,
    );
  }
}
