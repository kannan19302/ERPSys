import { BuilderThemeService } from "../services/builder-theme.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    themeConfig: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "theme-1" }),
      update: vi.fn().mockResolvedValue({ id: "theme-1" }),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({ id: "theme-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    designToken: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "token-1" }),
      update: vi.fn().mockResolvedValue({ id: "token-1" }),
    },
    themeSnapshot: {
      create: vi.fn().mockResolvedValue({ id: "snap-1" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("BuilderThemeService", () => {
  let service: BuilderThemeService;

  beforeEach(() => {
    service = new BuilderThemeService();
    vi.clearAllMocks();
  });

  it("getThemes returns list", async () => {
    const result = await service.getThemes("t1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("getThemeById throws on missing", async () => {
    await expect(service.getThemeById("t1", "none")).rejects.toThrow();
  });

  it("createTheme succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue(null);
    const result = await service.createTheme("t1", {
      name: "Theme",
      slug: "theme",
    });
    expect(result).toBeDefined();
  });

  it("createTheme rejects duplicate slug", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({ id: "theme-1" });
    await expect(service.createTheme("t1", { slug: "dup" })).rejects.toThrow();
  });

  it("updateTheme updates and handles default", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      id: "theme-1",
      tokens: {},
    });
    const result = await service.updateTheme("t1", "theme-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteTheme deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({ id: "theme-1" });
    const result = await service.deleteTheme("t1", "theme-1");
    expect(result).toBeDefined();
  });

  it("updateDesignTokens upserts tokens", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      id: "theme-1",
      tokens: { primary: "#000" },
    });
    (prisma.designToken.findFirst as any).mockResolvedValue(null);
    const result = await service.updateDesignTokens("t1", "theme-1", {
      tokens: { secondary: "#fff" },
    });
    expect(result).toBeDefined();
  });

  it("getDesignTokens returns tokens", async () => {
    const result = await service.getDesignTokens("t1", "theme-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("previewTheme returns CSS", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      id: "theme-1",
      tokens: { a: "1" },
      cssVariables: { "--color": "#000" },
    });
    const result = await service.previewTheme("t1", "theme-1");
    expect(result).toHaveProperty("css");
    expect(result).toHaveProperty("theme");
  });

  it("exportTheme returns export data", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      id: "theme-1",
      name: "T",
      slug: "t",
      version: 1,
      tokens: {},
      cssVariables: {},
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {},
      colors: {},
      settings: {},
    });
    const result = await service.exportTheme("t1", "theme-1");
    expect(result).toHaveProperty("name");
  });

  it("takeThemeSnapshot creates snapshot", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      id: "theme-1",
      version: 1,
      tokens: {},
      cssVariables: {},
    });
    const result = await service.takeThemeSnapshot("t1", "theme-1");
    expect(result).toBeDefined();
  });

  it("getThemeSnapshots returns snapshots", async () => {
    const result = await service.getThemeSnapshots("t1", "theme-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("getThemeDashboard returns metrics", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.themeConfig.findFirst as any).mockResolvedValue({
      name: "Default",
    });
    const result = await service.getThemeDashboard("t1");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("defaultTheme");
  });
});
