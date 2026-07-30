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
  Body,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ReportingService } from "./reporting.service";
import { ReportingBookmarksService } from "./reporting-bookmarks.service";
import { ReportingAlertRulesService } from "./reporting-alert-rules.service";
import { ReportingAuditLogsService } from "./reporting-audit-logs.service";
import { ReportingColumnPreferencesService } from "./reporting-column-preferences.service";
import { ReportingCacheConfigService } from "./reporting-cache-config.service";
import { ReportingDataSourcesService } from "./reporting-data-sources.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

@ApiTags("reporting-bulk")
@ApiBearerAuth()
@Controller("reporting-bulk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportingBulkController {
  constructor(
    private readonly service: ReportingService,
    private readonly bookmarksService: ReportingBookmarksService,
    private readonly alertRulesService: ReportingAlertRulesService,
    private readonly auditLogsService: ReportingAuditLogsService,
    private readonly columnPrefsService: ReportingColumnPreferencesService,
    private readonly cacheConfigService: ReportingCacheConfigService,
    private readonly dataSourcesService: ReportingDataSourcesService,
  ) {}

  @Get("reports")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List reports" })
  async getReports(@Req() req: AuthReq) {
    return this.service.getReports(req.user.tenantId);
  }

  @Post("reports")
  @Permissions("reporting.create")
  @ApiOperation({ summary: "Create report" })
  async createReport(@Req() req: AuthReq, @Body() body: any) {
    return this.service.createReport(req.user.tenantId, body);
  }

  @Get("reports/categories")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List report categories" })
  async getReportCategories(@Req() req: AuthReq) {
    return this.service.getReportCategories(req.user.tenantId);
  }

  @Post("reports/:id/clone")
  @Permissions("reporting.create")
  @ApiOperation({ summary: "Clone a report" })
  async cloneReport(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.cloneReport(req.user.tenantId, id);
  }

  @Get("bookmarks")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List report bookmarks" })
  async getBookmarks(@Req() req: AuthReq) {
    return this.bookmarksService.getBookmarks(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post("bookmarks")
  @Permissions("reporting.create")
  @ApiOperation({ summary: "Create bookmark" })
  async createBookmark(@Req() req: AuthReq, @Body() body: any) {
    return this.bookmarksService.createBookmarkSimple(req.user.tenantId, body);
  }

  @Delete("bookmarks/:id")
  @Permissions("reporting.delete")
  @ApiOperation({ summary: "Delete bookmark" })
  async deleteBookmark(@Param("id") id: string) {
    return this.bookmarksService.deleteBookmarkById(id);
  }

  @Get("alert-rules")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List alert rules" })
  async getAlertRules(@Req() req: AuthReq) {
    return this.alertRulesService.getRules(req.user.tenantId);
  }

  @Post("alert-rules")
  @Permissions("reporting.create")
  @ApiOperation({ summary: "Create alert rule" })
  async createAlertRule(@Req() req: AuthReq, @Body() body: any) {
    return this.alertRulesService.createRuleSimple(req.user.tenantId, body);
  }

  @Put("alert-rules/:id")
  @Permissions("reporting.update")
  @ApiOperation({ summary: "Update alert rule" })
  async updateAlertRule(@Param("id") id: string, @Body() body: any) {
    return this.alertRulesService.updateRuleById(id, body);
  }

  @Delete("alert-rules/:id")
  @Permissions("reporting.delete")
  @ApiOperation({ summary: "Delete alert rule" })
  async deleteAlertRule(@Param("id") id: string) {
    return this.alertRulesService.deleteRuleById(id);
  }

  @Get("audit-logs")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List audit logs" })
  async getAuditLogs(@Req() req: AuthReq) {
    return this.auditLogsService.getLogs(req.user.tenantId);
  }

  @Get("column-preferences")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "Get column preferences" })
  async getColumnPreferences(
    @Req() req: AuthReq,
    @Query("reportId") reportId: string,
  ) {
    return this.columnPrefsService.getPreferences(
      req.user.tenantId,
      req.user.userId,
      reportId,
    );
  }

  @Post("column-preferences")
  @Permissions("reporting.create")
  @ApiOperation({ summary: "Save column preferences" })
  async saveColumnPreferences(@Req() req: AuthReq, @Body() body: any) {
    return this.columnPrefsService.upsertPreferencesSimple(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Get("cache-config")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "Get cache configuration" })
  async getCacheConfig(
    @Req() req: AuthReq,
    @Query("reportId") reportId: string,
  ) {
    return this.cacheConfigService.getConfig(req.user.tenantId, reportId);
  }

  @Get("data-sources")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "List data sources" })
  async getDataSources(@Req() req: AuthReq) {
    return this.dataSourcesService.getDataSources(req.user.tenantId);
  }

  @Get("stats")
  @Permissions("reporting.read")
  @ApiOperation({ summary: "Reporting statistics" })
  async getStats(@Req() req: AuthReq) {
    return this.service.getReportingStats(req.user.tenantId);
  }

  @Delete("reports/:id")
  @Permissions("reporting.delete")
  @ApiOperation({ summary: "Delete report" })
  async deleteReport(@Param("id") id: string) {
    return this.service.deleteReport(id);
  }
}
