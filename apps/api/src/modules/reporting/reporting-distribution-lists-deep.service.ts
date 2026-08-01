import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ReportingDistributionListsDeepService {
  async getLists(tenantId: string) {
    return prisma.reportingDistributionList.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createList(
    tenantId: string,
    dto: { listName: string; description?: string },
  ) {
    return prisma.reportingDistributionList.create({
      data: {
        tenantId,
        listName: dto.listName,
        description: dto.description,
      },
    });
  }

  async addRecipient(
    listId: string,
    dto: { recipientEmail: string; recipientName: string },
  ) {
    return prisma.reportingDistributionRecipient.create({
      data: {
        listId,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName,
      },
    });
  }
}
