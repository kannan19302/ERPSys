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
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiPlatformDeepV3Service } from "./api-platform-deep-v3.service";

interface AuthenticatedRequest extends Request {
  user: { userId: string; tenantId: string; email: string; roles: string[] };
}

@ApiTags("api-platform")
@ApiBearerAuth()
@Controller("api-platform")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class ApiPlatformDeepV3Controller {
  constructor(private readonly svc: ApiPlatformDeepV3Service) {}

  @ApiOperation({ summary: "Get API key detail" })
  @Get("api-keys/:id")
  @Permissions("api-platform.api-key.read")
  async getApiKey(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getApiKey(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Update API key name" })
  @Put("api-keys/:id/name")
  @Permissions("api-platform.api-key.update")
  async renameApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.renameApiKey(req.user.tenantId, id, body.name);
  }
  @ApiOperation({ summary: "Regenerate API key secret" })
  @Post("api-keys/:id/regenerate")
  @Permissions("api-platform.api-key.regenerate")
  async regenerateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.regenerateApiKey(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get webhook detail" })
  @Get("webhooks/:id")
  @Permissions("api-platform.webhook.read")
  async getWebhook(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getWebhook(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Update webhook name" })
  @Put("webhooks/:id/name")
  @Permissions("api-platform.webhook.update")
  async renameWebhook(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ name: z.string() })) body: any,
  ) {
    return this.svc.renameWebhook(req.user.tenantId, id, body.name);
  }
  @ApiOperation({ summary: "Enable webhook" })
  @Post("webhooks/:id/enable")
  @Permissions("api-platform.webhook.update")
  async enableWebhook(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.enableWebhook(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Disable webhook" })
  @Post("webhooks/:id/disable")
  @Permissions("api-platform.webhook.update")
  async disableWebhook(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.disableWebhook(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get schema detail" })
  @Get("schemas/:id")
  @Permissions("api-platform.schema-registry.read")
  async getSchema(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getSchema(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get integration template detail" })
  @Get("integration-templates/:id")
  @Permissions("api-platform.integration-template.read")
  async getIntegrationTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getIntegrationTemplate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get health check detail" })
  @Get("health-checks/:id")
  @Permissions("api-platform.health.read")
  async getHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getHealthCheck(req.user.tenantId, id);
  }
  @ApiOperation({ summary: "Run health check" })
  @Post("health-checks/:id/run")
  @Permissions("api-platform.health.run")
  async runHealthCheck(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.runHealthCheck(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get data export detail" })
  @Get("data-exports/:id")
  @Permissions("api-platform.data-export.read")
  async getDataExport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDataExport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get data import detail" })
  @Get("data-imports/:id")
  @Permissions("api-platform.data-import.read")
  async getDataImport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getDataImport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get usage quota by metric" })
  @Get("usage-quotas/:metric")
  @Permissions("api-platform.usage-quota.read")
  async getUsageQuota(
    @Req() req: AuthenticatedRequest,
    @Param("metric") metric: string,
  ) {
    return this.svc.getUsageQuota(req.user.tenantId, metric);
  }

  @ApiOperation({ summary: "Get CORS config by origin" })
  @Get("cors-configs/:origin")
  @Permissions("api-platform.cors.read")
  async getCorsConfig(
    @Req() req: AuthenticatedRequest,
    @Param("origin") origin: string,
  ) {
    return this.svc.getCorsConfig(req.user.tenantId, origin);
  }

  @ApiOperation({ summary: "Get rate limit detail" })
  @Get("rate-limits/:endpoint")
  @Permissions("api-platform.rate-limit.read")
  async getRateLimit(
    @Req() req: AuthenticatedRequest,
    @Param("endpoint") endpoint: string,
  ) {
    return this.svc.getRateLimit(req.user.tenantId, endpoint);
  }

  @ApiOperation({ summary: "List categories" })
  @Get("categories")
  @Permissions("api-platform.category.read")
  async listCategories(@Req() req: AuthenticatedRequest) {
    return this.svc.listCategories(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create category" })
  @Post("categories")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.category.create")
  async createCategory(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string(), description: z.string().optional() }))
    body: any,
  ) {
    return this.svc.createCategory(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete category" })
  @Delete("categories/:id")
  @Permissions("api-platform.category.delete")
  async deleteCategory(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteCategory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List tags" })
  @Get("tags")
  @Permissions("api-platform.tag.read")
  async listTags(@Req() req: AuthenticatedRequest) {
    return this.svc.listTags(req.user.tenantId);
  }
  @ApiOperation({ summary: "Create tag" })
  @Post("tags")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("api-platform.tag.create")
  async createTag(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ name: z.string(), color: z.string().optional() }))
    body: any,
  ) {
    return this.svc.createTag(req.user.tenantId, body);
  }
  @ApiOperation({ summary: "Delete tag" })
  @Delete("tags/:id")
  @Permissions("api-platform.tag.delete")
  async deleteTag(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteTag(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get platform dashboard" })
  @Get("dashboard")
  @Permissions("api-platform.dashboard.read")
  async getPlatformDashboard(@Req() req: AuthenticatedRequest) {
    return this.svc.getPlatformDashboard(req.user.tenantId);
  }
  @ApiOperation({ summary: "Get API documentation" })
  @Get("docs")
  @Permissions("api-platform.docs.read")
  async getApiDocs(@Req() req: AuthenticatedRequest) {
    return this.svc.getApiDocs();
  }
  @ApiOperation({ summary: "Get recent activity" })
  @Get("recent-activity")
  @Permissions("api-platform.activity.read")
  async getRecentActivity(@Req() req: AuthenticatedRequest) {
    return this.svc.getRecentActivity(req.user.tenantId);
  }
}
