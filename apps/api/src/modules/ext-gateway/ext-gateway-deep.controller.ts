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
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ExtGatewayDeepService } from "./ext-gateway-deep.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  CreateConnectionSchema,
  UpdateConnectionSchema,
  CreateWebhookConfigSchema,
  UpdateWebhookConfigSchema,
  CreateRateLimitConfigSchema,
  UpdateRateLimitConfigSchema,
  CreateIntegrationTemplateSchema,
  UpdateIntegrationTemplateSchema,
} from "@unerp/shared";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("ext-gateway")
@ApiBearerAuth()
@Controller("ext-gateway")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ExtGatewayDeepController {
  constructor(private readonly extGatewayDeepService: ExtGatewayDeepService) {}

  // Connections
  @Get("connections")
  @Permissions("ext-gateway.connection.read")
  @ApiOperation({ summary: "List connections" })
  async getConnections(
    @Req() req: AuthReq,
    @Query("provider") provider?: string,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.extGatewayDeepService.getConnections(
      req.user.tenantId,
      provider,
      status,
      +page,
      +limit,
    );
  }

  @Get("connections/status")
  @Permissions("ext-gateway.connection.read")
  @ApiOperation({ summary: "Get connection status summary" })
  async getConnectionStatus(@Req() req: AuthReq) {
    return this.extGatewayDeepService.getConnectionStatus(req.user.tenantId);
  }

  @Get("connections/:id")
  @Permissions("ext-gateway.connection.read")
  @ApiOperation({ summary: "Get connection" })
  async getConnection(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.getConnection(req.user.tenantId, id);
  }

  @Post("connections")
  @Permissions("ext-gateway.connection.create")
  @ApiOperation({ summary: "Create connection" })
  async createConnection(
    @Req() req: AuthReq,
    @ZodBody(CreateConnectionSchema) dto: any,
  ) {
    return this.extGatewayDeepService.createConnection(req.user.tenantId, dto);
  }

  @Put("connections/:id")
  @Permissions("ext-gateway.connection.update")
  @ApiOperation({ summary: "Update connection" })
  async updateConnection(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateConnectionSchema) dto: any,
  ) {
    return this.extGatewayDeepService.updateConnection(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("connections/:id")
  @Permissions("ext-gateway.connection.delete")
  @ApiOperation({ summary: "Delete connection" })
  async deleteConnection(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.deleteConnection(req.user.tenantId, id);
  }

  @Post("connections/:id/test")
  @Permissions("ext-gateway.connection.test")
  @ApiOperation({ summary: "Test connection" })
  async testConnection(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.testConnection(req.user.tenantId, id);
  }

  @Get("connections/:id/logs")
  @Permissions("ext-gateway.log.read")
  @ApiOperation({ summary: "Get connection logs" })
  async getConnectionLogs(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Query("page") page = "1",
    @Query("limit") limit = "50",
  ) {
    return this.extGatewayDeepService.getConnectionLogs(
      req.user.tenantId,
      id,
      +page,
      +limit,
    );
  }

  // Webhooks
  @Get("webhooks")
  @Permissions("ext-gateway.webhook.read")
  @ApiOperation({ summary: "List webhook configs" })
  async getWebhooks(
    @Req() req: AuthReq,
    @Query("connectionId") connectionId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.extGatewayDeepService.getWebhookConfigs(
      req.user.tenantId,
      connectionId,
      +page,
      +limit,
    );
  }

  @Get("webhooks/stats")
  @Permissions("ext-gateway.webhook.read")
  @ApiOperation({ summary: "Get webhook stats" })
  async getWebhookStats(@Req() req: AuthReq) {
    return this.extGatewayDeepService.getWebhookStats(req.user.tenantId);
  }

  @Get("webhooks/:id")
  @Permissions("ext-gateway.webhook.read")
  @ApiOperation({ summary: "Get webhook config" })
  async getWebhook(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.getWebhookConfig(req.user.tenantId, id);
  }

  @Post("webhooks")
  @Permissions("ext-gateway.webhook.create")
  @ApiOperation({ summary: "Create webhook config" })
  async createWebhook(
    @Req() req: AuthReq,
    @ZodBody(CreateWebhookConfigSchema) dto: any,
  ) {
    return this.extGatewayDeepService.createWebhookConfig(
      req.user.tenantId,
      dto,
    );
  }

  @Put("webhooks/:id")
  @Permissions("ext-gateway.webhook.update")
  @ApiOperation({ summary: "Update webhook config" })
  async updateWebhook(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateWebhookConfigSchema) dto: any,
  ) {
    return this.extGatewayDeepService.updateWebhookConfig(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("webhooks/:id")
  @Permissions("ext-gateway.webhook.delete")
  @ApiOperation({ summary: "Delete webhook config" })
  async deleteWebhook(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.deleteWebhookConfig(
      req.user.tenantId,
      id,
    );
  }

  @Get("webhooks/:id/deliveries")
  @Permissions("ext-gateway.webhook.read")
  @ApiOperation({ summary: "List webhook deliveries" })
  async getWebhookDeliveries(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.extGatewayDeepService.getWebhookDeliveries(
      req.user.tenantId,
      id,
      status,
      +page,
      +limit,
    );
  }

  @Post("webhooks/deliveries/:id/retry")
  @Permissions("ext-gateway.webhook.retry")
  @ApiOperation({ summary: "Retry webhook delivery" })
  async retryWebhookDelivery(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.retryWebhookDelivery(
      req.user.tenantId,
      id,
    );
  }

  // Rate Limits
  @Get("rate-limits")
  @Permissions("ext-gateway.rate-limit.read")
  @ApiOperation({ summary: "List rate limit configs" })
  async getRateLimits(
    @Req() req: AuthReq,
    @Query("connectionId") connectionId?: string,
  ) {
    return this.extGatewayDeepService.getRateLimitConfigs(
      req.user.tenantId,
      connectionId,
    );
  }

  @Post("rate-limits")
  @Permissions("ext-gateway.rate-limit.create")
  @ApiOperation({ summary: "Create rate limit config" })
  async createRateLimit(
    @Req() req: AuthReq,
    @ZodBody(CreateRateLimitConfigSchema) dto: any,
  ) {
    return this.extGatewayDeepService.createRateLimitConfig(
      req.user.tenantId,
      dto,
    );
  }

  @Put("rate-limits/:id")
  @Permissions("ext-gateway.rate-limit.update")
  @ApiOperation({ summary: "Update rate limit config" })
  async updateRateLimit(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateRateLimitConfigSchema) dto: any,
  ) {
    return this.extGatewayDeepService.updateRateLimitConfig(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("rate-limits/:id")
  @Permissions("ext-gateway.rate-limit.delete")
  @ApiOperation({ summary: "Delete rate limit config" })
  async deleteRateLimit(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.deleteRateLimitConfig(
      req.user.tenantId,
      id,
    );
  }

  @Post("rate-limits/:id/check")
  @Permissions("ext-gateway.rate-limit.read")
  @ApiOperation({ summary: "Check rate limit" })
  async checkRateLimit(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.checkRateLimit(req.user.tenantId, id);
  }

  // Templates
  @Get("templates")
  @Permissions("ext-gateway.template.read")
  @ApiOperation({ summary: "List integration templates" })
  async getTemplates(
    @Req() req: AuthReq,
    @Query("provider") provider?: string,
    @Query("category") category?: string,
  ) {
    return this.extGatewayDeepService.getIntegrationTemplates(
      req.user.tenantId,
      provider,
      category,
    );
  }

  @Get("templates/built-in")
  @Permissions("ext-gateway.template.read")
  @ApiOperation({ summary: "List built-in templates" })
  async getBuiltInTemplates() {
    return this.extGatewayDeepService.getBuiltInTemplates();
  }

  @Post("templates")
  @Permissions("ext-gateway.template.create")
  @ApiOperation({ summary: "Create integration template" })
  async createTemplate(
    @Req() req: AuthReq,
    @ZodBody(CreateIntegrationTemplateSchema) dto: any,
  ) {
    return this.extGatewayDeepService.createIntegrationTemplate(
      req.user.tenantId,
      dto,
    );
  }

  @Put("templates/:id")
  @Permissions("ext-gateway.template.update")
  @ApiOperation({ summary: "Update integration template" })
  async updateTemplate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(UpdateIntegrationTemplateSchema) dto: any,
  ) {
    return this.extGatewayDeepService.updateIntegrationTemplate(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("templates/:id")
  @Permissions("ext-gateway.template.delete")
  @ApiOperation({ summary: "Delete integration template" })
  async deleteTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.extGatewayDeepService.deleteIntegrationTemplate(
      req.user.tenantId,
      id,
    );
  }

  // Analytics
  @Get("analytics")
  @Permissions("ext-gateway.analytics.read")
  @ApiOperation({ summary: "Get extension analytics" })
  async getAnalytics(@Req() req: AuthReq) {
    return this.extGatewayDeepService.getAnalytics(req.user.tenantId);
  }
}
