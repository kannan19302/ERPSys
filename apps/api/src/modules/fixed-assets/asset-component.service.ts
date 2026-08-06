import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssetComponentService {
  async getComponents(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetComponentWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    return prisma.fixedAssetComponent.findMany({
      where,
      include: { replacements: true },
      orderBy: { name: "asc" },
    });
  }

  async addComponent(
    tenantId: string,
    assetId: string,
    dto: {
      name: string;
      serialNo?: string;
      partNo?: string;
      quantity?: number;
      unitCost?: number;
      installedAt?: string;
      warrantyExpiry?: string;
    },
  ) {
    return prisma.fixedAssetComponent.create({
      data: {
        tenantId,
        assetId,
        name: dto.name,
        serialNo: dto.serialNo,
        partNo: dto.partNo,
        quantity: dto.quantity || 1,
        unitCost: dto.unitCost
          ? new Prisma.Decimal(dto.unitCost)
          : new Prisma.Decimal(0),
        installedAt: dto.installedAt ? new Date(dto.installedAt) : new Date(),
        warrantyExpiry: dto.warrantyExpiry
          ? new Date(dto.warrantyExpiry)
          : undefined,
        status: "ACTIVE",
      },
    });
  }

  async replaceComponent(
    tenantId: string,
    componentId: string,
    dto: {
      newSerialNo?: string;
      cost?: number;
      reason?: string;
      performedBy?: string;
    },
  ) {
    const comp = await prisma.fixedAssetComponent.findFirst({
      where: { tenantId, id: componentId },
    });
    if (!comp) throw new NotFoundException("Component not found");
    return prisma.$transaction(async (tx) => {
      await tx.fixedAssetComponentReplacement.create({
        data: {
          tenantId,
          componentId,
          replacedAt: new Date(),
          oldSerialNo: comp.serialNo,
          newSerialNo: dto.newSerialNo,
          cost: dto.cost ? new Prisma.Decimal(dto.cost) : new Prisma.Decimal(0),
          reason: dto.reason,
          performedBy: dto.performedBy,
        },
      });
      return tx.fixedAssetComponent.update({
        where: { id: componentId },
        data: { serialNo: dto.newSerialNo ?? comp.serialNo, status: "ACTIVE" },
      });
    });
  }

  async retireComponent(tenantId: string, componentId: string) {
    const comp = await prisma.fixedAssetComponent.findFirst({
      where: { tenantId, id: componentId },
    });
    if (!comp) throw new NotFoundException("Component not found");
    return prisma.fixedAssetComponent.update({
      where: { id: componentId },
      data: { status: "RETIRED" },
    });
  }

  async getReplacements(tenantId: string, componentId: string) {
    return prisma.fixedAssetComponentReplacement.findMany({
      where: { tenantId, componentId },
      orderBy: { replacedAt: "desc" },
    });
  }

  async getComponentSummary(tenantId: string, assetId?: string) {
    const where: Prisma.FixedAssetComponentWhereInput = { tenantId };
    if (assetId) where.assetId = assetId;
    const components = await prisma.fixedAssetComponent.findMany({ where });
    const active = components.filter((c) => c.status === "ACTIVE").length;
    const replaced = components.filter((c) => c.status === "REPLACED").length;
    const totalCost = components.reduce(
      (s, c) => s + Number(c.unitCost) * c.quantity,
      0,
    );
    return { totalComponents: components.length, active, replaced, totalCost };
  }
}
