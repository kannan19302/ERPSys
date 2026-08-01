import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationMachineTranslationService {
  async getConfigs(tenantId: string) {
    return prisma.localeMachineTranslationConfig.findMany({
      where: { tenantId },
      orderBy: { provider: "asc" },
    });
  }

  async upsertConfig(
    tenantId: string,
    dto: {
      provider: string;
      apiKey?: string;
      fromLocale?: string;
      toLocales?: string[];
      modelName?: string;
      maxCharsPerMonth?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.localeMachineTranslationConfig.findFirst({
      where: { tenantId, provider: dto.provider },
    });
    if (existing) {
      return prisma.localeMachineTranslationConfig.update({
        where: { id: existing.id },
        data: { ...dto, toLocales: dto.toLocales || [] },
      });
    }
    return prisma.localeMachineTranslationConfig.create({
      data: {
        tenantId,
        ...dto,
        toLocales: dto.toLocales || [],
        isActive: dto.isActive || false,
      },
    });
  }

  async toggleActive(tenantId: string, id: string) {
    const config = await prisma.localeMachineTranslationConfig.findFirst({
      where: { tenantId, id },
    });
    if (!config) throw new NotFoundException("MT config not found");
    return prisma.localeMachineTranslationConfig.update({
      where: { id },
      data: { isActive: !config.isActive },
    });
  }
}
