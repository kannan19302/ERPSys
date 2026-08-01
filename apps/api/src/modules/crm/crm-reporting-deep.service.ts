import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma, Prisma } from "@unerp/database";
import { z } from "zod";

export const createCrmSavedReportSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  module: z.string().optional(),
  type: z.enum(["TABLE", "CHART", "PIVOT", "SUMMARY"]).optional(),
  config: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.any()).optional(),
  chartConfig: z.record(z.any()).optional(),
  isShared: z.boolean().optional(),
});
export const updateCrmSavedReportSchema = createCrmSavedReportSchema.partial();
export type CreateCrmSavedReportInput = z.infer<
  typeof createCrmSavedReportSchema
>;
export type UpdateCrmSavedReportInput = z.infer<
  typeof updateCrmSavedReportSchema
>;

export const createReportScheduleSchema = z.object({
  name: z.string().min(1).max(200),
  frequency: z
    .enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "CUSTOM"])
    .optional(),
  cronExpr: z.string().optional(),
  recipients: z.array(z.string().email()).optional(),
  format: z.enum(["PDF", "CSV", "XLSX", "HTML"]).optional().default("PDF"),
  filters: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});
export const updateReportScheduleSchema = createReportScheduleSchema.partial();
export type CreateReportScheduleInput = z.infer<
  typeof createReportScheduleSchema
>;
export type UpdateReportScheduleInput = z.infer<
  typeof updateReportScheduleSchema
>;

export const createDashboardTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  category: z
    .enum(["GENERAL", "SALES", "MARKETING", "SERVICE", "EXECUTIVE"])
    .optional(),
  layout: z.array(z.any()).optional(),
  widgets: z.array(z.any()).optional(),
  isDefault: z.boolean().optional(),
});
export const updateDashboardTemplateSchema =
  createDashboardTemplateSchema.partial();
export type CreateDashboardTemplateInput = z.infer<
  typeof createDashboardTemplateSchema
>;
export type UpdateDashboardTemplateInput = z.infer<
  typeof updateDashboardTemplateSchema
>;

@Injectable()
export class CrmReportingDeepService {
  // ── Saved Reports ────────────────────────────────────────────

