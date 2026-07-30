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
import { RiskManagementService } from "./services/risk-management.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createScorecardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scorecardType: z.string().min(1),
  weightModel: z.any().optional(),
  criteria: z.any().optional(),
  status: z.string().optional(),
  isDefault: z.boolean().optional(),
});
const createVendorAssessmentSchema = z.object({
  vendorId: z.string().min(1),
  assessmentType: z.string().min(1),
  assessmentDate: z.string().min(1),
  score: z.number().min(0).max(100),
  criteria: z.any().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  assessedBy: z.string().optional(),
});
const createMarketExposureSchema = z.object({
  exposureType: z.string().min(1),
  counterparty: z.string().min(1),
  notionalAmount: z.number().positive(),
  currency: z.string().min(1),
  underlyingAsset: z.string().optional(),
  maturityDate: z.string().optional(),
  riskRating: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});
const hedgeExposureSchema = z.object({ hedgingStrategy: z.string().min(1) });
const createRiskEventSchema = z.object({
  eventType: z.string().min(1),
  severity: z.string().min(1),
  description: z.string().min(1),
  source: z.string().optional(),
  amount: z.number().optional(),
  status: z.string().optional(),
  reportedBy: z.string().optional(),
});
const resolveRiskEventSchema = z.object({
  resolutionNotes: z.string().optional(),
});
const createControlMeasureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  controlType: z.string().min(1),
  riskCategory: z.string().optional(),
  owner: z.string().min(1),
  frequency: z.string().optional(),
  effectiveness: z.string().optional(),
  status: z.string().optional(),
});
const testControlSchema = z.object({ effectiveness: z.string().min(1) });

