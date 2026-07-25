import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmCustomerExperienceDeepService } from "./crm-customer-experience-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / customer-experience-deep")
@ApiBearerAuth()
@Controller("crm/customer-experience-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCustomerExperienceDeepController {
  constructor(private readonly svc: CrmCustomerExperienceDeepService) {}

  @Get("csat")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get CSAT scores and breakdown" })
  async getCsat(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCsatScores(req.user.tenantId) };
  }

  @Get("feedback-analysis")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get customer feedback analysis" })
  async getFeedbackAnalysis(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerFeedbackAnalysis(req.user.tenantId),
    };
  }

  @Get("support-tickets")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get support ticket analysis" })
  async getSupportTickets(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSupportTicketAnalysis(req.user.tenantId) };
  }

  @Get("ces")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get customer effort score" })
  async getCes(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCustomerEffortScore(req.user.tenantId) };
  }

  @Get("reputation")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get online reputation monitoring data" })
  async getReputation(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getOnlineReputationMonitoring(req.user.tenantId),
    };
  }

  @Get("journey-analytics")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get customer journey analytics" })
  async getJourneyAnalytics(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerJourneyAnalytics(req.user.tenantId),
    };
  }

  @Get("voice-of-customer")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get voice of customer programs" })
  async getVoiceOfCustomer(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getVoiceOfCustomerProgram(req.user.tenantId),
    };
  }

  @Get("experience-gaps")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get experience gaps analysis" })
  async getExperienceGaps(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getExperienceGapsAnalysis(req.user.tenantId),
    };
  }

  @Get("personalized-recommendations")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get personalized engagement recommendations" })
  async getPersonalizedRecommendations(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getPersonalizedEngagementRecommendations(
        req.user.tenantId,
      ),
    };
  }

  @Get("cs-metrics-rollup")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get customer success metrics rollup" })
  async getCsMetricsRollup(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerSuccessMetricsRollup(req.user.tenantId),
    };
  }

  @Get("interaction-quality")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get interaction quality score" })
  async getInteractionQuality(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getInteractionQualityScore(req.user.tenantId),
    };
  }

  @Get("proactive-outreach")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get proactive outreach effectiveness" })
  async getProactiveOutreach(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getProactiveOutreachEffectiveness(req.user.tenantId),
    };
  }

  @Get("community-engagement")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get community engagement metrics" })
  async getCommunityEngagement(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCommunityEngagementMetrics(req.user.tenantId),
    };
  }

  @Get("dashboard")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get customer experience dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getCustomerExperienceDashboard(req.user.tenantId),
    };
  }

  @Get("knowledge-base")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get knowledge base effectiveness metrics" })
  async getKnowledgeBase(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getKnowledgeBaseEffectiveness(req.user.tenantId),
    };
  }

  @Get("benchmarking")
  @Permissions("crm.customer.experience.read")
  @ApiOperation({ summary: "Get experience benchmarking vs industry" })
  async getBenchmarking(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getExperienceBenchmarking(req.user.tenantId),
    };
  }
}