  async getSavedReports(
    tenantId: string,
    filters?: { module?: string; type?: string; favorites?: boolean },
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.module) where.module = filters.module;
    if (filters?.type) where.type = filters.type;
    if (filters?.favorites) where.isFavorite = true;
    return prisma.crmSavedReport.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    });
  }

  async getSavedReportById(tenantId: string, id: string) {
    const report = await prisma.crmSavedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { category: true, schedules: true, shares: true },
    });
    if (!report) throw new NotFoundException("Saved report not found");
    await prisma.crmSavedReport.update({
      where: { id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });
    return report;
  }

  async createSavedReport(
    tenantId: string,
    _orgId: string,
    dto: CreateCrmSavedReportInput,
    createdBy: string,
  ) {
    return prisma.crmSavedReport.create({
      data: {
        tenantId,
        categoryId: dto.categoryId || null,
        name: dto.name,
        description: dto.description || null,
        module: dto.module || "crm",
        type: dto.type || "TABLE",
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
        filters: (dto.filters ?? {}) as Prisma.InputJsonValue,
        columns: (dto.columns ?? []) as Prisma.InputJsonValue,
        chartConfig: (dto.chartConfig ?? null) as Prisma.InputJsonValue,
        isShared: dto.isShared ?? false,
        createdBy,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateSavedReport(
    tenantId: string,
    id: string,
    dto: UpdateCrmSavedReportInput,
  ) {
    const existing = await prisma.crmSavedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Saved report not found");
    return prisma.crmSavedReport.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.module !== undefined && { module: dto.module }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.config !== undefined && {
          config: dto.config as Prisma.InputJsonValue,
        }),
        ...(dto.filters !== undefined && {
          filters: dto.filters as Prisma.InputJsonValue,
        }),
        ...(dto.columns !== undefined && {
          columns: dto.columns as Prisma.InputJsonValue,
        }),
        ...(dto.chartConfig !== undefined && {
          chartConfig: dto.chartConfig as Prisma.InputJsonValue,
        }),
        ...(dto.isShared !== undefined && { isShared: dto.isShared }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async deleteSavedReport(tenantId: string, id: string) {
    const existing = await prisma.crmSavedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Saved report not found");
    return prisma.crmSavedReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async executeReport(
    tenantId: string,
    reportId: string,
    params?: Record<string, any>,
  ) {
    const report = await prisma.crmSavedReport.findFirst({
      where: { id: reportId, tenantId, deletedAt: null },
    });
    if (!report) throw new NotFoundException("Saved report not found");
    await prisma.crmSavedReport.update({
      where: { id: reportId },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    const mergedFilters = {
      ...((report.filters ?? {}) as Record<string, any>),
      ...(params || {}),
    };
    const module = params?.module || report.module || "crm";

    let data: any[] = [];
    if (module === "crm" || module === "opportunities") {
      data = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null },
        take: mergedFilters.limit || 100,
        skip: mergedFilters.offset || 0,
        orderBy: mergedFilters.sortBy
          ? { [mergedFilters.sortBy]: mergedFilters.sortOrder || "desc" }
          : { createdAt: "desc" },
      });
    } else if (module === "leads") {
      data = await prisma.lead.findMany({
        where: { tenantId, deletedAt: null },
        take: mergedFilters.limit || 100,
        skip: mergedFilters.offset || 0,
        orderBy: { createdAt: "desc" },
      });
    } else if (module === "customers") {
      data = await prisma.customer.findMany({
        where: { tenantId, deletedAt: null },
        take: mergedFilters.limit || 100,
        skip: mergedFilters.offset || 0,
        orderBy: { createdAt: "desc" },
      });
    } else if (module === "activities") {
      data = await prisma.activity.findMany({
        where: { tenantId },
        take: mergedFilters.limit || 100,
        skip: mergedFilters.offset || 0,
        orderBy: { createdAt: "desc" },
      });
    }

    return {
      report: { id: report.id, name: report.name, type: report.type },
      config: report.config,
      columns: report.columns,
      data,
      total: data.length,
      executedAt: new Date(),
    };
  }

  async duplicateReport(tenantId: string, reportId: string, userId: string) {
    const original = await prisma.crmSavedReport.findFirst({
      where: { id: reportId, tenantId, deletedAt: null },
    });
    if (!original) throw new NotFoundException("Saved report not found");
    return prisma.crmSavedReport.create({
      data: {
        tenantId,
        name: `${original.name} (Copy)`,
        description: original.description,
        module: original.module,
        type: original.type,
        config: original.config as Prisma.InputJsonValue,
        filters: original.filters as Prisma.InputJsonValue,
        columns: original.columns as Prisma.InputJsonValue,
        chartConfig: original.chartConfig as Prisma.InputJsonValue,
        createdBy: userId,
      },
    });
  }

  async favoriteReport(tenantId: string, id: string) {
    const existing = await prisma.crmSavedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Saved report not found");
    return prisma.crmSavedReport.update({
      where: { id },
      data: { isFavorite: true },
    });
  }

  async unfavoriteReport(tenantId: string, id: string) {
    const existing = await prisma.crmSavedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Saved report not found");
    return prisma.crmSavedReport.update({
      where: { id },
      data: { isFavorite: false },
    });
  }

  // ── Report Schedules ─────────────────────────────────────────

  async getReportSchedules(tenantId: string, reportId: string) {
    return prisma.crmReportSchedule.findMany({
      where: { tenantId, reportId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSchedule(
    tenantId: string,
    reportId: string,
    dto: CreateReportScheduleInput,
    createdBy: string,
  ) {
    const report = await prisma.crmSavedReport.findFirst({
      where: { id: reportId, tenantId, deletedAt: null },
    });
    if (!report) throw new NotFoundException("Saved report not found");
    return prisma.crmReportSchedule.create({
      data: {
        tenantId,
        reportId,
        name: dto.name,
        frequency: dto.frequency || "WEEKLY",
        cronExpr: dto.cronExpr || null,
        recipients: dto.recipients ?? [],
        format: dto.format || "PDF",
        filters: (dto.filters ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
        createdBy,
      },
    });
  }

  async updateSchedule(
    tenantId: string,
    reportId: string,
    scheduleId: string,
    dto: UpdateReportScheduleInput,
  ) {
    const existing = await prisma.crmReportSchedule.findFirst({
      where: { id: scheduleId, tenantId, reportId },
    });
    if (!existing) throw new NotFoundException("Report schedule not found");
    return prisma.crmReportSchedule.update({
      where: { id: scheduleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(dto.cronExpr !== undefined && { cronExpr: dto.cronExpr }),
        ...(dto.recipients !== undefined && { recipients: dto.recipients }),
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.filters !== undefined && {
          filters: dto.filters as Prisma.InputJsonValue,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteSchedule(tenantId: string, reportId: string, scheduleId: string) {
    const existing = await prisma.crmReportSchedule.findFirst({
      where: { id: scheduleId, tenantId, reportId },
    });
    if (!existing) throw new NotFoundException("Report schedule not found");
    return prisma.crmReportSchedule.delete({ where: { id: scheduleId } });
  }

  // ── Dashboard Templates ──────────────────────────────────────

  async getDashboardTemplates(tenantId: string) {
    return prisma.crmDashboardTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async createTemplate(tenantId: string, dto: CreateDashboardTemplateInput) {
    return prisma.crmDashboardTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        category: dto.category || "GENERAL",
        layout: (dto.layout ?? []) as Prisma.InputJsonValue,
        widgets: (dto.widgets ?? []) as Prisma.InputJsonValue,
        isDefault: dto.isDefault ?? false,
        createdBy: "system",
      },
    });
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    dto: UpdateDashboardTemplateInput,
  ) {
    const existing = await prisma.crmDashboardTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Dashboard template not found");
    return prisma.crmDashboardTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.layout !== undefined && {
          layout: dto.layout as Prisma.InputJsonValue,
        }),
        ...(dto.widgets !== undefined && {
          widgets: dto.widgets as Prisma.InputJsonValue,
        }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async deleteTemplate(tenantId: string, id: string) {
    const existing = await prisma.crmDashboardTemplate.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException("Dashboard template not found");
    return prisma.crmDashboardTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Dashboard Shares ─────────────────────────────────────────

  async getDashboardShares(tenantId: string, dashboardId: string) {
    return prisma.crmDashboardShare.findMany({
      where: { tenantId, dashboardId },
      orderBy: { createdAt: "desc" },
    });
  }

  async shareDashboard(
    tenantId: string,
    dashboardId: string,
    userId: string,
    canEdit?: boolean,
  ) {
    const dashboard = await prisma.crmDashboard.findFirst({
      where: { id: dashboardId, tenantId, deletedAt: null },
    });
    if (!dashboard) throw new NotFoundException("Dashboard not found");
    const existing = await prisma.crmDashboardShare.findFirst({
      where: { tenantId, dashboardId, userId },
    });
    if (existing)
      throw new BadRequestException("Dashboard already shared with this user");
    return prisma.crmDashboardShare.create({
      data: { tenantId, dashboardId, userId, canEdit: canEdit ?? false },
    });
  }

  async removeShare(tenantId: string, dashboardId: string, shareId: string) {
    const existing = await prisma.crmDashboardShare.findFirst({
      where: { id: shareId, tenantId, dashboardId },
    });
    if (!existing) throw new NotFoundException("Dashboard share not found");
    return prisma.crmDashboardShare.delete({ where: { id: shareId } });
  }

  // ── Report Categories & System Reports ───────────────────────

  async getReportCategories(tenantId: string) {
    return prisma.reportCategory.findMany({
      where: { tenantId },
      include: { _count: { select: { reports: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async getSystemReports(tenantId: string) {
    let reports = await prisma.systemReport.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    if (reports.length === 0) {
      await this.seedSystemReports(tenantId);
      reports = await prisma.systemReport.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    }
    return reports;
  }

  private async seedSystemReports(tenantId: string) {
    const defaults = [
      {
        name: "Pipeline by Stage",
        module: "crm",
        category: "sales",
        type: "CHART",
        config: { metric: "amount", groupBy: "stage" },
        sortOrder: 1,
      },
      {
        name: "Lead Source Breakdown",
        module: "crm",
        category: "marketing",
        type: "CHART",
        config: { metric: "count", groupBy: "source" },
        sortOrder: 2,
      },
      {
        name: "Win Rate Analysis",
        module: "crm",
        category: "sales",
        type: "TABLE",
        config: { metric: "winRate", groupBy: "rep" },
        sortOrder: 3,
      },
      {
        name: "Revenue Forecast",
        module: "crm",
        category: "sales",
        type: "SUMMARY",
        config: { metric: "forecast" },
        sortOrder: 4,
      },
      {
        name: "Activity Summary",
        module: "crm",
        category: "engagement",
        type: "TABLE",
        config: { metric: "count", groupBy: "type" },
        sortOrder: 5,
      },
      {
        name: "Deal Aging Report",
        module: "crm",
        category: "sales",
        type: "TABLE",
        config: { metric: "aging" },
        sortOrder: 6,
      },
      {
        name: "Territory Performance",
        module: "crm",
        category: "sales",
        type: "CHART",
        config: { metric: "revenue", groupBy: "territory" },
        sortOrder: 7,
      },
      {
        name: "Rep Performance",
        module: "crm",
        category: "sales",
        type: "TABLE",
        config: { metric: "achievement", groupBy: "rep" },
        sortOrder: 8,
      },
      {
        name: "Conversion Funnel",
        module: "crm",
        category: "marketing",
        type: "CHART",
        config: { metric: "conversion" },
        sortOrder: 9,
      },
      {
        name: "Customer Health",
        module: "crm",
        category: "service",
        type: "SUMMARY",
        config: { metric: "healthScore" },
        sortOrder: 10,
      },
    ];
    for (const r of defaults) {
      await prisma.systemReport.upsert({
        where: { id: `${tenantId}_${r.name}` },
        create: {
          id: `${tenantId}_${r.name}`,
          tenantId,
          ...r,
          category: r.category || "general",
        },
        update: {},
      });
    }
  }

  async getReportDashboard(tenantId: string) {
    const totalReports = await prisma.crmSavedReport.count({
      where: { tenantId, deletedAt: null },
    });
    const systemReports = await prisma.systemReport.count({
      where: { tenantId, isActive: true },
    });
    const favoriteReports = await prisma.crmSavedReport.count({
      where: { tenantId, deletedAt: null, isFavorite: true },
    });
    const totalSchedules = await prisma.crmReportSchedule.count({
      where: { tenantId, isActive: true },
    });
    const categories = await prisma.reportCategory.count({
      where: { tenantId },
    });

    const recent = await prisma.crmSavedReport.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { lastUsedAt: { sort: "desc", nulls: "last" } },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        lastUsedAt: true,
        usageCount: true,
      },
    });

    return {
      totalReports,
      systemReports,
      favoriteReports,
      totalSchedules,
      categories,
      recentReports: recent,
    };
  }

  async exportReport(tenantId: string, reportId: string, format: string) {
    const result = await this.executeReport(tenantId, reportId);
    if (format === "csv") {
      const headers = Array.isArray(result.columns)
        ? result.columns.map((c: any) => c.header || c.key || c).join(",")
        : "data";
      const rows = result.data.map((row: any) => Object.values(row).join(","));
      return {
        format: "csv",
        content: [headers, ...rows].join("\n"),
        filename: `${result.report.name}.csv`,
      };
    }
    return {
      format,
      content: JSON.stringify(result.data, null, 2),
      filename: `${result.report.name}.json`,
    };
  }
}
