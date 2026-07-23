import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { GlobalTaxDeepService } from "./services/global-tax-deep.service";

interface AuthenticatedRequest extends Request { user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string } }

const createPolicySchema = z.object({
  policyName: z.string().min(1), policyType: z.string().min(1), method: z.string().min(1),
  description: z.string().optional(), effectiveFrom: z.string().min(1), effectiveTo: z.string().optional(),
  currency: z.string().optional(), markupPercentage: z.number().optional(), documentationUrl: z.string().optional(),
});
const createAdjustmentSchema = z.object({
  policyId: z.string().min(1), adjustmentDate: z.string().min(1), fiscalYear: z.string().min(1),
  relatedPartyId: z.string().min(1), transactionType: z.string().min(1), originalAmount: z.number(),
  adjustedAmount: z.number(), reason: z.string().optional(), armLengthRange: z.string().optional(),
});
const createApportionmentSchema = z.object({
  fiscalYear: z.string().min(1), jurisdiction: z.string().min(1), factorType: z.string().min(1),
  numerator: z.number(), denominator: z.number(), sourceRef: z.string().optional(), notes: z.string().optional(),
});

@ApiTags("advanced-finance-global-tax")
@ApiBearerAuth()
@Controller("advanced-finance/global-tax")
@UseGuards(JwtAuthGuard, RbacGuard)
export class GlobalTaxDeepController {
  constructor(private readonly globalTaxService: GlobalTaxDeepService) {}

