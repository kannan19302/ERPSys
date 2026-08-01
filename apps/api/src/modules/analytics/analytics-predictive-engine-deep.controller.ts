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
import { AnalyticsPredictiveEngineDeepService } from "./analytics-predictive-engine-deep.service";

@ApiTags("AnalyticsPredictiveEngineDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/predictive-engine-deep")
export class AnalyticsPredictiveEngineDeepController {
  constructor(
    private readonly predictiveService: AnalyticsPredictiveEngineDeepService,
  ) {}

  @ApiOperation({ summary: "Get predictive AI/ML models" })
  @Permissions("analytics.predictive.read")
  @Get("models")
  async getModels(@Req() req: any) {
    return this.predictiveService.getModels(req.user.tenantId);
  }

  @ApiOperation({ summary: "Train predictive model" })
  @Permissions("analytics.predictive.create")
  @Post("models")
  async trainModel(
    @Req() req: any,
    @Body() dto: { modelName: string; algorithm: string; targetMetric: string },
  ) {
    return this.predictiveService.trainModel(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Run forecast simulation" })
  @Permissions("analytics.predictive.update")
  @Post("models/:id/forecast")
  async runForecast(
    @Req() req: any,
    @Param("id") modelId: string,
    @Body() dto: { forecastHorizon: string },
  ) {
    return this.predictiveService.runForecast(req.user.tenantId, modelId, dto);
  }
}
