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
import { ApiPlatformDeepService } from "./api-platform-deep.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("api-platform")
@ApiBearerAuth()
@Controller("api-platform")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ApiPlatformDeepController {
  constructor(private readonly svc: ApiPlatformDeepService) {}

  /* ─── API Keys ─── */
  @ApiOperation({ summary: "List API keys" })
  @Get("api-keys")
  @Permissions("api-platform.api-key.read")
  async listApiKeys(@Req() req: AuthenticatedRequest) {
    return this.svc.listApiKeys(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create API key" })
  @Post("api-keys")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.api-key.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ApiKey")
  async createApiKey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        scopes: z.array(z.string()).optional(),
        rateLimitPerMin: z.number().optional(),
        expiresAt: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createApiKey(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Update API key" })
  @Put("api-keys/:id")
  @Permissions("api-platform.api-key.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ApiKey")
  async updateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        name: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateApiKey(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete API key" })
  @Delete("api-keys/:id")
  @Permissions("api-platform.api-key.delete")
  async deleteApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteApiKey(req.user.tenantId, id);
  }

  /* ─── Rate Limits ─── */
  @ApiOperation({ summary: "List rate limits" })
  @Get("rate-limits")
  @Permissions("api-platform.rate-limit.read")
  async listRateLimits(@Req() req: AuthenticatedRequest) {
    return this.svc.listRateLimits(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create rate limit" })
  @Post("rate-limits")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.rate-limit.create")
  async createRateLimit(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        endpoint: z.string().min(1),
        maxRequests: z.number(),
        windowSec: z.number().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createRateLimit(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Update rate limit" })
  @Put("rate-limits/:id")
  @Permissions("api-platform.rate-limit.update")
  async updateRateLimit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        maxRequests: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateRateLimit(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete rate limit" })
  @Delete("rate-limits/:id")
  @Permissions("api-platform.rate-limit.delete")
  async deleteRateLimit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteRateLimit(req.user.tenantId, id);
  }

  /* ─── Webhooks ─── */
  @ApiOperation({ summary: "List webhooks" })
  @Get("webhooks")
  @Permissions("api-platform.webhook.read")
  async listWebhooks(@Req() req: AuthenticatedRequest) {
    return this.svc.listWebhooks(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create webhook" })
  @Post("webhooks")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.webhook.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ApiWebhook")
  async createWebhook(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        events: z.array(z.string()),
        retryCount: z.number().optional(),
        timeoutMs: z.number().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createWebhook(req.user.tenantId, req.user.userId, body);
  }
  @ApiOperation({ summary: "Update webhook" })
  @Put("webhooks/:id")
  @Permissions("api-platform.webhook.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ApiWebhook")
  async updateWebhook(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.updateWebhook(req.user.tenantId, id, body);
  }
  @ApiOperation({ summary: "Delete webhook" })
  @Delete("webhooks/:id")
  @Permissions("api-platform.webhook.delete")
  async deleteWebhook(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteWebhook(req.user.tenantId, id);
  }

  /* ─── Webhook Deliveries ─── */
  @ApiOperation({ summary: "List webhook deliveries" })
  @Get("webhooks/:webhookId/deliveries")
  @Permissions("api-platform.webhook-delivery.read")
  async listWebhookDeliveries(
    @Req() req: AuthenticatedRequest,
    @Param("webhookId") webhookId: string,
  ) {
    return this.svc.listWebhookDeliveries(req.user.tenantId, webhookId);
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

  /* ─── Analytics ─── */
  @ApiOperation({ summary: "Get API analytics" })
  @Get("analytics")
  @Permissions("api-platform.analytics.read")
  async getAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.svc.getAnalytics(req.user.tenantId, from, to);
  }
  @ApiOperation({ summary: "Export API analytics" })
  @Post("analytics/export")
  @Permissions("api-platform.analytics.export")
  async exportAnalytics(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        format: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.exportAnalytics(req.user.tenantId, body);
  }

  /* ─── CORS ─── */
  @ApiOperation({ summary: "List CORS configs" })
  @Get("cors-configs")
  @Permissions("api-platform.cors.read")
  async listCorsConfigs(@Req() req: AuthenticatedRequest) {
    return this.svc.listCorsConfigs(req.user.tenantId);
  }
  @ApiOperation({ summary: "Update CORS config" })
  @Put("cors-configs/:origin")
  @Permissions("api-platform.cors.update")
  async upsertCorsConfig(
    @Req() req: AuthenticatedRequest,
    @Param("origin") origin: string,
    @ZodBody(
      z.object({
        methods: z.array(z.string()).optional(),
        headers: z.array(z.string()).optional(),
        allowCredentials: z.boolean().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.upsertCorsConfig(req.user.tenantId, origin, body);
  }

  /* ─── Schema Registry ─── */
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
        name: z.string().min(1),
        schema: z.any(),
        version: z.string().optional(),
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

  /* ─── Integration Templates ─── */
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
        name: z.string().min(1),
        description: z.string().optional(),
        provider: z.string().min(1),
        config: z.any(),
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

  /* ─── Data Export ─── */
  @ApiOperation({ summary: "List data exports" })
  @Get("data-exports")
  @Permissions("api-platform.data-export.read")
  async listDataExports(@Req() req: AuthenticatedRequest) {
    return this.svc.listDataExports(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create data export" })
  @Post("data-exports")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.data-export.create")
  async createDataExport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        format: z.string().optional(),
        scope: z.any().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createDataExport(req.user.tenantId, req.user.userId, body);
  }

  /* ─── Data Import ─── */
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
      z.object({
        name: z.string().min(1),
        format: z.string().optional(),
        mapping: z.any().optional(),
      }),
    )
    body: any,
  ) {
    return this.svc.createDataImport(req.user.tenantId, req.user.userId, body);
  }

  /* ─── Health ─── */
  @ApiOperation({ summary: "List health checks" })
  @Get("health-checks")
  @Permissions("api-platform.health.read")
  async listHealthChecks(@Req() req: AuthenticatedRequest) {
    return this.svc.listHealthChecks(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create health check" })
  @Post("health-checks")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.health.read")
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

  /* ─── Usage Quotas ─── */
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
    @ZodBody(
      z.object({ maxValue: z.number(), windowSec: z.number().optional() }),
    )
    body: any,
  ) {
    return this.svc.updateUsageQuota(req.user.tenantId, metric, body);
  }

  /* ─── IP Access Rules ─── */
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
    @ZodBody(
      z.object({
        cidr: z.string().min(1),
        type: z.string().optional(),
        reason: z.string().optional(),
      }),
    )
    body: any,
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

  /* ─── Endpoint Registry ─── */
  @ApiOperation({ summary: "List registered endpoints" })
  @Get("endpoints")
  @Permissions("api-platform.endpoint.read")
  async listEndpoints(@Req() req: AuthenticatedRequest) {
    return this.svc.listEndpoints(req.user.tenantId);
  }

  /* ─── Versions ─── */
  @ApiOperation({ summary: "List API versions" })
  @Get("versions")
  @Permissions("api-platform.version.read")
  async listVersions(@Req() req: AuthenticatedRequest) {
    return this.svc.listVersions(req.user.tenantId);
  }

  /* ─── Access Logs ─── */
  @ApiOperation({ summary: "List access logs" })
  @Get("access-logs")
  @Permissions("api-platform.access-log.read")
  async listAccessLogs(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.svc.listAccessLogs(req.user.tenantId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}
