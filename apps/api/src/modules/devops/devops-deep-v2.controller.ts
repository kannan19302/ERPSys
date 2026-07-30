// @ts-nocheck
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
import { DevopsDeepV2Service } from "./devops-deep-v2.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("devops")
@ApiBearerAuth()
@Controller("devops")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DevopsDeepV2Controller {
  constructor(private readonly svc: DevopsDeepV2Service) {}

  @ApiOperation({ summary: "Get pipeline stats" })
  @Get("pipelines/stats")
  @Permissions("devops.pipeline.read")
  async getPipelineStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getPipelineStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Trigger pipeline" })
  @Post("pipelines/:id/trigger")
  @Permissions("devops.pipeline.run")
  async triggerPipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.triggerPipeline(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get deployment stats" })
  @Get("deployments/stats")
  @Permissions("devops.deployment.read")
  async getDeploymentStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getDeploymentStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get deployment history" })
  @Get("deployments/history")
  @Permissions("devops.deployment.read")
  async getDeploymentHistory(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
  ) {
    return this.svc.getDeploymentHistory(
      req.user.tenantId,
      page ? parseInt(page) : 1,
    );
  }

  @ApiOperation({ summary: "Get environment stats" })
  @Get("environments/stats")
  @Permissions("devops.environment.read")
  async getEnvironmentStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getEnvironmentStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get config map stats" })
  @Get("config-maps/stats")
  @Permissions("devops.config-map.read")
  async getConfigMapStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getConfigMapStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get feature flag stats" })
  @Get("feature-flags/stats")
  @Permissions("devops.feature-flag.read")
  async getFeatureFlagStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getFeatureFlagStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get dashboard stats" })
  @Get("monitor-dashboards/stats")
  @Permissions("devops.monitor.read")
  async getDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getDashboardStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get alert stats" })
  @Get("alert-configs/stats")
  @Permissions("devops.alert.read")
  async getAlertStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getAlertStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Trigger alert" })
  @Post("alert-configs/:id/trigger")
  @Permissions("devops.alert.update")
  async triggerAlert(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.triggerAlert(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get log stats" })
  @Get("logs/stats")
  @Permissions("devops.log.read")
  async getLogStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getLogStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get backup stats" })
  @Get("backup-jobs/stats")
  @Permissions("devops.backup.read")
  async getBackupStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getBackupStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get migration stats" })
  @Get("migrations/stats")
  @Permissions("devops.migration.read")
  async getMigrationStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getMigrationStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get health check stats" })
  @Get("health-checks/stats")
  @Permissions("devops.health.read")
  async getHealthCheckStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getHealthCheckStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get error stats" })
  @Get("errors/stats")
  @Permissions("devops.error.read")
  async getErrorStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getErrorStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get uptime stats" })
  @Get("uptime/stats")
  @Permissions("devops.uptime.read")
  async getUptimeStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getUptimeStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get SLA stats" })
  @Get("sla-contracts/stats")
  @Permissions("devops.sla.read")
  async getSlaStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getSlaStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get incident stats" })
  @Get("incidents/stats")
  @Permissions("devops.incident.read")
  async getIncidentStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getIncidentStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get capacity plan stats" })
  @Get("capacity-plans/stats")
  @Permissions("devops.capacity.read")
  async getCapacityPlanStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getCapacityPlanStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get change request stats" })
  @Get("change-requests/stats")
  @Permissions("devops.change-request.read")
  async getChangeRequestStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getChangeRequestStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "List certificates" })
  @Get("certificates")
  @Permissions("devops.certificate.read")
  async listCertificates(@Req() req: AuthenticatedRequest) {
    return this.svc.listCertificates(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create certificate" })
  @Post("certificates")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.certificate.create")
  async createCertificate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string(),
        domain: z.string(),
        issuer: z.string().optional(),
        notBefore: z.string(),
        notAfter: z.string(),
        fingerprint: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createCertificate(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update certificate" })
  @Put("certificates/:id")
  @Permissions("devops.certificate.update")
  async updateCertificate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ isActive: z.boolean().optional() })) body: any,
  ) {
    return this.svc.updateCertificate(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete certificate" })
  @Delete("certificates/:id")
  @Permissions("devops.certificate.delete")
  async deleteCertificate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteCertificate(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Get certificate stats" })
  @Get("certificates/stats")
  @Permissions("devops.certificate.read")
  async getCertificateStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getCertificateStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get devops summary" })
  @Get("summary")
  @Permissions("devops.summary.read")
  async getDevopsSummary(@Req() req: AuthenticatedRequest) {
    return this.svc.getDevopsSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get performance metrics" })
  @Get("performance")
  @Permissions("devops.performance.read")
  async getPerformanceMetrics(@Req() req: AuthenticatedRequest) {
    return this.svc.getPerformanceMetrics(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get resource metrics" })
  @Get("resources")
  @Permissions("devops.resource.read")
  async getResourceMetrics(@Req() req: AuthenticatedRequest) {
    return this.svc.getResourceMetrics(req.user.tenantId);
  }
}
