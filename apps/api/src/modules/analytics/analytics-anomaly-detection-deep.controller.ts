// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AnalyticsAnomalyDetectionDeepService } from "./analytics-anomaly-detection-deep.service";

@ApiTags("AnalyticsAnomalyDetectionDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/anomaly-detection-deep")
export class AnalyticsAnomalyDetectionDeepController {
  constructor(
    private readonly anomalyService: AnalyticsAnomalyDetectionDeepService,
  ) {}

  @ApiOperation({ summary: "Get automated metric anomalies" })
  @Permissions("analytics.anomalies.read")
  @Get("anomalies")
  async getAnomalies(@Req() req: any) {
    return this.anomalyService.getAnomalies(req.user.tenantId);
  }
}
