import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { WebhooksService } from "./webhooks.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createEndpointSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  enabled: z.boolean().default(true),
  filter: z.record(z.unknown()).optional(),
  retryCount: z.number().int().min(0).max(10).default(3),
  timeoutMs: z.number().int().min(100).max(30000).default(5000),
  apiVersion: z.string().optional(),
});

const updateEndpointSchema = createEndpointSchema.partial();

@ApiTags("saas-webhooks")
@ApiBearerAuth()
@Controller("saas/webhooks")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @ApiOperation({ summary: "List webhook endpoints" })
  @Permissions("saas.webhook.read")
  @Get("endpoints")
  async listEndpoints(@Req() req: AuthReq) {
    return this.webhooksService.listEndpoints(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create webhook endpoint" })
  @Permissions("saas.webhook.create")
  @Post("endpoints")
  async createEndpoint(@Req() req: AuthReq, @ZodBody(createEndpointSchema) body: z.infer<typeof createEndpointSchema>) {
    return this.webhooksService.createEndpoint(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Get webhook endpoint" })
  @Permissions("saas.webhook.read")
  @Get("endpoints/:id")
  async getEndpoint(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.getEndpoint(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Update webhook endpoint" })
  @Permissions("saas.webhook.update")
  @Patch("endpoints/:id")
  async updateEndpoint(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateEndpointSchema) body: z.infer<typeof updateEndpointSchema>) {
    return this.webhooksService.updateEndpoint(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: "Delete webhook endpoint" })
  @Permissions("saas.webhook.delete")
  @Delete("endpoints/:id")
  async deleteEndpoint(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.deleteEndpoint(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get endpoint secret" })
  @Permissions("saas.webhook.read")
  @Get("endpoints/:id/secret")
  async getEndpointSecret(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.getEndpointSecret(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Rotate endpoint secret" })
  @Permissions("saas.webhook.create")
  @Post("endpoints/:id/rotate-secret")
  async rotateSecret(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.rotateSecret(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List deliveries for endpoint" })
  @Permissions("saas.webhook.read")
  @Get("endpoints/:id/deliveries")
  async listDeliveries(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.listDeliveries(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Redeliver webhook event" })
  @Permissions("saas.webhook.create")
  @Post("deliveries/:deliveryId/redeliver")
  async redeliverEvent(@Req() req: AuthReq, @Param("deliveryId") deliveryId: string) {
    return this.webhooksService.redeliverEvent(req.user.tenantId, deliveryId);
  }

  @ApiOperation({ summary: "Get available webhook events" })
  @Permissions("saas.webhook.read")
  @Get("events")
  async getAvailableEvents() {
    return this.webhooksService.getAvailableEvents();
  }

  @ApiOperation({ summary: "Test webhook endpoint" })
  @Permissions("saas.webhook.create")
  @Post("endpoints/:id/test")
  async testEndpoint(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.testEndpoint(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get delivery stats for endpoint" })
  @Permissions("saas.webhook.read")
  @Get("endpoints/:id/stats")
  async getDeliveryStats(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.getDeliveryStats(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Disable webhook endpoint" })
  @Permissions("saas.webhook.update")
  @Patch("endpoints/:id/disable")
  async disableEndpoint(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.disableEndpoint(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Enable webhook endpoint" })
  @Permissions("saas.webhook.update")
  @Patch("endpoints/:id/enable")
  async enableEndpoint(@Req() req: AuthReq, @Param("id") id: string) {
    return this.webhooksService.enableEndpoint(req.user.tenantId, id);
  }
}
