// @ts-nocheck
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
import { AnalyticsCustomDashboardsDeepService } from "./analytics-custom-dashboards-deep.service";

@ApiTags("AnalyticsCustomDashboardsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/custom-dashboards-deep")
export class AnalyticsCustomDashboardsDeepController {
  constructor(
    private readonly dashboardService: AnalyticsCustomDashboardsDeepService,
  ) {}

  @ApiOperation({ summary: "Get custom analytics dashboards" })
  @Permissions("analytics.dashboards.read")
  @Get("dashboards")
  async getDashboards(@Req() req: any) {
    return this.dashboardService.getDashboards(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create custom analytics dashboard" })
  @Permissions("analytics.dashboards.create")
  @Post("dashboards")
  async createDashboard(
    @Req() req: any,
    @Body() dto: { name: string; description?: string; isPublic?: boolean },
  ) {
    return this.dashboardService.createDashboard(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({ summary: "Add widget to dashboard" })
  @Permissions("analytics.dashboards.update")
  @Post("dashboards/:id/widgets")
  async addWidget(
    @Param("id") dashboardId: string,
    @Body()
    dto: {
      title: string;
      widgetType: string;
      queryConfig?: any;
      layoutGrid?: any;
    },
  ) {
    return this.dashboardService.addWidget(dashboardId, dto);
  }
}
