// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrOrgChartSuccessionDeepService } from "./hr-org-chart-succession-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / org-chart-succession-deep")
@ApiBearerAuth()
@Controller("hr-advanced/org-chart-succession-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrOrgChartSuccessionDeepController {
  constructor(private readonly svc: HrOrgChartSuccessionDeepService) {}

  @Post("succession-plans")
  @Permissions("hr.succession.plan.create")
  @ApiOperation({ summary: "Create executive key position succession plan" })
  async createSuccessionPlan(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      keyPositionTitle: string;
      incumbentEmployeeId: string;
      readinessTimelineMonths?: number;
      candidateEmployeeIds: string[];
    },
  ) {
    return {
      data: await this.svc.createSuccessionPlan(req.user.tenantId, body),
    };
  }

  @Get("succession-plans")
  @Permissions("hr.succession.plan.read")
  @ApiOperation({ summary: "Get executive succession plans" })
  async getSuccessionPlans(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSuccessionPlans(req.user.tenantId) };
  }

  @Get("org-chart-tree")
  @Permissions("hr.orgchart.tree.read")
  @ApiOperation({ summary: "Get interactive matrix organization chart tree" })
  async getInteractiveOrgChartTree(
    @Req() req: AuthenticatedRequest,
    @Query("rootEmployeeId") rootEmployeeId?: string,
  ) {
    return {
      data: await this.svc.getInteractiveOrgChartTree(
        req.user.tenantId,
        rootEmployeeId,
      ),
    };
  }

  @Get("bench-strength")
  @Permissions("hr.succession.bench.read")
  @ApiOperation({
    summary: "Get leadership bench strength index & vacancy risk scoring",
  })
  async getBenchStrengthIndex(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getBenchStrengthIndex(req.user.tenantId) };
  }
}
