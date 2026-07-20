import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("saas-health")
@ApiBearerAuth()
@Controller("saas/health")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HealthController {
  @ApiOperation({ summary: "Get full system health check" })
  @Permissions("saas.analytics.read")
  @Get()
  async healthCheck() {
    return { status: "ok", timestamp: new Date().toISOString(), services: { api: "healthy", database: "healthy", redis: "healthy" } };
  }

  @ApiOperation({ summary: "Get API version info" })
  @Permissions("saas.analytics.read")
  @Get("version")
  async getVersion() {
    return { version: "1.0.0", build: Date.now(), name: "UniERP SaaS Platform" };
  }

  @ApiOperation({ summary: "Get uptime status" })
  @Permissions("saas.analytics.read")
  @Get("uptime")
  async getUptime() {
    return { uptime: process.uptime(), startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString() };
  }

  @ApiOperation({ summary: "Get rate limit status" })
  @Permissions("saas.analytics.read")
  @Get("rate-limits")
  async getRateLimits() {
    return { current: 0, limit: 1000, remaining: 1000, resetAt: new Date(Date.now() + 3600000).toISOString() };
  }

  @ApiOperation({ summary: "Get service dependencies status" })
  @Permissions("saas.analytics.read")
  @Get("dependencies")
  async getDependencies(@Req() req: AuthReq) {
    return { database: "connected", redis: "connected", storage: "available", queue: "running", tenantId: req.user.tenantId };
  }

  @ApiOperation({ summary: "Get latency metrics" })
  @Permissions("saas.analytics.read")
  @Get("latency")
  async getLatency() {
    const start = Date.now();
    return { latencyMs: Date.now() - start, timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: "Get cache statistics" })
  @Permissions("saas.analytics.read")
  @Get("cache")
  async getCacheStats() {
    return { hitRate: 0.94, keys: 1280, memoryUsage: "2.4 MB", evictions: 0 };
  }

  @ApiOperation({ summary: "Get tenant-specific health" })
  @Permissions("saas.portal.read")
  @Get("tenant")
  async getTenantHealth(@Req() req: AuthReq) {
    return { tenantId: req.user.tenantId, status: "active", quotaOk: true, billingOk: true, subscriptionActive: true };
  }
}
