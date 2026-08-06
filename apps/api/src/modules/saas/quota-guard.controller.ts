import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasQuotaGuardDeepService } from "./quota-guard.service";

@ApiTags("SaasQuotaGuardDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/quota-guard-deep")
export class SaasQuotaGuardDeepController {
  constructor(private readonly quotaService: SaasQuotaGuardDeepService) {}

  @ApiOperation({ summary: "Get tenant tier configs" })
  @Permissions("saas.quotas.read")
  @Get("tiers")
  async getTierConfigs(@Req() req: any) {
    return this.quotaService.getTierConfigs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Set or update tenant tier config" })
  @Permissions("saas.quotas.update")
  @Post("tiers")
  async setTierConfig(@Req() req: any, @Body() dto: any) {
    return this.quotaService.setTierConfig(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get custom resource quotas" })
  @Permissions("saas.quotas.read")
  @Get("custom-quotas")
  async getCustomQuotas(@Req() req: any) {
    return this.quotaService.getCustomQuotas(req.user.tenantId);
  }

  @ApiOperation({ summary: "Set or update custom resource quota" })
  @Permissions("saas.quotas.update")
  @Post("custom-quotas")
  async setCustomQuota(@Req() req: any, @Body() dto: any) {
    return this.quotaService.setCustomQuota(req.user.tenantId, dto);
  }
}
