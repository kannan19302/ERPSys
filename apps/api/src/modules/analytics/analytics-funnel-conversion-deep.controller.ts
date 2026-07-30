// @ts-nocheck
import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AnalyticsFunnelConversionDeepService } from "./analytics-funnel-conversion-deep.service";

@ApiTags("AnalyticsFunnelConversionDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/funnel-conversion-deep")
export class AnalyticsFunnelConversionDeepController {
  constructor(
    private readonly funnelService: AnalyticsFunnelConversionDeepService,
  ) {}

  @ApiOperation({ summary: "Get conversion funnel audit logs" })
  @Permissions("analytics.funnels.read")
  @Get("conversions")
  async getConversions(@Req() req: any) {
    return this.funnelService.getConversions(req.user.tenantId);
  }

  @ApiOperation({ summary: "Define funnel step event" })
  @Permissions("analytics.funnels.create")
  @Post("steps")
  async defineFunnelStep(
    @Req() req: any,
    @Body() dto: { funnelName: string; stepOrder: number; eventName: string },
  ) {
    return this.funnelService.defineFunnelStep(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Compute funnel conversion calculation" })
  @Permissions("analytics.funnels.update")
  @Post("compute")
  async computeFunnelConversion(
    @Req() req: any,
    @Body() dto: { funnelName: string; period?: string },
  ) {
    return this.funnelService.computeFunnelConversion(req.user.tenantId, dto);
  }
}
