// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  Body,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { DevopsService } from "./devops.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  CreateDeploymentSchema,
  UpdateDeploymentSchema,
  CreateEnvironmentSchema,
  UpdateEnvironmentSchema,
  CreateEnvironmentConfigSchema,
  CreateReleaseSchema,
  UpdateReleaseSchema,
  CreateBuildLogSchema,
} from "@unerp/shared";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("devops")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RbacGuard)
export class DevopsController {
  constructor(private readonly devopsService: DevopsService) {}

  // Legacy admin/devops endpoints
  @Get("admin/devops/metrics")
  @Permissions("admin.devops.read")
  @ApiOperation({ summary: "Get system metrics" })
  async getMetrics() {
    const s = this.devopsService as any;
    return s.originalGetMetrics
      ? s.originalGetMetrics()
      : {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
        };
  }

  @Get("admin/devops/errors")
  @Permissions("admin.devops.read")
  @ApiOperation({ summary: "Get recent errors" })
  async getRecentErrors(@Req() req: AuthReq) {
    return (
      (this.devopsService as any).getRecentErrors?.(req.user.tenantId) || []
    );
  }

  @Get("admin/devops/integrations")
  @Permissions("admin.devops.read")
  @ApiOperation({ summary: "Get integration links" })
  async getIntegrations() {
    return (
      (this.devopsService as any).getIntegrationLinks?.() || {
        prometheus: "http://localhost:9090",
        grafana: "http://localhost:3000/d/unerp-dashboard",
      }
    );
  }

  // Deployments
  @Get("deployments")
  @Permissions("devops.deployment.read")
  @ApiOperation({ summary: "List deployments" })
  async getDeployments(
    @Req() req: AuthReq,
    @Query("environmentId") environmentId?: string,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.devopsService.getDeployments(
      req.user.tenantId,
      environmentId,
      status,
      +page,
      +limit,
    );
  }

