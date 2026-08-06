import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ReportingSharesService {
  async getShares(tenantId: string, reportId: string) {
    return prisma.reportShare.findMany({
      where: { tenantId, reportId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createShare(
    tenantId: string,
    sharedById: string,
    dto: {
      reportId: string;
      sharedWithUserId?: string;
      role?: string;
      shareLink?: string;
      expiresAt?: string;
      isPublic?: boolean;
    },
  ) {
    return prisma.reportShare.create({
      data: {
        tenantId,
        sharedById,
        ...dto,
        role: dto.role || "VIEWER",
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async updateShare(
    tenantId: string,
    id: string,
    dto: { role?: string; expiresAt?: string; isPublic?: boolean },
  ) {
    const share = await prisma.reportShare.findFirst({
      where: { tenantId, id },
    });
    if (!share) throw new NotFoundException("Share not found");
    return prisma.reportShare.update({ where: { id }, data: dto });
  }

  async deleteShare(tenantId: string, id: string) {
    const share = await prisma.reportShare.findFirst({
      where: { tenantId, id },
    });
    if (!share) throw new NotFoundException("Share not found");
    await prisma.reportShare.delete({ where: { id } });
    return { success: true };
  }
}
