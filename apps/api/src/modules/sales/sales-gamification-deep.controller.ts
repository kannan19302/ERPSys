import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SalesGamificationDeepService } from "./sales-gamification-deep.service";

@ApiTags("SalesGamificationDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/gamification")
export class SalesGamificationDeepController {
  constructor(
    private readonly gamificationService: SalesGamificationDeepService,
  ) {}

  @ApiOperation({ summary: "Get sales leaderboards" })
  @Permissions("sales.gamification.read")
  @Get("leaderboard")
  async getLeaderboard(
    @Req() req: any,
    @Query("period") period?: string,
    @Query("metric") metric?: string,
  ) {
    return this.gamificationService.getLeaderboard(
      req.user.tenantId,
      period,
      metric,
    );
  }

  @ApiOperation({ summary: "Record sales activity score" })
  @Permissions("sales.gamification.update")
  @Post("record-activity")
  async recordActivity(
    @Req() req: any,
    @Body() dto: { salesRepId: string; metric: string; scoreDelta: number },
  ) {
    return this.gamificationService.recordRepActivity(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Get quota attainments" })
  @Permissions("sales.gamification.read")
  @Get("quota-attainment")
  async getQuotaAttainment(
    @Req() req: any,
    @Query("salesRepId") salesRepId?: string,
    @Query("period") period?: string,
  ) {
    return this.gamificationService.getQuotaAttainment(
      req.user.tenantId,
      salesRepId,
      period,
    );
  }

  @ApiOperation({ summary: "Set or update quota attainment" })
  @Permissions("sales.gamification.update")
  @Post("quota-attainment")
  async setQuotaAttainment(@Req() req: any, @Body() dto: any) {
    return this.gamificationService.setQuotaAttainment(req.user.tenantId, dto);
  }
}
