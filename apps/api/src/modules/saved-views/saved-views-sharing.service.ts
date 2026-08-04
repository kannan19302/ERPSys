import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SavedViewsSharingService {
  async getSharesForView(tenantId: string, viewId: string) {
    return prisma.savedViewShare.findMany({
      where: { tenantId, viewId },
      orderBy: { createdAt: "desc" },
    });
  }

  async shareView(
    tenantId: string,
    viewId: string,
    sharedWith: string,
    permission = "READ",
  ) {
    return prisma.savedViewShare.create({
      data: {
        tenantId,
        viewId,
        sharedWith,
        permission,
      },
    });
  }

  async removeShare(tenantId: string, shareId: string) {
    const existing = await prisma.savedViewShare.findFirst({
      where: { tenantId, id: shareId },
    });
    if (!existing)
      throw new NotFoundException("Saved view share rule not found");
    return prisma.savedViewShare.delete({
      where: { id: shareId },
    });
  }
}
