import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { DevopsDeepV3Service } from "./devops-deep-v3.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("devops")
@ApiBearerAuth()
@Controller("devops")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DevopsDeepV3Controller {
  constructor(private readonly svc: DevopsDeepV3Service) {}

  @ApiOperation({ summary: "Get pipeline detail" })
  @Get("pipelines/:id")
  @Permissions("devops.pipeline.read")
  async getPipeline(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getPipeline(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Cancel pipeline run" })
  @Post("pipelines/:id/cancel")
  @Permissions("devops.pipeline.cancel")
  async cancelPipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.cancelPipeline(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get deployment detail" })
  @Get("deployments/:id")
  @Permissions("devops.deployment.read")
  async getDeployment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDeployment(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Cancel deployment" })
  @Post("deployments/:id/cancel")
  @Permissions("devops.deployment.cancel")
  async cancelDeployment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.cancelDeployment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get environment detail" })
  @Get("environments/:id")
  @Permissions("devops.environment.read")
  async getEnvironment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getEnvironment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get config map detail" })
  @Get("config-maps/:id")
  @Permissions("devops.config-map.read")
  async getConfigMap(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getConfigMap(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get feature flag detail" })
  @Get("feature-flags/:flagKey")
  @Permissions("devops.feature-flag.read")
  async getFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param("flagKey") flagKey: string,
  ) {
    return this.svc.getFeatureFlag(req.user.tenantId, flagKey);
  }
  @ApiOperation({ summary: "Enable feature flag" })
  @Post("feature-flags/:flagKey/enable")
  @Permissions("devops.feature-flag.update")
  async enableFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param("flagKey") flagKey: string,
  ) {
    return this.svc.enableFeatureFlag(req.user.tenantId, flagKey);
  }
  @ApiOperation({ summary: "Disable feature flag" })
  @Post("feature-flags/:flagKey/disable")
  @Permissions("devops.feature-flag.update")
  async disableFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param("flagKey") flagKey: string,
  ) {
    return this.svc.disableFeatureFlag(req.user.tenantId, flagKey);
  }

  @ApiOperation({ summary: "Get monitor dashboard detail" })
  @Get("monitor-dashboards/:id")
  @Permissions("devops.monitor.read")
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDashboard(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get alert config detail" })
  @Get("alert-configs/:id")
  @Permissions("devops.alert.read")
  async getAlertConfig(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getAlertConfig(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get log entry detail" })
  @Get("logs/:id")
  @Permissions("devops.log.read")
  async getLogEntry(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getLogEntry(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Export logs" })
  @Get("logs/export")
  @Permissions("devops.log.export")
  async exportLogs(
    @Req() req: AuthenticatedRequest,
    @Query("level") level?: string,
  ) {
    return this.svc.exportLogs(req.user.tenantId, level);
  }

  @ApiOperation({ summary: "Get backup job detail" })
  @Get("backup-jobs/:id")
  @Permissions("devops.backup.read")
  async getBackupJob(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getBackupJob(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get migration detail" })
  @Get("migrations/:id")
  @Permissions("devops.migration.read")
  async getMigration(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getMigration(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get health check detail" })
  @Get("health-checks/:id")
  @Permissions("devops.health.read")
  async getHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getHealthCheck(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get error detail" })
  @Get("errors/:id")
  @Permissions("devops.error.read")
  async getError(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getError(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get uptime detail" })
  @Get("uptime/:id")
  @Permissions("devops.uptime.read")
  async getUptime(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getUptime(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get SLA contract detail" })
  @Get("sla-contracts/:id")
  @Permissions("devops.sla.read")
  async getSlaContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSlaContract(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get incident detail" })
  @Get("incidents/:id")
  @Permissions("devops.incident.read")
  async getIncident(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getIncident(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get capacity plan detail" })
  @Get("capacity-plans/:id")
  @Permissions("devops.capacity.read")
  async getCapacityPlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getCapacityPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get change request detail" })
  @Get("change-requests/:id")
  @Permissions("devops.change-request.read")
  async getChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getChangeRequest(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Reject change request" })
  @Post("change-requests/:id/reject")
  @Permissions("devops.change-request.reject")
  async rejectChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.rejectChangeRequest(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get certificate detail" })
  @Get("certificates/:id")
  @Permissions("devops.certificate.read")
  async getCertificate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getCertificate(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Renew certificate" })
  @Post("certificates/:id/renew")
  @Permissions("devops.certificate.renew")
  async renewCertificate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.renewCertificate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get system health status" })
  @Get("system-health")
  @Permissions("devops.system-health.read")
  async getSystemHealth(@Req() req: AuthenticatedRequest) {
    return this.svc.getSystemHealth(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get real-time metrics" })
  @Get("realtime")
  @Permissions("devops.realtime.read")
  async getRealtimeMetrics(@Req() req: AuthenticatedRequest) {
    return this.svc.getRealtimeMetrics(req.user.tenantId);
  }
}
