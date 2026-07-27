import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalizationService } from "../localization.service";
import { prisma } from "@unerp/database";

vi.mock("@unerp/database", () => ({
  prisma: {
    locale: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    translationKey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    translationEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    translationImport: { findMany: vi.fn(), create: vi.fn() },
    localeFormattingRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    languageOverride: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("LocalizationService", () => {
  let service: LocalizationService;

  beforeEach(() => {
    service = new LocalizationService();
    vi.clearAllMocks();
  });

  it("should get locales", async () => {
    const mockLocales = [
      { id: "1", code: "en", name: "English", _count: { translations: 5 } },
    ];
    (prisma.locale.findMany as any).mockResolvedValue(mockLocales);
    const result = await service.getLocales("t1");
    expect(result).toEqual(mockLocales);
  });

  it("should create locale", async () => {
    (prisma.locale.findFirst as any).mockResolvedValue(null);
    const mockLocale = {
      id: "1",
      code: "fr",
      name: "Français",
      tenantId: "t1",
    };
    (prisma.locale.create as any).mockResolvedValue(mockLocale);
    const result = await service.createLocale("t1", {
      code: "fr",
      name: "Français",
    });
    expect(result).toEqual(mockLocale);
  });

  it("should throw on duplicate locale code", async () => {
    (prisma.locale.findFirst as any).mockResolvedValue({ id: "1" });
    await expect(
      service.createLocale("t1", { code: "fr", name: "Français" }),
    ).rejects.toThrow("already exists");
  });

  it("should create translation key", async () => {
    (prisma.translationKey.findFirst as any).mockResolvedValue(null);
    const mockKey = {
      id: "1",
      key: "welcome",
      module: "dashboard",
      tenantId: "t1",
    };
    (prisma.translationKey.create as any).mockResolvedValue(mockKey);
    const result = await service.createTranslationKey("t1", {
      key: "welcome",
      module: "dashboard",
    });
    expect(result).toEqual(mockKey);
  });

  it("should upsert translation entry", async () => {
    (prisma.translationEntry.findFirst as any).mockResolvedValue(null);
    const mockEntry = { id: "1", value: "Bienvenue", tenantId: "t1" };
    (prisma.translationEntry.create as any).mockResolvedValue(mockEntry);
    const result = await service.upsertTranslation("t1", {
      localeId: "l1",
      keyId: "k1",
      value: "Bienvenue",
    });
    expect(result).toEqual(mockEntry);
  });

  it("should get formatting rules", async () => {
    const mockRules = [{ id: "1", dateFormat: "DD/MM/YYYY", tenantId: "t1" }];
    (prisma.localeFormattingRule.findMany as any).mockResolvedValue(mockRules);
    const result = await service.getFormattingRules("t1");
    expect(result).toEqual(mockRules);
  });
});
