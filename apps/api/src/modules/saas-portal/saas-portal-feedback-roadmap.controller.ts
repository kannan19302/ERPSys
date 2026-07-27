import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalFeedbackRoadmapService } from "./saas-portal-feedback-roadmap.service";

@ApiTags("SaasPortalFeedbackRoadmap")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/feedback-roadmap")
export class SaasPortalFeedbackRoadmapController {
  constructor(
    private readonly feedbackService: SaasPortalFeedbackRoadmapService,
  ) {}

  @ApiOperation({ summary: "Get public feature requests & roadmap" })
  @Permissions("saas_portal.feedback.read")
  @Get("requests")
  async getFeatureRequests() {
    return this.feedbackService.getFeatureRequests();
  }

  @ApiOperation({ summary: "Submit feature request" })
  @Permissions("saas_portal.feedback.create")
  @Post("requests")
  async submitFeatureRequest(
    @Req() req: any,
    @Body() dto: { title: string; description: string; category: string },
  ) {
    return this.feedbackService.submitFeatureRequest(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Vote on feature request" })
  @Permissions("saas_portal.feedback.update")
  @Post("requests/:id/vote")
  async voteFeatureRequest(@Req() req: any, @Param("id") requestId: string) {
    return this.feedbackService.voteFeatureRequest(
      req.user.tenantId,
      req.user.userId,
      requestId,
    );
  }
}
