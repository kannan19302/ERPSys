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
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { ReportingBookmarksService } from "./reporting-bookmarks.service";
import { ReportingSharesService } from "./reporting-shares.service";
import { ReportingVersionsService } from "./reporting-versions.service";
import { ReportingExecutionLogsService } from "./reporting-execution-logs.service";
import { ReportingDataSourcesService } from "./reporting-data-sources.service";
import { ReportingCacheConfigService } from "./reporting-cache-config.service";
import { ReportingAlertRulesService } from "./reporting-alert-rules.service";
import { ReportingAuditLogsService } from "./reporting-audit-logs.service";
import { ReportingFilterPresetsService } from "./reporting-filter-presets.service";
import { ReportingColumnPreferencesService } from "./reporting-column-preferences.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; roles?: string[] };
}

const bookmarkSchema = z.object({
  reportId: z.string().min(1),
  label: z.string().min(1),
  filterState: z.record(z.unknown()).optional(),
});
const shareSchema = z.object({
  reportId: z.string().min(1),
  sharedWithUserId: z.string().optional(),
  role: z.string().optional(),
  shareLink: z.string().optional(),
  expiresAt: z.string().optional(),
  isPublic: z.boolean().optional(),
});
const versionSchema = z.object({
  queryConfig: z.record(z.unknown()),
  snapshot: z.record(z.unknown()).optional(),
  changeNotes: z.string().optional(),
});
const dsSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  moduleName: z.string().optional(),
  tableName: z.string().optional(),
  connectionString: z.string().optional(),
  credentials: z.record(z.unknown()).optional(),
  schema: z.record(z.unknown()).optional(),
});
const cacheSchema = z.object({
  ttlMinutes: z.number().optional(),
  invalidateOnUpdate: z.boolean().optional(),
});
const alertSchema = z.object({
  reportId: z.string().min(1),
  name: z.string().min(1),
  condition: z.record(z.unknown()),
  channel: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
});
const presetSchema = z.object({
  name: z.string().min(1),
  filterState: z.record(z.unknown()),
  isDefault: z.boolean().optional(),
});
const colPrefSchema = z.object({
  columns: z.array(
    z.object({
      field: z.string().min(1),
      label: z.string().optional(),
      visible: z.boolean().optional(),
      width: z.number().optional(),
      sortOrder: z.number().optional(),
      pinned: z.string().optional(),
    }),
  ),
});

