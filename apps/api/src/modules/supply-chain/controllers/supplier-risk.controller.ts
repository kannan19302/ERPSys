import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors, HttpCode, HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { TrackChanges } from "../../../common/decorators/track-changes.decorator";
import { ChangeHistoryInterceptor } from "../../../common/interceptors/change-history.interceptor";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SupplierRiskService } from "../services/supplier-risk.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags("supply-chain / supplier-risk")
@ApiBearerAuth()
@Controller("supply-chain")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class SupplierRiskController {
  constructor(private readonly riskSvc: SupplierRiskService) {}

  @Get("supplier-risk-profiles")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "List supplier risk profiles" })
  listProfiles(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("riskCategory") riskCategory?: string) {
    return this.riskSvc.getRiskProfiles(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, riskCategory });
  }

  @Get("supplier-risk-profiles/:id")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "Get supplier risk profile by id" })
  getProfile(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.riskSvc.getRiskProfileById(req.user.tenantId, id);
  }

  @Get("suppliers/:vendorId/risk-profile")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "Get risk profile for a vendor" })
  getProfileByVendor(@Req() req: AuthRequest, @Param("vendorId") vendorId: string) {
    return this.riskSvc.getRiskProfileByVendor(req.user.tenantId, vendorId);
  }

  @Post("supplier-risk-profiles")
  @Permissions("supply-chain.risk.create")
  @TrackChanges("SupplierRiskProfile")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a supplier risk profile" })
  createProfile(@Req() req: AuthRequest, @ZodBody(z.object({ vendorId: z.string(), vendorName: z.string().optional(), financialHealth: z.number().min(0).max(100).optional(), geopoliticalRisk: z.number().min(0).max(100).optional(), operationalRisk: z.number().min(0).max(100).optional(), complianceRisk: z.number().min(0).max(100).optional(), qualityRisk: z.number().min(0).max(100).optional(), concentrationRisk: z.number().min(0).max(100).optional(), factors: z.array(z.object({ factorType: z.string(), factorName: z.string(), score: z.number().min(0).max(100), weight: z.number().optional(), trend: z.string().optional(), description: z.string().optional() })).optional() })) body: any) {
    return this.riskSvc.createRiskProfile(req.user.tenantId, body);
  }

  @Patch("supplier-risk-profiles/:id")
  @Permissions("supply-chain.risk.update")
  @TrackChanges("SupplierRiskProfile", "id")
  @ApiOperation({ summary: "Update a supplier risk profile" })
  updateProfile(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ financialHealth: z.number().min(0).max(100).optional(), geopoliticalRisk: z.number().min(0).max(100).optional(), operationalRisk: z.number().min(0).max(100).optional(), complianceRisk: z.number().min(0).max(100).optional(), qualityRisk: z.number().min(0).max(100).optional(), concentrationRisk: z.number().min(0).max(100).optional() })) body: any) {
    return this.riskSvc.updateRiskProfile(req.user.tenantId, id, body);
  }

  @Get("supplier-risk-alerts")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "List supplier risk alerts" })
  listAlerts(@Req() req: AuthRequest, @Query("status") status?: string, @Query("severity") severity?: string) {
    return this.riskSvc.getRiskAlerts(req.user.tenantId, { status, severity });
  }

  @Post("supplier-risk-alerts")
  @Permissions("supply-chain.risk.create")
  @TrackChanges("SupplierRiskAlert")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a supplier risk alert" })
  createAlert(@Req() req: AuthRequest, @ZodBody(z.object({ profileId: z.string(), alertType: z.string(), severity: z.string().optional(), title: z.string(), description: z.string().optional(), source: z.string().optional() })) body: any) {
    return this.riskSvc.createRiskAlert(req.user.tenantId, body);
  }

  @Post("supplier-risk-alerts/:id/resolve")
  @Permissions("supply-chain.risk.update")
  @TrackChanges("SupplierRiskAlert", "id")
  @ApiOperation({ summary: "Resolve a supplier risk alert" })
  resolveAlert(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ resolution: z.string() })) body: { resolution: string }) {
    return this.riskSvc.resolveRiskAlert(req.user.tenantId, id, body.resolution, req.user.userId);
  }

  @Get("alternative-sourcing")
  @Permissions("supply-chain.network.read")
  @ApiOperation({ summary: "List alternative sourcing records" })
  listAlternativeSourcing(@Req() req: AuthRequest, @Query("productId") productId?: string) {
    return this.riskSvc.getAlternativeSourcing(req.user.tenantId, productId);
  }

  @Post("alternative-sourcing")
  @Permissions("supply-chain.network.manage")
  @TrackChanges("AlternativeSourcing")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create an alternative sourcing record" })
  createAlternativeSourcing(@Req() req: AuthRequest, @ZodBody(z.object({ vendorId: z.string(), vendorName: z.string().optional(), productId: z.string().optional(), productSku: z.string().optional(), leadTimeDays: z.number().int().optional(), moq: z.number().int().optional(), unitCost: z.number().optional(), currency: z.string().optional(), notes: z.string().optional() })) body: any) {
    return this.riskSvc.createAlternativeSourcing(req.user.tenantId, body);
  }

  @Get("supplier-diversity")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "List supplier diversity records" })
  listDiversity(@Req() req: AuthRequest, @Query("diversityType") diversityType?: string) {
    return this.riskSvc.getSupplierDiversity(req.user.tenantId, diversityType);
  }

  @Post("supplier-risk-profiles/:profileId/diversity")
  @Permissions("supply-chain.risk.create")
  @TrackChanges("SupplierDiversity")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add supplier diversity certification" })
  createDiversity(@Req() req: AuthRequest, @Param("profileId") profileId: string, @ZodBody(z.object({ diversityType: z.string(), certificationBody: z.string().optional(), certificationNumber: z.string().optional(), certificationDate: z.string().optional(), expirationDate: z.string().optional(), spendAmount: z.number().optional(), fiscalYear: z.string().optional() })) body: any) {
    return this.riskSvc.createSupplierDiversity(req.user.tenantId, profileId, body);
  }

  @Get("supplier-risk-heatmap")
  @Permissions("supply-chain.risk.read")
  @ApiOperation({ summary: "Get supplier risk heatmap with summary" })
  getHeatMap(@Req() req: AuthRequest) {
    return this.riskSvc.getRiskHeatMap(req.user.tenantId);
  }
}
