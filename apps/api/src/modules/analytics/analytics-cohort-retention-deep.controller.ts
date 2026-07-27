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
import { AnalyticsCohortRetentionDeepService } from "./analytics-cohort-retention-deep.service";

@ApiTags("AnalyticsCohortRetentionDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/cohort-retention-deep")
export class AnalyticsCohortRetentionDeepController {
  constructor(
    private readonly cohortService: AnalyticsCohortRetentionDeepService,
  ) {}

  @ApiOperation({ summary: "Get cohort retention analyses" })
  @Permissions("analytics.cohorts.read")
  @Get("analyses")
  async getAnalyses(@Req() req: any) {
    return this.cohortService.getAnalyses(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create cohort retention analysis" })
  @Permissions("analytics.cohorts.create")
  @Post("analyses")
  async createCohortAnalysis(
    @Req() req: any,
    @Body()
    dto: { cohortName: string; groupingRule: string; timeGranularity?: string },
  ) {
    return this.cohortService.createCohortAnalysis(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Add cohort snapshot group" })
  @Permissions("analytics.cohorts.update")
  @Post("analyses/:id/groups")
  async addCohortGroup(
    @Req() req: any,
    @Param("id") analysisId: string,
    @Body()
    dto: { cohortDate: string; initialUsers: number; retentionRates?: any },
  ) {
    return this.cohortService.addCohortGroup(
      analysisId,
      req.user.tenantId,
      dto,
    );
  }
}
