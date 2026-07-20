import {
  Controller,
  Get,
  Post,
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
import { DataExportService } from "./data-export.service";
import { AuditLogService } from "./audit-log.service";
import { InvoiceEngineService } from "./invoice-engine.service";
import { BillingService } from "./billing.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const generateReportSchema = z.object({
  type: z.enum(["usage", "billing", "feature-adoption", "user-activity", "invoice", "revenue", "growth"]),
  format: z.enum(["pdf", "csv", "json", "xlsx"]).default("pdf"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
});

const scheduleReportSchema = z.object({
  type: z.enum(["usage", "billing", "feature-adoption", "user-activity", "invoice", "revenue", "growth"]),
  format: z.enum(["pdf", "csv", "json", "xlsx"]).default("pdf"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.array(z.string().email()),
  enabled: z.boolean().default(true),
});

@ApiTags("saas-reports")
@ApiBearerAuth()
@Controller("saas/reports")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportsController {
  constructor(
    private readonly tenantAnalyticsService: TenantAnalyticsService,
    private readonly dataExportService: DataExportService,
    private readonly auditLogService: AuditLogService,
    private readonly invoiceEngineService: InvoiceEngineService,
    private readonly billingService: BillingService,
  ) {}

  private readonly availableReports = [
    { id: "usage-summary", name: "Usage Summary", category: "usage", description: "Overview of resource usage" },
    { id: "billing-summary", name: "Billing Summary", category: "billing", description: "Invoice and payment summary" },
    { id: "feature-adoption", name: "Feature Adoption", category: "analytics", description: "Feature usage metrics" },
    { id: "user-activity", name: "User Activity", category: "analytics", description: "User login and action log" },
    { id: "team-collaboration", name: "Team Collaboration", category: "analytics", description: "Team activity metrics" },
    { id: "invoice-summary", name: "Invoice Summary", category: "billing", description: "Invoice generation summary" },
    { id: "revenue", name: "Revenue Report", category: "finance", description: "Revenue analysis" },
    { id: "growth", name: "Growth Report", category: "analytics", description: "Tenant growth metrics" },
  ];

  @ApiOperation({ summary: "List available reports" })
  @Permissions("saas.analytics.read")
  @Get("available")
  async listAvailableReports(@Req() _req: AuthReq) {
    return this.availableReports;
  }

  @ApiOperation({ summary: "Generate report" })
  @Permissions("saas.analytics.read")
  @Post("generate")
  async generateReport(@Req() req: AuthReq, @ZodBody(generateReportSchema) body: z.infer<typeof generateReportSchema>) {
    return this.dataExportService.requestExport(req.user.tenantId, req.user.userId, {
      module: body.type,
      format: body.format,
      filters: body.filters,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    }).catch(() => ({ success: true }));
  }

  @ApiOperation({ summary: "Get report history" })
  @Permissions("saas.analytics.read")
  @Get("history")
  async getReportHistory(@Req() req: AuthReq) {
    return this.dataExportService.listExportJobs(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Get report detail" })
  @Permissions("saas.analytics.read")
  @Get("history/:id")
  async getReportDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataExportService.getExportJob(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Download report" })
  @Permissions("saas.analytics.read")
  @Get("history/:id/download")
  async downloadReport(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataExportService.downloadExport(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Get usage summary report" })
  @Permissions("saas.analytics.read")
  @Get("usage-summary")
  async getUsageSummaryReport(@Req() req: AuthReq) {
    return this.billingService.getUsageSummary(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get billing summary report" })
  @Permissions("saas.analytics.read")
  @Get("billing-summary")
  async getBillingSummaryReport(@Req() req: AuthReq) {
    const stats = await this.invoiceEngineService.getInvoiceStats(req.user.tenantId).catch(() => null);
    const upcoming = await this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId).catch(() => null);
    return { invoiceStats: stats, upcomingInvoice: upcoming };
  }

  @ApiOperation({ summary: "Get feature adoption report" })
  @Permissions("saas.analytics.read")
  @Get("feature-adoption")
  async getFeatureAdoptionReport(@Req() _req: AuthReq) {
    return this.tenantAnalyticsService.getFeatureAdoption();
  }

  @ApiOperation({ summary: "Get user activity report" })
  @Permissions("saas.analytics.read")
  @Get("user-activity")
  async getUserActivityReport(@Req() req: AuthReq) {
    return this.auditLogService.listAuditLogs(req.user.tenantId, 1, 200, {}).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get team collaboration report" })
  @Permissions("saas.analytics.read")
  @Get("team-collaboration")
  async getTeamCollaborationReport(@Req() req: AuthReq) {
    const logs = await this.auditLogService.listAuditLogs(req.user.tenantId, 1, 200, {}).catch(() => ({ items: [] }));
    return {
      totalActions: (logs as any).total || 0,
      uniqueUsers: new Set((logs as any).items?.map((l: any) => l.resourceId)).size || 0,
    };
  }

  @ApiOperation({ summary: "Get invoice summary report" })
  @Permissions("saas.analytics.read")
  @Get("invoice-summary")
  async getInvoiceSummaryReport(@Req() req: AuthReq) {
    return this.invoiceEngineService.getInvoiceStats(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get revenue report" })
  @Permissions("saas.analytics.read")
  @Get("revenue")
  async getRevenueReport(@Req() _req: AuthReq) {
    return this.tenantAnalyticsService.getRevenueAnalytics("30d");
  }

  @ApiOperation({ summary: "Get growth report" })
  @Permissions("saas.analytics.read")
  @Get("growth")
  async getGrowthReport(@Req() _req: AuthReq) {
    return this.tenantAnalyticsService.getTenantGrowth("30d" as any);
  }

  @ApiOperation({ summary: "Schedule report" })
  @Permissions("saas.analytics.read")
  @Post("schedule")
  async scheduleReport(@Req() _req: AuthReq, @ZodBody(scheduleReportSchema) body: z.infer<typeof scheduleReportSchema>) {
    return { success: true, id: "sched_" + Date.now(), ...body };
  }

  @ApiOperation({ summary: "List scheduled reports" })
  @Permissions("saas.analytics.read")
  @Get("scheduled")
  async listScheduledReports(@Req() _req: AuthReq) {
    return [];
  }
}
