import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingService {
  async getReports(tenantId: string) {
    return prisma.report.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createReport(tenantId: string, body: any) {
    return prisma.report.create({ data: { ...body, tenantId } as any });
  }

  async getReportCategories(tenantId: string) {
    return prisma.reportCategory.findMany({ where: { tenantId } });
  }

  async cloneReport(tenantId: string, id: string) {
    const original = await prisma.report.findFirst({ where: { id, tenantId } });
    if (!original) throw new NotFoundException("Report not found");
    return prisma.report.create({
      data: {
        ...original,
        id: undefined,
        name: `${original.name} (Copy)`,
        tenantId,
      } as any,
    });
  }

  async getReportingStats(tenantId: string) {
    const [reports, templates, jobs, exports] = await Promise.all([
      prisma.report.count({ where: { tenantId } }),
      prisma.reportingTemplateDeep.count({ where: { tenantId } }),
      prisma.reportingScheduledJobDeep.count({ where: { tenantId } }),
      prisma.reportingExportJob.count({ where: { tenantId } }),
    ]);
    return { reports, templates, jobs, exports };
  }

  async deleteReport(id: string) {
    return prisma.report.delete({ where: { id } });
  }

  async getWidgets(tenantId: string) {
    return prisma.reportWidget.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWidget(
    tenantId: string,
    dto: {
      dashboardId: string;
      title: string;
      chartType: string;
      queryConfig: string;
      position: string;
    },
  ) {
    return prisma.reportWidget.create({
      data: {
        tenantId,
        dashboardId: dto.dashboardId,
        title: dto.title,
        chartType: dto.chartType,
        queryConfig: dto.queryConfig,
        position: dto.position,
      },
    });
  }

  async getViews(tenantId: string) {
    return prisma.reportView.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createView(
    tenantId: string,
    dto: {
      name: string;
      queryConfig: string;
      isScheduled?: boolean;
      scheduleCron?: string;
      recipientEmails?: string;
    },
  ) {
    return prisma.reportView.create({
      data: {
        tenantId,
        name: dto.name,
        queryConfig: dto.queryConfig,
        isScheduled: dto.isScheduled ?? false,
        scheduleCron: dto.scheduleCron,
        recipientEmails: dto.recipientEmails,
      },
    });
  }
}
