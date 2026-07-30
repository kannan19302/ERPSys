import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LocalizationService } from "./localization.service";
import { LocalizationGlossaryService } from "./localization-glossary.service";
import { LocalizationContextService } from "./localization-context.service";
import { LocalizationFallbackService } from "./localization-fallback.service";
import { LocalizationContentScheduleService } from "./localization-content-schedule.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

@ApiTags("localization-bulk")
@ApiBearerAuth()
@Controller("localization-bulk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class LocalizationBulkController {
  constructor(
    private readonly service: LocalizationService,
    private readonly glossaryService: LocalizationGlossaryService,
    private readonly contextService: LocalizationContextService,
    private readonly fallbackService: LocalizationFallbackService,
    private readonly contentScheduleService: LocalizationContentScheduleService,
  ) {}

  @Get("locales")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List all locales" })
  async getLocales(@Req() req: AuthReq) {
    return this.service.getLocalesSimple(req.user.tenantId);
  }

  @Post("locales")
  @Permissions("localization.manage")
  @ApiOperation({ summary: "Create locale" })
  async createLocale(@Req() req: AuthReq, @Body() body: any) {
    return this.service.createLocaleSimple(req.user.tenantId, body);
  }

  @Get("translations")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List translations" })
  async getTranslations(@Req() req: AuthReq) {
    return this.service.getTranslationsWithDetails(req.user.tenantId);
  }

  @Post("translations/bulk-import")
  @Permissions("localization.manage")
  @ApiOperation({ summary: "Bulk import translations" })
  async bulkImportTranslations(
    @Req() req: AuthReq,
    @Body()
    body: {
      entries: Array<{ key: string; localeCode: string; value: string }>;
    },
  ) {
    return this.service.bulkImportTranslations(
      req.user.tenantId,
      body.entries || [],
    );
  }

  @Get("glossary")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List glossary entries" })
  async getGlossary(@Req() req: AuthReq) {
    return this.glossaryService.getEntries(req.user.tenantId);
  }

  @Post("glossary")
  @Permissions("localization.manage")
  @ApiOperation({ summary: "Add glossary term" })
  async addGlossaryTerm(@Req() req: AuthReq, @Body() body: any) {
    return this.service.createGlossaryTerm(req.user.tenantId, body);
  }

  @Get("contexts")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List translation contexts" })
  async getContexts(@Req() req: AuthReq) {
    return this.contextService.getContexts(req.user.tenantId);
  }

  @Get("fallback-rules")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List fallback rules" })
  async getFallbackRules(@Req() req: AuthReq) {
    return this.fallbackService.getFallbackChains(req.user.tenantId);
  }

  @Get("content-schedules")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List content schedules" })
  async getContentSchedules(@Req() req: AuthReq) {
    return this.contentScheduleService.getSchedules(req.user.tenantId);
  }

  @Get("regions")
  @Permissions("localization.read")
  @ApiOperation({ summary: "List regions" })
  async getRegions(@Req() req: AuthReq) {
    return this.service.getFormattingRulesSimple(req.user.tenantId);
  }

  @Post("regions")
  @Permissions("localization.manage")
  @ApiOperation({ summary: "Create region rules" })
  async createRegion(@Req() req: AuthReq, @Body() body: any) {
    return this.service.createFormattingRule(req.user.tenantId, body);
  }

  @Get("stats")
  @Permissions("localization.read")
  @ApiOperation({ summary: "Localization stats" })
  async getLocalizationStats(@Req() req: AuthReq) {
    return this.service.getLocalizationStats(req.user.tenantId);
  }

  @Delete("translations/:id")
  @Permissions("localization.manage")
  @ApiOperation({ summary: "Delete translation entry" })
  async deleteTranslation(@Param("id") id: string) {
    return this.service.deleteTranslationEntry(id);
  }
}
