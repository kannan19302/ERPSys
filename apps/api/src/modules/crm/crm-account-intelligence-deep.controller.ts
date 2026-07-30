// @ts-nocheck
import { Controller, Get, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmAccountIntelligenceDeepService } from "./crm-account-intelligence-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / account-intelligence-deep")
@ApiBearerAuth()
@Controller("crm/account-intelligence-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmAccountIntelligenceDeepController {
  constructor(private readonly svc: CrmAccountIntelligenceDeepService) {}

  @Get("health-scores")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account health scores" })
  async getHealthScores(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountHealthScores(req.user.tenantId) };
  }

  @Get("expansion-signals")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account expansion signals" })
  async getExpansionSignals(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getExpansionSignals(req.user.tenantId) };
  }

  @Get("churn-risk")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get churn risk accounts" })
  async getChurnRisk(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getChurnRiskAccounts(req.user.tenantId) };
  }

  @Get("product-adoption")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get product adoption analysis" })
  async getProductAdoption(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getProductAdoptionAnalysis(req.user.tenantId),
    };
  }

  @Get("engagement-analytics")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get contact engagement analytics" })
  async getEngagementAnalytics(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getEngagementAnalytics(req.user.tenantId) };
  }

  @Get("relationship-mapping/:customerId")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get relationship mapping for an account" })
  async getRelationshipMapping(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.svc.getRelationshipMapping(
        req.user.tenantId,
        customerId,
      ),
    };
  }

  @Get("stakeholder-tracking")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get stakeholder tracking data" })
  async getStakeholderTracking(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getStakeholderTracking(req.user.tenantId) };
  }

  @Get("growth-trends")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account growth trends" })
  async getGrowthTrends(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountGrowthTrends(req.user.tenantId) };
  }

  @Get("key-accounts")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get key account summary" })
  async getKeyAccounts(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getKeyAccountSummary(req.user.tenantId) };
  }

  @Get("whitespace")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get whitespace analysis for expansion" })
  async getWhitespace(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getWhitespaceAnalysis(req.user.tenantId) };
  }

  @Get("summary")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account executive summary" })
  async getExecutiveSummary(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAccountExecutiveSummary(req.user.tenantId),
    };
  }

  @Get("penetration-rate")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account penetration rate" })
  async getPenetrationRate(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAccountPenetrationRate(req.user.tenantId),
    };
  }

  @Get("at-risk")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get at-risk accounts" })
  async getAtRiskAccounts(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAtRiskAccounts(req.user.tenantId) };
  }

  @Get("influence-map/:customerId")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get contact influence map for an account" })
  async getInfluenceMap(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.svc.getContactInfluenceMap(
        req.user.tenantId,
        customerId,
      ),
    };
  }

  @Get("segmentation")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account segmentation analysis" })
  async getSegmentation(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountSegmentation(req.user.tenantId) };
  }

  @Get("recent-activities")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get recent account activities" })
  async getRecentActivities(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRecentAccountActivities(req.user.tenantId),
    };
  }

  @Get("revenue-trend")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account revenue trend" })
  async getRevenueTrend(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountRevenueTrend(req.user.tenantId) };
  }

  @Get("decision-maker-coverage")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get decision maker coverage statistics" })
  async getDecisionMakerCoverage(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDecisionMakerCoverage(req.user.tenantId) };
  }

  @Get("dashboard")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account intelligence dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAccountIntelligenceDashboard(req.user.tenantId),
    };
  }

  @Get("predictive-churn")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get predictive churn scores" })
  async getPredictiveChurn(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPredictiveChurnScore(req.user.tenantId) };
  }

  @Get("nps")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get NPS scores and breakdown" })
  async getNPS(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAccountNPS(req.user.tenantId) };
  }

  @Get("competitive-displacement")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get competitive displacement opportunities" })
  async getCompetitiveDisplacement(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCompetitiveDisplacement(req.user.tenantId),
    };
  }

  @Get("renewal-pipeline")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get upcoming renewal pipeline" })
  async getRenewalPipeline(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getRenewalPipeline(req.user.tenantId) };
  }

  @Get("touchpoint-frequency")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account touchpoint frequency analysis" })
  async getTouchpointFrequency(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAccountTouchpointFrequency(req.user.tenantId),
    };
  }

  @Get("health-dashboard")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account health summary dashboard" })
  async getHealthDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAccountHealthDashboard(req.user.tenantId),
    };
  }

  @Get("timeline/:customerId")
  @Permissions("crm.account.intelligence.read")
  @ApiOperation({ summary: "Get account intelligence timeline" })
  async getTimeline(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return {
      data: await this.svc.getAccountIntelligenceTimeline(
        req.user.tenantId,
        customerId,
      ),
    };
  }
}