@ApiTags("advanced-finance-risk-management")
@ApiBearerAuth()
@Controller("advanced-finance/risk-management")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RiskManagementController {
  constructor(private readonly riskService: RiskManagementService) {}

  @Post("scorecards")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Create risk scorecard" })
  async createScorecard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createScorecardSchema) dto: any,
  ) {
    return this.riskService.createScorecard(req.user.tenantId, dto);
  }

  @Get("scorecards")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List risk scorecards" })
  async listScorecards(
    @Req() req: AuthenticatedRequest,
    @Query("isActive") isActive?: string,
  ) {
    return this.riskService.listScorecards(
      req.user.tenantId,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
    );
  }

  @Get("scorecards/:id")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get risk scorecard" })
  async getScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.getScorecard(req.user.tenantId, id);
  }

  @Patch("scorecards/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Update risk scorecard" })
  async updateScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createScorecardSchema.partial()) dto: any,
  ) {
    return this.riskService.updateScorecard(req.user.tenantId, id, dto);
  }

  @Delete("scorecards/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Delete risk scorecard" })
  async deleteScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.deleteScorecard(req.user.tenantId, id);
  }

  @Post("scorecards/:id/set-default")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Set default scorecard" })
  async setDefaultScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.setDefaultScorecard(req.user.tenantId, id);
  }

  @Post("customer-scores/compute")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Compute risk score for customer" })
  async computeScoreForCustomer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        customerId: z.string().min(1),
        scorecardId: z.string().optional(),
      }),
    )
    dto: any,
  ) {
    return this.riskService.computeScoreForCustomer(
      req.user.tenantId,
      dto.customerId,
      dto.scorecardId,
    );
  }

  @Get("customer-scores")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List customer scores" })
  async listCustomerScores(
    @Req() req: AuthenticatedRequest,
    @Query("customerId") customerId?: string,
    @Query("riskRating") riskRating?: string,
  ) {
    return this.riskService.listCustomerScores(req.user.tenantId, {
      customerId,
      riskRating,
    });
  }

  @Get("customer-scores/:id")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get customer score" })
  async getCustomerScore(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.getCustomerScore(req.user.tenantId, id);
  }

  @Post("vendor-assessments")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Create vendor assessment" })
  async createVendorAssessment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createVendorAssessmentSchema) dto: any,
  ) {
    return this.riskService.createVendorAssessment(req.user.tenantId, dto);
  }

  @Get("vendor-assessments")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List vendor assessments" })
  async listVendorAssessments(
    @Req() req: AuthenticatedRequest,
    @Query("vendorId") vendorId?: string,
    @Query("riskRating") riskRating?: string,
  ) {
    return this.riskService.listVendorAssessments(req.user.tenantId, {
      vendorId,
      riskRating,
    });
  }

  @Get("vendor-assessments/by-vendor/:vendorId")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get vendor assessments by vendor" })
  async getVendorAssessmentsByVendor(
    @Req() req: AuthenticatedRequest,
    @Param("vendorId") vendorId: string,
  ) {
    return this.riskService.getVendorAssessmentsByVendor(
      req.user.tenantId,
      vendorId,
    );
  }

  @Post("market-exposures")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Create market exposure" })
  async createMarketExposure(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createMarketExposureSchema) dto: any,
  ) {
    return this.riskService.createMarketExposure(req.user.tenantId, dto);
  }

  @Get("market-exposures")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List market exposures" })
  async listMarketExposures(
    @Req() req: AuthenticatedRequest,
    @Query("riskType") riskType?: string,
    @Query("status") status?: string,
  ) {
    return this.riskService.listMarketExposures(req.user.tenantId, {
      riskType,
      status,
    });
  }

  @Get("market-exposures/:id")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get market exposure" })
  async getMarketExposure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.getMarketExposure(req.user.tenantId, id);
  }

  @Patch("market-exposures/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Update market exposure" })
  async updateMarketExposure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createMarketExposureSchema.partial()) dto: any,
  ) {
    return this.riskService.updateMarketExposure(req.user.tenantId, id, dto);
  }

  @Post("market-exposures/:id/hedge")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Hedge exposure" })
  async hedgeExposure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(hedgeExposureSchema) dto: any,
  ) {
    return this.riskService.hedgeExposure(req.user.tenantId, id, dto);
  }

  @Post("market-exposures/:id/close")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Close exposure" })
  async closeExposure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.closeExposure(req.user.tenantId, id);
  }

  @Post("risk-events")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Create risk event" })
  async createRiskEvent(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRiskEventSchema) dto: any,
  ) {
    return this.riskService.createRiskEvent(req.user.tenantId, dto);
  }

  @Get("risk-events")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List risk events" })
  async listRiskEvents(
    @Req() req: AuthenticatedRequest,
    @Query("eventType") eventType?: string,
    @Query("severity") severity?: string,
    @Query("status") status?: string,
  ) {
    return this.riskService.listRiskEvents(req.user.tenantId, {
      eventType,
      severity,
      status,
    });
  }

  @Get("risk-events/:id")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get risk event" })
  async getRiskEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.getRiskEvent(req.user.tenantId, id);
  }

  @Patch("risk-events/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Update risk event" })
  async updateRiskEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createRiskEventSchema.partial()) dto: any,
  ) {
    return this.riskService.updateRiskEvent(req.user.tenantId, id, dto);
  }

  @Post("risk-events/:id/resolve")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Resolve risk event" })
  async resolveRiskEvent(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(resolveRiskEventSchema) dto: any,
  ) {
    return this.riskService.resolveRiskEvent(req.user.tenantId, id, dto);
  }

  @Post("control-measures")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Create control measure" })
  async createControlMeasure(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createControlMeasureSchema) dto: any,
  ) {
    return this.riskService.createControlMeasure(req.user.tenantId, dto);
  }

  @Get("control-measures")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "List control measures" })
  async listControlMeasures(
    @Req() req: AuthenticatedRequest,
    @Query("riskCategory") riskCategory?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.riskService.listControlMeasures(
      req.user.tenantId,
      riskCategory,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
    );
  }

  @Get("control-measures/:id")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get control measure" })
  async getControlMeasure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.getControlMeasure(req.user.tenantId, id);
  }

  @Patch("control-measures/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Update control measure" })
  async updateControlMeasure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createControlMeasureSchema.partial()) dto: any,
  ) {
    return this.riskService.updateControlMeasure(req.user.tenantId, id, dto);
  }

  @Delete("control-measures/:id")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Delete control measure" })
  async deleteControlMeasure(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.riskService.deleteControlMeasure(req.user.tenantId, id);
  }

  @Post("control-measures/:id/test")
  @Permissions("finance.risk.manage")
  @ApiOperation({ summary: "Test control measure" })
  async testControl(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(testControlSchema) dto: any,
  ) {
    return this.riskService.testControl(req.user.tenantId, id, dto);
  }

  @Get("summary")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get risk summary" })
  async getRiskSummary(@Req() req: AuthenticatedRequest) {
    return this.riskService.getRiskSummary(req.user.tenantId);
  }

  @Get("heat-map")
  @Permissions("finance.risk.read")
  @ApiOperation({ summary: "Get heat map data" })
  async getHeatMapData(@Req() req: AuthenticatedRequest) {
    return this.riskService.getHeatMapData(req.user.tenantId);
  }
}
