import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasOnboardingFlowDeepService } from "./saas-onboarding-flow-deep.service";

@ApiTags("SaasOnboardingFlowDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/onboarding-flow-deep")
export class SaasOnboardingFlowDeepController {
  constructor(
    private readonly onboardingService: SaasOnboardingFlowDeepService,
  ) {}

  @ApiOperation({ summary: "Get tenant onboarding checklist" })
  @Permissions("saas.onboarding.read")
  @Get("checklist")
  async getChecklist(@Req() req: any) {
    return this.onboardingService.getOnboardingChecklist(req.user.tenantId);
  }

  @ApiOperation({ summary: "Complete onboarding step" })
  @Permissions("saas.onboarding.update")
  @Post("checklist/:stepId/complete")
  async completeStep(@Req() req: any, @Param("stepId") stepId: string) {
    return this.onboardingService.completeStep(req.user.tenantId, stepId);
  }
}
