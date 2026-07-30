// @ts-nocheck
import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ReportingExportsDeepService } from "./reporting-exports-deep.service";

@ApiTags("ReportingExportsDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("reporting/exports-deep")
export class ReportingExportsDeepController {
  constructor(private readonly exportService: ReportingExportsDeepService) {}

  @ApiOperation({ summary: "Get export job history" })
  @Permissions("reporting.exports.read")
  @Get("jobs")
  async getExportJobs(@Req() req: any) {
    return this.exportService.getExportJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Request instant report export" })
  @Permissions("reporting.exports.create")
  @Post("jobs")
  async requestExport(
    @Req() req: any,
    @Body()
    dto: { reportType: string; exportFormat: string; filterParams?: any },
  ) {
    return this.exportService.requestExport(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }
}
