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
import { HrGlobalPayrollDeepService } from "./hr-global-payroll-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced / global-payroll-deep")
@ApiBearerAuth()
@Controller("hr-advanced/global-payroll-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrGlobalPayrollDeepController {
  constructor(private readonly svc: HrGlobalPayrollDeepService) {}

  @Post("tax-withholding-configs")
  @Permissions("hr.payroll.withholding.create")
  @ApiOperation({ summary: "Create country tax withholding rule" })
  async createTaxWithholdingConfig(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      countryCode: string;
      taxCategory:
        | "INCOME_TAX"
        | "SOCIAL_SECURITY"
        | "HEALTH_INSURANCE"
        | "PENSION"
        | "LOCAL_TAX";
      withholdingRatePercent: number;
      exemptionAmount?: number;
    },
  ) {
    return {
      data: await this.svc.createTaxWithholdingConfig(req.user.tenantId, body),
    };
  }

  @Get("tax-withholding-configs")
  @Permissions("hr.payroll.withholding.read")
  @ApiOperation({ summary: "Get country tax withholding rules" })
  async getTaxWithholdingConfigs(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getTaxWithholdingConfigs(req.user.tenantId) };
  }

  @Post("calculate-gross-up")
  @Permissions("hr.payroll.grossup.calculate")
  @ApiOperation({
    summary: "Calculate tax gross-up required for target net bonus",
  })
  async calculateGrossUpAmount(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      netTargetAmount: number;
      countryCode?: string;
      estimatedTaxRatePercent?: number;
    },
  ) {
    return {
      data: await this.svc.calculateGrossUpAmount(req.user.tenantId, body),
    };
  }

  @Post("retroactive-adjustments")
  @Permissions("hr.payroll.retro.create")
  @ApiOperation({
    summary: "Process retroactive salary increase back-pay calculation",
  })
  async processRetroactivePayAdjustment(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      effectiveDate: string;
      newSalaryAmount: number;
    },
  ) {
    return {
      data: await this.svc.processRetroactivePayAdjustment(
        req.user.tenantId,
        body.employeeId,
        body.effectiveDate,
        body.newSalaryAmount,
      ),
    };
  }

  @Get("garnishment-orders")
  @Permissions("hr.payroll.garnishment.read")
  @ApiOperation({ summary: "Get court garnishment deduction orders" })
  async getGarnishmentOrders(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return {
      data: await this.svc.getGarnishmentOrders(req.user.tenantId, employeeId),
    };
  }
}
