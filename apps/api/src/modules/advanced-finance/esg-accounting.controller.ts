// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { EsgAccountingService } from "./services/esg-accounting.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createEmissionSourceSchema = z.object({
  sourceName: z.string().min(1),
  sourceType: z.string().min(1),
  scope: z.enum(["1", "2", "3"]),
  emissionFactor: z.number().positive().optional(),
  unit: z.string().min(1),
  status: z.string().optional(),
});
const recordEmissionSchema = z.object({
  sourceId: z.string().min(1),
  amount: z.number().positive(),
  recordedDate: z.string().min(1),
  notes: z.string().optional(),
});
const createOffsetCreditSchema = z.object({
  creditType: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  vintage: z.string().optional(),
  registry: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().min(1),
  costPerUnit: z.number().min(0).optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const createKpiDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  unit: z.string().min(1),
  targetValue: z.number().optional(),
  targetDirection: z.string().optional(),
  calculationMethod: z.string().optional(),
  reportingFrequency: z.string().optional(),
  dataSource: z.string().optional(),
  status: z.string().optional(),
});
const recordKpiActualValueSchema = z.object({
  kpiId: z.string().min(1),
  value: z.number(),
  recordedDate: z.string().min(1),
  fiscalYear: z.number().int().optional(),
  notes: z.string().optional(),
});
const createReportTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  reportingFramework: z.string().min(1),
  templateType: z.string().min(1),
  sections: z.any().optional(),
  isDefault: z.boolean().optional(),
  status: z.string().optional(),
});
const createDisclosureMappingSchema = z.object({
  framework: z.string().min(1),
  metricCode: z.string().min(1),
  metricName: z.string().min(1),
  mappedField: z.string().min(1),
  mappedEntity: z.string().optional(),
  mappingRules: z.any().optional(),
});
const createSustainabilityTargetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  targetType: z.string().min(1),
  baselineValue: z.number(),
  targetValue: z.number(),
  baselineYear: z.string().min(1),
  targetYear: z.string().min(1),
  unit: z.string().min(1),
  progressMetric: z.string().optional(),
  status: z.string().optional(),
});

