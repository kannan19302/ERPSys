import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Builder dashboards: user-authored ERP dashboards (widgets + layout).
 */
@Injectable()
export class BuilderDashboardsService {
  async getDashboards(tenantId: string) {
    return prisma.builderDashboard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardById(tenantId: string, id: string) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');
    return db;
  }

  async createDashboard(
    tenantId: string,
    dto: { name: string; description?: string; icon?: string; widgets?: any; layout?: any; refreshRate?: number }
  ) {
    return prisma.builderDashboard.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        icon: dto.icon || null,
        widgets: dto.widgets || [],
        layout: dto.layout || {},
        refreshRate: dto.refreshRate || 300,
      },
    });
  }

  async updateDashboard(tenantId: string, id: string, dto: Partial<{ name: string; description: string; icon: string; status: string; widgets: any; layout: any; refreshRate: number }>) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');

    return prisma.builderDashboard.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.widgets !== undefined && { widgets: dto.widgets }),
        ...(dto.layout !== undefined && { layout: dto.layout }),
        ...(dto.refreshRate !== undefined && { refreshRate: dto.refreshRate }),
      },
    });
  }

  async deleteDashboard(tenantId: string, id: string) {
    const db = await prisma.builderDashboard.findFirst({ where: { id, tenantId } });
    if (!db) throw new NotFoundException('Dashboard not found');
    return prisma.builderDashboard.delete({ where: { id } });
  }
}
