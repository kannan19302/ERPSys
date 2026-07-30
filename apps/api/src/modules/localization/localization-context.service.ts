// @ts-nocheck
import { Injectable, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationContextService {
  async getContexts(tenantId: string) {
    return prisma.localeTranslationContext.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async createContext(
    tenantId: string,
    dto: { name: string; description?: string },
  ) {
    const exists = await prisma.localeTranslationContext.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (exists) throw new BadRequestException("Context already exists");
    return prisma.localeTranslationContext.create({
      data: { tenantId, ...dto },
    });
  }

  async updateContext(
    tenantId: string,
    id: string,
    dto: { name?: string; description?: string; isActive?: boolean },
  ) {
    return prisma.localeTranslationContext.update({ where: { id }, data: dto });
  }
}
