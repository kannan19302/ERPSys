import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class LocalizationMemoryService {
  async getEntries(
    tenantId: string,
    sourceLocale?: string,
    targetLocale?: string,
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (sourceLocale) where.sourceLocale = sourceLocale;
    if (targetLocale) where.targetLocale = targetLocale;
    return prisma.localeTranslationMemoryEntry.findMany({
      where,
      orderBy: { usageCount: "desc" },
      take: 200,
    });
  }

  async addEntry(
    tenantId: string,
    dto: {
      sourceText: string;
      sourceLocale: string;
      targetLocale: string;
      translatedText: string;
      contextId?: string;
      matchType?: string;
      matchScore?: number;
      createdBy?: string;
    },
  ) {
    return prisma.localeTranslationMemoryEntry.create({
      data: {
        tenantId,
        ...dto,
        matchType: dto.matchType || "EXACT",
        matchScore: dto.matchScore || 100,
      },
    });
  }

  async search(
    tenantId: string,
    sourceText: string,
    sourceLocale: string,
    targetLocale: string,
  ) {
    return prisma.localeTranslationMemoryEntry.findMany({
      where: {
        tenantId,
        sourceLocale,
        targetLocale,
        sourceText: { contains: sourceText, mode: "insensitive" },
      },
      orderBy: { matchScore: "desc" },
      take: 20,
    });
  }

  async approveEntry(tenantId: string, id: string) {
    return prisma.localeTranslationMemoryEntry.update({
      where: { id },
      data: { approved: true },
    });
  }

  async getStats(tenantId: string) {
    const [total, approved, byLocale] = await Promise.all([
      prisma.localeTranslationMemoryEntry.count({ where: { tenantId } }),
      prisma.localeTranslationMemoryEntry.count({
        where: { tenantId, approved: true },
      }),
      prisma.localeTranslationMemoryEntry.groupBy({
        by: ["sourceLocale", "targetLocale"],
        where: { tenantId },
        _count: true,
      }),
    ]);
    return {
      totalEntries: total,
      approvedEntries: approved,
      entriesByLocale: byLocale,
    };
  }
}
