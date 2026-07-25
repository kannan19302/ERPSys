import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmMarketingRoiDeepService } from "./crm-marketing-roi-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / marketing-roi-deep")
@ApiBearerAuth()
@Controller("crm/marketing-roi-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmMarketingRoiDeepController {
  constructor(private readonly svc: CrmMarketingRoiDeepService) {}

  @Get("campaign-roi")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get campaign ROI analysis" })
  async getCampaignRoi(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCampaignRoiAnalysis(req.user.tenantId) };
  }

  @Get("attribution")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get attribution model analysis" })
  async getAttribution(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getAttributionModelAnalysis(req.user.tenantId),
    };
  }

  @Get("lead-sources")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get lead source analysis" })
  async getLeadSources(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getLeadSourceAnalysis(req.user.tenantId) };
  }

  @Get("content-performance")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get content performance metrics" })
  async getContentPerformance(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getContentPerformance(req.user.tenantId) };
  }

  @Get("ab-testing")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get A/B testing results" })
  async getAbTesting(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAbTestingResults(req.user.tenantId) };
  }

  @Get("spend-efficiency")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get spend efficiency analysis" })
  async getSpendEfficiency(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSpendEfficiencyAnalysis(req.user.tenantId),
    };
  }

  @Get("pipeline-influenced")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get pipeline influenced by marketing" })
  async getPipelineInfluenced(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getPipelineInfluencedByMarketing(req.user.tenantId),
    };
  }

  @Get("email-campaigns")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get email campaign performance" })
  async getEmailCampaigns(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getEmailCampaignPerformance(req.user.tenantId),
    };
  }

  @Get("seo-organic")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get SEO and organic performance" })
  async getSeoOrganic(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSeoOrganicPerformance(req.user.tenantId) };
  }

  @Get("social-media")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get social media ROI" })
  async getSocialMedia(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSocialMediaRoi(req.user.tenantId) };
  }

  @Get("paid-media")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get paid media performance" })
  async getPaidMedia(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPaidMediaPerformance(req.user.tenantId) };
  }

  @Get("lead-quality")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get lead quality by channel" })
  async getLeadQuality(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getLeadQualityByChannel(req.user.tenantId) };
  }

  @Get("funnel-metrics")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get marketing funnel metrics" })
  async getFunnelMetrics(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMarketingFunnelMetrics(req.user.tenantId),
    };
  }

  @Get("spend-allocation")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get marketing spend allocation" })
  async getSpendAllocation(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMarketingSpendAllocation(req.user.tenantId),
    };
  }

  @Get("mql-trend")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get MQL trend over time" })
  async getMqlTrend(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMarketingQualifiedLeadTrend(req.user.tenantId),
    };
  }

  @Get("campaign-lifecycle")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get campaign lifecycle analysis" })
  async getCampaignLifecycle(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCampaignLifecycleAnalysis(req.user.tenantId),
    };
  }

  @Get("event-roi")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get event marketing ROI" })
  async getEventRoi(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getEventMarketingRoi(req.user.tenantId) };
  }

  @Get("referral-program")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get referral program metrics" })
  async getReferralProgram(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getReferralProgramMetrics(req.user.tenantId),
    };
  }

  @Get("dashboard")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get marketing ROI dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getMarketingRoiDashboard(req.user.tenantId) };
  }

  @Get("cohort-revenue")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get cohort revenue analysis" })
  async getCohortRevenue(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCohortRevenueAnalysis(req.user.tenantId) };
  }

  @Get("personalization-impact")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get personalization impact metrics" })
  async getPersonalizationImpact(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPersonalizationImpact(req.user.tenantId) };
  }

  @Get("partner-marketing")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get partner marketing ROI" })
  async getPartnerMarketing(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getPartnerMarketingRoi(req.user.tenantId) };
  }

  @Get("benchmarks")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get marketing benchmarks vs industry" })
  async getBenchmarks(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getMarketingBenchmarks(req.user.tenantId) };
  }

  @Get("demand-generation")
  @Permissions("crm.marketing.roi.read")
  @ApiOperation({ summary: "Get demand generation summary" })
  async getDemandGeneration(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getDemandGenerationSummary(req.user.tenantId),
    };
  }
}
