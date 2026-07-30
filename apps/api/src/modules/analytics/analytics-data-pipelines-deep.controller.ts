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
import { AnalyticsDataPipelinesDeepService } from "./analytics-data-pipelines-deep.service";

@ApiTags("AnalyticsDataPipelinesDeep")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("analytics/data-pipelines-deep")
export class AnalyticsDataPipelinesDeepController {
  constructor(
    private readonly pipelineService: AnalyticsDataPipelinesDeepService,
  ) {}

  @ApiOperation({ summary: "Get analytics ETL data pipelines" })
  @Permissions("analytics.pipelines.read")
  @Get("pipelines")
  async getPipelines(@Req() req: any) {
    return this.pipelineService.getPipelines(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create analytics ETL pipeline" })
  @Permissions("analytics.pipelines.create")
  @Post("pipelines")
  async createPipeline(
    @Req() req: any,
    @Body()
    dto: {
      pipelineName: string;
      sourceDatasetId: string;
      targetDatasetId: string;
      transformationSql?: string;
    },
  ) {
    return this.pipelineService.createPipeline(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Trigger manual pipeline execution" })
  @Permissions("analytics.pipelines.update")
  @Post("pipelines/:id/run")
  async runPipeline(@Param("id") id: string) {
    return this.pipelineService.runPipeline(id);
  }
}
