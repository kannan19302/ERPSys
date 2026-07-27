import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SavedViewsFiltersService {
  async getFilterRules(tenantId: string, viewId: string) {
    return prisma.savedViewFilterRule.findMany({
      where: { tenantId, viewId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async addFilterRule(tenantId: string, viewId: string, data: any) {
    return prisma.savedViewFilterRule.create({
      data: {
        ...data,
        tenantId,
        viewId,
      },
    });
  }

  async deleteFilterRule(tenantId: string, id: string) {
    const existing = await prisma.savedViewFilterRule.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Filter rule not found");
    return prisma.savedViewFilterRule.delete({
      where: { id },
    });
  }

  async getUserPreference(
    tenantId: string,
    userId: string,
    moduleName: string,
  ) {
    return prisma.savedViewPreference.findFirst({
      where: { tenantId, userId, moduleName },
    });
  }

  async setPreferredView(
    tenantId: string,
    userId: string,
    moduleName: string,
    defaultViewId: string,
  ) {
    return prisma.savedViewPreference.upsert({
      where: { tenantId_userId_moduleName: { tenantId, userId, moduleName } },
      create: {
        tenantId,
        userId,
        moduleName,
        defaultViewId,
        pinnedViews: [defaultViewId],
      },
      update: {
        defaultViewId,
      },
    });
  }
}
