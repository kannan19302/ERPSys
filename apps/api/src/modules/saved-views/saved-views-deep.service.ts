import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SavedViewsDeepService {
  async getLayouts(tenantId: string, userId: string, viewId: string) {
    return prisma.savedViewLayout.findMany({
      where: { tenantId, userId, viewId },
      orderBy: { createdAt: "desc" },
    });
  }

  async upsertLayout(
    tenantId: string,
    userId: string,
    data: {
      viewId: string;
      layoutType?: string;
      columns?: any[];
      groupBy?: string;
      sortBy?: any[];
      pageSize?: number;
      isDefault?: boolean;
    },
  ) {
    const existing = await prisma.savedViewLayout.findUnique({
      where: {
        tenantId_userId_viewId: { tenantId, userId, viewId: data.viewId },
      },
    });
    if (existing) {
      return prisma.savedViewLayout.update({
        where: { id: existing.id },
        data: {
          layoutType: data.layoutType,
          columns: data.columns,
          groupBy: data.groupBy,
          sortBy: data.sortBy,
          pageSize: data.pageSize,
          isDefault: data.isDefault,
        },
      });
    }
    return prisma.savedViewLayout.create({
      data: {
        tenantId,
        userId,
        viewId: data.viewId,
        layoutType: data.layoutType ?? "table",
        columns: data.columns ?? [],
        groupBy: data.groupBy,
        sortBy: data.sortBy ?? [],
        pageSize: data.pageSize ?? 25,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async deleteLayout(tenantId: string, userId: string, id: string) {
    const layout = await prisma.savedViewLayout.findFirst({
      where: { id, tenantId, userId },
    });
    if (!layout) throw new NotFoundException("Layout not found");
    return prisma.savedViewLayout.delete({ where: { id } });
  }

  async getFilters(tenantId: string, viewId: string) {
    return prisma.savedViewFilter.findMany({
      where: { tenantId, viewId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async addFilter(
    tenantId: string,
    userId: string,
    data: {
      viewId: string;
      field: string;
      operator: string;
      value: any;
      logic?: string;
    },
  ) {
    const count = await prisma.savedViewFilter.count({
      where: { tenantId, viewId: data.viewId },
    });
    return prisma.savedViewFilter.create({
      data: {
        tenantId,
        userId,
        viewId: data.viewId,
        field: data.field,
        operator: data.operator,
        value: data.value,
        logic: data.logic ?? "AND",
        sortOrder: count,
      },
    });
  }

  async updateFilter(
    tenantId: string,
    userId: string,
    id: string,
    data: {
      field?: string;
      operator?: string;
      value?: any;
      logic?: string;
      isActive?: boolean;
    },
  ) {
    const filter = await prisma.savedViewFilter.findFirst({
      where: { id, tenantId, userId },
    });
    if (!filter) throw new NotFoundException("Filter not found");
    return prisma.savedViewFilter.update({ where: { id }, data });
  }

  async deleteFilter(tenantId: string, userId: string, id: string) {
    const filter = await prisma.savedViewFilter.findFirst({
      where: { id, tenantId, userId },
    });
    if (!filter) throw new NotFoundException("Filter not found");
    return prisma.savedViewFilter.delete({ where: { id } });
  }

  async getColumnConfigs(tenantId: string, viewId: string, userId: string) {
    return prisma.savedViewColumnConfig.findMany({
      where: { tenantId, viewId, userId },
      orderBy: { position: "asc" },
    });
  }

  async upsertColumnConfig(
    tenantId: string,
    userId: string,
    data: {
      viewId: string;
      field: string;
      label?: string;
      width?: number;
      sortable?: boolean;
      visible?: boolean;
      position?: number;
      format?: string;
      alignment?: string;
    },
  ) {
    return prisma.savedViewColumnConfig.upsert({
      where: {
        tenantId_viewId_field_userId: {
          tenantId,
          viewId: data.viewId,
          field: data.field,
          userId,
        },
      },
      update: {
        label: data.label,
        width: data.width,
        sortable: data.sortable,
        visible: data.visible,
        position: data.position,
        format: data.format,
        alignment: data.alignment,
      },
      create: {
        tenantId,
        userId,
        viewId: data.viewId,
        field: data.field,
        label: data.label,
        width: data.width,
        sortable: data.sortable ?? true,
        visible: data.visible ?? true,
        position: data.position ?? 0,
        format: data.format,
        alignment: data.alignment ?? "left",
      },
    });
  }

  async reorderColumns(
    tenantId: string,
    userId: string,
    viewId: string,
    fieldOrder: string[],
  ) {
    await prisma.$transaction(
      fieldOrder.map((field, index) =>
        prisma.savedViewColumnConfig.updateMany({
          where: { tenantId, viewId, userId, field },
          data: { position: index },
        }),
      ),
    );
    return { success: true };
  }

  async shareView(
    tenantId: string,
    sharedByUserId: string,
    data: {
      viewId: string;
      sharedWithUserId: string;
      permission?: string;
    },
  ) {
    return prisma.savedViewSharing.upsert({
      where: {
        tenantId_viewId_sharedWithUserId: {
          tenantId,
          viewId: data.viewId,
          sharedWithUserId: data.sharedWithUserId,
        },
      },
      update: { permission: data.permission ?? "view" },
      create: {
        tenantId,
        viewId: data.viewId,
        sharedWithUserId: data.sharedWithUserId,
        sharedByUserId,
        permission: data.permission ?? "view",
      },
    });
  }

  async removeShare(tenantId: string, userId: string, id: string) {
    const share = await prisma.savedViewSharing.findFirst({
      where: { id, tenantId, sharedByUserId: userId },
    });
    if (!share) throw new NotFoundException("Share not found");
    return prisma.savedViewSharing.delete({ where: { id } });
  }

  async getSharedWithMe(tenantId: string, userId: string) {
    const shares = await prisma.savedViewSharing.findMany({
      where: { tenantId, sharedWithUserId: userId },
      include: { view: true },
    });
    return shares.map((s) => ({
      id: s.id,
      viewId: s.viewId,
      viewName: s.view.name,
      permission: s.permission,
      sharedByUserId: s.sharedByUserId,
      createdAt: s.createdAt,
    }));
  }

  async setDefaultView(tenantId: string, userId: string, viewId: string) {
    await prisma.savedViewLayout.updateMany({
      where: { tenantId, userId, isDefault: true },
      data: { isDefault: false },
    });
    const layout = await prisma.savedViewLayout.findFirst({
      where: { tenantId, userId, viewId },
    });
    if (layout) {
      return prisma.savedViewLayout.update({
        where: { id: layout.id },
        data: { isDefault: true },
      });
    }
    throw new NotFoundException("Layout not found for this view");
  }

  async applyViewConfig(
    tenantId: string,
    userId: string,
    viewId: string,
    resourceName: string,
  ) {
    const [layout, filters, columns] = await Promise.all([
      prisma.savedViewLayout.findFirst({ where: { tenantId, userId, viewId } }),
      prisma.savedViewFilter.findMany({
        where: { tenantId, viewId, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.savedViewColumnConfig.findMany({
        where: { tenantId, viewId, userId },
        orderBy: { position: "asc" },
      }),
    ]);
    return { layout, filters, columns };
  }

  async cloneView(
    tenantId: string,
    userId: string,
    sourceViewId: string,
    newName: string,
  ) {
    const source = await prisma.savedView.findUnique({
      where: { id: sourceViewId },
    });
    if (!source || source.tenantId !== tenantId)
      throw new NotFoundException("Source view not found");
    const cloned = await prisma.savedView.create({
      data: {
        tenantId,
        userId,
        resourceName: source.resourceName,
        name: newName,
        state: source.state as any,
      },
    });
    const layouts = await prisma.savedViewLayout.findMany({
      where: { tenantId, userId, viewId: sourceViewId },
    });
    for (const l of layouts) {
      await prisma.savedViewLayout.create({
        data: {
          tenantId,
          userId,
          viewId: cloned.id,
          layoutType: l.layoutType,
          columns: l.columns as any,
          groupBy: l.groupBy,
          sortBy: l.sortBy as any,
          pageSize: l.pageSize,
        },
      });
    }
    const filters = await prisma.savedViewFilter.findMany({
      where: { tenantId, viewId: sourceViewId, isActive: true },
    });
    for (const f of filters) {
      await prisma.savedViewFilter.create({
        data: {
          tenantId,
          userId,
          viewId: cloned.id,
          field: f.field,
          operator: f.operator,
          value: f.value as any,
          logic: f.logic,
          sortOrder: f.sortOrder,
        },
      });
    }
    return cloned;
  }
}
