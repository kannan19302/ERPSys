// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { LocalizationContextService } from "./localization-context.service";
import { LocalizationGlossaryService } from "./localization-glossary.service";
import { LocalizationMemoryService } from "./localization-memory.service";
import { LocalizationMachineTranslationService } from "./localization-mt.service";
import { LocalizationReviewService } from "./localization-review.service";
import { LocalizationFallbackService } from "./localization-fallback.service";
import { LocalizationContentScheduleService } from "./localization-content-schedule.service";
import { LocalizationRegionValidationService } from "./localization-region-validation.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles?: string[] };
}

const contextSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
const glossarySchema = z.object({
  term: z.string().min(1),
  contextId: z.string().optional(),
  definition: z.string().min(1),
  translation: z.string().optional(),
  usage: z.string().optional(),
});
const memorySchema = z.object({
  sourceText: z.string().min(1),
  sourceLocale: z.string().min(1),
  targetLocale: z.string().min(1),
  translatedText: z.string().min(1),
  contextId: z.string().optional(),
  matchType: z.string().optional(),
  matchScore: z.number().optional(),
  createdBy: z.string().optional(),
});
const mtSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().optional(),
  fromLocale: z.string().optional(),
  toLocales: z.array(z.string()).optional(),
  modelName: z.string().optional(),
  maxCharsPerMonth: z.number().optional(),
  isActive: z.boolean().optional(),
});
const reviewSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  comment: z.string().optional(),
});
const fallbackSchema = z.object({
  localeCode: z.string().min(1),
  fallbackOrder: z.array(z.string()).min(1),
});
const scheduleSchema = z.object({
  name: z.string().min(1),
  contentKey: z.string().min(1),
  sourceLocale: z.string().min(1),
  targetLocales: z.array(z.string()).min(1),
  cronExpression: z.string().min(1),
});
const regionRuleSchema = z.object({
  regionCode: z.string().min(1),
  entityType: z.string().min(1),
  validationRules: z.record(z.unknown()),
  isActive: z.boolean().optional(),
});

@ApiTags("localization-deep")
@ApiBearerAuth()
@Controller("admin/localization")
@UseGuards(JwtAuthGuard, RbacGuard)
export class LocalizationDeepController {
  constructor(
    private readonly ctxService: LocalizationContextService,
    private readonly glossaryService: LocalizationGlossaryService,
    private readonly memoryService: LocalizationMemoryService,
    private readonly mtService: LocalizationMachineTranslationService,
    private readonly reviewService: LocalizationReviewService,
    private readonly fallbackService: LocalizationFallbackService,
    private readonly scheduleService: LocalizationContentScheduleService,
    private readonly regionService: LocalizationRegionValidationService,
  ) {}

  // Contexts
  @Get("contexts")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List translation contexts" })
  async getContexts(@Req() req: AuthReq) {
    return this.ctxService.getContexts(req.user.tenantId);
  }

  @Post("contexts")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Create translation context" })
  async createContext(@Req() req: AuthReq, @ZodBody(contextSchema) body: any) {
    return this.ctxService.createContext(req.user.tenantId, body);
  }

  @Put("contexts/:id")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Update translation context" })
  async updateContext(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(contextSchema.partial()) body: any,
  ) {
    return this.ctxService.updateContext(req.user.tenantId, id, body);
  }

  // Glossary
  @Get("glossary")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List glossary entries" })
  async getGlossary(@Req() req: AuthReq) {
    return this.glossaryService.getEntries(req.user.tenantId);
  }

  @Post("glossary")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Create glossary entry" })
  async createGlossaryEntry(
    @Req() req: AuthReq,
    @ZodBody(glossarySchema) body: any,
  ) {
    return this.glossaryService.createEntry(req.user.tenantId, body);
  }

  @Put("glossary/:id")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Update glossary entry" })
  async updateGlossaryEntry(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(glossarySchema.partial()) body: any,
  ) {
    return this.glossaryService.updateEntry(req.user.tenantId, id, body);
  }

  @Post("glossary/:id/archive")
  @Permissions("admin.localization.delete")
  @ApiOperation({ summary: "Archive glossary entry" })
  async archiveGlossaryEntry(@Req() req: AuthReq, @Param("id") id: string) {
    return this.glossaryService.archiveEntry(req.user.tenantId, id);
  }

  // Translation Memory
  @Get("translation-memory")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List translation memory entries" })
  async getMemory(
    @Req() req: AuthReq,
    @Query("sourceLocale") sourceLocale?: string,
    @Query("targetLocale") targetLocale?: string,
  ) {
    return this.memoryService.getEntries(
      req.user.tenantId,
      sourceLocale,
      targetLocale,
    );
  }

  @Post("translation-memory")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Add translation memory entry" })
  async addMemory(@Req() req: AuthReq, @ZodBody(memorySchema) body: any) {
    return this.memoryService.addEntry(req.user.tenantId, body);
  }