  @Get("deployments/:id")
  @Permissions("devops.deployment.read")
  @ApiOperation({ summary: "Get deployment details" })
  async getDeployment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.getDeployment(req.user.tenantId, id);
  }

  @Post("deployments")
  @Permissions("devops.deployment.create")
  @ApiOperation({ summary: "Create deployment" })
  async createDeployment(
    @Req() req: AuthReq,
    @ZodBody(CreateDeploymentSchema) dto: any,
  ) {
    return this.devopsService.createDeployment(req.user.tenantId, dto);
  }

  @Put("deployments/:id")
  @Permissions("devops.deployment.update")
  @ApiOperation({ summary: "Update deployment" })
  async updateDeployment(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateDeploymentSchema) dto: any,
  ) {
    return this.devopsService.updateDeployment(req.user.tenantId, id, dto);
  }

  @Delete("deployments/:id")
  @Permissions("devops.deployment.delete")
  @ApiOperation({ summary: "Delete deployment" })
  async deleteDeployment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.deleteDeployment(req.user.tenantId, id);
  }

  @Post("deployments/:id/rollback")
  @Permissions("devops.deployment.rollback")
  @ApiOperation({ summary: "Rollback deployment" })
  async rollbackDeployment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.rollbackDeployment(
      req.user.tenantId,
      id,
      req.user.email,
    );
  }

  // Environment
  @Get("environments")
  @Permissions("devops.environment.read")
  @ApiOperation({ summary: "List environments" })
  async getEnvironments(@Req() req: AuthReq) {
    return this.devopsService.getEnvironments(req.user.tenantId);
  }

  @Get("environments/:id")
  @Permissions("devops.environment.read")
  @ApiOperation({ summary: "Get environment" })
  async getEnvironment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.getEnvironment(req.user.tenantId, id);
  }

  @Post("environments")
  @Permissions("devops.environment.create")
  @ApiOperation({ summary: "Create environment" })
  async createEnvironment(
    @Req() req: AuthReq,
    @ZodBody(CreateEnvironmentSchema) dto: any,
  ) {
    return this.devopsService.createEnvironment(req.user.tenantId, dto);
  }

  @Put("environments/:id")
  @Permissions("devops.environment.update")
  @ApiOperation({ summary: "Update environment" })
  async updateEnvironment(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateEnvironmentSchema) dto: any,
  ) {
    return this.devopsService.updateEnvironment(req.user.tenantId, id, dto);
  }

  @Delete("environments/:id")
  @Permissions("devops.environment.delete")
  @ApiOperation({ summary: "Delete environment" })
  async deleteEnvironment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.deleteEnvironment(req.user.tenantId, id);
  }

  @Post("environments/:id/health")
  @Permissions("devops.environment.update")
  @ApiOperation({ summary: "Update health status" })
  async updateHealth(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body("healthStatus") healthStatus: string,
  ) {
    return this.devopsService.updateHealthStatus(
      req.user.tenantId,
      id,
      healthStatus,
    );
  }

  // Configs
  @Get("environments/:id/configs")
  @Permissions("devops.config.read")
  @ApiOperation({ summary: "Get environment configs" })
  async getConfigs(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.getEnvironmentConfigs(req.user.tenantId, id);
  }

  @Post("configs")
  @Permissions("devops.config.create")
  @ApiOperation({ summary: "Upsert config" })
  async upsertConfig(
    @Req() req: AuthReq,
    @ZodBody(CreateEnvironmentConfigSchema) dto: any,
  ) {
    return this.devopsService.upsertConfig(req.user.tenantId, dto);
  }

  @Delete("configs/:id")
  @Permissions("devops.config.delete")
  @ApiOperation({ summary: "Delete config" })
  async deleteConfig(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.deleteConfig(req.user.tenantId, id);
  }

  // Releases
  @Get("releases")
  @Permissions("devops.release.read")
  @ApiOperation({ summary: "List releases" })
  async getReleases(
    @Req() req: AuthReq,
    @Query("application") application?: string,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.devopsService.getReleases(
      req.user.tenantId,
      application,
      status,
      +page,
      +limit,
    );
  }

  @Get("releases/:id")
  @Permissions("devops.release.read")
  @ApiOperation({ summary: "Get release" })
  async getRelease(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.getRelease(req.user.tenantId, id);
  }

  @Post("releases")
  @Permissions("devops.release.create")
  @ApiOperation({ summary: "Create release" })
  async createRelease(
    @Req() req: AuthReq,
    @ZodBody(CreateReleaseSchema) dto: any,
  ) {
    return this.devopsService.createRelease(req.user.tenantId, dto);
  }

  @Put("releases/:id")
  @Permissions("devops.release.update")
  @ApiOperation({ summary: "Update release" })
  async updateRelease(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateReleaseSchema) dto: any,
  ) {
    return this.devopsService.updateRelease(req.user.tenantId, id, dto);
  }

  @Delete("releases/:id")
  @Permissions("devops.release.delete")
  @ApiOperation({ summary: "Delete release" })
  async deleteRelease(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.deleteRelease(req.user.tenantId, id);
  }

  @Post("releases/:id/approve")
  @Permissions("devops.release.approve")
  @ApiOperation({ summary: "Approve release" })
  async approveRelease(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.approveRelease(
      req.user.tenantId,
      id,
      req.user.email,
    );
  }

  @Post("releases/:id/deploy")
  @Permissions("devops.release.deploy")
  @ApiOperation({ summary: "Deploy release" })
  async deployRelease(@Req() req: AuthReq, @Param("id") id: string) {
    return this.devopsService.deployRelease(
      req.user.tenantId,
      id,
      req.user.email,
    );
  }

  // Build Logs
  @Get("build-logs")
  @Permissions("devops.build-log.read")
  @ApiOperation({ summary: "Get build logs" })
  async getBuildLogs(
    @Req() req: AuthReq,
    @Query("deploymentId") deploymentId: string,
    @Query("level") level?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "50",
  ) {
    return this.devopsService.getBuildLogs(
      req.user.tenantId,
      deploymentId,
      level,
      +page,
      +limit,
    );
  }

  @Post("build-logs")
  @Permissions("devops.build-log.read")
  @ApiOperation({ summary: "Create build log" })
  async createBuildLog(
    @Req() req: AuthReq,
    @ZodBody(CreateBuildLogSchema) dto: any,
  ) {
    return this.devopsService.createBuildLog(req.user.tenantId, dto);
  }

  // Analytics
  @Get("analytics")
  @Permissions("devops.analytics.read")
  @ApiOperation({ summary: "Get deployment analytics" })
  async getAnalytics(@Req() req: AuthReq, @Query("period") period?: string) {
    return this.devopsService.getAnalytics(req.user.tenantId, period);
  }

  @Post("analytics/compute")
  @Permissions("devops.analytics.read")
  @ApiOperation({ summary: "Compute deployment analytics" })
  async computeAnalytics(@Req() req: AuthReq) {
    return this.devopsService.computeAnalytics(req.user.tenantId);
  }

  // Stages
  @Get("stages/:deploymentId")
  @Permissions("devops.deployment.read")
  @ApiOperation({ summary: "Get deployment stages" })
  async getStages(
    @Req() req: AuthReq,
    @Param("deploymentId") deploymentId: string,
  ) {
    return this.devopsService.getDeploymentStages(
      req.user.tenantId,
      deploymentId,
    );
  }

  @Put("stages/:id/status")
  @Permissions("devops.deployment.update")
  @ApiOperation({ summary: "Update stage status" })
  async updateStageStatus(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("errorMessage") errorMessage?: string,
  ) {
    return this.devopsService.updateStageStatus(
      req.user.tenantId,
      id,
      status,
      errorMessage,
    );
  }
}
