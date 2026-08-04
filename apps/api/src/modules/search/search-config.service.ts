import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SearchConfigService {
  async getIndexConfigs(tenantId: string) {
    return prisma.searchIndexConfig.findMany({
      where: { tenantId },
      orderBy: { entityType: "asc" },
    });
  }

  async getIndexConfigByEntityType(tenantId: string, entityType: string) {
    const config = await prisma.searchIndexConfig.findFirst({
      where: { tenantId, entityType },
    });
    if (!config)
      throw new NotFoundException(
        `Search index config for entity '${entityType}' not found`,
      );
    return config;
  }

  async upsertIndexConfig(tenantId: string, entityType: string, data: any) {
    return prisma.searchIndexConfig.upsert({
      where: { tenantId_entityType: { tenantId, entityType } },
      create: {
        ...data,
        tenantId,
        entityType,
        searchableFields: data.searchableFields || [],
        filterFields: data.filterFields || [],
      },
      update: {
        ...data,
        searchableFields: data.searchableFields || [],
        filterFields: data.filterFields || [],
      },
    });
  }
}
