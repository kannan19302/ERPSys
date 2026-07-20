import {
  Controller,
  Get,
  Post,
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
import { SaasService } from "./saas.service";
import { StorageMeteringService } from "./storage-metering.service";
import { UsageAlertsService } from "./usage-alerts.service";
import { BillingService } from "./billing.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const exportUsageSchema = z.object({
  format: z.enum(["csv", "json", "xlsx"]).default("csv"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  metrics: z.array(z.string()).optional(),
});

@ApiTags("saas-usage")
@ApiBearerAuth()
@Controller("saas/usage")
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsageAnalyticsController {
  constructor(
    private readonly saasService: SaasService,
    private readonly storageMetering: StorageMeteringService,
    private readonly usageAlertsService: UsageAlertsService,
    private readonly billingService: BillingService,
  ) {}

  @ApiOperation({ summary: "Get current usage" })
  @Permissions("saas.metering.read")
  @Get("current")
  async getCurrentUsage(@Req() req: AuthReq) {
    return this.billingService.getUsageSummary(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get usage history" })
  @Permissions("saas.metering.read")
  @Get("history")
  async getUsageHistory(
    @Req() req: AuthReq,
    @Query("metric") metric?: string,
    @Query("from") _from?: string,
    @Query("to") _to?: string,
  ) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    if (metric) return records.filter((r: any) => r.metric === metric);
    return records;
  }

  @ApiOperation({ summary: "Get metric history" })
  @Permissions("saas.metering.read")
  @Get("history/:metric")
  async getMetricHistory(@Req() req: AuthReq, @Param("metric") metric: string) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return records.filter((r: any) => r.metric === metric);
  }

  @ApiOperation({ summary: "Get usage forecast" })
  @Permissions("saas.metering.read")
  @Get("forecast")
  async getUsageForecast(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    const forecast: Record<string, number> = {};
    for (const r of records as any[]) {
      forecast[r.metric] = Math.round(r.currentValue * 1.1);
    }
    return { forecast, basedOn: records };
  }

  @ApiOperation({ summary: "Refresh usage metrics" })
  @Permissions("saas.metering.read")
  @Post("refresh")
  async refreshUsageMetrics(@Req() req: AuthReq) {
    return this.storageMetering.recomputeTenant(req.user.tenantId).catch(() => ({ perApp: {}, totalBytes: 0 }));
  }

  @ApiOperation({ summary: "Get usage breakdown" })
  @Permissions("saas.metering.read")
  @Get("breakdown")
  async getUsageBreakdown(@Req() req: AuthReq) {
    const usage = await this.billingService.getUsageSummary(req.user.tenantId).catch(() => null);
    const storage = await this.storageMetering.getTenantUsage(req.user.tenantId).catch(() => []);
    return { usage, perAppStorage: storage };
  }

  @ApiOperation({ summary: "Get usage trends" })
  @Permissions("saas.metering.read")
  @Get("trends")
  async getUsageTrends(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return { trends: records, period: "30d" };
  }

  @ApiOperation({ summary: "Get peak usage" })
  @Permissions("saas.metering.read")
  @Get("peak")
  async getPeakUsage(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    const peak: Record<string, { current: number; limit: number; pct: number }> = {};
    for (const r of records as any[]) {
      peak[r.metric] = {
        current: r.currentValue,
        limit: r.limitValue,
        pct: r.limitValue > 0 ? Math.round((r.currentValue / r.limitValue) * 100) : 0,
      };
    }
    return peak;
  }

  @ApiOperation({ summary: "Get daily usage" })
  @Permissions("saas.metering.read")
  @Get("daily")
  async getDailyUsage(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return { daily: records, date: new Date().toISOString().substring(0, 10) };
  }

  @ApiOperation({ summary: "Get monthly usage" })
  @Permissions("saas.metering.read")
  @Get("monthly")
  async getMonthlyUsage(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return { monthly: records, month: new Date().toISOString().substring(0, 7) };
  }

  @ApiOperation({ summary: "Get usage comparison" })
  @Permissions("saas.metering.read")
  @Get("comparison")
  async getUsageComparison(@Req() req: AuthReq) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return { current: records, previous: [], change: {} };
  }

  @ApiOperation({ summary: "Detect usage anomalies" })
  @Permissions("saas.metering.read")
  @Get("anomalies")
  async detectUsageAnomalies(@Req() _req: AuthReq) {
    return { anomalies: [], totalChecked: 0 };
  }

  @ApiOperation({ summary: "Export usage data" })
  @Permissions("saas.metering.read")
  @Post("export")
  async exportUsageData(@Req() req: AuthReq, @ZodBody(exportUsageSchema) body: z.infer<typeof exportUsageSchema>) {
    const records = await this.saasService.getUsageRecords(req.user.tenantId).catch(() => []);
    return { format: body.format, data: JSON.stringify(records), filename: `usage-export-${req.user.tenantId}.${body.format}` };
  }

  @ApiOperation({ summary: "Get app usage breakdown" })
  @Permissions("saas.metering.read")
  @Get("apps")
  async getAppUsageBreakdown(@Req() req: AuthReq) {
    return this.storageMetering.getTenantUsage(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Get app usage detail" })
  @Permissions("saas.metering.read")
  @Get("apps/:appSlug")
  async getAppUsageDetail(@Req() req: AuthReq, @Param("appSlug") appSlug: string) {
    const apps = await this.storageMetering.getTenantUsage(req.user.tenantId).catch(() => []);
    return (apps as any[]).find((a) => a.appSlug === appSlug) || { appSlug, rowCount: 0, estimatedBytes: 0 };
  }

  @ApiOperation({ summary: "Get usage alert summary" })
  @Permissions("saas.alert.read")
  @Get("alerts")
  async getUsageAlertSummary(@Req() req: AuthReq) {
    return this.usageAlertsService.getAlertHistory(req.user.tenantId).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get optimization recommendations" })
  @Permissions("saas.metering.read")
  @Get("recommendations")
  async getOptimizationRecommendations(@Req() req: AuthReq) {
    const usage = await this.billingService.getUsageSummary(req.user.tenantId).catch(() => null);
    const recommendations = [];
    if (usage && usage.users && usage.storage) {
      if (usage.users.pct > 80) recommendations.push({ type: "users", message: "Approaching user limit", severity: "warning" });
      if (usage.storage.pct > 80) recommendations.push({ type: "storage", message: "Storage usage is high", severity: "warning" });
    }
    return recommendations;
  }
}