@ApiTags("reporting-admin-deep")
@ApiBearerAuth()
@Controller("admin/reporting")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportingAdminDeepController {
  constructor(
    private readonly bookmarksService: ReportingBookmarksService,
    private readonly sharesService: ReportingSharesService,
    private readonly versionsService: ReportingVersionsService,
    private readonly execLogsService: ReportingExecutionLogsService,
    private readonly dataSourcesService: ReportingDataSourcesService,
    private readonly cacheConfigService: ReportingCacheConfigService,
    private readonly alertRulesService: ReportingAlertRulesService,
    private readonly auditLogsService: ReportingAuditLogsService,
    private readonly filterPresetsService: ReportingFilterPresetsService,
    private readonly colPrefsService: ReportingColumnPreferencesService,
  ) {}

  // Bookmarks
  @Get("bookmarks")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List user bookmarks" })
  async getBookmarks(@Req() req: AuthReq) {
    return this.bookmarksService.getBookmarks(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post("bookmarks")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create bookmark" })
  async createBookmark(
    @Req() req: AuthReq,
    @ZodBody(bookmarkSchema) body: any,
  ) {
    return this.bookmarksService.createBookmark(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Delete("bookmarks/:id")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Delete bookmark" })
  async deleteBookmark(@Req() req: AuthReq, @Param("id") id: string) {
    return this.bookmarksService.deleteBookmark(
      req.user.tenantId,
      req.user.userId,
      id,
    );
  }

  // Shares
  @Get("shares/:reportId")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List report shares" })
  async getShares(@Req() req: AuthReq, @Param("reportId") reportId: string) {
    return this.sharesService.getShares(req.user.tenantId, reportId);
  }

  @Post("shares")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create share" })
  async createShare(@Req() req: AuthReq, @ZodBody(shareSchema) body: any) {
    return this.sharesService.createShare(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Put("shares/:id")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Update share" })
  async updateShare(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(shareSchema.partial()) body: any,
  ) {
    return this.sharesService.updateShare(req.user.tenantId, id, body);
  }

  @Delete("shares/:id")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Delete share" })
  async deleteShare(@Req() req: AuthReq, @Param("id") id: string) {
    return this.sharesService.deleteShare(req.user.tenantId, id);
  }

  // Versions
  @Get("versions/:reportId")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List report versions" })
  async getVersions(@Req() req: AuthReq, @Param("reportId") reportId: string) {
    return this.versionsService.getVersions(req.user.tenantId, reportId);
  }

  @Post("versions/:reportId")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create version" })
  async createVersion(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @ZodBody(versionSchema) body: any,
  ) {
    return this.versionsService.createVersion(
      req.user.tenantId,
      reportId,
      req.user.userId,
      body,
    );
  }

  @Get("versions/:reportId/diff")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "Compare two versions" })
  async diffVersions(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @Query("v1") v1: string,
    @Query("v2") v2: string,
  ) {
    return this.versionsService.getVersionDiff(
      req.user.tenantId,
      reportId,
      parseInt(v1),
      parseInt(v2),
    );
  }

  // Execution Logs
  @Get("execution-logs")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List execution logs" })
  async getExecLogs(
    @Req() req: AuthReq,
    @Query("reportId") reportId?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.execLogsService.getLogs(
      req.user.tenantId,
      reportId,
      status,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get("execution-logs/stats")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "Execution log stats" })
  async getExecLogStats(@Req() req: AuthReq) {
    return this.execLogsService.getStats(req.user.tenantId);
  }

  // Data Sources
  @Get("data-sources")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List data sources" })
  async getDataSources(@Req() req: AuthReq) {
    return this.dataSourcesService.getDataSources(req.user.tenantId);
  }

  @Post("data-sources")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create data source" })
  async createDataSource(@Req() req: AuthReq, @ZodBody(dsSchema) body: any) {
    return this.dataSourcesService.createDataSource(req.user.tenantId, body);
  }

  @Put("data-sources/:id")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Update data source" })
  async updateDataSource(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(dsSchema.partial()) body: any,
  ) {
    return this.dataSourcesService.updateDataSource(
      req.user.tenantId,
      id,
      body,
    );
  }

  @Delete("data-sources/:id")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Delete data source" })
  async deleteDataSource(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dataSourcesService.deleteDataSource(req.user.tenantId, id);
  }

  // Cache Config
  @Get("cache-config/:reportId")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "Get cache config" })
  async getCacheConfig(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
  ) {
    return this.cacheConfigService.getConfig(req.user.tenantId, reportId);
  }

  @Post("cache-config/:reportId")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Upsert cache config" })
  async upsertCacheConfig(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @ZodBody(cacheSchema) body: any,
  ) {
    return this.cacheConfigService.upsertConfig(
      req.user.tenantId,
      reportId,
      body,
    );
  }

  @Post("cache-config/:reportId/invalidate")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Invalidate cache" })
  async invalidateCache(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
  ) {
    return this.cacheConfigService.invalidateCache(req.user.tenantId, reportId);
  }

  // Alert Rules
  @Get("alert-rules")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List alert rules" })
  async getAlertRules(
    @Req() req: AuthReq,
    @Query("reportId") reportId?: string,
  ) {
    return this.alertRulesService.getRules(req.user.tenantId, reportId);
  }

  @Post("alert-rules")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create alert rule" })
  async createAlertRule(@Req() req: AuthReq, @ZodBody(alertSchema) body: any) {
    return this.alertRulesService.createRule(req.user.tenantId, body);
  }

  @Put("alert-rules/:id")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Update alert rule" })
  async updateAlertRule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(alertSchema.partial()) body: any,
  ) {
    return this.alertRulesService.updateRule(req.user.tenantId, id, body);
  }

  @Delete("alert-rules/:id")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Delete alert rule" })
  async deleteAlertRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.alertRulesService.deleteRule(req.user.tenantId, id);
  }

  // Audit Logs
  @Get("audit-logs")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List audit logs" })
  async getAuditLogs(
    @Req() req: AuthReq,
    @Query("reportId") reportId?: string,
    @Query("action") action?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.auditLogsService.getLogs(
      req.user.tenantId,
      reportId,
      action,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post("audit-logs")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Record audit log" })
  async recordAuditLog(
    @Req() req: AuthReq,
    @ZodBody(
      z.object({
        reportId: z.string().min(1),
        action: z.string().min(1),
        details: z.string().optional(),
      }),
    )
    body: any,
  ) {
    return this.auditLogsService.record(
      req.user.tenantId,
      req.user.userId,
      body.reportId,
      body.action,
      body.details,
    );
  }

  // Filter Presets
  @Get("filter-presets/:reportId")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "List filter presets" })
  async getFilterPresets(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
  ) {
    return this.filterPresetsService.getPresets(req.user.tenantId, reportId);
  }

  @Post("filter-presets/:reportId")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Create filter preset" })
  async createFilterPreset(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @ZodBody(presetSchema) body: any,
  ) {
    return this.filterPresetsService.createPreset(
      req.user.tenantId,
      reportId,
      req.user.userId,
      body,
    );
  }

  @Delete("filter-presets/:reportId/:id")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Delete filter preset" })
  async deleteFilterPreset(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @Param("id") id: string,
  ) {
    return this.filterPresetsService.deletePreset(
      req.user.tenantId,
      reportId,
      id,
    );
  }

  // Column Preferences
  @Get("column-preferences/:reportId")
  @Permissions("admin.reporting.read")
  @ApiOperation({ summary: "Get column preferences" })
  async getColPrefs(@Req() req: AuthReq, @Param("reportId") reportId: string) {
    return this.colPrefsService.getPreferences(
      req.user.tenantId,
      req.user.userId,
      reportId,
    );
  }

  @Post("column-preferences/:reportId")
  @Permissions("admin.reporting.create")
  @ApiOperation({ summary: "Set column preferences" })
  async setColPrefs(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
    @ZodBody(colPrefSchema) body: any,
  ) {
    return this.colPrefsService.upsertPreferences(
      req.user.tenantId,
      req.user.userId,
      reportId,
      body.columns,
    );
  }

  @Delete("column-preferences/:reportId")
  @Permissions("admin.reporting.delete")
  @ApiOperation({ summary: "Reset column preferences" })
  async resetColPrefs(
    @Req() req: AuthReq,
    @Param("reportId") reportId: string,
  ) {
    return this.colPrefsService.resetPreferences(
      req.user.tenantId,
      req.user.userId,
      reportId,
    );
  }
}