@ApiTags("advanced-finance-esg")
@ApiBearerAuth()
@Controller("advanced-finance/esg")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EsgAccountingController {
  constructor(private readonly esgService: EsgAccountingService) {}

  @Post("emission-sources")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create emission source" })
  async createEmissionSource(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEmissionSourceSchema) dto: any,
  ) {
    return this.esgService.createEmissionSource(req.user.tenantId, dto);
  }

  @Get("emission-sources")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List emission sources" })
  async listEmissionSources(
    @Req() req: AuthenticatedRequest,
    @Query("scope") scope?: string,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.esgService.listEmissionSources(
      req.user.tenantId,
      scope,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined,
    );
  }

  @Get("emission-sources/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get emission source" })
  async getEmissionSource(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getEmissionSource(req.user.tenantId, id);
  }

  @Patch("emission-sources/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update emission source" })
  async updateEmissionSource(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createEmissionSourceSchema.partial()) dto: any,
  ) {
    return this.esgService.updateEmissionSource(req.user.tenantId, id, dto);
  }

  @Delete("emission-sources/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Delete emission source" })
  async deleteEmissionSource(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.deleteEmissionSource(req.user.tenantId, id);
  }

  @Post("emissions/record")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Record emission" })
  async recordEmission(
    @Req() req: AuthenticatedRequest,
    @ZodBody(recordEmissionSchema) dto: any,
  ) {
    return this.esgService.recordEmission(req.user.tenantId, dto);
  }

  @Get("emissions/by-scope")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get emissions by scope" })
  async getEmissionByScope(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear: string,
  ) {
    return this.esgService.getEmissionByScope(
      req.user.tenantId,
      parseInt(fiscalYear, 10),
    );
  }

  @Post("offset-credits")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create offset credit" })
  async createOffsetCredit(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createOffsetCreditSchema) dto: any,
  ) {
    return this.esgService.createOffsetCredit(req.user.tenantId, dto);
  }

  @Get("offset-credits")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List offset credits" })
  async listOffsetCredits(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.esgService.listOffsetCredits(req.user.tenantId, status);
  }

  @Get("offset-credits/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get offset credit" })
  async getOffsetCredit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getOffsetCredit(req.user.tenantId, id);
  }

  @Patch("offset-credits/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update offset credit" })
  async updateOffsetCredit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createOffsetCreditSchema.partial()) dto: any,
  ) {
    return this.esgService.updateOffsetCredit(req.user.tenantId, id, dto);
  }

  @Post("offset-credits/:id/retire")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Retire offset credit" })
  async retireOffsetCredit(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(z.object({ reason: z.string().min(1) })) dto: any,
  ) {
    return this.esgService.retireOffsetCredit(
      req.user.tenantId,
      id,
      dto.reason,
    );
  }

  @Get("offset-credits/available")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get available offset credits" })
  async getAvailableOffsetCredits(@Req() req: AuthenticatedRequest) {
    return this.esgService.getAvailableOffsetCredits(req.user.tenantId);
  }

  @Post("kpi-definitions")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create KPI definition" })
  async createKpiDefinition(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createKpiDefinitionSchema) dto: any,
  ) {
    return this.esgService.createKpiDefinition(req.user.tenantId, dto);
  }

  @Get("kpi-definitions")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List KPI definitions" })
  async listKpiDefinitions(
    @Req() req: AuthenticatedRequest,
    @Query("category") category?: string,
  ) {
    return this.esgService.listKpiDefinitions(req.user.tenantId, category);
  }

  @Get("kpi-definitions/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get KPI definition" })
  async getKpiDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getKpiDefinition(req.user.tenantId, id);
  }

  @Patch("kpi-definitions/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update KPI definition" })
  async updateKpiDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createKpiDefinitionSchema.partial()) dto: any,
  ) {
    return this.esgService.updateKpiDefinition(req.user.tenantId, id, dto);
  }

  @Delete("kpi-definitions/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Delete KPI definition" })
  async deleteKpiDefinition(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.deleteKpiDefinition(req.user.tenantId, id);
  }

  @Post("kpi-values")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Record KPI actual value" })
  async recordKpiActualValue(
    @Req() req: AuthenticatedRequest,
    @ZodBody(recordKpiActualValueSchema) dto: any,
  ) {
    return this.esgService.recordKpiActualValue(req.user.tenantId, dto);
  }

  @Get("kpi-values")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List KPI actual values" })
  async listKpiActualValues(
    @Req() req: AuthenticatedRequest,
    @Query("kpiId") kpiId?: string,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.esgService.listKpiActualValues(
      req.user.tenantId,
      kpiId,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined,
    );
  }

  @Get("kpi-values/:id/variance")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Compute KPI variance" })
  async computeVariance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.computeVariance(req.user.tenantId, id);
  }

  @Post("report-templates")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create report template" })
  async createReportTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createReportTemplateSchema) dto: any,
  ) {
    return this.esgService.createReportTemplate(req.user.tenantId, dto);
  }

  @Get("report-templates")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List report templates" })
  async listReportTemplates(
    @Req() req: AuthenticatedRequest,
    @Query("reportingFramework") reportingFramework?: string,
  ) {
    return this.esgService.listReportTemplates(
      req.user.tenantId,
      reportingFramework,
    );
  }

  @Get("report-templates/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get report template" })
  async getReportTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getReportTemplate(req.user.tenantId, id);
  }

  @Patch("report-templates/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update report template" })
  async updateReportTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createReportTemplateSchema.partial()) dto: any,
  ) {
    return this.esgService.updateReportTemplate(req.user.tenantId, id, dto);
  }

  @Post("report-templates/:id/set-default")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Set default report template" })
  async setDefaultReportTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.setDefaultReportTemplate(req.user.tenantId, id);
  }

  @Delete("report-templates/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Delete report template" })
  async deleteReportTemplate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.deleteReportTemplate(req.user.tenantId, id);
  }

  @Post("reports/generate")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Generate ESG report" })
  async generateReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ templateId: z.string().min(1) })) dto: any,
  ) {
    return this.esgService.generateReport(req.user.tenantId, dto.templateId);
  }

  @Post("disclosure-mappings")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create disclosure mapping" })
  async createDisclosureMapping(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDisclosureMappingSchema) dto: any,
  ) {
    return this.esgService.createDisclosureMapping(req.user.tenantId, dto);
  }

  @Get("disclosure-mappings")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List disclosure mappings" })
  async listDisclosureMappings(
    @Req() req: AuthenticatedRequest,
    @Query("framework") framework?: string,
  ) {
    return this.esgService.listDisclosureMappings(req.user.tenantId, framework);
  }

  @Get("disclosure-mappings/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get disclosure mapping" })
  async getDisclosureMapping(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getDisclosureMapping(req.user.tenantId, id);
  }

  @Patch("disclosure-mappings/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update disclosure mapping" })
  async updateDisclosureMapping(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createDisclosureMappingSchema.partial()) dto: any,
  ) {
    return this.esgService.updateDisclosureMapping(req.user.tenantId, id, dto);
  }

  @Delete("disclosure-mappings/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Delete disclosure mapping" })
  async deleteDisclosureMapping(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.deleteDisclosureMapping(req.user.tenantId, id);
  }

  @Post("sustainability-targets")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Create sustainability target" })
  async createSustainabilityTarget(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createSustainabilityTargetSchema) dto: any,
  ) {
    return this.esgService.createSustainabilityTarget(req.user.tenantId, dto);
  }

  @Get("sustainability-targets")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "List sustainability targets" })
  async listSustainabilityTargets(
    @Req() req: AuthenticatedRequest,
    @Query("targetType") targetType?: string,
    @Query("status") status?: string,
  ) {
    return this.esgService.listSustainabilityTargets(
      req.user.tenantId,
      targetType,
      status,
    );
  }

  @Get("sustainability-targets/:id")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get sustainability target" })
  async getSustainabilityTarget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getSustainabilityTarget(req.user.tenantId, id);
  }

  @Patch("sustainability-targets/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update sustainability target" })
  async updateSustainabilityTarget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createSustainabilityTargetSchema.partial()) dto: any,
  ) {
    return this.esgService.updateSustainabilityTarget(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Post("sustainability-targets/:id/progress")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Update sustainability target progress" })
  async updateSustainabilityTargetProgress(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(
      z.object({ currentValue: z.number(), notes: z.string().optional() }),
    )
    dto: any,
  ) {
    return this.esgService.updateSustainabilityTargetProgress(
      req.user.tenantId,
      id,
      dto.currentValue,
    );
  }

  @Get("sustainability-targets/:id/status")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get sustainability target status" })
  async getSustainabilityTargetStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.getSustainabilityTargetStatus(req.user.tenantId, id);
  }

  @Delete("sustainability-targets/:id")
  @Permissions("finance.esg.manage")
  @ApiOperation({ summary: "Delete sustainability target" })
  async deleteSustainabilityTarget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.esgService.deleteSustainabilityTarget(req.user.tenantId, id);
  }

  @Get("dashboard")
  @Permissions("finance.esg.read")
  @ApiOperation({ summary: "Get ESG summary dashboard" })
  async getEsgSummaryDashboard(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.esgService.getEsgSummaryDashboard(
      req.user.tenantId,
      fiscalYear ? parseInt(fiscalYear, 10) : undefined,
    );
  }
}
