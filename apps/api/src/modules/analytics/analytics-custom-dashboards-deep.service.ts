import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AnalyticsCustomDashboardsDeepService {
  async getDashboards(tenantId: string) {
    return prisma.analyticsCustomDashboard.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createDashboard(
    tenantId: string,
    creatorId: string,
    dto: { name: string; description?: string; isPublic?: boolean },
  ) {
    return prisma.analyticsCustomDashboard.create({
      data: {
        tenantId,
        creatorId,
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic || false,
      },
    });
  }

  async addWidget(
    dashboardId: string,
    dto: {
      title: string;
      widgetType: string;
      queryConfig?: any;
      layoutGrid?: any;
    },
  ) {
    return prisma.analyticsDashboardWidgetDeep.create({
      data: {
        dashboardId,
        title: dto.title,
        widgetType: dto.widgetType || "KPI",
        queryConfig: dto.queryConfig || {},
        layoutGrid: dto.layoutGrid || { x: 0, y: 0, w: 4, h: 3 },
      },
    });
  }
}
