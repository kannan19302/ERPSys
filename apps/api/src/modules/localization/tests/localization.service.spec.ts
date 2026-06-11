import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalizationService } from '../localization.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    languageOverride: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('LocalizationService', () => {
  let service: LocalizationService;

  beforeEach(() => {
    service = new LocalizationService();
    vi.clearAllMocks();
  });

  it('should list overrides for a tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.languageOverride.findMany).mockResolvedValue([
      { id: 'lo-1', tenantId: 't1', locale: 'es', key: 'dashboard.welcome', translation: '¡Bienvenido!' },
      { id: 'lo-2', tenantId: 't1', locale: 'fr', key: 'dashboard.welcome', translation: 'Bienvenue!' },
    ] as any);

    const overrides = await service.getOverrides('t1');
    expect(overrides).toHaveLength(2);
    expect(overrides[0]?.locale).toBe('es');
  });

  it('should create a new translation override', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.languageOverride.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.languageOverride.create).mockResolvedValue({
      id: 'lo-new', tenantId: 't1', locale: 'de', key: 'dashboard.title', translation: 'Armaturenbrett',
    } as any);

    const result = await service.createOrUpdateOverride('t1', {
      locale: 'de',
      key: 'dashboard.title',
      translation: 'Armaturenbrett',
    });
    expect(result.locale).toBe('de');
  });

  it('should return supported languages', async () => {
    const langs = await service.getLanguages();
    expect(langs.length).toBeGreaterThan(0);
    const arabic = langs.find((l) => l.code === 'ar');
    expect(arabic?.dir).toBe('rtl');
  });
});
