import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationFallbackService {
  async getFallbackChains(tenantId: string) {
    return prisma.localeFallbackChain.findMany({
      where: { tenantId },
      orderBy: { localeCode: "asc" },
    });
  }

  async upsertChain(
    tenantId: string,
    localeCode: string,
    fallbackOrder: string[],
  ) {
    const existing = await prisma.localeFallbackChain.findFirst({
      where: { tenantId, localeCode },
    });
    if (existing) {
      return prisma.localeFallbackChain.update({
        where: { id: existing.id },
        data: { fallbackOrder },
      });
    }
    return prisma.localeFallbackChain.create({
      data: { tenantId, localeCode, fallbackOrder },
    });
  }

  async resolveTranslation(tenantId: string, localeCode: string, key: string) {
    const chain = await prisma.localeFallbackChain.findFirst({
      where: { tenantId, localeCode },
    });
    const localesToTry = chain
      ? [localeCode, ...(chain.fallbackOrder as string[])]
      : [localeCode];
    for (const code of localesToTry) {
      const locale = await prisma.locale.findFirst({
        where: { tenantId, code },
      });
      if (!locale) continue;
      const keyRec = await prisma.translationKey.findFirst({
        where: { tenantId, key },
      });
      if (!keyRec) continue;
      const entry = await prisma.translationEntry.findFirst({
        where: { tenantId, localeId: locale.id, keyId: keyRec.id },
      });
      if (entry) return { localeCode: code, value: entry.value };
    }
    return { localeCode: null, value: null };
  }
}
