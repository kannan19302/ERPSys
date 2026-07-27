import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AdvancedHrExitInterviewDeepService } from "./advanced-hr-exit-interview-deep.service";

@ApiTags("AdvancedHrExitInterviewDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-hr/exit-interview-deep")
export class AdvancedHrExitInterviewDeepController {
  constructor(
    private readonly exitService: AdvancedHrExitInterviewDeepService,
  ) {}

  @ApiOperation({ summary: "Get all exit interviews" })
  @Permissions("advanced-hr.exit.read")
  @Get("interviews")
  async getInterviews(@Req() req: any) {
    return this.exitService.getInterviews(req.user.tenantId);
  }

  @ApiOperation({ summary: "Record exit interview" })
  @Permissions("advanced-hr.exit.create")
  @Post("interviews")
  async recordInterview(
    @Req() req: any,
    @Body()
    dto: {
      employeeId: string;
      exitDate: string;
      exitReason: string;
      satisfactionScore: number;
      wouldRehire: boolean;
      comments?: string;
    },
  ) {
    return this.exitService.recordInterview(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get attrition insights & top exit reasons" })
  @Permissions("advanced-hr.exit.read")
  @Get("insights")
  async getAttritionInsights(@Req() req: any) {
    return this.exitService.getAttritionInsights(req.user.tenantId);
  }
}
