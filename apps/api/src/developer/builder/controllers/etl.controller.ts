import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { BuilderEtlService } from "../services/builder-etl.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller("builder")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EtlController {
  constructor(private readonly service: BuilderEtlService) {}

  @Get("etl/data-sources")
  @Permissions("builder.etl.read")
  async getDataSources(@Req() req: AuthenticatedRequest) {
    return this.service.getDataSources(req.user.tenantId);
  }

  @Post("etl/data-sources")
  @Permissions("builder.etl.create")
  async createDataSource(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.service.createDataSource(req.user.tenantId, dto);
  }

  @Patch("etl/data-sources/:id")
  @Permissions("builder.etl.update")
  async updateDataSource(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updateDataSource(req.user.tenantId, id, dto);
  }

  @Delete("etl/data-sources/:id")
  @Permissions("builder.etl.delete")
  async deleteDataSource(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteDataSource(req.user.tenantId, id);
  }

  @Get("etl/pipelines")
  @Permissions("builder.etl.read")
  async getPipelines(
    @Req() req: AuthenticatedRequest,
    @Query("search") search?: string,
  ) {
    return this.service.getPipelines(req.user.tenantId, { search });
  }

  @Get("etl/pipelines/:id")
  @Permissions("builder.etl.read")
  async getPipelineById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getPipelineById(req.user.tenantId, id);
  }

  @Post("etl/pipelines")
  @Permissions("builder.etl.create")
  async buildTransformationPipeline(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.service.buildTransformationPipeline(req.user.tenantId, dto);
  }

  @Patch("etl/pipelines/:id")
  @Permissions("builder.etl.update")
  async updatePipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.updatePipeline(req.user.tenantId, id, dto);
  }

  @Delete("etl/pipelines/:id")
  @Permissions("builder.etl.delete")
  async deletePipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deletePipeline(req.user.tenantId, id);
  }

  @Post("etl/pipelines/:id/execute")
  @Permissions("builder.etl.execute")
  async executeETLJob(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.executeETLJob(req.user.tenantId, id, dto);
  }

  @Get("etl/pipelines/:id/jobs")
  @Permissions("builder.etl.read")
  async getJobRuns(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.getJobRuns(req.user.tenantId, id);
  }

  @Post("etl/pipelines/:id/preview")
  @Permissions("builder.etl.read")
  async previewTransformation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.service.previewTransformation(req.user.tenantId, id, dto);
  }

  @Get("etl/dashboard")
  @Permissions("builder.etl.read")
  async getETLDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getETLDashboard(req.user.tenantId);
  }
}
