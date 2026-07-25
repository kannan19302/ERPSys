import { Controller, Get, Post, UseGuards, Req, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrPerformanceAppraisalsDeepService } from "./hr-performance-appraisals-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / performance-appraisals-deep")
@ApiBearerAuth()
@Controller("hr-advanced/performance-appraisals-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrPerformanceAppraisalsDeepController {
  constructor(private readonly svc: HrPerformanceAppraisalsDeepService) {}

  @Post("appraisal-cycles")
  @Permissions("hr.appraisal.cycle.create")
  @ApiOperation({
    summary: "Create enterprise 360-degree performance appraisal cycle",
  })
  async createAppraisalCycle(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      reviewPeriod: string;
      startDate: string;
      endDate: string;
      include360Feedback?: boolean;
    },
  ) {
    return {
      data: await this.svc.createAppraisalCycle(req.user.tenantId, body),
    };
  }

  @Get("appraisal-cycles")
  @Permissions("hr.appraisal.cycle.read")
  @ApiOperation({ summary: "Get performance appraisal cycles" })
  async getAppraisalCycles(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getAppraisalCycles(req.user.tenantId) };
  }

  @Post("calibrate-9box")
  @Permissions("hr.appraisal.9box.calibrate")
  @ApiOperation({
    summary: "Calibrate employee on 9-box performance vs potential grid",
  })
  async calibrateNineBoxGrid(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      performanceRating: "LOW" | "MEDIUM" | "HIGH";
      potentialRating: "LOW" | "MEDIUM" | "HIGH";
      notes?: string;
    },
  ) {
    return {
      data: await this.svc.calibrateNineBoxGrid(req.user.tenantId, body),
    };
  }

  @Get("9box-matrix")
  @Permissions("hr.appraisal.9box.read")
  @ApiOperation({ summary: "Get enterprise 9-box talent matrix distribution" })
  async getNineBoxTalentMatrix(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getNineBoxTalentMatrix(req.user.tenantId) };
  }

  @Get("merit-budget-pool")
  @Permissions("hr.appraisal.merit.read")
  @ApiOperation({
    summary: "Get merit salary increase budget pool guidelines and allocation",
  })
  async getMeritIncreaseBudgetPool(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMeritIncreaseBudgetPool(req.user.tenantId),
    };
  }
}
