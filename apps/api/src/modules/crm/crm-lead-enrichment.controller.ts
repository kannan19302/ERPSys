import { z } from "zod";
import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { CrmLeadEnrichmentService, enrichmentSourceSchema, enrichmentRuleSchema, fieldMappingSchema, enrichmentScheduleSchema } from "./crm-lead-enrichment.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentSourceController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Post("sources")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Create enrichment source" })
  async createSource(@Req() req: AuthRequest, @ZodBody(enrichmentSourceSchema) body: unknown) {
    return this.svc.createSource(req.user.tenantId, body as any);
  }

  @Get("sources")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "List enrichment sources" })
  async listSources(@Req() req: AuthRequest) {
    return { data: await this.svc.listSources(req.user.tenantId) };
  }

  @Get("sources/:id")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get enrichment source" })
  async getSource(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getSource(req.user.tenantId, id);
  }

  @Put("sources/:id")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Update enrichment source" })
  async updateSource(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(enrichmentSourceSchema.partial()) body: unknown) {
    return this.svc.updateSource(req.user.tenantId, id, body as any);
  }

  @Delete("sources/:id")
  @Permissions("crm.enrichment.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete enrichment source" })
  async deleteSource(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteSource(req.user.tenantId, id);
  }

  @Post("sources/:id/test")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Test enrichment source connection" })
  async testSource(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.testSource(req.user.tenantId, id);
  }

  @Post("sources/:id/toggle")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Toggle enrichment source enabled/disabled" })
  async toggleSource(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.toggleSource(req.user.tenantId, id);
  }
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentRuleController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Post("rules")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Create enrichment rule" })
  async createRule(@Req() req: AuthRequest, @ZodBody(enrichmentRuleSchema) body: unknown) {
    return this.svc.createRule(req.user.tenantId, body as any);
  }

  @Get("rules")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "List enrichment rules" })
  async listRules(@Req() req: AuthRequest, @Query("objectType") objectType?: string) {
    return { data: await this.svc.listRules(req.user.tenantId, objectType) };
  }

  @Get("rules/:id")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get enrichment rule" })
  async getRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getRule(req.user.tenantId, id);
  }

  @Put("rules/:id")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Update enrichment rule" })
  async updateRule(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(enrichmentRuleSchema.partial()) body: unknown) {
    return this.svc.updateRule(req.user.tenantId, id, body as any);
  }

  @Delete("rules/:id")
  @Permissions("crm.enrichment.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete enrichment rule" })
  async deleteRule(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteRule(req.user.tenantId, id);
  }

  @Post("rules/:id/toggle")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Toggle enrichment rule active/inactive" })
  async toggleRule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.toggleRule(req.user.tenantId, id);
  }
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentFieldMappingController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Post("field-mappings")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Create field mapping" })
  async createMapping(@Req() req: AuthRequest, @ZodBody(fieldMappingSchema) body: unknown) {
    return this.svc.createFieldMapping(req.user.tenantId, body as any);
  }

  @Get("field-mappings")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "List field mappings" })
  async listMappings(@Req() req: AuthRequest, @Query("sourceId") sourceId?: string, @Query("targetEntity") targetEntity?: string) {
    return { data: await this.svc.listFieldMappings(req.user.tenantId, sourceId, targetEntity) };
  }

  @Put("field-mappings/:id")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Update field mapping" })
  async updateMapping(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(fieldMappingSchema.partial()) body: unknown) {
    return this.svc.updateFieldMapping(req.user.tenantId, id, body as any);
  }

  @Delete("field-mappings/:id")
  @Permissions("crm.enrichment.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete field mapping" })
  async deleteMapping(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteFieldMapping(req.user.tenantId, id);
  }
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentExecutionController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Post("leads/:leadId/enrich")
  @Permissions("crm.lead.update")
  @ApiOperation({ summary: "Enrich a single lead" })
  async enrichLead(@Req() req: AuthRequest, @Param("leadId") leadId: string, @Query("sourceId") sourceId?: string) {
    return this.svc.enrichLead(req.user.tenantId, leadId, sourceId, req.user.userId);
  }

  @Get("leads/:leadId/data")
  @Permissions("crm.lead.read")
  @ApiOperation({ summary: "Get enrichment data for a lead" })
  async getEnrichmentData(@Req() req: AuthRequest, @Param("leadId") leadId: string) {
    return { data: await this.svc.getEnrichmentData(req.user.tenantId, leadId) };
  }

  @Post("bulk-enrich")
  @Permissions("crm.lead.update")
  @ApiOperation({ summary: "Bulk enrich leads" })
  async bulkEnrich(@Req() req: AuthRequest, @ZodBody(z.object({ leadIds: z.array(z.string()), sourceId: z.string().optional() })) body: { leadIds: string[]; sourceId?: string }) {
    return this.svc.bulkEnrich(req.user.tenantId, body.leadIds, body.sourceId, req.user.userId);
  }

  @Get("logs")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "List enrichment logs" })
  async listLogs(@Req() req: AuthRequest, @Query("objectId") objectId?: string, @Query("sourceId") sourceId?: string, @Query("status") status?: string) {
    return { data: await this.svc.listLogs(req.user.tenantId, objectId, sourceId, status) };
  }

  @Get("logs/:id")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get enrichment log" })
  async getLog(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getLog(req.user.tenantId, id);
  }
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentScheduleController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Post("schedules")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Create enrichment schedule" })
  async createSchedule(@Req() req: AuthRequest, @ZodBody(enrichmentScheduleSchema) body: unknown) {
    return this.svc.createSchedule(req.user.tenantId, body as any);
  }

  @Get("schedules")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "List enrichment schedules" })
  async listSchedules(@Req() req: AuthRequest) {
    return { data: await this.svc.listSchedules(req.user.tenantId) };
  }

  @Get("schedules/:id")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get enrichment schedule" })
  async getSchedule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.getSchedule(req.user.tenantId, id);
  }

  @Put("schedules/:id")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Update enrichment schedule" })
  async updateSchedule(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(enrichmentScheduleSchema.partial()) body: unknown) {
    return this.svc.updateSchedule(req.user.tenantId, id, body as any);
  }

  @Delete("schedules/:id")
  @Permissions("crm.enrichment.manage")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete enrichment schedule" })
  async deleteSchedule(@Req() req: AuthRequest, @Param("id") id: string) {
    await this.svc.deleteSchedule(req.user.tenantId, id);
  }

  @Post("schedules/:id/toggle")
  @Permissions("crm.enrichment.manage")
  @ApiOperation({ summary: "Toggle enrichment schedule" })
  async toggleSchedule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.svc.toggleSchedule(req.user.tenantId, id);
  }
}

@ApiTags("crm-lead-enrichment")
@ApiBearerAuth()
@Controller("crm/lead-enrichment")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadEnrichmentAnalyticsController {
  constructor(private readonly svc: CrmLeadEnrichmentService) {}

  @Get("stats")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get enrichment statistics" })
  async getStats(@Req() req: AuthRequest) {
    return this.svc.getStats(req.user.tenantId);
  }

  @Get("source-efficacy")
  @Permissions("crm.enrichment.read")
  @ApiOperation({ summary: "Get source efficacy metrics" })
  async getSourceEfficacy(@Req() req: AuthRequest) {
    return { data: await this.svc.getSourceEfficacy(req.user.tenantId) };
  }
}
