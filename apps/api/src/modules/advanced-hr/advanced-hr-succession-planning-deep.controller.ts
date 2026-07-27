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
import { AdvancedHrSuccessionPlanningDeepService } from "./advanced-hr-succession-planning-deep.service";

@ApiTags("AdvancedHrSuccessionPlanningDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/succession-planning-deep")
export class AdvancedHrSuccessionPlanningDeepController {
  constructor(
    private readonly successionService: AdvancedHrSuccessionPlanningDeepService,
  ) {}

  @ApiOperation({ summary: "Get succession plans" })
  @Permissions("advanced-hr.succession.read")
  @Get("plans")
  async getPlans(@Req() req: any) {
    return this.successionService.getPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create succession plan" })
  @Permissions("advanced-hr.succession.create")
  @Post("plans")
  async createPlan(
    @Req() req: any,
    @Body()
    dto: { planName: string; targetRoleId: string; urgencyLevel?: string },
  ) {
    return this.successionService.createPlan(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Nominate successor candidate" })
  @Permissions("advanced-hr.succession.update")
  @Post("plans/:id/candidates")
  async nominateCandidate(
    @Req() req: any,
    @Param("id") planId: string,
    @Body()
    dto: { employeeId: string; readinessScore: number; readinessLevel: string },
  ) {
    return this.successionService.nominateCandidate(
      planId,
      req.user.tenantId,
      dto,
    );
  }
}
