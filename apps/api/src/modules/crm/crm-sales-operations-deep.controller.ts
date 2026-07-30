// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmSalesOperationsDeepService } from "./crm-sales-operations-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / sales-operations-deep")
@ApiBearerAuth()
@Controller("crm/sales-operations-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmSalesOperationsDeepController {
  constructor(private readonly svc: CrmSalesOperationsDeepService) {}

  @Get("kpi-dashboard")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales ops KPI dashboard" })
  async getKpiDashboard(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSalesOpsKpiDashboard(req.user.tenantId) };
  }

  @Get("territory-coverage")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get territory coverage analysis" })
  async getTerritoryCoverage(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getTerritoryCoverageAnalysis(req.user.tenantId),
    };
  }

  @Get("headcount-productivity")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales headcount productivity metrics" })
  async getHeadcountProductivity(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesHeadcountProductivity(req.user.tenantId),
    };
  }

  @Get("bottlenecks")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get operational bottlenecks analysis" })
  async getBottlenecks(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getOperationalBottlenecks(req.user.tenantId),
    };
  }

  @Get("tech-stack")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales tech stack utilization" })
  async getTechStack(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesTechStackUtilization(req.user.tenantId),
    };
  }

  @Get("forecast-compliance")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get forecast submission compliance" })
  async getForecastCompliance(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getForecastSubmissionCompliance(req.user.tenantId),
    };
  }

  @Get("playbook-adherence")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales playbook adherence rate" })
  async getPlaybookAdherence(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesPlaybookAdherence(req.user.tenantId),
    };
  }

  @Get("data-quality")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get CRM data quality report" })
  async getDataQuality(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCrmDataQualityReport(req.user.tenantId) };
  }

  @Get("capacity-planning")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales capacity planning" })
  async getCapacityPlanning(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSalesCapacityPlanning(req.user.tenantId) };
  }

  @Get("incentive-structure")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales incentive structure" })
  async getIncentiveStructure(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesIncentiveStructure(req.user.tenantId),
    };
  }

  @Get("deal-room-utilization")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get deal room utilization metrics" })
  async getDealRoomUtilization(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDealRoomUtilization(req.user.tenantId) };
  }

  @Get("channel-performance")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales channel performance" })
  async getChannelPerformance(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesChannelPerformance(req.user.tenantId),
    };
  }

  @Get("ramp-time")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get ramp time analysis for new reps" })
  async getRampTime(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getRampTimAnalysis(req.user.tenantId) };
  }

  @Get("pipeline-velocity")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get pipeline velocity metrics" })
  async getPipelineVelocity(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getPipelineVelocityMetrics(req.user.tenantId),
    };
  }

  @Get("crm-adoption")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get CRM adoption metrics" })
  async getCrmAdoption(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getCrmAdoptionMetrics(req.user.tenantId) };
  }

  @Get("process-efficiency")
  @Permissions("crm.sales.ops.read")
  @ApiOperation({ summary: "Get sales process efficiency score" })
  async getProcessEfficiency(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getSalesProcessEfficiencyScore(req.user.tenantId),
    };
  }
}