  @Get("transfer-pricing-policies")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "List transfer pricing policies" })
  async getPolicies(@Req() req: AuthenticatedRequest, @Query("isActive") isActive?: string) {
    const active = isActive !== undefined ? isActive === "true" : undefined;
    return this.globalTaxService.getTransferPricingPolicies(req.user.tenantId, active);
  }

  @Get("transfer-pricing-policies/:id")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get transfer pricing policy" })
  async getPolicyById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.getTransferPricingPolicyById(req.user.tenantId, id);
  }

  @Post("transfer-pricing-policies")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Create transfer pricing policy" })
  async createPolicy(@Req() req: AuthenticatedRequest, @ZodBody(createPolicySchema) dto: any) {
    return this.globalTaxService.createTransferPricingPolicy(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("transfer-pricing-policies/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Update transfer pricing policy" })
  async updatePolicy(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createPolicySchema.partial()) dto: any) {
    return this.globalTaxService.updateTransferPricingPolicy(req.user.tenantId, id, dto);
  }

  @Delete("transfer-pricing-policies/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Delete transfer pricing policy" })
  async deletePolicy(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.deleteTransferPricingPolicy(req.user.tenantId, id);
  }

  @Post("transfer-pricing-policies/:id/approve")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Approve transfer pricing policy" })
  async approvePolicy(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.approveTransferPricingPolicy(req.user.tenantId, id, req.user.userId);
  }

  @Get("transfer-pricing-policies/by-method/:method")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get policies by method" })
  async getPoliciesByMethod(@Req() req: AuthenticatedRequest, @Param("method") method: string) {
    return this.globalTaxService.getPoliciesByMethod(req.user.tenantId, method);
  }

  @Get("transfer-pricing-policies/by-type/:policyType")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get policies by type" })
  async getPoliciesByType(@Req() req: AuthenticatedRequest, @Param("policyType") policyType: string) {
    return this.globalTaxService.getPoliciesByType(req.user.tenantId, policyType);
  }

  @Get("transfer-pricing-adjustments")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "List transfer pricing adjustments" })
  async getAdjustments(@Req() req: AuthenticatedRequest, @Query("fiscalYear") fiscalYear?: string, @Query("policyId") policyId?: string) {
    return this.globalTaxService.getTransferPricingAdjustments(req.user.tenantId, fiscalYear, policyId);
  }

  @Get("transfer-pricing-adjustments/:id")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get adjustment by ID" })
  async getAdjustmentById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.getTransferPricingAdjustmentById(req.user.tenantId, id);
  }

  @Post("transfer-pricing-adjustments")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Create transfer pricing adjustment" })
  async createAdjustment(@Req() req: AuthenticatedRequest, @ZodBody(createAdjustmentSchema) dto: any) {
    return this.globalTaxService.createTransferPricingAdjustment(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("transfer-pricing-adjustments/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Update transfer pricing adjustment" })
  async updateAdjustment(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createAdjustmentSchema.partial()) dto: any) {
    return this.globalTaxService.updateTransferPricingAdjustment(req.user.tenantId, id, dto);
  }

  @Post("transfer-pricing-adjustments/:id/review")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Review transfer pricing adjustment" })
  async reviewAdjustment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.reviewTransferPricingAdjustment(req.user.tenantId, id, req.user.userId);
  }

  @Post("transfer-pricing-adjustments/:id/approve")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Approve transfer pricing adjustment" })
  async approveAdjustment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.approveTransferPricingAdjustment(req.user.tenantId, id, req.user.userId);
  }

  @Post("transfer-pricing-adjustments/:id/post")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Post transfer pricing adjustment" })
  async postAdjustment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.postTransferPricingAdjustment(req.user.tenantId, id);
  }

  @Delete("transfer-pricing-adjustments/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Delete transfer pricing adjustment" })
  async deleteAdjustment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.deleteTransferPricingAdjustment(req.user.tenantId, id);
  }

  @Get("transfer-pricing-adjustments/by-policy/:policyId")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get adjustments by policy" })
  async getAdjustmentsByPolicy(@Req() req: AuthenticatedRequest, @Param("policyId") policyId: string) {
    return this.globalTaxService.getAdjustmentsByPolicy(req.user.tenantId, policyId);
  }

  @Post("transfer-pricing-adjustments/:id/compute-arm-length")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Compute arm's length range" })
  async computeArmLength(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.computeArmLengthRange(req.user.tenantId, id);
  }

  @Get("apportionment-factors")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "List apportionment factors" })
  async getApportionmentFactors(@Req() req: AuthenticatedRequest, @Query("fiscalYear") fiscalYear?: string, @Query("jurisdiction") jurisdiction?: string) {
    return this.globalTaxService.getApportionmentFactors(req.user.tenantId, fiscalYear, jurisdiction);
  }

  @Get("apportionment-factors/:id")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get apportionment factor by ID" })
  async getApportionmentFactorById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.getApportionmentFactorById(req.user.tenantId, id);
  }

  @Post("apportionment-factors")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Create apportionment factor" })
  async createApportionmentFactor(@Req() req: AuthenticatedRequest, @ZodBody(createApportionmentSchema) dto: any) {
    return this.globalTaxService.createApportionmentFactor(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("apportionment-factors/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Update apportionment factor" })
  async updateApportionmentFactor(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createApportionmentSchema.partial()) dto: any) {
    return this.globalTaxService.updateApportionmentFactor(req.user.tenantId, id, dto);
  }

  @Post("apportionment-factors/:id/finalize")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Finalize apportionment factor" })
  async finalizeApportionmentFactor(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.finalizeApportionmentFactor(req.user.tenantId, id);
  }

  @Delete("apportionment-factors/:id")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Delete apportionment factor" })
  async deleteApportionmentFactor(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.globalTaxService.deleteApportionmentFactor(req.user.tenantId, id);
  }

  @Get("apportionment-factors/by-jurisdiction/:orgId/:fiscalYear/:jurisdiction")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get factors by jurisdiction" })
  async getFactorsByJurisdiction(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("fiscalYear") fiscalYear: string, @Param("jurisdiction") jurisdiction: string) {
    return this.globalTaxService.getFactorsByJurisdiction(req.user.tenantId, orgId, fiscalYear, jurisdiction);
  }

  @Post("compute-effective-apportionment/:orgId/:fiscalYear")
  @Permissions("finance.tax-nexus.manage")
  @ApiOperation({ summary: "Compute effective apportionment" })
  async computeEffectiveApportionment(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("fiscalYear") fiscalYear: string) {
    return this.globalTaxService.computeEffectiveApportionment(req.user.tenantId, orgId, fiscalYear);
  }

  @Get("dashboard/:orgId")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get tax compliance dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.globalTaxService.getTaxComplianceDashboard(req.user.tenantId, orgId);
  }

  @Get("transfer-pricing-summary/:orgId/:fiscalYear")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get transfer pricing summary" })
  async getTransferPricingSummary(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("fiscalYear") fiscalYear: string) {
    return this.globalTaxService.getTransferPricingSummary(req.user.tenantId, orgId, fiscalYear);
  }

  @Get("multi-state-return-summary/:orgId/:fiscalYear")
  @Permissions("finance.tax-nexus.read")
  @ApiOperation({ summary: "Get multi-state return summary" })
  async getMultiStateSummary(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("fiscalYear") fiscalYear: string) {
    return this.globalTaxService.getMultiStateReturnSummary(req.user.tenantId, orgId, fiscalYear);
  }
}
