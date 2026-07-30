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
import { HrBenefitsAdministrationDeepService } from "./hr-benefits-administration-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / benefits-administration-deep")
@ApiBearerAuth()
@Controller("hr-advanced/benefits-administration-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrBenefitsAdministrationDeepController {
  constructor(private readonly svc: HrBenefitsAdministrationDeepService) {}

  @Post("open-enrollment-cycles")
  @Permissions("hr.benefits.open.enrollment.create")
  @ApiOperation({
    summary: "Create annual open enrollment cycle & contribution caps",
  })
  async createOpenEnrollmentCycle(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      planYear: number;
      startDate: string;
      endDate: string;
      hsaMaxContributionIndividual?: number;
      hsaMaxContributionFamily?: number;
      fsaMaxContribution?: number;
    },
  ) {
    return {
      data: await this.svc.createOpenEnrollmentCycle(
        req.user.tenantId,
        body as any,
      ),
    };
  }

  @Get("open-enrollment-cycles")
  @Permissions("hr.benefits.open.enrollment.read")
  @ApiOperation({ summary: "Get open enrollment cycles" })
  async getOpenEnrollmentCycles(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getOpenEnrollmentCycles(req.user.tenantId) };
  }

  @Post("enrollments")
  @Permissions("hr.benefits.enrollment.create")
  @ApiOperation({ summary: "Submit employee benefit plan election" })
  async submitBenefitEnrollment(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      planId: string;
      coverageTier:
        | "EMPLOYEE_ONLY"
        | "EMPLOYEE_SPOUSE"
        | "EMPLOYEE_CHILDREN"
        | "FAMILY";
      employeeContributionMonthly: number;
      employerContributionMonthly: number;
    },
  ) {
    return {
      data: await this.svc.submitBenefitEnrollment(req.user.tenantId, body),
    };
  }

  @Post("cobra-notice")
  @Permissions("hr.benefits.cobra.create")
  @ApiOperation({
    summary: "Generate COBRA health continuation coverage election notice",
  })
  async generateCobraContinuationNotice(
    @Req() req: AuthenticatedRequest,
    @Body() body: { employeeId: string; qualifyingEvent: string },
  ) {
    return {
      data: await this.svc.generateCobraContinuationNotice(
        req.user.tenantId,
        body.employeeId,
        body.qualifyingEvent,
      ),
    };
  }

  @Get("calculate-401k-match")
  @Permissions("hr.benefits.401k.calculate")
  @ApiOperation({
    summary: "Calculate 401(k) company match formula for employee",
  })
  async calculate401kCompanyMatch(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId: string,
    @Query("annualSalary") annualSalary: string,
    @Query("employeeContributionPercent") employeeContributionPercent: string,
  ) {
    return {
      data: await this.svc.calculate401kCompanyMatch(
        req.user.tenantId,
        employeeId,
        parseFloat(annualSalary || "100000"),
        parseFloat(employeeContributionPercent || "6"),
      ),
    };
  }
}
