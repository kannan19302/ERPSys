import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  CrmReportingDeepService,
  createCrmSavedReportSchema,
  updateCrmSavedReportSchema,
  createReportScheduleSchema,
  updateReportScheduleSchema,
  createDashboardTemplateSchema,
  updateDashboardTemplateSchema,
  CreateCrmSavedReportInput,
  UpdateCrmSavedReportInput,
  CreateReportScheduleInput,
  UpdateReportScheduleInput,
  CreateDashboardTemplateInput,
  UpdateDashboardTemplateInput,
} from "./crm-reporting-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm-reporting")
@ApiBearerAuth()
@Controller("crm/reporting")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmReportingDeepController {
  constructor(private readonly svc: CrmReportingDeepService) {}

  // ── Saved Reports ─────────────────────────────────────────

  @ApiOperation({ summary: "Get saved reports" })
  @Get("reports")
  @Permissions("crm.reporting.reports.read")
  async getReports(
    @Req() req: AuthenticatedRequest,
    @Query("module") module?: string,
    @Query("type") type?: string,
    @Query("favorites") favorites?: string,
  ) {
    return this.svc.getSavedReports(req.user.tenantId, {
      module,
      type,
      favorites: favorites === "true",
    });
  }

  @ApiOperation({ summary: "Create saved report" })
  @Post("reports")
  @Permissions("crm.reporting.reports.create")
  async createReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCrmSavedReportSchema) dto: CreateCrmSavedReportInput,
  ) {
    return this.svc.createSavedReport(
      req.user.tenantId,
      req.user.orgId || "org-system-default",
      dto,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Update saved report" })
  @Put("reports/:id")
  @Permissions("crm.reporting.reports.update")
  async updateReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateCrmSavedReportSchema) dto: UpdateCrmSavedReportInput,
  ) {
    return this.svc.updateSavedReport(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete saved report" })
  @Delete("reports/:id")
  @Permissions("crm.reporting.reports.delete")
  async deleteReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteSavedReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get saved report by id" })
  @Get("reports/:id")
  @Permissions("crm.reporting.reports.read")
  async getReportById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.getSavedReportById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Execute saved report" })
  @Post("reports/:id/execute")
  @Permissions("crm.reporting.reports.read")
  async executeReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.any().optional()) params?: Record<string, any>,
  ) {
    return this.svc.executeReport(req.user.tenantId, id, params);
  }

  @ApiOperation({ summary: "Duplicate saved report" })
  @Post("reports/:id/duplicate")
  @Permissions("crm.reporting.reports.create")
  async duplicateReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.duplicateReport(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: "Favorite a report" })
  @Post("reports/:id/favorite")
  @Permissions("crm.reporting.reports.update")
  async favoriteReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.favoriteReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Unfavorite a report" })
  @Post("reports/:id/unfavorite")
  @Permissions("crm.reporting.reports.update")
  async unfavoriteReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.unfavoriteReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Export a report" })
  @Post("reports/:id/export")
  @Permissions("crm.reporting.reports.read")
  async exportReport(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("format") format?: string,
  ) {
    return this.svc.exportReport(req.user.tenantId, id, format || "json");
  }

  // ── Report Schedules ──────────────────────────────────────

  @ApiOperation({ summary: "Get report schedules" })
  @Get("reports/:id/schedules")
  @Permissions("crm.reporting.schedules.read")
  async getSchedules(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { data: await this.svc.getReportSchedules(req.user.tenantId, id) };
  }

  @ApiOperation({ summary: "Create report schedule" })
  @Post("reports/:id/schedules")
  @Permissions("crm.reporting.schedules.create")
  async createSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createReportScheduleSchema) dto: CreateReportScheduleInput,
  ) {
    return this.svc.createSchedule(req.user.tenantId, id, dto, req.user.userId);
  }

  @ApiOperation({ summary: "Update report schedule" })
  @Put("reports/:id/schedules/:scheduleId")
  @Permissions("crm.reporting.schedules.update")
  async updateSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("scheduleId") scheduleId: string,
    @ZodBody(updateReportScheduleSchema) dto: UpdateReportScheduleInput,
  ) {
    return this.svc.updateSchedule(req.user.tenantId, id, scheduleId, dto);
  }

  @ApiOperation({ summary: "Delete report schedule" })
  @Delete("reports/:id/schedules/:scheduleId")
  @Permissions("crm.reporting.schedules.delete")
  async deleteSchedule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("scheduleId") scheduleId: string,
  ) {
    return this.svc.deleteSchedule(req.user.tenantId, id, scheduleId);
  }

  // ── Categories & System Reports ───────────────────────────

  @ApiOperation({ summary: "Get report categories" })
  @Get("categories")
  @Permissions("crm.reporting.reports.read")
  async getCategories(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getReportCategories(req.user.tenantId) };
  }

  @ApiOperation({ summary: "Get system reports" })
  @Get("system")
  @Permissions("crm.reporting.reports.read")
  async getSystemReports(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getSystemReports(req.user.tenantId) };
  }

  // ── Dashboard Templates ───────────────────────────────────

  @ApiOperation({ summary: "Get dashboard templates" })
  @Get("dashboards/templates")
  @Permissions("crm.reporting.templates.read")
  async getTemplates(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDashboardTemplates(req.user.tenantId) };
  }

  @ApiOperation({ summary: "Create dashboard template" })
  @Post("dashboards/templates")
  @Permissions("crm.reporting.templates.create")
  async createTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDashboardTemplateSchema) dto: CreateDashboardTemplateInput,
  ) {
    return this.svc.createTemplate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update dashboard template" })
  @Put("dashboards/templates/:id")
  @Permissions("crm.reporting.templates.update")
  async updateTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateDashboardTemplateSchema) dto: UpdateDashboardTemplateInput,
  ) {
    return this.svc.updateTemplate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete dashboard template" })
  @Delete("dashboards/templates/:id")
  @Permissions("crm.reporting.templates.delete")
  async deleteTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.deleteTemplate(req.user.tenantId, id);
  }

  // ── Dashboard Shares ──────────────────────────────────────

  @ApiOperation({ summary: "Get dashboard shares" })
  @Get("dashboards/:dashboardId/shares")
  @Permissions("crm.reporting.shares.read")
  async getShares(
    @Req() req: AuthenticatedRequest,
    @Param("dashboardId") dashboardId: string,
  ) {
    return {
      data: await this.svc.getDashboardShares(req.user.tenantId, dashboardId),
    };
  }

  @ApiOperation({ summary: "Share dashboard with user" })
  @Post("dashboards/:dashboardId/shares")
  @Permissions("crm.reporting.shares.create")
  async shareDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("dashboardId") dashboardId: string,
    @ZodBody(
      z.object({ userId: z.string().min(1), canEdit: z.boolean().optional() }),
    )
    body: { userId: string; canEdit?: boolean },
  ) {
    return this.svc.shareDashboard(
      req.user.tenantId,
      dashboardId,
      body.userId,
      body.canEdit,
    );
  }

  @ApiOperation({ summary: "Remove dashboard share" })
  @Delete("dashboards/:dashboardId/shares/:shareId")
  @Permissions("crm.reporting.shares.delete")
  async removeShare(
    @Req() req: AuthenticatedRequest,
    @Param("dashboardId") dashboardId: string,
    @Param("shareId") shareId: string,
  ) {
    return this.svc.removeShare(req.user.tenantId, dashboardId, shareId);
  }

  // ── Dashboard ─────────────────────────────────────────────

  @ApiOperation({ summary: "Get report usage dashboard" })
  @Get("dashboard")
  @Permissions("crm.reporting.reports.read")
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.svc.getReportDashboard(req.user.tenantId);
  }
}
