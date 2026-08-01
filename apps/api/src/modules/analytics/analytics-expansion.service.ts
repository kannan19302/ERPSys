import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import type {
  ReportFilterDto,
  DashboardWidgetDto,
  KpiValueDto,
  ScheduledExportDto,
} from "./dto/analytics-expansion.dto";

@Injectable()
export class AnalyticsExpansionService {
  // ── Report Filters ──
  async getReportFilters(tenantId: string, reportId: string) {
    return prisma.analyticsReportFilter.findMany({
      where: { tenantId, reportId },
    });
  }

  async createReportFilter(tenantId: string, dto: ReportFilterDto) {
    const report = await prisma.report.findFirst({
      where: { id: dto.reportId, tenantId },
    });
    if (!report) throw new NotFoundException("Report not found");
    return prisma.analyticsReportFilter.create({
      data: {
        tenantId,
        reportId: dto.reportId,
        field: dto.field,
        operator: dto.operator,
        value: dto.value,
      },
    });
  }

  async deleteReportFilter(tenantId: string, id: string) {
    const existing = await prisma.analyticsReportFilter.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Report filter not found");
    return prisma.analyticsReportFilter.delete({ where: { id } });
  }

  // ── Dashboard Widgets ──
  async getDashboardWidgets(tenantId: string, dashboardId: string) {
    return prisma.analyticsDashboardWidget.findMany({
      where: { tenantId, dashboardId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createDashboardWidget(tenantId: string, dto: DashboardWidgetDto) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: dto.dashboardId, tenantId },
    });
    if (!dashboard) throw new NotFoundException("Dashboard not found");
    return prisma.analyticsDashboardWidget.create({
      data: {
        tenantId,
        dashboardId: dto.dashboardId,
        widgetType: dto.widgetType,
        title: dto.title,
        config: dto.config as never,
        position: dto.position as never,
        width: dto.width,
        height: dto.height,
      },
    });
  }

  async updateDashboardWidget(
    tenantId: string,
    id: string,
    dto: Partial<DashboardWidgetDto>,
  ) {
    const existing = await prisma.analyticsDashboardWidget.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Dashboard widget not found");
    return prisma.analyticsDashboardWidget.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        config: dto.config !== undefined ? (dto.config as never) : undefined,
        position:
          dto.position !== undefined ? (dto.position as never) : undefined,
        width: dto.width !== undefined ? dto.width : undefined,
        height: dto.height !== undefined ? dto.height : undefined,
      },
    });
  }

  async deleteDashboardWidget(tenantId: string, id: string) {
    const existing = await prisma.analyticsDashboardWidget.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Dashboard widget not found");
    return prisma.analyticsDashboardWidget.delete({ where: { id } });
  }

  // ── KPI Values ──
  async getKpiValues(tenantId: string, kpiId: string) {
    return prisma.analyticsKpiValue.findMany({
      where: { tenantId, kpiId },
      orderBy: { periodStart: "desc" },
    });
  }

  async recordKpiValue(tenantId: string, dto: KpiValueDto) {
    const kpi = await prisma.kPI.findFirst({
      where: { id: dto.kpiId, tenantId },
    });
    if (!kpi) throw new NotFoundException("KPI not found");
    return prisma.analyticsKpiValue.create({
      data: {
        tenantId,
        kpiId: dto.kpiId,
        value: new Prisma.Decimal(dto.value),
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        metadata: dto.metadata || undefined,
      },
    });
  }

  // ── Scheduled Exports ──
  async getScheduledExports(tenantId: string) {
    return prisma.analyticsScheduledExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createScheduledExport(tenantId: string, dto: ScheduledExportDto) {
    const cronMap: Record<string, number> = {
      DAILY: 1,
      WEEKLY: 7,
      MONTHLY: 30,
      QUARTERLY: 90,
    };
    const nextRunAt = new Date();
    nextRunAt.setDate(nextRunAt.getDate() + (cronMap[dto.schedule] || 1));
    return prisma.analyticsScheduledExport.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        dataset: dto.dataset,
        format: dto.format,
        schedule: dto.schedule,
        recipients: dto.recipients as never,
        filters: dto.filters || undefined,
        nextRunAt,
      },
    });
  }

  async updateScheduledExport(
    tenantId: string,
    id: string,
    dto: Partial<ScheduledExportDto>,
  ) {
    const existing = await prisma.analyticsScheduledExport.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Scheduled export not found");
    return prisma.analyticsScheduledExport.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
        format: dto.format !== undefined ? dto.format : undefined,
        schedule: dto.schedule !== undefined ? dto.schedule : undefined,
        isActive:
          (dto as any).isActive !== undefined
            ? (dto as any).isActive
            : undefined,
      },
    });
  }

  async deleteScheduledExport(tenantId: string, id: string) {
    const existing = await prisma.analyticsScheduledExport.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Scheduled export not found");
    return prisma.analyticsScheduledExport.delete({ where: { id } });
  }
}
