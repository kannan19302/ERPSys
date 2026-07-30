import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class LocalizationService {
  // ─── LOCALE CRUD ────────────────────────────────────

  async getLocales(tenantId: string) {
    return prisma.locale.findMany({
      where: { tenantId },
      include: { _count: { select: { translations: true } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async createLocale(
    tenantId: string,
    dto: {
      code: string;
      name: string;
      direction?: string;
      isDefault?: boolean;
      sortOrder?: number;
    },
  ) {
    const existing = await prisma.locale.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing)
      throw new BadRequestException(`Locale "${dto.code}" already exists`);
    if (dto.isDefault) await this.clearDefaultLocale(tenantId);
    return prisma.locale.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        direction: dto.direction || "ltr",
        isActive: true,
        isDefault: dto.isDefault || false,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateLocale(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      direction?: string;
      isDefault?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.getLocaleById(tenantId, id);
    if (dto.isDefault) await this.clearDefaultLocale(tenantId);
    return prisma.locale.update({
      where: { id },
      data: {
        name: dto.name,
        direction: dto.direction,
        isDefault: dto.isDefault,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deleteLocale(tenantId: string, id: string) {
    const locale = await this.getLocaleById(tenantId, id);
    if (locale.isDefault)
      throw new BadRequestException("Cannot delete the default locale");
    await prisma.locale.delete({ where: { id } });
    return { success: true };
  }

  async toggleLocale(tenantId: string, id: string) {
    const locale = await this.getLocaleById(tenantId, id);
    return prisma.locale.update({
      where: { id },
      data: { isActive: !locale.isActive },
    });
  }

  // ─── TRANSLATION KEYS ───────────────────────────────

  async getTranslationKeys(tenantId: string, module?: string) {
    const where: any = { tenantId };
    if (module) where.module = module;
    return prisma.translationKey.findMany({
      where,
      include: { _count: { select: { translations: true } } },
      orderBy: { key: "asc" },
    });
  }

  async createTranslationKey(
    tenantId: string,
    dto: {
      key: string;
      module: string;
      description?: string;
      isDynamic?: boolean;
    },
  ) {
    const existing = await prisma.translationKey.findFirst({
      where: { tenantId, key: dto.key },
    });
    if (existing)
      throw new BadRequestException(
        `Translation key "${dto.key}" already exists`,
      );
    return prisma.translationKey.create({
      data: {
        tenantId,
        key: dto.key,
        module: dto.module,
        description: dto.description || null,
        isDynamic: dto.isDynamic || false,
      },
    });
  }

  async deleteTranslationKey(tenantId: string, id: string) {
    const key = await prisma.translationKey.findFirst({
      where: { id, tenantId },
    });
    if (!key) throw new NotFoundException("Translation key not found");
    await prisma.translationKey.delete({ where: { id } });
    return { success: true };
  }

  // ─── TRANSLATION ENTRIES ────────────────────────────

  async getTranslations(tenantId: string, localeId?: string, keyId?: string) {
    const where: any = { tenantId };
    if (localeId) where.localeId = localeId;
    if (keyId) where.keyId = keyId;
    return prisma.translationEntry.findMany({
      where,
      include: {
        locale: { select: { code: true, name: true } },
        key: { select: { key: true, module: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async upsertTranslation(
    tenantId: string,
    dto: {
      localeId: string;
      keyId: string;
      value: string;
      isOverride?: boolean;
    },
  ) {
    const existing = await prisma.translationEntry.findFirst({
      where: { tenantId, localeId: dto.localeId, keyId: dto.keyId },
    });
    if (existing) {
      return prisma.translationEntry.update({
        where: { id: existing.id },
        data: { value: dto.value, isOverride: true },
      });
    }
    return prisma.translationEntry.create({
      data: {
        tenantId,
        localeId: dto.localeId,
        keyId: dto.keyId,
        value: dto.value,
        isOverride: dto.isOverride || false,
      },
    });
  }

  async deleteTranslation(tenantId: string, id: string) {
    const entry = await prisma.translationEntry.findFirst({
      where: { id, tenantId },
    });
    if (!entry) throw new NotFoundException("Translation entry not found");
    await prisma.translationEntry.delete({ where: { id } });
    return { success: true };
  }

  // ─── IMPORT / EXPORT ────────────────────────────────

  async importTranslations(
    tenantId: string,
    dto: { localeCode: string; entries: { key: string; value: string }[] },
  ) {
    const locale = await prisma.locale.findFirst({
      where: { tenantId, code: dto.localeCode },
    });
    if (!locale)
      throw new NotFoundException(`Locale "${dto.localeCode}" not found`);
    let imported = 0,
      skipped = 0;
    const errors: string[] = [];
    for (const entry of dto.entries) {
      let key = await prisma.translationKey.findFirst({
        where: { tenantId, key: entry.key },
      });
      if (!key) {
        key = await prisma.translationKey.create({
          data: { tenantId, key: entry.key, module: "imported" },
        });
      }
      const existing = await prisma.translationEntry.findFirst({
        where: { tenantId, localeId: locale.id, keyId: key.id },
      });
      if (existing) {
        skipped++;
        continue;
      }
      try {
        await prisma.translationEntry.create({
          data: {
            tenantId,
            localeId: locale.id,
            keyId: key.id,
            value: entry.value,
            isOverride: false,
          },
        });
        imported++;
      } catch (e: any) {
        errors.push(`Failed for key "${entry.key}": ${e.message}`);
      }
    }
    await prisma.translationImport.create({
      data: {
        tenantId,
        localeCode: dto.localeCode,
        fileName: "api_import",
        totalEntries: dto.entries.length,
        importedCount: imported,
        skippedCount: skipped,
        status: "COMPLETED",
        errorLog: errors.length > 0 ? errors.join("\n") : null,
        completedAt: new Date(),
      },
    });
    return { imported, skipped, errors };
  }

  async getImportHistory(tenantId: string) {
    return prisma.translationImport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async exportTranslations(tenantId: string, localeCode?: string) {
    const where: any = { tenantId };
    if (localeCode) {
      const locale = await prisma.locale.findFirst({
        where: { tenantId, code: localeCode },
      });
      if (!locale)
        throw new NotFoundException(`Locale "${localeCode}" not found`);
      where.localeId = locale.id;
    }
    const entries = await prisma.translationEntry.findMany({
      where,
      include: {
        locale: { select: { code: true } },
        key: { select: { key: true, module: true } },
      },
      orderBy: [{ locale: { code: "asc" } }, { key: { key: "asc" } }],
    });
    return entries.map((e) => ({
      locale: e.locale.code,
      key: e.key.key,
      module: e.key.module,
      value: e.value,
    }));
  }

  // ─── FORMATTING RULES ───────────────────────────────

  async getFormattingRules(tenantId: string) {
    return prisma.localeFormattingRule.findMany({
      where: { tenantId },
      include: { locale: { select: { code: true, name: true } } },
      orderBy: { locale: { code: "asc" } },
    });
  }

  async upsertFormattingRule(
    tenantId: string,
    dto: {
      localeId: string;
      dateFormat?: string;
      timeFormat?: string;
      numberFormat?: string;
      currencyCode?: string;
      currencySymbol?: string;
      firstDayOfWeek?: number;
      timezone?: string;
    },
  ) {
    const existing = await prisma.localeFormattingRule.findFirst({
      where: { tenantId, localeId: dto.localeId },
    });
    if (existing) {
      return prisma.localeFormattingRule.update({
        where: { id: existing.id },
        data: dto as any,
      });
    }
    return prisma.localeFormattingRule.create({
      data: { tenantId, ...dto } as any,
    });
  }

  // ─── LEGACY OVERRIDES ───────────────────────────────

  async getOverrides(tenantId: string) {
    return prisma.languageOverride.findMany({
      where: { tenantId },
      orderBy: { locale: "asc" },
    });
  }

  async createOrUpdateOverride(
    tenantId: string,
    dto: { locale: string; key: string; translation: string },
  ) {
    const existing = await prisma.languageOverride.findFirst({
      where: { tenantId, locale: dto.locale, key: dto.key },
    });
    if (existing)
      return prisma.languageOverride.update({
        where: { id: existing.id },
        data: { translation: dto.translation },
      });
    return prisma.languageOverride.create({
      data: {
        tenantId,
        locale: dto.locale,
        key: dto.key,
        translation: dto.translation,
      },
    });
  }

  async deleteOverride(tenantId: string, id: string) {
    const record = await prisma.languageOverride.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException("Translation override not found");
    return prisma.languageOverride.delete({ where: { id } });
  }

  async getLanguages() {
    return [
      { code: "en", name: "English", dir: "ltr" },
      { code: "es", name: "Español", dir: "ltr" },
      { code: "fr", name: "Français", dir: "ltr" },
      { code: "de", name: "Deutsch", dir: "ltr" },
      { code: "ar", name: "العربية", dir: "rtl" },
      { code: "zh", name: "中文", dir: "ltr" },
      { code: "hi", name: "हिन्दी", dir: "ltr" },
      { code: "ja", name: "日本語", dir: "ltr" },
    ];
  }

  // ─── PRIVATE ────────────────────────────────────────

  // ─── BULK OPERATIONS ────────────────────────────

  async getLocalesSimple(tenantId: string) {
    return prisma.locale.findMany({ where: { tenantId } });
  }

  async createLocaleSimple(tenantId: string, body: any) {
    return prisma.locale.create({ data: { ...body, tenantId } as any });
  }

  async getTranslationsWithDetails(tenantId: string) {
    return prisma.translationEntry.findMany({
      where: { tenantId },
      include: { locale: true, key: true },
    });
  }

  async bulkImportTranslations(
    tenantId: string,
    entries: Array<{ key: string; localeCode: string; value: string }>,
  ) {
    const results: any[] = [];
    for (const entry of entries || []) {
      let key = await prisma.translationKey.findFirst({
        where: { tenantId, key: entry.key },
      });
      if (!key)
        key = await prisma.translationKey.create({
          data: { tenantId, key: entry.key },
        });
      const locale = await prisma.locale.findFirst({
        where: { tenantId, code: entry.localeCode },
      });
      if (!locale) {
        results.push({
          key: entry.key,
          locale: entry.localeCode,
          status: "error",
          message: "Locale not found",
        });
        continue;
      }
      await prisma.translationEntry.upsert({
        where: {
          translationKeyId_localeId: {
            translationKeyId: key.id,
            localeId: locale.id,
          },
        } as any,
        create: {
          tenantId,
          translationKeyId: key.id,
          localeId: locale.id,
          value: entry.value,
        },
        update: { value: entry.value },
      });
      results.push({
        key: entry.key,
        locale: entry.localeCode,
        status: "imported",
      });
    }
    return {
      results,
      imported: results.filter((r: any) => r.status === "imported").length,
    };
  }

  async createGlossaryTerm(tenantId: string, body: any) {
    return prisma.translationGlossaryTerm.create({
      data: { ...body, tenantId } as any,
    });
  }

  async getFormattingRulesSimple(tenantId: string) {
    return prisma.localeFormattingRule.findMany({ where: { tenantId } });
  }

  async createFormattingRule(tenantId: string, body: any) {
    return prisma.localeFormattingRule.create({
      data: { ...body, tenantId } as any,
    });
  }

  async getLocalizationStats(tenantId: string) {
    const [locales, keys, entries, imports] = await Promise.all([
      prisma.locale.count({ where: { tenantId } }),
      prisma.translationKey.count({ where: { tenantId } }),
      prisma.translationEntry.count({ where: { tenantId } }),
      prisma.translationImport.count({ where: { tenantId } }),
    ]);
    return { locales, keys, entries, imports };
  }

  async deleteTranslationEntry(id: string) {
    return prisma.translationEntry.delete({ where: { id } });
  }

  private async getLocaleById(tenantId: string, id: string) {
    const locale = await prisma.locale.findFirst({ where: { id, tenantId } });
    if (!locale) throw new NotFoundException("Locale not found");
    return locale;
  }

  private async clearDefaultLocale(tenantId: string) {
    await prisma.locale.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
