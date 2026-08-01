import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AssetGroupService {
  async getGroups(tenantId: string) {
    return prisma.fixedAssetGroup.findMany({
      where: { tenantId },
      include: { _count: { select: { children: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createGroup(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
  ) {
    const exists = await prisma.fixedAssetGroup.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (exists) throw new BadRequestException("Group name already exists");
    return prisma.fixedAssetGroup.create({
      data: { tenantId, ...dto, sortOrder: dto.sortOrder || 0 },
    });
  }

  async updateGroup(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
  ) {
    const group = await prisma.fixedAssetGroup.findFirst({
      where: { tenantId, id },
    });
    if (!group) throw new NotFoundException("Group not found");
    return prisma.fixedAssetGroup.update({ where: { id }, data: dto });
  }

  async deleteGroup(tenantId: string, id: string) {
    const group = await prisma.fixedAssetGroup.findFirst({
      where: { tenantId, id },
    });
    if (!group) throw new NotFoundException("Group not found");
    const childCount = await prisma.fixedAssetGroup.count({
      where: { parentId: id },
    });
    if (childCount > 0)
      throw new BadRequestException("Cannot delete group with children");
    await prisma.fixedAssetGroupMember.deleteMany({ where: { groupId: id } });
    await prisma.fixedAssetGroup.delete({ where: { id } });
    return { success: true };
  }

  async addAssetToGroup(tenantId: string, groupId: string, assetId: string) {
    const exists = await prisma.fixedAssetGroupMember.findFirst({
      where: { tenantId, groupId, assetId },
    });
    if (exists) throw new BadRequestException("Asset already in group");
    return prisma.fixedAssetGroupMember.create({
      data: { tenantId, groupId, assetId },
    });
  }

  async removeAssetFromGroup(
    tenantId: string,
    groupId: string,
    assetId: string,
  ) {
    const member = await prisma.fixedAssetGroupMember.findFirst({
      where: { tenantId, groupId, assetId },
    });
    if (!member) throw new NotFoundException("Asset not in group");
    await prisma.fixedAssetGroupMember.delete({ where: { id: member.id } });
    return { success: true };
  }

  async getGroupAssets(tenantId: string, groupId: string) {
    const members = await prisma.fixedAssetGroupMember.findMany({
      where: { tenantId, groupId },
      include: { group: { select: { name: true } } },
    });
    const assetIds = members.map((m) => m.assetId);
    return prisma.fixedAsset.findMany({
      where: { tenantId, id: { in: assetIds } },
    });
  }
}
