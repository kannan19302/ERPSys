import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingDataDrilldownDeepService } from "./reporting-data-drilldown-deep.service";

@ApiTags("ReportingDataDrilldownDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/data-drilldown-deep")
export class ReportingDataDrilldownDeepController {
  constructor(
    private readonly drilldownService: ReportingDataDrilldownDeepService,
  ) {}

  @ApiOperation({ summary: "Get available report drilldown dimension paths" })
  @Permissions("reporting.drilldown.read")
  @Get("paths")
  async getDrilldownPaths(@Req() req: any) {
    return this.drilldownService.getDrilldownPaths(req.user.tenantId);
  }

  @ApiOperation({ summary: "Execute dimensional data drilldown query" })
  @Permissions("reporting.drilldown.execute")
  @Post("execute")
  async executeDrilldown(
    @Req() req: any,
    @Body() dto: { dimension: string; filterValue: string; metricKey: string },
  ) {
    return this.drilldownService.executeDrilldown(req.user.tenantId, dto);
  }
}
