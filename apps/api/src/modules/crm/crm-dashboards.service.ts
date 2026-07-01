import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateCrmDashboardInput, UpdateCrmDashboardInput,
  CreateDashboardWidgetInput, UpdateDashboardWidgetInput,
} from '@unerp/shared';
import { resolveOrgId } from './crm-shared';

/**
 * Dashboard builder: user/shared dashboards, their widgets, and layout.
 * Per-widget data resolution (getWidgetData) lives in the CrmService facade
 * because it aggregates across several domain services.
 */
@Injectable()
export class CrmDashboardsService {
  async getDashboards(tenantId: string, userId: string) {
    return prisma.crmDashboard.findMany({
      where: { tenantId, deletedAt: null, OR: [{ createdBy: userId }, { isShared: true }] },
      include: { _count: { select: { widgets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDashboard(tenantId: string, orgId: string, userId: string, dto: CreateCrmDashboardInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.crmDashboard.create({
      data: { tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description || null, isShared: dto.isShared || false, createdBy: userId },
    });
  }

  async updateDashboard(tenantId: string, id: string, dto: UpdateCrmDashboardInput) {
    const existing = await prisma.crmDashboard.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({ where: { id }, data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isShared !== undefined && { isShared: dto.isShared }),
    } });
  }

  async deleteDashboard(tenantId: string, id: string) {
    const existing = await prisma.crmDashboard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async cloneDashboard(tenantId: string, id: string, userId: string) {
    const original = await prisma.crmDashboard.findFirst({ where: { id, tenantId, deletedAt: null }, include: { widgets: true } });
    if (!original) throw new NotFoundException('Dashboard not found');
    const clone = await prisma.crmDashboard.create({
      data: { tenantId, orgId: original.orgId, name: `${original.name} (Copy)`, description: original.description, layout: original.layout as Prisma.InputJsonValue, isShared: false, createdBy: userId },
    });
    for (const w of original.widgets) {
      await prisma.crmDashboardWidget.create({
        data: { tenantId, dashboardId: clone.id, widgetType: w.widgetType, title: w.title, dataSource: w.dataSource, config: w.config as Prisma.InputJsonValue, refreshInterval: w.refreshInterval },
      });
    }
    return clone;
  }

  async addWidget(tenantId: string, dashboardId: string, dto: CreateDashboardWidgetInput) {
    const dashboard = await prisma.crmDashboard.findFirst({ where: { id: dashboardId, tenantId, deletedAt: null } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboardWidget.create({
      data: { tenantId, dashboardId, widgetType: dto.widgetType, title: dto.title, dataSource: dto.dataSource, config: dto.config as Prisma.InputJsonValue, refreshInterval: dto.refreshInterval || 0 },
    });
  }

  async updateWidget(tenantId: string, widgetId: string, dto: UpdateDashboardWidgetInput) {
    const widget = await prisma.crmDashboardWidget.findFirst({ where: { id: widgetId, tenantId } });
    if (!widget) throw new NotFoundException('Widget not found');
    return prisma.crmDashboardWidget.update({ where: { id: widgetId }, data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.widgetType !== undefined && { widgetType: dto.widgetType }),
      ...(dto.dataSource !== undefined && { dataSource: dto.dataSource }),
      ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
      ...(dto.refreshInterval !== undefined && { refreshInterval: dto.refreshInterval }),
    } });
  }

  async removeWidget(tenantId: string, widgetId: string) {
    const widget = await prisma.crmDashboardWidget.findFirst({ where: { id: widgetId, tenantId } });
    if (!widget) throw new NotFoundException('Widget not found');
    return prisma.crmDashboardWidget.delete({ where: { id: widgetId } });
  }

  async updateDashboardLayout(tenantId: string, dashboardId: string, layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>) {
    const dashboard = await prisma.crmDashboard.findFirst({ where: { id: dashboardId, tenantId } });
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    return prisma.crmDashboard.update({ where: { id: dashboardId }, data: { layout: layout as Prisma.InputJsonValue } });
  }

  async getWidget(tenantId: string, widgetId: string) {
    const widget = await prisma.crmDashboardWidget.findFirst({ where: { id: widgetId, tenantId } });
    if (!widget) throw new NotFoundException('Widget not found');
    return widget;
  }
}
