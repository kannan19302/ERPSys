import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FinancialInstrumentsService } from "./services/financial-instruments.service";

interface AuthenticatedRequest extends Request { user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string } }

const createFvSchema = z.object({
  instrumentType: z.string().min(1), instrumentId: z.string().min(1), measurementDate: z.string().min(1),
  fairValue: z.number(), costBasis: z.number(), hierarchyLevel: z.string().min(1),
  valuationTechnique: z.string().optional(), significantInputs: z.any().optional(),
  performedBy: z.string().optional(), notes: z.string().optional(),
});
const createEclSchema = z.object({
  provisionDate: z.string().min(1), period: z.string().min(1), portfolio: z.string().optional(),
  stage: z.string().min(1), grossCarryingAmount: z.number(), lossRate: z.number(),
  previousAllowance: z.number().optional(), methodology: z.string().min(1),
  probabilityDefault: z.number().optional(), lossGivenDefault: z.number().optional(),
  exposureAtDefault: z.number().optional(), daysPastDue: z.number().optional(),
  creditRiskRating: z.string().optional(),
});

@ApiTags("advanced-finance-financial-instruments")
@ApiBearerAuth()
@Controller("advanced-finance/financial-instruments")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FinancialInstrumentsController {
  constructor(private readonly fiService: FinancialInstrumentsService) {}

  @Get("fair-value-measurements")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "List fair value measurements" })
  async getMeasurements(@Req() req: AuthenticatedRequest, @Query("instrumentType") instrumentType?: string) {
    return this.fiService.getFairValueMeasurements(req.user.tenantId, instrumentType);
  }

  @Get("fair-value-measurements/:id")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get fair value measurement by ID" })
  async getMeasurementById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.getFairValueMeasurementById(req.user.tenantId, id);
  }

  @Post("fair-value-measurements")
  @Permissions("finance.assets.create")
  @ApiOperation({ summary: "Create fair value measurement" })
  async createMeasurement(@Req() req: AuthenticatedRequest, @ZodBody(createFvSchema) dto: any) {
    return this.fiService.createFairValueMeasurement(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("fair-value-measurements/:id")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Update fair value measurement" })
  async updateMeasurement(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createFvSchema.partial()) dto: any) {
    return this.fiService.updateFairValueMeasurement(req.user.tenantId, id, dto);
  }

  @Delete("fair-value-measurements/:id")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Delete fair value measurement" })
  async deleteMeasurement(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.deleteFairValueMeasurement(req.user.tenantId, id);
  }

  @Get("fair-value-measurements/by-instrument/:instrumentType/:instrumentId")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get measurements by instrument" })
  async getMeasurementsByInstrument(@Req() req: AuthenticatedRequest, @Param("instrumentType") instrumentType: string, @Param("instrumentId") instrumentId: string) {
    return this.fiService.getMeasurementsByInstrument(req.user.tenantId, instrumentType, instrumentId);
  }

  @Get("fair-value-measurements/latest/:instrumentType/:instrumentId")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get latest measurement for instrument" })
  async getLatestMeasurement(@Req() req: AuthenticatedRequest, @Param("instrumentType") instrumentType: string, @Param("instrumentId") instrumentId: string) {
    return this.fiService.getLatestMeasurement(req.user.tenantId, instrumentType, instrumentId);
  }

  @Get("fair-value-measurements/by-level/:hierarchyLevel")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get measurements by hierarchy level" })
  async getByLevel(@Req() req: AuthenticatedRequest, @Param("hierarchyLevel") hierarchyLevel: string) {
    return this.fiService.getFairValueByLevel(req.user.tenantId, hierarchyLevel);
  }

  @Get("fair-value-hierarchy-summary/:orgId")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get fair value hierarchy summary" })
  async getHierarchySummary(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.fiService.getFairValueHierarchySummary(req.user.tenantId, orgId);
  }

  @Post("fair-value-measurements/:id/approve")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Approve fair value measurement" })
  async approveMeasurement(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.approveMeasurement(req.user.tenantId, id, req.user.userId);
  }

  @Get("expected-credit-loss-provisions")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "List ECL provisions" })
  async getECLProvisions(@Req() req: AuthenticatedRequest, @Query("period") period?: string, @Query("stage") stage?: string) {
    return this.fiService.getExpectedCreditLossProvisions(req.user.tenantId, period, stage);
  }

  @Get("expected-credit-loss-provisions/:id")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get ECL provision by ID" })
  async getECLProvisionById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.getExpectedCreditLossProvisionById(req.user.tenantId, id);
  }

  @Post("expected-credit-loss-provisions")
  @Permissions("finance.assets.create")
  @ApiOperation({ summary: "Create ECL provision" })
  async createECLProvision(@Req() req: AuthenticatedRequest, @ZodBody(createEclSchema) dto: any) {
    return this.fiService.createExpectedCreditLossProvision(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("expected-credit-loss-provisions/:id")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Update ECL provision" })
  async updateECLProvision(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createEclSchema.partial()) dto: any) {
    return this.fiService.updateExpectedCreditLossProvision(req.user.tenantId, id, dto);
  }

  @Delete("expected-credit-loss-provisions/:id")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Delete ECL provision" })
  async deleteECLProvision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.deleteExpectedCreditLossProvision(req.user.tenantId, id);
  }

  @Post("expected-credit-loss-provisions/:id/review")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Review ECL provision" })
  async reviewECLProvision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.reviewExpectedCreditLossProvision(req.user.tenantId, id, req.user.userId);
  }

  @Post("expected-credit-loss-provisions/:id/approve")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Approve ECL provision" })
  async approveECLProvision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.approveExpectedCreditLossProvision(req.user.tenantId, id, req.user.userId);
  }

  @Post("expected-credit-loss-provisions/:id/post")
  @Permissions("finance.assets.update")
  @ApiOperation({ summary: "Post ECL provision" })
  async postECLProvision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.fiService.postExpectedCreditLossProvision(req.user.tenantId, id);
  }

  @Get("expected-credit-loss-provisions/by-period/:period")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get provisions by period" })
  async getProvisionsByPeriod(@Req() req: AuthenticatedRequest, @Param("period") period: string) {
    return this.fiService.getProvisionsByPeriod(req.user.tenantId, period);
  }

  @Get("ecl-summary/:orgId/:period")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get ECL summary" })
  async getECLSummary(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("period") period: string) {
    return this.fiService.getECLSummary(req.user.tenantId, orgId, period);
  }

  @Get("ecl-roll-forward/:orgId/:period")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get ECL roll-forward" })
  async getECLRollForward(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("period") period: string) {
    return this.fiService.getECLRollForward(req.user.tenantId, orgId, period);
  }

  @Post("compute-loss-rate/:orgId/:portfolio")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Compute historical loss rate" })
  async computeLossRate(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("portfolio") portfolio: string) {
    return this.fiService.computeLossRate(req.user.tenantId, orgId, portfolio);
  }

  @Get("ecl-dashboard/:orgId")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get ECL dashboard" })
  async getECLDashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.fiService.getAllECLDashboard(req.user.tenantId, orgId);
  }

  @Get("dashboard/:orgId")
  @Permissions("finance.assets.read")
  @ApiOperation({ summary: "Get financial instruments dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.fiService.getFinancialInstrumentsDashboard(req.user.tenantId, orgId);
  }
}
