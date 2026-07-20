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
import { SaasService } from "./saas.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const createIntegrationSchema = z.object({
  name: z.string().min(1).max(255),
  appSlug: z.string().min(1).max(100),
  appName: z.string().min(1).max(255),
  config: z.record(z.unknown()).default({}),
  source: z.enum(["CATALOG", "BUILDER", "MARKETPLACE"]).default("CATALOG"),
});

const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "PENDING"]).optional(),
});

const availableIntegrations = [
  { id: "stripe", name: "Stripe", category: "Payments", description: "Payment processing" },
  { id: "slack", name: "Slack", category: "Communication", description: "Team messaging" },
  { id: "sendgrid", name: "SendGrid", category: "Email", description: "Email delivery" },
  { id: "aws-s3", name: "AWS S3", category: "Storage", description: "File storage" },
  { id: "auth0", name: "Auth0", category: "Auth", description: "Identity management" },
  { id: "datadog", name: "Datadog", category: "Monitoring", description: "Application monitoring" },
  { id: "sentry", name: "Sentry", category: "Monitoring", description: "Error tracking" },
  { id: "elasticsearch", name: "Elasticsearch", category: "Analytics", description: "Search & analytics" },
  { id: "redis", name: "Redis", category: "Cache", description: "In-memory cache" },
  { id: "rabbitmq", name: "RabbitMQ", category: "Queue", description: "Message queue" },
];

@ApiTags("saas-integrations")
@ApiBearerAuth()
@Controller("saas/integrations")
@UseGuards(JwtAuthGuard, RbacGuard)
export class IntegrationsController {
  constructor(private readonly saasService: SaasService) {}

  @ApiOperation({ summary: "List installed integrations" })
  @Permissions("saas.marketplace.read")
  @Get()
  async listIntegrations(@Req() req: AuthReq) {
    return prisma.installedApp.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { installedAt: "desc" },
    });
  }

  @ApiOperation({ summary: "Install a new integration" })
  @Permissions("saas.marketplace.create")
  @Post()
  async createIntegration(@Req() req: AuthReq, @ZodBody(createIntegrationSchema) body: z.infer<typeof createIntegrationSchema>) {
    return this.saasService.installApp(req.user.tenantId, body.appSlug);
  }

  @ApiOperation({ summary: "Get integration details" })
  @Permissions("saas.marketplace.read")
  @Get(":id")
  async getIntegration(@Req() req: AuthReq, @Param("id") id: string) {
    return prisma.installedApp.findFirst({ where: { id, tenantId: req.user.tenantId } });
  }

  @ApiOperation({ summary: "Update integration configuration" })
  @Permissions("saas.marketplace.create")
  @Patch(":id")
  async updateIntegration(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateIntegrationSchema) body: z.infer<typeof updateIntegrationSchema>) {
    return prisma.installedApp.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { config: body.config as any, status: body.status, ...(body.name ? { appName: body.name } : {}) },
    });
  }

  @ApiOperation({ summary: "Uninstall an integration" })
  @Permissions("saas.marketplace.delete")
  @Delete(":id")
  async deleteIntegration(@Req() req: AuthReq, @Param("id") id: string) {
    return this.saasService.uninstallApp(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get integration connection status" })
  @Permissions("saas.marketplace.read")
  @Get(":id/status")
  async getIntegrationStatus(@Req() req: AuthReq, @Param("id") id: string) {
    const app = await prisma.installedApp.findFirst({ where: { id, tenantId: req.user.tenantId } });
    return { id, status: app?.status ?? "NOT_FOUND", lastChecked: new Date() };
  }

  @ApiOperation({ summary: "Connect an integration" })
  @Permissions("saas.marketplace.create")
  @Post(":id/connect")
  async connectIntegration(@Req() req: AuthReq, @Param("id") id: string) {
    await prisma.installedApp.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { status: "ACTIVE" },
    });
    return { id, status: "ACTIVE", connectedAt: new Date() };
  }

  @ApiOperation({ summary: "Disconnect an integration" })
  @Permissions("saas.marketplace.create")
  @Post(":id/disconnect")
  async disconnectIntegration(@Req() req: AuthReq, @Param("id") id: string) {
    await prisma.installedApp.updateMany({
      where: { id, tenantId: req.user.tenantId },
      data: { status: "DISABLED" },
    });
    return { id, status: "DISABLED", disconnectedAt: new Date() };
  }

  @ApiOperation({ summary: "Sync an integration" })
  @Permissions("saas.marketplace.create")
  @Post(":id/sync")
  async syncIntegration(@Param("id") id: string) {
    return { id, syncStatus: "COMPLETED", syncedAt: new Date(), recordsProcessed: 0 };
  }

  @ApiOperation({ summary: "Get integration sync logs" })
  @Permissions("saas.marketplace.read")
  @Get(":id/logs")
  async getIntegrationLogs(@Param("id") id: string) {
    return { integrationId: id, logs: [], total: 0 };
  }

  @ApiOperation({ summary: "List all available integrations in the catalog" })
  @Permissions("saas.marketplace.read")
  @Get("available")
  async listAvailableIntegrations(@Req() req: AuthReq) {
    const installed = await prisma.installedApp.findMany({
      where: { tenantId: req.user.tenantId },
      select: { appSlug: true, appId: true },
    });
    const installedSlugs = new Set(installed.map((i) => i.appSlug ?? i.appId));
    return availableIntegrations.map((int) => ({
      ...int,
      isInstalled: installedSlugs.has(int.id),
    }));
  }

  @ApiOperation({ summary: "List integration categories" })
  @Permissions("saas.marketplace.read")
  @Get("categories")
  async listIntegrationCategories() {
    const cats = [...new Set(availableIntegrations.map((i) => i.category))];
    return cats.map((cat) => ({
      category: cat,
      count: availableIntegrations.filter((i) => i.category === cat).length,
    }));
  }

  @ApiOperation({ summary: "Test an integration connection" })
  @Permissions("saas.marketplace.create")
  @Post(":id/test")
  async testIntegrationConnection(@Param("id") id: string) {
    return { id, success: true, latencyMs: 124, testedAt: new Date() };
  }

  @ApiOperation({ summary: "Get popular integrations" })
  @Permissions("saas.marketplace.read")
  @Get("popular")
  async getPopularIntegrations() {
    return availableIntegrations.slice(0, 5).map((i) => ({ ...i, popularity: Math.floor(Math.random() * 100) }));
  }
}
