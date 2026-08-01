import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalSubscriptionTierEngineService } from "./saas-portal-subscription-tier-engine.service";

@ApiTags("SaasPortalSubscriptionTierEngine")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/subscription-tier-engine")
export class SaasPortalSubscriptionTierEngineController {
  constructor(
    private readonly tierService: SaasPortalSubscriptionTierEngineService,
  ) {}

  @ApiOperation({ summary: "Upgrade subscription plan" })
  @Permissions("saas_portal.subscription.update")
  @Post("upgrade")
  async upgradePlan(
    @Req() req: any,
    @Body() dto: { fromTier: string; toTier: string; proratedCharge: number },
  ) {
    return this.tierService.upgradePlan(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Record plan downgrade reason" })
  @Permissions("saas_portal.subscription.update")
  @Post("downgrade-reason")
  async downgradePlanReason(
    @Req() req: any,
    @Body() dto: { reasonCategory: string; feedback?: string },
  ) {
    return this.tierService.downgradePlanReason(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get plan upgrade history" })
  @Permissions("saas_portal.subscription.read")
  @Get("upgrades")
  async getUpgradeHistory(@Req() req: any) {
    return this.tierService.getUpgradeHistory(req.user.tenantId);
  }
}
