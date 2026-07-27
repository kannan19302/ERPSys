import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SavedViewsService {
  async findAll(tenantId: string, userId: string, resourceName: string) {
    return prisma.savedView.findMany({
      where: { tenantId, userId, resourceName },
      orderBy: { name: "asc" },
    });
  }

  async createOrUpdate(
    tenantId: string,
    userId: string,
    dto: { resourceName: string; name: string; state: Record<string, any> },
  ) {
    return prisma.savedView.upsert({
      where: {
        tenantId_userId_resourceName_name: {
          tenantId,
          userId,
          resourceName: dto.resourceName,
          name: dto.name,
        },
      },
      update: { state: dto.state },
      create: {
        tenantId,
        userId,
        resourceName: dto.resourceName,
        name: dto.name,
        state: dto.state,
      },
    });
  }

  async delete(tenantId: string, userId: string, id: string) {
    const view = await prisma.savedView.findUnique({ where: { id } });
    if (!view || view.tenantId !== tenantId || view.userId !== userId) {
      throw new NotFoundException("Saved view not found");
    }
    return prisma.savedView.delete({ where: { id } });
  }
}
