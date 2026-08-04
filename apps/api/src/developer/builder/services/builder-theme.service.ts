import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class BuilderThemeService {
  async getThemes(tenantId: string) {
    return prisma.themeConfig.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getThemeById(tenantId: string, id: string) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");
    return theme;
  }

  async createTheme(tenantId: string, dto: any) {
    const existing = await prisma.themeConfig.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing)
      throw new BadRequestException("A theme with this slug already exists");

    return prisma.themeConfig.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        isDefault: dto.isDefault || false,
        tokens: dto.tokens || {},
        cssVariables: dto.cssVariables || {},
        typography: dto.typography || {},
        spacing: dto.spacing || {},
        borderRadius: dto.borderRadius || {},
        shadows: dto.shadows || {},
        colors: dto.colors || {},
        settings: dto.settings || {},
      },
    });
  }

  async updateTheme(tenantId: string, id: string, dto: any) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");

    if (dto.isDefault) {
      await prisma.themeConfig.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.themeConfig.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.tokens !== undefined && { tokens: dto.tokens as any }),
        ...(dto.cssVariables !== undefined && {
          cssVariables: dto.cssVariables as any,
        }),
        ...(dto.typography !== undefined && {
          typography: dto.typography as any,
        }),
        ...(dto.spacing !== undefined && { spacing: dto.spacing as any }),
        ...(dto.borderRadius !== undefined && {
          borderRadius: dto.borderRadius as any,
        }),
        ...(dto.shadows !== undefined && { shadows: dto.shadows as any }),
        ...(dto.colors !== undefined && { colors: dto.colors as any }),
        ...(dto.settings !== undefined && { settings: dto.settings as any }),
      },
    });
  }

  async deleteTheme(tenantId: string, id: string) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");
    return prisma.themeConfig.delete({ where: { id } });
  }

  async updateDesignTokens(tenantId: string, themeId: string, dto: any) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");

    if (dto.tokens) {
      for (const [name, value] of Object.entries(dto.tokens)) {
        const existing = await prisma.designToken.findFirst({
          where: { tenantId, themeId, name },
        });

        if (existing) {
          await prisma.designToken.update({
            where: { id: existing.id },
            data: { value: String(value) },
          });
        } else {
          await prisma.designToken.create({
            data: {
              tenantId,
              themeId,
              category: dto.category || "color",
              name,
              value: String(value),
              cssVariable:
                dto.cssVariable ||
                `--${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`,
            },
          });
        }
      }
    }

    return prisma.themeConfig.update({
      where: { id: themeId },
      data: {
        tokens: { ...(theme.tokens as any), ...(dto.tokens || {}) } as any,
        ...(dto.cssVariables && {
          cssVariables: {
            ...(theme.cssVariables as any),
            ...dto.cssVariables,
          } as any,
        }),
      },
    });
  }

  async getDesignTokens(tenantId: string, themeId: string) {
    return prisma.designToken.findMany({
      where: { tenantId, themeId },
      orderBy: { name: "asc" },
    });
  }

  async previewTheme(tenantId: string, themeId: string) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");

    const cssVars = theme.cssVariables as Record<string, string>;
    const css = Object.entries(cssVars)
      .map(([key, val]) => `${key}: ${val};`)
      .join("\n  ");

    return {
      theme,
      css: `:root {\n  ${css}\n}`,
      tokenCount: Object.keys(theme.tokens as any).length,
      previewUrl: `/api/builder/themes/${themeId}/preview.css`,
    };
  }

  async exportTheme(tenantId: string, themeId: string) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");

    return {
      name: theme.name,
      slug: theme.slug,
      version: theme.version,
      tokens: theme.tokens,
      cssVariables: theme.cssVariables,
      typography: theme.typography,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      colors: theme.colors,
      settings: theme.settings,
    };
  }

  async takeThemeSnapshot(tenantId: string, themeId: string) {
    const theme = await prisma.themeConfig.findFirst({
      where: { id: themeId, tenantId },
    });
    if (!theme) throw new NotFoundException("Theme not found");

    const newVersion = (theme.version || 0) + 1;

    await prisma.themeSnapshot.create({
      data: {
        tenantId,
        themeId,
        version: theme.version || 1,
        tokens: theme.tokens as any,
        css: theme.cssVariables as any,
      },
    });

    return prisma.themeConfig.update({
      where: { id: themeId },
      data: { version: newVersion },
    });
  }

  async getThemeSnapshots(tenantId: string, themeId: string) {
    return prisma.themeSnapshot.findMany({
      where: { tenantId, themeId },
      orderBy: { version: "desc" },
    });
  }

  async getThemeDashboard(tenantId: string) {
    const [total, active, defaultTheme] = await Promise.all([
      prisma.themeConfig.count({ where: { tenantId } }),
      prisma.themeConfig.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.themeConfig.findFirst({ where: { tenantId, isDefault: true } }),
    ]);

    return { total, active, defaultTheme: defaultTheme?.name || null };
  }
}