  @Get("translation-memory/search")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "Search translation memory" })
  async searchMemory(
    @Req() req: AuthReq,
    @Query("sourceText") sourceText: string,
    @Query("sourceLocale") sourceLocale: string,
    @Query("targetLocale") targetLocale: string,
  ) {
    return this.memoryService.search(
      req.user.tenantId,
      sourceText,
      sourceLocale,
      targetLocale,
    );
  }

  @Post("translation-memory/:id/approve")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Approve translation memory entry" })
  async approveMemory(@Req() req: AuthReq, @Param("id") id: string) {
    return this.memoryService.approveEntry(req.user.tenantId, id);
  }

  @Get("translation-memory/stats")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "Get translation memory stats" })
  async getMemoryStats(@Req() req: AuthReq) {
    return this.memoryService.getStats(req.user.tenantId);
  }

  // Machine Translation Config
  @Get("mt-configs")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List machine translation configs" })
  async getMtConfigs(@Req() req: AuthReq) {
    return this.mtService.getConfigs(req.user.tenantId);
  }

  @Post("mt-configs")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Upsert machine translation config" })
  async upsertMtConfig(@Req() req: AuthReq, @ZodBody(mtSchema) body: any) {
    return this.mtService.upsertConfig(req.user.tenantId, body);
  }

  @Post("mt-configs/:id/toggle")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Toggle MT config active status" })
  async toggleMtConfig(@Req() req: AuthReq, @Param("id") id: string) {
    return this.mtService.toggleActive(req.user.tenantId, id);
  }

  // Translation Reviews
  @Get("reviews")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List translation reviews" })
  async getReviews(
    @Req() req: AuthReq,
    @Query("translationId") translationId?: string,
  ) {
    return this.reviewService.getReviews(req.user.tenantId, translationId);
  }

  @Post("reviews/:translationId")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Submit translation review" })
  async submitReview(
    @Req() req: AuthReq,
    @Param("translationId") translationId: string,
    @ZodBody(reviewSchema) body: any,
  ) {
    return this.reviewService.submitReview(
      req.user.tenantId,
      translationId,
      req.user.userId,
      body,
    );
  }

  @Get("reviews/pending")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "Get pending reviews" })
  async getPendingReviews(@Req() req: AuthReq) {
    return this.reviewService.getPendingReviews(req.user.tenantId);
  }

  // Fallback Chains
  @Get("fallback-chains")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List fallback chains" })
  async getFallbackChains(@Req() req: AuthReq) {
    return this.fallbackService.getFallbackChains(req.user.tenantId);
  }

  @Post("fallback-chains")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Upsert fallback chain" })
  async upsertFallbackChain(
    @Req() req: AuthReq,
    @ZodBody(fallbackSchema) body: any,
  ) {
    return this.fallbackService.upsertChain(
      req.user.tenantId,
      body.localeCode,
      body.fallbackOrder,
    );
  }

  @Get("resolve")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "Resolve translation with fallback" })
  async resolveTranslation(
    @Req() req: AuthReq,
    @Query("localeCode") localeCode: string,
    @Query("key") key: string,
  ) {
    return this.fallbackService.resolveTranslation(
      req.user.tenantId,
      localeCode,
      key,
    );
  }

  // Content Schedules
  @Get("content-schedules")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List content sync schedules" })
  async getSchedules(@Req() req: AuthReq) {
    return this.scheduleService.getSchedules(req.user.tenantId);
  }

  @Post("content-schedules")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Create content sync schedule" })
  async createSchedule(
    @Req() req: AuthReq,
    @ZodBody(scheduleSchema) body: any,
  ) {
    return this.scheduleService.createSchedule(req.user.tenantId, body);
  }

  @Put("content-schedules/:id")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Update content sync schedule" })
  async updateSchedule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(scheduleSchema.partial()) body: any,
  ) {
    return this.scheduleService.updateSchedule(req.user.tenantId, id, body);
  }

  @Delete("content-schedules/:id")
  @Permissions("admin.localization.delete")
  @ApiOperation({ summary: "Delete content sync schedule" })
  async deleteSchedule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.scheduleService.deleteSchedule(req.user.tenantId, id);
  }

  // Region Validation
  @Get("region-rules")
  @Permissions("admin.localization.read")
  @ApiOperation({ summary: "List region validation rules" })
  async getRegionRules(@Req() req: AuthReq) {
    return this.regionService.getRules(req.user.tenantId);
  }

  @Post("region-rules")
  @Permissions("admin.localization.create")
  @ApiOperation({ summary: "Upsert region validation rule" })
  async upsertRegionRule(
    @Req() req: AuthReq,
    @ZodBody(regionRuleSchema) body: any,
  ) {
    return this.regionService.upsertRule(req.user.tenantId, body);
  }

  @Delete("region-rules/:id")
  @Permissions("admin.localization.delete")
  @ApiOperation({ summary: "Delete region validation rule" })
  async deleteRegionRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.regionService.deleteRule(req.user.tenantId, id);
  }
}
