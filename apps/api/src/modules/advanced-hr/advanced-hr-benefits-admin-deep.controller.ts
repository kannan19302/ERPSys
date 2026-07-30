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
import { AdvancedHrBenefitsAdminDeepService } from "./advanced-hr-benefits-admin-deep.service";

@ApiTags("AdvancedHrBenefitsAdminDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/benefits-admin-deep")
export class AdvancedHrBenefitsAdminDeepController {
  constructor(
    private readonly benefitsService: AdvancedHrBenefitsAdminDeepService,
  ) {}

  @ApiOperation({ summary: "Get employee benefits plans" })
  @Permissions("advanced-hr.benefits.read")
  @Get("plans")
  async getPlans(@Req() req: any) {
    return this.benefitsService.getPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create employee benefits plan" })
  @Permissions("advanced-hr.benefits.create")
  @Post("plans")
  async createPlan(
    @Req() req: any,
    @Body()
    dto: {
      planName: string;
      planType: string;
      providerName: string;
      employeeCost: number;
      employerCost: number;
    },
  ) {
    return this.benefitsService.createPlan(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Enroll employee in benefits plan" })
  @Permissions("advanced-hr.benefits.update")
  @Post("plans/:id/enroll")
  async enrollEmployee(
    @Req() req: any,
    @Param("id") planId: string,
    @Body() dto: { employeeId: string },
  ) {
    return this.benefitsService.enrollEmployee(
      planId,
      req.user.tenantId,
      dto.employeeId,
    );
  }
}
