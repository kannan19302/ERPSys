import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { AuditLogService } from "./audit-log.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const recordEventSchema = z.object({
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(100),
  resourceId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
});

@ApiTags("saas-activity")
@ApiBearerAuth()
@Controller("saas/activity")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ActivityFeedController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: "List all activity feed entries" })
  @Permissions("saas.audit.read")
  @Get()
  async listActivity(
    @Req() req: AuthReq,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
  ) {
    return this.auditLogService.listAuditLogs(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      { action },
    );
  }

  @ApiOperation({ summary: "Get recent activity entries" })
  @Permissions("saas.audit.read")
  @Get("recent")
  async getRecentActivity(@Req() req: AuthReq) {
    return this.auditLogService.listAuditLogs(req.user.tenantId, 1, 20, {});
  }

  @ApiOperation({ summary: "Get activity statistics" })
  @Permissions("saas.audit.read")
  @Get("stats")
  async getActivityStats(@Req() req: AuthReq) {
    return this.auditLogService.getAuditStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get activity for a specific user" })
  @Permissions("saas.audit.read")
  @Get("user/:userId")
  async getUserActivity(@Req() req: AuthReq, @Param("userId") userId: string) {
    const items = await prisma.tenantAuditLog.findMany({
      where: { tenantId: req.user.tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { items, total: items.length, userId };
  }

  @ApiOperation({ summary: "Get activity timeline grouped by date" })
  @Permissions("saas.audit.read")
  @Get("timeline")
  async getActivityTimeline(@Req() req: AuthReq, @Query("days") days?: string) {
    const numDays = Math.min(parseInt(days ?? "7", 10), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    const logs = await prisma.tenantAuditLog.findMany({
      where: { tenantId: req.user.tenantId, createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
    });

    const timeline: Record<string, { count: number; actions: Record<string, number> }> = {};
    for (const log of logs) {
      const key = log.createdAt.toISOString().substring(0, 10);
      if (!timeline[key]) timeline[key] = { count: 0, actions: {} };
      timeline[key].count++;
      timeline[key].actions[log.action] = (timeline[key].actions[log.action] ?? 0) + 1;
    }

    return { days: numDays, totalEntries: logs.length, timeline };
  }

  @ApiOperation({ summary: "Export activity log" })
  @Permissions("saas.audit.read")
  @Get("export")
  async exportActivityLog(@Req() req: AuthReq, @Query("format") format?: string) {
    return this.auditLogService.exportAuditLogs(req.user.tenantId, format ?? "csv", {});
  }

  @ApiOperation({ summary: "Clear all activity logs" })
  @Permissions("saas.audit.create")
  @Delete("clear")
  async clearActivityLog(@Req() req: AuthReq) {
    const result = await prisma.tenantAuditLog.deleteMany({
      where: { tenantId: req.user.tenantId },
    });
    return { deletedCount: result.count, clearedAt: new Date() };
  }

  @ApiOperation({ summary: "Get activity summary grouped by action type" })
  @Permissions("saas.audit.read")
  @Get("summary")
  async getActivitySummary(@Req() req: AuthReq) {
    const stats = await this.auditLogService.getAuditStats(req.user.tenantId);
    return {
      totalEntries: stats.totalEntries,
      byAction: stats.byAction,
      mostRecent: stats.mostRecentEntry,
    };
  }

  @ApiOperation({ summary: "Get live activity feed (recent unread)" })
  @Permissions("saas.audit.read")
  @Get("feed")
  async getLiveFeed(@Req() req: AuthReq) {
    const items = await prisma.tenantAuditLog.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return { items, total: items.length, pollIntervalMs: 15000 };
  }

  @ApiOperation({ summary: "Record a custom activity event" })
  @Permissions("saas.audit.create")
  @Post("event")
  async recordCustomEvent(@Req() req: AuthReq, @ZodBody(recordEventSchema) body: z.infer<typeof recordEventSchema>) {
    return this.auditLogService.logAction(
      req.user.tenantId,
      body.action,
      body.resource,
      body.resourceId ?? "",
      body.details as Record<string, unknown>,
      body.ipAddress,
    );
  }
}
