import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AdvancedHrOrgChartDeepService } from "./advanced-hr-org-chart-deep.service";

@ApiTags("AdvancedHrOrgChartDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/org-chart-deep")
export class AdvancedHrOrgChartDeepController {
  constructor(private readonly orgService: AdvancedHrOrgChartDeepService) {}

  @ApiOperation({ summary: "Get hierarchical org chart nodes" })
  @Permissions("advanced-hr.orgchart.read")
  @Get("nodes")
  async getOrgChart(@Req() req: any) {
    return this.orgService.getOrgChart(req.user.tenantId);
  }

  @ApiOperation({ summary: "Upsert org chart node" })
  @Permissions("advanced-hr.orgchart.update")
  @Post("nodes")
  async upsertNode(
    @Req() req: any,
    @Body()
    dto: {
      employeeId: string;
      parentNodeId?: string;
      jobTitle: string;
      department: string;
      reportingLevel: number;
      headcount?: number;
    },
  ) {
    return this.orgService.upsertNode(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get department headcount breakdown" })
  @Permissions("advanced-hr.orgchart.read")
  @Get("department-headcounts")
  async getDepartmentHeadcounts(@Req() req: any) {
    return this.orgService.getDepartmentHeadcounts(req.user.tenantId);
  }
}
