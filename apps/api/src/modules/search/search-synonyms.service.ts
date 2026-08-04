import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SearchSynonymsService {
  async getSynonymGroups(tenantId: string) {
    return prisma.searchSynonymGroup.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createSynonymGroup(tenantId: string, data: any) {
    return prisma.searchSynonymGroup.create({
      data: {
        ...data,
        tenantId,
        synonyms: data.synonyms || [],
      },
    });
  }

  async updateSynonymGroup(tenantId: string, id: string, data: any) {
    const existing = await prisma.searchSynonymGroup.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Synonym group not found");
    return prisma.searchSynonymGroup.update({
      where: { id },
      data,
    });
  }

  async deleteSynonymGroup(tenantId: string, id: string) {
    const existing = await prisma.searchSynonymGroup.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("Synonym group not found");
    return prisma.searchSynonymGroup.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
