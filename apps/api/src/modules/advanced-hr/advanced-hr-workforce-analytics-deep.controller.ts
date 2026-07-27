import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AdvancedHrWorkforceAnalyticsDeepService } from "./advanced-hr-workforce-analytics-deep.service";

@ApiTags("AdvancedHrWorkforceAnalyticsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/workforce-analytics-deep")
export class AdvancedHrWorkforceAnalyticsDeepController {
  constructor(
    private readonly analyticsService: AdvancedHrWorkforceAnalyticsDeepService,
  ) {}

  @ApiOperation({ summary: "Get workforce analytics snapshots" })
  @Permissions("advanced-hr.analytics.read")
  @Get("snapshots")
  async getAnalytics(@Req() req: any) {
    return this.analyticsService.getAnalytics(req.user.tenantId);
  }

  @ApiOperation({ summary: "Generate workforce analytics snapshot" })
  @Permissions("advanced-hr.analytics.create")
  @Post("snapshots")
  async generateSnapshot(
    @Req() req: any,
    @Body()
    dto: {
      reportingPeriod: string;
      headcount: number;
      attritionRate: number;
      avgTenureYears: number;
      engagementScore: number;
    },
  ) {
    return this.analyticsService.generateSnapshot(req.user.tenantId, dto);
  }
}
