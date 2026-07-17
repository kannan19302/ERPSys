import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class LocalizationService {
  async getOverrides(tenantId: string) {
    return prisma.languageOverride.findMany({
      where: { tenantId },
      orderBy: { locale: 'asc' },
    });
  }

  async createOrUpdateOverride(
    tenantId: string,
    dto: { locale: string; key: string; translation: string }
  ) {
    const existing = await prisma.languageOverride.findFirst({
      where: { tenantId, locale: dto.locale, key: dto.key },
    });

    if (existing) {
      return prisma.languageOverride.update({
        where: { id: existing.id },
        data: { translation: dto.translation },
      });
    }

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
    if (!record) throw new NotFoundException('Translation override not found');

    return prisma.languageOverride.delete({
      where: { id },
    });
  }

  async getLanguages() {
    return [
      { code: 'en', name: 'English', dir: 'ltr' },
      { code: 'es', name: 'Español', dir: 'ltr' },
      { code: 'fr', name: 'Français', dir: 'ltr' },
      { code: 'de', name: 'Deutsch', dir: 'ltr' },
      { code: 'ar', name: 'العربية', dir: 'rtl' },
      { code: 'zh', name: '中文', dir: 'ltr' },
      { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
      { code: 'ja', name: '日本語', dir: 'ltr' },
    ];
  }
}
