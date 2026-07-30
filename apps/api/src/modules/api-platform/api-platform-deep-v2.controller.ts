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
import { ApiPlatformDeepV2Service } from "./api-platform-deep-v2.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("api-platform")
@ApiBearerAuth()
@Controller("api-platform")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ApiPlatformDeepV2Controller {
  constructor(private readonly svc: ApiPlatformDeepV2Service) {}

  @ApiOperation({ summary: "Rotate API key" })
  @Post("api-keys/:id/rotate")
  @Permissions("api-platform.api-key.rotate")
  async rotateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.rotateApiKey(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Get API key stats" })
  @Get("api-keys/stats")
  @Permissions("api-platform.api-key.read")
  async getApiKeyStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getApiKeyStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Revoke API key" })
  @Post("api-keys/:id/revoke")
  @Permissions("api-platform.api-key.revoke")
  async revokeApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.revokeApiKey(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Bulk revoke API keys" })
  @Post("api-keys/bulk-revoke")
  @Permissions("api-platform.api-key.revoke")
  async bulkRevokeApiKeys(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ ids: z.array(z.string()) })) body: any,
  ) {
    return this.svc.bulkRevokeApiKeys(req.user.tenantId, body.ids);
  }

  @ApiOperation({ summary: "Get rate limit stats" })
  @Get("rate-limits/stats")
  @Permissions("api-platform.rate-limit.read")
  async getRateLimitStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getRateLimitStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get rate limit usage" })
  @Get("rate-limits/:id/usage")
  @Permissions("api-platform.rate-limit.read")
  async getRateLimitUsage(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getRateLimitUsage(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Reset rate limit counters" })
  @Post("rate-limits/reset")
  @Permissions("api-platform.rate-limit.update")
  async resetRateLimits(@Req() req: AuthenticatedRequest) {
    return this.svc.resetRateLimits(req.user.tenantId);
  }

  @ApiOperation({ summary: "List webhook delivery logs" })
  @Get("webhooks/:webhookId/deliveries")
  @Permissions("api-platform.webhook-delivery.read")
  async listWebhookDeliveries(
    @Req() req: AuthenticatedRequest,
    @Param("webhookId") webhookId: string,
    @Query("page") page?: string,
  ) {
    return this.svc.listWebhookDeliveries(
      req.user.tenantId,
      webhookId,
      page ? parseInt(page) : 1,
    );
  }
  @ApiOperation({ summary: "Get webhook delivery detail" })
  @Get("webhook-deliveries/:id")
  @Permissions("api-platform.webhook-delivery.read")
  async getWebhookDelivery(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getWebhookDelivery(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Retry webhook delivery" })
  @Post("webhook-deliveries/:id/retry")
  @Permissions("api-platform.webhook-delivery.retry")
  async retryWebhookDelivery(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.retryWebhookDelivery(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Get webhook stats" })
  @Get("webhooks/stats")
  @Permissions("api-platform.webhook.read")
  async getWebhookStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getWebhookStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Test webhook" })
  @Post("webhooks/:id/test")
  @Permissions("api-platform.webhook.test")
  async testWebhook(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.testWebhook(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List CORS configs" })
  @Get("cors-configs")
  @Permissions("api-platform.cors.read")
  async listCorsConfigs(@Req() req: AuthenticatedRequest) {
    return this.svc.listCorsConfigs(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create CORS config" })
  @Post("cors-configs")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.cors.create")
  async createCorsConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        origin: z.string(),
        methods: z.array(z.string()).optional(),
        headers: z.array(z.string()).optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createCorsConfig(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update CORS config" })
  @Put("cors-configs/:origin")
  @Permissions("api-platform.cors.update")
  async updateCorsConfig(
    @Req() req: AuthenticatedRequest,
    @Param("origin") origin: string,
    @ZodBody(z.object({ methods: z.array(z.string()).optional() })) body: any,
  ) {
    return this.svc.updateCorsConfig(req.user.tenantId, origin, body);
  }
  @ApiOperation({ summary: "Delete CORS config" })
  @Delete("cors-configs/:origin")
  @Permissions("api-platform.cors.delete")
  async deleteCorsConfig(
    @Req() req: AuthenticatedRequest,
    @Param("origin") origin: string,
  ) {
    return this.svc.deleteCorsConfig(req.user.tenantId, origin);
  }

  @ApiOperation({ summary: "List schemas" })
  @Get("schemas")
  @Permissions("api-platform.schema-registry.read")
  async listSchemas(@Req() req: AuthenticatedRequest) {
    return this.svc.listSchemas(req.user.tenantId);
  }
  @ApiOperation({ summary: "Register schema" })
  @Post("schemas")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.schema-registry.create")
  async registerSchema(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string(),
        version: z.string().optional(),
        schema: z.any(),
        format: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.registerSchema(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete schema" })
  @Delete("schemas/:id")
  @Permissions("api-platform.schema-registry.delete")
  async deleteSchema(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSchema(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List integration templates" })
  @Get("integration-templates")
  @Permissions("api-platform.integration-template.read")
  async listIntegrationTemplates(@Req() req: AuthenticatedRequest) {
    return this.svc.listIntegrationTemplates(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create integration template" })
  @Post("integration-templates")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.integration-template.create")
  async createIntegrationTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string(),
        provider: z.string(),
        config: z.any(),
        description: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createIntegrationTemplate(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete integration template" })
  @Delete("integration-templates/:id")
  @Permissions("api-platform.integration-template.delete")
  async deleteIntegrationTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteIntegrationTemplate(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Get integration template stats" })
  @Get("integration-templates/stats")
  @Permissions("api-platform.integration-template.read")
  async getIntegrationTemplateStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getIntegrationTemplateStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "List data exports" })
  @Get("data-exports")
  @Permissions("api-platform.data-export.read")
  async listDataExports(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
  ) {
    return this.svc.listDataExports(
      req.user.tenantId,
      page ? parseInt(page) : 1,
    );
  }
  @ApiOperation({ summary: "Create data export" })
  @Post("data-exports")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.data-export.create")
  async createDataExport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string(), format: z.string(), scope: z.any() }))
    body: any,
  ) {
    return this.svc.createDataExport(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Download data export" })
  @Get("data-exports/:id/download")
  @Permissions("api-platform.data-export.read")
  async downloadDataExport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.downloadDataExport(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Delete data export" })
  @Delete("data-exports/:id")
  @Permissions("api-platform.data-export.delete")
  async deleteDataExport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteDataExport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List data imports" })
  @Get("data-imports")
  @Permissions("api-platform.data-import.read")
  async listDataImports(@Req() req: AuthenticatedRequest) {
    return this.svc.listDataImports(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create data import" })
  @Post("data-imports")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.data-import.create")
  async createDataImport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({ name: z.string(), format: z.string(), mapping: z.any() }),
    )
    body: any,
  ) {
    return this.svc.createDataImport(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: "List health checks" })
  @Get("health-checks")
  @Permissions("api-platform.health.read")
  async listHealthChecks(@Req() req: AuthenticatedRequest) {
    return this.svc.listHealthChecks(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create health check" })
  @Post("health-checks")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.health.create")
  async createHealthCheck(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string(),
        endpoint: z.string(),
        intervalSec: z.number().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createHealthCheck(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Toggle health check" })
  @Put("health-checks/:id/toggle")
  @Permissions("api-platform.health.update")
  async toggleHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.toggleHealthCheck(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Delete health check" })
  @Delete("health-checks/:id")
  @Permissions("api-platform.health.delete")
  async deleteHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteHealthCheck(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List access logs" })
  @Get("access-logs")
  @Permissions("api-platform.access-log.read")
  async listAccessLogs(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
  ) {
    return this.svc.listAccessLogs(
      req.user.tenantId,
      page ? parseInt(page) : 1,
    );
  }
  @ApiOperation({ summary: "Get access log stats" })
  @Get("access-log-stats")
  @Permissions("api-platform.access-log.read")
  async getAccessLogStats(@Req() req: AuthenticatedRequest) {
    return this.svc.getAccessLogStats(req.user.tenantId);
  }
  @ApiOperation({ summary: "Export access logs" })
  @Post("access-logs/export")
  @Permissions("api-platform.access-log.export")
  async exportAccessLogs(@Req() req: AuthenticatedRequest) {
    return this.svc.exportAccessLogs(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get usage summary" })
  @Get("usage-summary")
  @Permissions("api-platform.usage.read")
  async getUsageSummary(@Req() req: AuthenticatedRequest) {
    return this.svc.getUsageSummary(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get API platform health" })
  @Get("health")
  @Permissions("api-platform.health.read")
  async getApiPlatformHealth(@Req() req: AuthenticatedRequest) {
    return this.svc.getApiPlatformHealth(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get platform config" })
  @Get("config")
  @Permissions("api-platform.config.read")
  async getPlatformConfig(@Req() req: AuthenticatedRequest) {
    return this.svc.getPlatformConfig();
  }

  @ApiOperation({ summary: "List usage quotas" })
  @Get("usage-quotas")
  @Permissions("api-platform.usage-quota.read")
  async listUsageQuotas(@Req() req: AuthenticatedRequest) {
    return this.svc.listUsageQuotas(req.user.tenantId);
  }
  @ApiOperation({ summary: "Update usage quota" })
  @Put("usage-quotas/:metric")
  @Permissions("api-platform.usage-quota.update")
  async updateUsageQuota(
    @Req() req: AuthenticatedRequest,
    @Param("metric") metric: string,
    @ZodBody(z.object({ limit: z.number() })) body: any,
  ) {
    return this.svc.updateUsageQuota(req.user.tenantId, metric, body.limit);
  }

  @ApiOperation({ summary: "List IP access rules" })
  @Get("ip-access-rules")
  @Permissions("api-platform.ip-access.read")
  async listIpAccessRules(@Req() req: AuthenticatedRequest) {
    return this.svc.listIpAccessRules(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create IP access rule" })
  @Post("ip-access-rules")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.ip-access.create")
  async createIpAccessRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ cidr: z.string(), type: z.string() })) body: any,
  ) {
    return this.svc.createIpAccessRule(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete IP access rule" })
  @Delete("ip-access-rules/:id")
  @Permissions("api-platform.ip-access.delete")
  async deleteIpAccessRule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteIpAccessRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List registered endpoints" })
  @Get("endpoints")
  @Permissions("api-platform.endpoint.read")
  async listEndpoints(@Req() req: AuthenticatedRequest) {
    return this.svc.listEndpoints(req.user.tenantId);
  }

  @ApiOperation({ summary: "List API versions" })
  @Get("versions")
  @Permissions("api-platform.version.read")
  async listApiVersions(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiVersions(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get analytics" })
  @Get("analytics")
  @Permissions("api-platform.analytics.read")
  async getApiAnalytics(@Req() req: AuthenticatedRequest) {
    return this.svc.getApiAnalytics(req.user.tenantId);
  }
  @ApiOperation({ summary: "Export analytics" })
  @Post("analytics/export")
  @Permissions("api-platform.analytics.export")
  async exportApiAnalytics(@Req() req: AuthenticatedRequest) {
    return this.svc.exportApiAnalytics(req.user.tenantId);
  }
}
