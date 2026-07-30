// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AnalyticsRealtimeStreamDeepService } from "./analytics-realtime-stream-deep.service";

@ApiTags("AnalyticsRealtimeStreamDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/realtime-stream-deep")
export class AnalyticsRealtimeStreamDeepController {
  constructor(
    private readonly realtimeService: AnalyticsRealtimeStreamDeepService,
  ) {}

  @ApiOperation({ summary: "Get real-time live system analytics metrics" })
  @Permissions("analytics.realtime.read")
  @Get("live")
  async getLiveMetrics(@Req() req: any) {
    return this.realtimeService.getLiveMetrics(req.user.tenantId);
  }
}
