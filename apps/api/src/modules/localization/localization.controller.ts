// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { LocalizationService } from "./localization.service";
import {
  createLocaleSchema,
  updateLocaleSchema,
  createTranslationKeySchema,
  upsertTranslationSchema,
  importTranslationsSchema,
  createFormattingRuleSchema,
} from "./localization.dtos";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("localization")
@ApiBearerAuth()
@Controller("admin/localization")
@UseGuards(JwtAuthGuard, RbacGuard)
export class LocalizationController {
  constructor(private readonly service: LocalizationService) {}

  @Get("locales")
  @Permissions("localization.locales.read")
  @ApiOperation({ summary: "List locales" })
  async getLocales(@Req() req: AuthenticatedRequest) {
    return this.service.getLocales(req.user.tenantId);
  }

  @Post("locales")
  @Permissions("localization.locales.create")
  @ApiOperation({ summary: "Create locale" })
  async createLocale(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createLocaleSchema) body: any,
  ) {
    return this.service.createLocale(req.user.tenantId, body);
  }

  @Put("locales/:id")
  @Permissions("localization.locales.update")
  @ApiOperation({ summary: "Update locale" })
  async updateLocale(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateLocaleSchema) body: any,
  ) {
    return this.service.updateLocale(req.user.tenantId, id, body);
  }

  @Delete("locales/:id")
  @Permissions("localization.locales.delete")
  @ApiOperation({ summary: "Delete locale" })
  async deleteLocale(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteLocale(req.user.tenantId, id);
  }

  @Post("locales/:id/toggle")
  @Permissions("localization.locales.update")
  @ApiOperation({ summary: "Toggle locale active status" })
  async toggleLocale(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.toggleLocale(req.user.tenantId, id);
  }

  @Get("translation-keys")
  @Permissions("localization.translations.read")
  @ApiOperation({ summary: "List translation keys" })
  async getTranslationKeys(
    @Req() req: AuthenticatedRequest,
    @Query("module") module?: string,
  ) {
    return this.service.getTranslationKeys(req.user.tenantId, module);
  }

  @Post("translation-keys")
  @Permissions("localization.translations.create")
  @ApiOperation({ summary: "Create translation key" })
  async createTranslationKey(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createTranslationKeySchema) body: any,
  ) {
    return this.service.createTranslationKey(req.user.tenantId, body);
  }

  @Delete("translation-keys/:id")
  @Permissions("localization.translations.delete")
  @ApiOperation({ summary: "Delete translation key" })
  async deleteTranslationKey(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteTranslationKey(req.user.tenantId, id);
  }

  @Get("translations")
  @Permissions("localization.translations.read")
  @ApiOperation({ summary: "List translation entries" })
  async getTranslations(
    @Req() req: AuthenticatedRequest,
    @Query("localeId") localeId?: string,
    @Query("keyId") keyId?: string,
  ) {
    return this.service.getTranslations(req.user.tenantId, localeId, keyId);
  }

  @Post("translations")
  @Permissions("localization.translations.create")
  @ApiOperation({ summary: "Upsert translation entry" })
  async upsertTranslation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(upsertTranslationSchema) body: any,
  ) {
    return this.service.upsertTranslation(req.user.tenantId, body);
  }

  @Delete("translations/:id")
  @Permissions("localization.translations.delete")
  @ApiOperation({ summary: "Delete translation entry" })
  async deleteTranslation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteTranslation(req.user.tenantId, id);
  }

  @Post("import")
  @Permissions("localization.translations.create")
  @ApiOperation({ summary: "Import translations" })
  async importTranslations(
    @Req() req: AuthenticatedRequest,
    @ZodBody(importTranslationsSchema) body: any,
  ) {
    return this.service.importTranslations(req.user.tenantId, body);
  }

  @Get("imports")
  @Permissions("localization.translations.read")
  @ApiOperation({ summary: "Get import history" })
  async getImportHistory(@Req() req: AuthenticatedRequest) {
    return this.service.getImportHistory(req.user.tenantId);
  }

  @Get("export")
  @Permissions("localization.translations.read")
  @ApiOperation({ summary: "Export translations" })
  async exportTranslations(
    @Req() req: AuthenticatedRequest,
    @Query("localeCode") localeCode?: string,
  ) {
    return this.service.exportTranslations(req.user.tenantId, localeCode);
  }

  @Get("formatting-rules")
  @Permissions("localization.locales.read")
  @ApiOperation({ summary: "List formatting rules" })
  async getFormattingRules(@Req() req: AuthenticatedRequest) {
    return this.service.getFormattingRules(req.user.tenantId);
  }

  @Post("formatting-rules")
  @Permissions("localization.locales.create")
  @ApiOperation({ summary: "Upsert formatting rule" })
  async upsertFormattingRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFormattingRuleSchema) body: any,
  ) {
    return this.service.upsertFormattingRule(req.user.tenantId, body);
  }

  @Get("languages")
  @Permissions("localization.locales.read")
  @ApiOperation({ summary: "Get system languages" })
  async getLanguages() {
    return this.service.getLanguages();
  }

  @Get("overrides")
  @Permissions("localization.translations.read")
  @ApiOperation({ summary: "Get language overrides" })
  async getOverrides(@Req() req: AuthenticatedRequest) {
    return this.service.getOverrides(req.user.tenantId);
  }

  @Post("overrides")
  @Permissions("localization.translations.create")
  @ApiOperation({ summary: "Create/update override" })
  async createOrUpdateOverride(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        locale: z.string(),
        key: z.string(),
        translation: z.string(),
      }),
    )
    body: any,
  ) {
    return this.service.createOrUpdateOverride(req.user.tenantId, body);
  }

  @Delete("overrides/:id")
  @Permissions("localization.translations.delete")
  @ApiOperation({ summary: "Delete override" })
  async deleteOverride(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.deleteOverride(req.user.tenantId, id);
  }
}
