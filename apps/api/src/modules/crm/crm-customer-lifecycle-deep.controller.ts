// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmCustomerLifecycleDeepService } from "./crm-customer-lifecycle-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / customer-lifecycle-deep")
@ApiBearerAuth()
@Controller("crm/customer-lifecycle-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCustomerLifecycleDeepController {
  constructor(private readonly svc: CrmCustomerLifecycleDeepService) {}

  @Get("lifecycle-stages")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer lifecycle stage tracking" })
  async getLifecycleStages(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getLifecycleStageTracking(req.user.tenantId),
    };
  }

  @Get("activation-milestones")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer activation milestones" })
  async getActivationMilestones(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getActivationMilestones(req.user.tenantId) };
  }

  @Get("retention-programs")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get retention program effectiveness" })
  async getRetentionPrograms(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRetentionProgramsAnalysis(req.user.tenantId),
    };
  }

  @Get("ltv")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer lifetime value calculations" })
  async getLtv(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerLtvCalculation(req.user.tenantId),
    };
  }

  @Get("cohort-retention")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get cohort retention analysis" })
  async getCohortRetention(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCohortRetentionAnalysis(req.user.tenantId),
    };
  }

  @Get("nps")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get NPS score tracking over time" })
  async getNps(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getNpsTracking(req.user.tenantId) };
  }

  @Get("advocacy")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer advocacy management" })
  async getAdvocacy(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAdvocacyManagement(req.user.tenantId) };
  }

  @Get("churn-analysis")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get churn analysis report" })
  async getChurnAnalysis(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getChurnAnalysisReport(req.user.tenantId) };
  }

  @Get("onboarding-success")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get onboarding success metrics" })
  async getOnboardingSuccess(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getOnboardingSuccessMetrics(req.user.tenantId),
    };
  }

  @Get("expansion-revenue")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get expansion revenue tracking" })
  async getExpansionRevenue(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getExpansionRevenueTracking(req.user.tenantId),
    };
  }

  @Get("health-index")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer health index" })
  async getHealthIndex(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCustomerHealthIndex(req.user.tenantId) };
  }

  @Get("renewal-forecast")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get renewal forecast" })
  async getRenewalForecast(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getRenewalForecast(req.user.tenantId) };
  }

  @Get("segment-evolution")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer segment evolution" })
  async getSegmentEvolution(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerSegmentEvolution(req.user.tenantId),
    };
  }

  @Get("time-to-value")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get time to value analysis" })
  async getTimeToValue(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getTimeToValueAnalysis(req.user.tenantId) };
  }

  @Get("journey-heatmap")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer journey heatmap" })
  async getJourneyHeatmap(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerJourneyHeatmap(req.user.tenantId),
    };
  }

  @Get("engagement-scorecard")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get engagement scorecard by lifecycle stage" })
  async getEngagementScorecard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getEngagementScorecardByLifecycle(req.user.tenantId),
    };
  }

  @Get("playbook-effectiveness")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get success playbook effectiveness" })
  async getPlaybookEffectiveness(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSuccessPlaybookEffectiveness(req.user.tenantId),
    };
  }

  @Get("cs-kpis")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer success KPIs" })
  async getCsKpis(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCustomerSuccessKpis(req.user.tenantId) };
  }

  @Get("dashboard")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer lifecycle dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerLifecycleDashboard(req.user.tenantId),
    };
  }

  @Get("alerts")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get alerts by lifecycle stage" })
  async getAlerts(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAlertsByLifecycleStage(req.user.tenantId),
    };
  }

  @Get("first-year-prediction")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get first year retention predictions" })
  async getFirstYearPrediction(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getFirstYearRetentionPrediction(req.user.tenantId),
    };
  }

  @Get("portfolio-summary")
  @Permissions("crm.customer.lifecycle.read")
  @ApiOperation({ summary: "Get customer portfolio summary" })
  async getPortfolioSummary(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerPortfolioSummary(req.user.tenantId),
    };
  }
}
