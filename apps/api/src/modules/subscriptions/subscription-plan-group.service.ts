import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SubscriptionPlanGroupService {
  async getGroups(tenantId: string) {
    return prisma.subscriptionPlanGroup.findMany({
      where: { tenantId },
      include: {
        plans: { where: { isActive: true }, orderBy: { monthlyPrice: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createGroup(
    tenantId: string,
    dto: { name: string; description?: string; sortOrder?: number },
  ) {
    const exists = await prisma.subscriptionPlanGroup.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (exists) throw new BadRequestException("Group name already exists");
    return prisma.subscriptionPlanGroup.create({
      data: { tenantId, ...dto, sortOrder: dto.sortOrder || 0 },
    });
  }

  async updateGroup(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const g = await prisma.subscriptionPlanGroup.findFirst({
      where: { tenantId, id },
    });
    if (!g) throw new NotFoundException("Group not found");
    return prisma.subscriptionPlanGroup.update({ where: { id }, data: dto });
  }

  async deleteGroup(tenantId: string, id: string) {
    const g = await prisma.subscriptionPlanGroup.findFirst({
      where: { tenantId, id },
    });
    if (!g) throw new NotFoundException("Group not found");
    const planCount = await prisma.subscriptionPlanTier.count({
      where: { tenantId },
    });
    if (planCount > 0)
      throw new BadRequestException(
        "Remove all plans from group before deleting",
      );
    await prisma.subscriptionPlanGroup.delete({ where: { id } });
    return { success: true };
  }

  async assignPlansToGroup(
    tenantId: string,
    groupId: string,
    planIds: string[],
  ) {
    const g = await prisma.subscriptionPlanGroup.findFirst({
      where: { tenantId, id: groupId },
    });
    if (!g) throw new NotFoundException("Group not found");
    for (const planId of planIds) {
      await prisma.subscriptionPlanTier
        .update({ where: { id: planId, tenantId }, data: {} })
        .catch(() => {});
    }
    return { success: true, planIds };
  }
}
