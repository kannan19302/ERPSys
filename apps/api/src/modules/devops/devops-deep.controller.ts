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
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { DevopsDeepService } from "./devops-deep.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("devops")
@ApiBearerAuth()
@Controller("devops")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DevopsDeepController {
  constructor(private readonly svc: DevopsDeepService) {}

  /* ─── Pipelines ─── */
  @ApiOperation({ summary: "List pipelines" })
  @Get("pipelines")
  @Permissions("devops.pipeline.read")
  async listPipelines(@Req() req: AuthenticatedRequest) {
    return this.svc.listPipelines(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create pipeline" })
  @Post("pipelines")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.pipeline.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsPipeline")
  async createPipeline(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        stages: z.array(z.any()).optional(),
        trigger: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createPipeline(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Update pipeline" })
  @Put("pipelines/:id")
  @Permissions("devops.pipeline.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsPipeline")
  async updatePipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        description: z.string().optional(),
        stages: z.array(z.any()).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updatePipeline(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete pipeline" })
  @Delete("pipelines/:id")
  @Permissions("devops.pipeline.delete")
  async deletePipeline(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deletePipeline(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Run pipeline" })
  @Post("pipelines/:id/run")
  @Permissions("devops.pipeline.run")
  async runPipeline(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.runPipeline(req.user.tenantId, id, req.user.userId);
  }

  /* ─── Deployments ─── */
  @ApiOperation({ summary: "List deployments" })
  @Get("deployments")
  @Permissions("devops.deployment.read")
  async listDeployments(@Req() req: AuthenticatedRequest) {
    return this.svc.listDeployments(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create deployment" })
  @Post("deployments")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.deployment.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsDeployment")
  async createDeployment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        version: z.string().min(1),
        environmentId: z.string().optional(),
        pipelineId: z.string().optional(),
        commitSha: z.string().optional(),
        branch: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createDeployment(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Rollback deployment" })
  @Post("deployments/:id/rollback")
  @Permissions("devops.deployment.rollback")
  async rollbackDeployment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.rollbackDeployment(req.user.tenantId, id);
  }

  /* ─── Environments ─── */
  @ApiOperation({ summary: "List environments" })
  @Get("environments")
  @Permissions("devops.environment.read")
  async listEnvironments(@Req() req: AuthenticatedRequest) {
    return this.svc.listEnvironments(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create environment" })
  @Post("environments")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.environment.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsEnvironment")
  async createEnvironment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        type: z.string().optional(),
        url: z.string().optional(),
        isProtected: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createEnvironment(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update environment" })
  @Put("environments/:id")
  @Permissions("devops.environment.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsEnvironment")
  async updateEnvironment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        url: z.string().optional(),
        isProtected: z.boolean().optional(),
        config: z.any().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateEnvironment(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete environment" })
  @Delete("environments/:id")
  @Permissions("devops.environment.delete")
  async deleteEnvironment(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteEnvironment(req.user.tenantId, id);
  }

  /* ─── Config Maps ─── */
  @ApiOperation({ summary: "List config maps" })
  @Get("config-maps")
  @Permissions("devops.config-map.read")
  async listConfigMaps(@Req() req: AuthenticatedRequest) {
    return this.svc.listConfigMaps(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create config map" })
  @Post("config-maps")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.config-map.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsConfigMap")
  async createConfigMap(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1), data: z.any() })) body: any,
  ) {
    return this.svc.createConfigMap(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update config map" })
  @Put("config-maps/:id")
  @Permissions("devops.config-map.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsConfigMap")
  async updateConfigMap(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ data: z.any() })) body: any,
  ) {
    return this.svc.updateConfigMap(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete config map" })
  @Delete("config-maps/:id")
  @Permissions("devops.config-map.delete")
  async deleteConfigMap(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteConfigMap(req.user.tenantId, id);
  }

  /* ─── Feature Flags ─── */
  @ApiOperation({ summary: "List feature flags" })
  @Get("feature-flags-deep")
  @Permissions("devops.feature-flag.read")
  async listFeatureFlags(@Req() req: AuthenticatedRequest) {
    return this.svc.listFeatureFlags(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create feature flag" })
  @Post("feature-flags-deep")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.feature-flag.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsFeatureFlag")
  async createFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        flagKey: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        rules: z.array(z.any()).optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createFeatureFlag(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update feature flag" })
  @Put("feature-flags-deep/:flagKey")
  @Permissions("devops.feature-flag.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsFeatureFlag")
  async updateFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param("flagKey") flagKey: string,
    @ZodBody(
      z.object({
        isEnabled: z.boolean().optional(),
        rules: z.array(z.any()).optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateFeatureFlag(req.user.tenantId, flagKey, body);
  }
  @ApiOperation({ summary: "Delete feature flag" })
  @Delete("feature-flags-deep/:flagKey")
  @Permissions("devops.feature-flag.delete")
  async deleteFeatureFlag(
    @Req() req: AuthenticatedRequest,
    @Param("flagKey") flagKey: string,
  ) {
    return this.svc.deleteFeatureFlag(req.user.tenantId, flagKey);
  }

  /* ─── Monitoring ─── */
  @ApiOperation({ summary: "List monitor dashboards" })
  @Get("monitor-dashboards")
  @Permissions("devops.monitor.read")
  async listMonitorDashboards(@Req() req: AuthenticatedRequest) {
    return this.svc.listMonitorDashboards(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create monitor dashboard" })
  @Post("monitor-dashboards")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.monitor.create")
  async createMonitorDashboard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        widgets: z.array(z.any()).optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createMonitorDashboard(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete monitor dashboard" })
  @Delete("monitor-dashboards/:id")
  @Permissions("devops.monitor.delete")
  async deleteMonitorDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteMonitorDashboard(req.user.tenantId, id);
  }

  /* ─── Alerts ─── */
  @ApiOperation({ summary: "List alert configs" })
  @Get("alert-configs")
  @Permissions("devops.alert.read")
  async listAlertConfigs(@Req() req: AuthenticatedRequest) {
    return this.svc.listAlertConfigs(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create alert config" })
  @Post("alert-configs")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.alert.create")
  async createAlertConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        metric: z.string().min(1),
        condition: z.string().min(1),
        threshold: z.number(),
        severity: z.string().optional(),
        channels: z.array(z.string()).optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createAlertConfig(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update alert config" })
  @Put("alert-configs/:id")
  @Permissions("devops.alert.update")
  async updateAlertConfig(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        threshold: z.number().optional(),
        isActive: z.boolean().optional(),
        channels: z.array(z.string()).optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateAlertConfig(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete alert config" })
  @Delete("alert-configs/:id")
  @Permissions("devops.alert.delete")
  async deleteAlertConfig(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteAlertConfig(req.user.tenantId, id);
  }

  /* ─── Logs ─── */
  @ApiOperation({ summary: "List deployment logs" })
  @Get("logs")
  @Permissions("devops.log.read")
  async listLogs(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("source") source?: string,
    @Query("level") level?: string,
  ) {
    return this.svc.listLogs(req.user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      source,
      level,
    });
  }
  @ApiOperation({ summary: "Export logs" })
  @Post("logs/export")
  @Permissions("devops.log.export")
  async exportLogs(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ format: z.string().optional() })) body: any,
  ) {
    return this.svc.exportLogs(req.user.tenantId, body);
  }

  /* ─── Audit Logs ─── */
  @ApiOperation({ summary: "List devops audit logs" })
  @Get("audit-logs-deep")
  @Permissions("devops.audit-log.read")
  async listAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listAuditLogs(req.user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
  @ApiOperation({ summary: "Export devops audit logs" })
  @Post("audit-logs-deep/export")
  @Permissions("devops.audit-log.export")
  async exportAuditLogs(@Req() req: AuthenticatedRequest) {
    return this.svc.exportAuditLogs(req.user.tenantId);
  }

  /* ─── Backups ─── */
  @ApiOperation({ summary: "List backup jobs" })
  @Get("backup-jobs")
  @Permissions("devops.backup.read")
  async listBackupJobs(@Req() req: AuthenticatedRequest) {
    return this.svc.listBackupJobs(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create backup job" })
  @Post("backup-jobs")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.backup.create")
  async createBackupJob(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1), type: z.string().optional() }))
    body: any,
  ) {
    return this.svc.createBackupJob(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Restore from backup" })
  @Post("backup-jobs/:id/restore")
  @Permissions("devops.backup.restore")
  async restoreBackup(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.restoreBackup(req.user.tenantId, id);
  }

  /* ─── Migrations ─── */
  @ApiOperation({ summary: "List migration records" })
  @Get("migrations")
  @Permissions("devops.migration.read")
  async listMigrations(@Req() req: AuthenticatedRequest) {
    return this.svc.listMigrations(req.user.tenantId);
  }
  @ApiOperation({ summary: "Run migration" })
  @Post("migrations/run")
  @Permissions("devops.migration.run")
  async runMigration(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1) })) body: any,
  ) {
    return this.svc.runMigration(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Rollback migration" })
  @Post("migrations/rollback")
  @Permissions("devops.migration.rollback")
  async rollbackMigration(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string().min(1) })) body: any,
  ) {
    return this.svc.rollbackMigration(req.user.tenantId, req.user.userId, body);
  }

  /* ─── Health Checks ─── */
  @ApiOperation({ summary: "List health checks" })
  @Get("health-checks-deep")
  @Permissions("devops.health.read")
  async listHealthChecks(@Req() req: AuthenticatedRequest) {
    return this.svc.listHealthChecks(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create health check" })
  @Post("health-checks-deep")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.health.create")
  async createHealthCheck(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        endpoint: z.string().min(1),
        method: z.string().optional(),
        intervalSec: z.number().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createHealthCheck(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete health check" })
  @Delete("health-checks-deep/:id")
  @Permissions("devops.health.delete")
  async deleteHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteHealthCheck(req.user.tenantId, id);
  }

  /* ─── Performance ─── */
  @ApiOperation({ summary: "Get performance metrics" })
  @Get("performance")
  @Permissions("devops.performance.read")
  async getPerformance(
    @Req() req: AuthenticatedRequest,
    @Query("metric") metric?: string,
  ) {
    return this.svc.getPerformance(req.user.tenantId, metric);
  }

  /* ─── Errors ─── */
  @ApiOperation({ summary: "List error records" })
  @Get("errors")
  @Permissions("devops.error.read")
  async listErrors(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listErrors(req.user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
  @ApiOperation({ summary: "Resolve error" })
  @Post("errors/:id/resolve")
  @Permissions("devops.error.resolve")
  async resolveError(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.resolveError(req.user.tenantId, id, req.user.userId);
  }

  /* ─── Uptime ─── */
  @ApiOperation({ summary: "List uptime records" })
  @Get("uptime")
  @Permissions("devops.uptime.read")
  async listUptimeRecords(
    @Req() req: AuthenticatedRequest,
    @Query("checkId") checkId?: string,
  ) {
    return this.svc.listUptimeRecords(req.user.tenantId, checkId);
  }

  /* ─── SLA Contracts ─── */
  @ApiOperation({ summary: "List SLA contracts" })
  @Get("sla-contracts")
  @Permissions("devops.sla.read")
  async listSlaContracts(@Req() req: AuthenticatedRequest) {
    return this.svc.listSlaContracts(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create SLA contract" })
  @Post("sla-contracts")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.sla.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsSlaContract")
  async createSlaContract(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        uptimePct: z.number(),
        responseTimeMs: z.number().optional(),
        startDate: z.string().min(1),
        endDate: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createSlaContract(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update SLA contract" })
  @Put("sla-contracts/:id")
  @Permissions("devops.sla.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsSlaContract")
  async updateSlaContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        uptimePct: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateSlaContract(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete SLA contract" })
  @Delete("sla-contracts/:id")
  @Permissions("devops.sla.delete")
  async deleteSlaContract(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSlaContract(req.user.tenantId, id);
  }

  /* ─── Incidents ─── */
  @ApiOperation({ summary: "List incidents" })
  @Get("incidents")
  @Permissions("devops.incident.read")
  async listIncidents(@Req() req: AuthenticatedRequest) {
    return this.svc.listIncidents(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create incident" })
  @Post("incidents")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.incident.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsIncident")
  async createIncident(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        severity: z.string().optional(),
        source: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createIncident(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update incident" })
  @Put("incidents/:id")
  @Permissions("devops.incident.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsIncident")
  async updateIncident(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        status: z.string().optional(),
        severity: z.string().optional(),
        assignedTo: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateIncident(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Resolve incident" })
  @Post("incidents/:id/resolve")
  @Permissions("devops.incident.resolve")
  async resolveIncident(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.resolveIncident(req.user.tenantId, id, req.user.userId);
  }

  /* ─── Capacity Plans ─── */
  @ApiOperation({ summary: "List capacity plans" })
  @Get("capacity-plans")
  @Permissions("devops.capacity.read")
  async listCapacityPlans(@Req() req: AuthenticatedRequest) {
    return this.svc.listCapacityPlans(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create capacity plan" })
  @Post("capacity-plans")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.capacity.create")
  async createCapacityPlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        resourceType: z.string().min(1),
        currentValue: z.number(),
        projectedValue: z.number().optional(),
        thresholdPct: z.number().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createCapacityPlan(req.user.tenantId, body);
  }

  /* ─── Resource Metrics ─── */
  @ApiOperation({ summary: "Get resource metrics" })
  @Get("resources")
  @Permissions("devops.resource.read")
  async getResourceMetrics(@Req() req: AuthenticatedRequest) {
    return this.svc.getResourceMetrics(req.user.tenantId);
  }

  /* ─── Change Requests ─── */
  @ApiOperation({ summary: "List change requests" })
  @Get("change-requests")
  @Permissions("devops.change-request.read")
  async listChangeRequests(@Req() req: AuthenticatedRequest) {
    return this.svc.listChangeRequests(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create change request" })
  @Post("change-requests")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("devops.change-request.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("DevopsChangeRequest")
  async createChangeRequest(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.string().optional(),
        riskLevel: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createChangeRequest(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }
  @ApiOperation({ summary: "Approve change request" })
  @Post("change-requests/:id/approve")
  @Permissions("devops.change-request.approve")
  async approveChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.approveChangeRequest(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }
}
