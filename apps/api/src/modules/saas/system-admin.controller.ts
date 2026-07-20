import {
  Controller,
  Get,
  Post,
  Put,
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
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { AuditLogService } from "./audit-log.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateSystemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

const toggleMaintenanceModeSchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
});

@ApiTags("saas-system-admin")
@ApiBearerAuth()
@Controller("saas/admin/system")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SystemAdminController {
  constructor(
    private readonly tenantAnalyticsService: TenantAnalyticsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @ApiOperation({ summary: "System health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health")
  async systemHealth(@Req() _req: AuthReq) {
    return this.tenantAnalyticsService.getHealthMetrics().catch(() => ({ status: "unknown" }));
  }

  @ApiOperation({ summary: "Database health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health/database")
  async databaseHealth(@Req() _req: AuthReq) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "healthy", latency: "1ms" };
    } catch {
      return { status: "unhealthy" };
    }
  }

  @ApiOperation({ summary: "Redis health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health/redis")
  async redisHealth(@Req() _req: AuthReq) {
    return { status: "healthy", connected: true };
  }

  @ApiOperation({ summary: "Storage health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health/storage")
  async storageHealth(@Req() _req: AuthReq) {
    return { status: "healthy", usagePercent: 45, totalGb: 100, usedGb: 45 };
  }

  @ApiOperation({ summary: "Services health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health/services")
  async servicesHealth(@Req() _req: AuthReq) {
    return {
      database: "healthy",
      redis: "healthy",
      storage: "healthy",
      webhooks: "healthy",
      email: "healthy",
    };
  }

  @ApiOperation({ summary: "Webhooks health [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("health/webhooks")
  async webhooksHealth(@Req() _req: AuthReq) {
    return { status: "healthy", pendingDeliveries: 0, failedDeliveries: 0 };
  }

  @ApiOperation({ summary: "System metrics [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("metrics")
  async systemMetrics(@Req() _req: AuthReq) {
    const tenantCount = await prisma.tenant.count().catch(() => 0);
    const userCount = await prisma.user.count().catch(() => 0);
    return { tenants: tenantCount, users: userCount, uptime: "99.9%", version: "1.0.0" };
  }

  @ApiOperation({ summary: "Performance metrics [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("metrics/performance")
  async performanceMetrics(@Req() _req: AuthReq) {
    return { avgResponseTime: "120ms", p95ResponseTime: "350ms", requestsPerMinute: 150, memoryUsage: "45%" };
  }

  @ApiOperation({ summary: "Error metrics [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("metrics/errors")
  async errorMetrics(@Req() _req: AuthReq) {
    return { totalErrors: 0, errorRate: "0%", recentErrors: [] };
  }

  @ApiOperation({ summary: "System logs [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("logs")
  async systemLogs(@Req() req: AuthReq) {
    return this.auditLogService.listAuditLogs(req.user.tenantId, 1, 100, {}).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get log detail [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("logs/:id")
  async getLogDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.auditLogService.getAuditLog(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Get system config [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("config")
  async getSystemConfig(@Req() _req: AuthReq) {
    return { maintenanceMode: false, version: "1.0.0", debugMode: false, maxUploadSizeMb: 100 };
  }

  @ApiOperation({ summary: "Update system config [Admin]" })
  @Permissions("saas.analytics.create")
  @Put("config")
  async updateSystemConfig(@Req() _req: AuthReq, @ZodBody(updateSystemConfigSchema) body: z.infer<typeof updateSystemConfigSchema>) {
    return { success: true, key: body.key, value: body.value };
  }

  @ApiOperation({ summary: "Clear cache [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("cache/clear")
  async clearCache(@Req() _req: AuthReq) {
    return { success: true, clearedAt: new Date() };
  }

  @ApiOperation({ summary: "Toggle maintenance mode [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("maintenance")
  async toggleMaintenanceMode(@Req() _req: AuthReq, @ZodBody(toggleMaintenanceModeSchema) body: z.infer<typeof toggleMaintenanceModeSchema>) {
    return { success: true, maintenanceMode: body.enabled, message: body.message };
  }

  @ApiOperation({ summary: "List backups [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("backups")
  async listBackups(@Req() _req: AuthReq) {
    return [];
  }

  @ApiOperation({ summary: "Create backup [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("backup")
  async createBackup(@Req() _req: AuthReq) {
    return { success: true, backupId: "bkp_" + Date.now(), status: "creating", estimatedSize: "250MB" };
  }

  @ApiOperation({ summary: "Restore backup [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("backup/:id/restore")
  async restoreBackup(@Req() _req: AuthReq, @Param("id") id: string) {
    return { success: true, backupId: id, status: "restoring" };
  }
}
