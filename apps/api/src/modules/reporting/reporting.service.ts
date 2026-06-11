import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class ReportingService {
  async getWidgets(tenantId: string) {
    return prisma.reportWidget.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWidget(
    tenantId: string,
    dto: { dashboardId: string; title: string; chartType: string; queryConfig: string; position: string }
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async createView(
    tenantId: string,
    dto: { name: string; queryConfig: string; isScheduled?: boolean; scheduleCron?: string; recipientEmails?: string }
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
