import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiPlatformService } from "./api-platform.service";
import { ApiRateLimitsService } from "./api-rate-limits.service";
import { ApiQuotasService } from "./api-quotas.service";
import {
  createRateLimitRuleSchema,
  createApiKeySchema,
  updateApiKeyScopesSchema,
  createWebhookSchema,
  updateWebhookSchema,
  registerEndpointSchema,
} from "./api-platform.dtos";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("api-platform")
@ApiBearerAuth()
@Controller("admin/api-platform")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApiPlatformController {
  constructor(
    private readonly service: ApiPlatformService,
    private readonly rateLimitsService: ApiRateLimitsService,
    private readonly quotasService: ApiQuotasService,
  ) {}

  @Get("rate-limits")
  @Permissions("api-platform.keys.read")
  @ApiOperation({ summary: "List API rate limit rules" })
  async getRateLimits(@Req() req: AuthenticatedRequest) {
    return this.rateLimitsService.getRateLimitRules(req.user.tenantId);
  }

  @Post("rate-limits")
  @Permissions("api-platform.keys.create")
  @ApiOperation({ summary: "Create API rate limit rule" })
  async createRateLimitRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRateLimitRuleSchema) body: any,
  ) {
    return this.rateLimitsService.createRateLimitRule(req.user.tenantId, body);
  }

  @Get("quotas")
  @Permissions("api-platform.usage.read")
  @ApiOperation({ summary: "List API quota policies" })
  async getQuotas(@Req() req: AuthenticatedRequest) {
    return this.quotasService.getQuotaPolicies(req.user.tenantId);
  }

  @Get("keys")
  @Permissions("api-platform.keys.read")
  @ApiOperation({ summary: "List API keys" })
  async getApiKeys(@Req() req: AuthenticatedRequest) {
    return this.service.getApiKeys(req.user.tenantId);
  }

  @Post("keys")
  @Permissions("api-platform.keys.create")
  @ApiOperation({ summary: "Create API key" })
  async createApiKey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createApiKeySchema) body: any,
  ) {
    return this.service.createApiKey(req.user.tenantId, body);
  }

  @Delete("keys/:id")
  @Permissions("api-platform.keys.delete")
  @ApiOperation({ summary: "Revoke API key" })
  async revokeApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.revokeApiKey(req.user.tenantId, id);
  }

  @Post("keys/:id/rotate")
  @Permissions("api-platform.keys.update")
  @ApiOperation({ summary: "Rotate API key" })
  async rotateApiKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.rotateApiKey(req.user.tenantId, id);
  }

  @Put("keys/:id/scopes")
  @Permissions("api-platform.keys.update")
  @ApiOperation({ summary: "Update API key scopes" })
  async updateApiKeyScopes(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateApiKeyScopesSchema) body: any,
  ) {
    return this.service.updateApiKeyScopes(req.user.tenantId, id, body);
  }

  @Get("webhooks")
  @Permissions("api-platform.webhooks.read")
  @ApiOperation({ summary: "List webhook subscriptions" })
  async getWebhookSubscriptions(@Req() req: AuthenticatedRequest) {
    return this.service.getWebhookSubscriptions(req.user.tenantId);
  }

  @Post("webhooks")
  @Permissions("api-platform.webhooks.create")
  @ApiOperation({ summary: "Create webhook subscription" })
  async createWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createWebhookSchema) body: any,
  ) {
    return this.service.createWebhookSubscription(req.user.tenantId, body);
  }

  @Put("webhooks/:id")
  @Permissions("api-platform.webhooks.update")
  @ApiOperation({ summary: "Update webhook subscription" })
  async updateWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateWebhookSchema) body: any,
  ) {
    return this.service.updateWebhookSubscription(req.user.tenantId, id, body);
  }

  @Delete("webhooks/:id")
  @Permissions("api-platform.webhooks.delete")
  @ApiOperation({ summary: "Delete webhook subscription" })
  async deleteWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteWebhookSubscription(req.user.tenantId, id);
  }

  @Post("webhooks/:id/toggle")
  @Permissions("api-platform.webhooks.update")
  @ApiOperation({ summary: "Toggle webhook active status" })
  async toggleWebhookSubscription(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.toggleWebhookSubscription(req.user.tenantId, id);
  }

  @Get("webhooks/logs")
  @Permissions("api-platform.webhooks.read")
  @ApiOperation({ summary: "Get webhook delivery logs" })
  async getWebhookDeliveryLogs(
    @Req() req: AuthenticatedRequest,
    @Query("subscriptionId") subscriptionId?: string,
  ) {
    return this.service.getWebhookDeliveryLogs(
      req.user.tenantId,
      subscriptionId,
    );
  }

  @Post("webhooks/logs/:id/retry")
  @Permissions("api-platform.webhooks.update")
  @ApiOperation({ summary: "Retry webhook delivery" })
  async retryWebhookDelivery(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.retryWebhookDelivery(req.user.tenantId, id);
  }

  @Get("usage")
  @Permissions("api-platform.usage.read")
  @ApiOperation({ summary: "Get API usage metrics" })
  async getUsageMetrics(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.service.getUsageMetrics(req.user.tenantId, period);
  }

  @Get("endpoints")
  @Permissions("api-platform.usage.read")
  @ApiOperation({ summary: "List registered endpoints" })
  async getEndpoints(
    @Req() req: AuthenticatedRequest,
    @Query("module") module?: string,
  ) {
    return this.service.getEndpoints(req.user.tenantId, module);
  }

  @Post("endpoints")
  @Permissions("api-platform.keys.create")
  @ApiOperation({ summary: "Register endpoint" })
  async registerEndpoint(
    @Req() req: AuthenticatedRequest,
    @ZodBody(registerEndpointSchema) body: any,
  ) {
    return this.service.registerEndpoint(req.user.tenantId, body);
  }

  @Delete("endpoints/:id")
  @Permissions("api-platform.keys.delete")
  @ApiOperation({ summary: "De-register endpoint" })
  async deregisterEndpoint(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deregisterEndpoint(req.user.tenantId, id);
  }
}
