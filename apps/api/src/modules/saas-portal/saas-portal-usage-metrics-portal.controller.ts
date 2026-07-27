import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalUsageMetricsPortalService } from "./saas-portal-usage-metrics-portal.service";

@ApiTags("SaasPortalUsageMetricsPortal")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas-portal/usage-metrics")
export class SaasPortalUsageMetricsPortalController {
  constructor(
    private readonly usageService: SaasPortalUsageMetricsPortalService,
  ) {}

  @ApiOperation({ summary: "Get portal tenant usage dashboard" })
  @Permissions("saas_portal.usage.read")
  @Get("dashboard")
  async getUsageDashboard(@Req() req: any, @Query("period") period?: string) {
    return this.usageService.getUsageDashboard(req.user.tenantId, period);
  }

  @ApiOperation({ summary: "Update portal usage metric snapshot" })
  @Permissions("saas_portal.usage.update")
  @Post("dashboard")
  async updateUsageMetric(@Req() req: any, @Body() dto: any) {
    return this.usageService.updateUsageMetric(req.user.tenantId, dto);
  }
}
