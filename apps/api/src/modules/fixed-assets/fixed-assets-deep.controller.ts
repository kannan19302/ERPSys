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
import { AssetInsuranceService } from "./asset-insurance.service";
import { AssetRevaluationService } from "./asset-revaluation.service";
import { AssetPhysicalAuditService } from "./asset-physical-audit.service";
import { AssetWarrantyService } from "./asset-warranty.service";
import { AssetComponentService } from "./asset-component.service";
import { AssetImpairmentService } from "./asset-impairment.service";
import { AssetConditionService } from "./asset-condition.service";
import { AssetUtilizationService } from "./asset-utilization.service";
import { AssetGroupService } from "./asset-group.service";
import { AssetBudgetService } from "./asset-budget.service";
import { AssetDocumentService } from "./asset-document.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

const createInsuranceSchema = z.object({
  policyNo: z.string().min(1),
  insurer: z.string().min(1),
  coverageAmount: z.number().nonnegative(),
  premiumAmount: z.number().nonnegative(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
const updateInsuranceSchema = z.object({
  coverageAmount: z.number().nonnegative().optional(),
  premiumAmount: z.number().nonnegative().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});
const createRevaluationSchema = z.object({
  oldValue: z.number(),
  newValue: z.number(),
  reason: z.string().min(1),
  revaluedAt: z.string().optional(),
});
const createAuditSchema = z.object({
  assetId: z.string().min(1),
  auditName: z.string().min(1),
  expectedLocation: z.string().min(1),
  foundLocation: z.string().min(1),
  condition: z.enum(["GOOD", "DAMAGED", "MISSING"]),
  auditedBy: z.string().min(1),
  auditedAt: z.string().optional(),
});
const createWarrantySchema = z.object({
  warrantyProvider: z.string().min(1),
  warrantyType: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  coverageDetails: z.string().optional(),
  contractValue: z.number().optional(),
  claimPhone: z.string().optional(),
  claimEmail: z.string().optional(),
});
const fileClaimSchema = z.object({
  claimDate: z.string().min(1),
  description: z.string().min(1),
  claimAmount: z.number().nonnegative(),
});
const updateClaimSchema = z.object({
  status: z.string().min(1),
  approvedAmount: z.number().optional(),
  resolution: z.string().optional(),
});
const addComponentSchema = z.object({
  name: z.string().min(1),
  serialNo: z.string().optional(),
  partNo: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  unitCost: z.number().optional(),
  installedAt: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});
const replaceComponentSchema = z.object({
  newSerialNo: z.string().optional(),
  cost: z.number().optional(),
  reason: z.string().optional(),
  performedBy: z.string().optional(),
});
const createImpairmentSchema = z.object({
  impairmentDate: z.string().min(1),
  carryingAmount: z.number().nonnegative(),
  recoverableAmount: z.number().nonnegative(),
  impairmentType: z.string().optional(),
  reason: z.string().min(1),
  approvedBy: z.string().optional(),
});
const createAssessmentSchema = z.object({
  assessmentDate: z.string().min(1),
  conditionScore: z.number().int().min(1).max(10),
  conditionRating: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"]),
  assessedBy: z.string().min(1),
  notes: z.string().optional(),
  remainingLifeEstimate: z.number().int().optional(),
  replacementCostEstimate: z.number().optional(),
  nextAssessmentDate: z.string().optional(),
});
const recordMetricSchema = z.object({
  metricDate: z.string().min(1),
  metricType: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
});
const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const updateGroupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const createAllocationSchema = z.object({
  fiscalYear: z.number().int(),
  categoryId: z.string().optional(),
  allocatedAmount: z.number().nonnegative(),
  notes: z.string().optional(),
});
const updateAllocationSchema = z.object({
  allocatedAmount: z.number().optional(),
  spentAmount: z.number().optional(),
  notes: z.string().optional(),
});
const uploadDocSchema = z.object({
  documentType: z.string().min(1),
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().optional(),
  uploadedBy: z.string().optional(),
});

@ApiTags("fixed-assets-deep")
@ApiBearerAuth()
@Controller("fixed-assets")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FixedAssetsDeepController {
  constructor(
    private readonly insuranceService: AssetInsuranceService,
    private readonly revaluationService: AssetRevaluationService,
    private readonly auditService: AssetPhysicalAuditService,
    private readonly warrantyService: AssetWarrantyService,
    private readonly componentService: AssetComponentService,
    private readonly impairmentService: AssetImpairmentService,
    private readonly conditionService: AssetConditionService,
    private readonly utilizationService: AssetUtilizationService,
    private readonly groupService: AssetGroupService,
    private readonly budgetService: AssetBudgetService,
    private readonly documentService: AssetDocumentService,
  ) {}

  // Insurance
  @Get(":assetId/insurance")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List insurance policies for asset" })
  async getPolicies(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.insuranceService.getPolicies(req.user.tenantId, assetId);
  }

  @Post(":assetId/insurance")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create insurance policy for asset" })
  async createPolicy(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(createInsuranceSchema) body: any,
  ) {
    return this.insuranceService.createPolicy(req.user.tenantId, assetId, body);
  }

  @Put("insurance/:id")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Update insurance policy" })
  async updatePolicy(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateInsuranceSchema) body: any,
  ) {
    return this.insuranceService.updatePolicy(req.user.tenantId, id, body);
  }

  @Get("insurance/stats")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get insurance policy statistics" })
  async getInsuranceStats(@Req() req: AuthReq) {
    return this.insuranceService.getPolicyStats(req.user.tenantId);
  }

  @Post("insurance/expire")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Expire all overdue insurance policies" })
  async expirePolicies(@Req() req: AuthReq) {
    return this.insuranceService.expirePolicies(req.user.tenantId);
  }

  // Revaluations
  @Get(":assetId/revaluations")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List revaluations for asset" })
  async getRevaluations(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
  ) {
    return this.revaluationService.getRevaluations(req.user.tenantId, assetId);
  }

  @Post(":assetId/revaluations")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create asset revaluation" })
  async createRevaluation(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(createRevaluationSchema) body: any,
  ) {
    return this.revaluationService.createRevaluation(
      req.user.tenantId,
      assetId,
      req.user.userId,
      body,
    );
  }

  @Get("revaluations/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get revaluation summary" })
  async getRevalSummary(@Req() req: AuthReq) {
    return this.revaluationService.getRevaluationSummary(req.user.tenantId);
  }

  // Physical Audits
  @Get(":assetId/audits")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List physical audits for asset" })
  async getAudits(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.auditService.getAudits(req.user.tenantId, assetId);
  }

  @Post("audits")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create physical audit record" })
  async createAudit(
    @Req() req: AuthReq,
    @ZodBody(createAuditSchema) body: any,
  ) {
    return this.auditService.createAudit(req.user.tenantId, body);
  }

  @Get("audits/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get physical audit summary" })
  async getAuditSummary(@Req() req: AuthReq) {
    return this.auditService.getAuditSummary(req.user.tenantId);
  }

  // Warranties
  @Get(":assetId/warranties")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List warranties for asset" })
  async getWarranties(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.warrantyService.getWarranties(req.user.tenantId, assetId);
  }

  @Post(":assetId/warranties")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create warranty for asset" })
  async createWarranty(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(createWarrantySchema) body: any,
  ) {
    return this.warrantyService.createWarranty(
      req.user.tenantId,
      assetId,
      body,
    );
  }

  @Post("warranties/:warrantyId/claims")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "File warranty claim" })
  async fileClaim(
    @Req() req: AuthReq,
    @Param("warrantyId") warrantyId: string,
    @ZodBody(fileClaimSchema) body: any,
  ) {
    return this.warrantyService.fileClaim(req.user.tenantId, warrantyId, body);
  }

  @Put("warranty-claims/:claimId")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Update warranty claim status" })
  async updateClaim(
    @Req() req: AuthReq,
    @Param("claimId") claimId: string,
    @ZodBody(updateClaimSchema) body: any,
  ) {
    return this.warrantyService.updateClaimStatus(
      req.user.tenantId,
      claimId,
      body,
    );
  }

  @Get("warranties/claims")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List all warranty claims" })
  async getClaims(
    @Req() req: AuthReq,
    @Query("warrantyId") warrantyId?: string,
  ) {
    return this.warrantyService.getWarrantyClaims(
      req.user.tenantId,
      warrantyId,
    );
  }

  @Post("warranties/expire")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Expire overdue warranties" })
  async expireWarranties(@Req() req: AuthReq) {
    return this.warrantyService.expireWarranties(req.user.tenantId);
  }

  // Components
  @Get(":assetId/components")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List components for asset" })
  async getComponents(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.componentService.getComponents(req.user.tenantId, assetId);
  }

  @Post(":assetId/components")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Add component to asset" })
  async addComponent(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(addComponentSchema) body: any,
  ) {
    return this.componentService.addComponent(req.user.tenantId, assetId, body);
  }

  @Post("components/:componentId/replace")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Replace component" })
  async replaceComponent(
    @Req() req: AuthReq,
    @Param("componentId") componentId: string,
    @ZodBody(replaceComponentSchema) body: any,
  ) {
    return this.componentService.replaceComponent(
      req.user.tenantId,
      componentId,
      body,
    );
  }

  @Post("components/:componentId/retire")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Retire component" })
  async retireComponent(
    @Req() req: AuthReq,
    @Param("componentId") componentId: string,
  ) {
    return this.componentService.retireComponent(
      req.user.tenantId,
      componentId,
    );
  }

  @Get("components/:componentId/replacements")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get replacement history for component" })
  async getReplacements(
    @Req() req: AuthReq,
    @Param("componentId") componentId: string,
  ) {
    return this.componentService.getReplacements(
      req.user.tenantId,
      componentId,
    );
  }

  @Get(":assetId/components/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get component summary for asset" })
  async getComponentSummary(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
  ) {
    return this.componentService.getComponentSummary(
      req.user.tenantId,
      assetId,
    );
  }

  // Impairments
  @Get(":assetId/impairments")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List impairments for asset" })
  async getImpairments(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.impairmentService.getImpairments(req.user.tenantId, assetId);
  }

  @Post(":assetId/impairments")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Record impairment for asset" })
  async createImpairment(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(createImpairmentSchema) body: any,
  ) {
    return this.impairmentService.createImpairment(
      req.user.tenantId,
      assetId,
      req.user.userId,
      body,
    );
  }

  @Get("impairments/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get impairment summary" })
  async getImpairmentSummary(@Req() req: AuthReq) {
    return this.impairmentService.getImpairmentSummary(req.user.tenantId);
  }

  // Condition Assessments
  @Get(":assetId/assessments")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List condition assessments for asset" })
  async getAssessments(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.conditionService.getAssessments(req.user.tenantId, assetId);
  }

  @Post(":assetId/assessments")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create condition assessment" })
  async createAssessment(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(createAssessmentSchema) body: any,
  ) {
    return this.conditionService.createAssessment(
      req.user.tenantId,
      assetId,
      body,
    );
  }

  @Get("assessments/latest")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get latest condition assessments for all assets" })
  async getLatestAssessments(@Req() req: AuthReq) {
    return this.conditionService.getLatestAssessments(req.user.tenantId);
  }

  @Get("assessments/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get condition assessment summary" })
  async getConditionSummary(@Req() req: AuthReq) {
    return this.conditionService.getConditionSummary(req.user.tenantId);
  }

  // Utilization Metrics
  @Get(":assetId/utilization")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List utilization metrics for asset" })
  async getUtilization(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @Query("metricType") metricType?: string,
  ) {
    return this.utilizationService.getMetrics(
      req.user.tenantId,
      assetId,
      metricType,
    );
  }

  @Post(":assetId/utilization")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Record utilization metric" })
  async recordMetric(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(recordMetricSchema) body: any,
  ) {
    return this.utilizationService.recordMetric(
      req.user.tenantId,
      assetId,
      body,
    );
  }

  @Get(":assetId/utilization/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get utilization summary for asset" })
  async getUtilSummary(@Req() req: AuthReq, @Param("assetId") assetId: string) {
    return this.utilizationService.getAssetUtilizationSummary(
      req.user.tenantId,
      assetId,
    );
  }

  // Groups
  @Get("groups")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List asset groups" })
  async getGroups(@Req() req: AuthReq) {
    return this.groupService.getGroups(req.user.tenantId);
  }

  @Post("groups")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create asset group" })
  async createGroup(
    @Req() req: AuthReq,
    @ZodBody(createGroupSchema) body: any,
  ) {
    return this.groupService.createGroup(req.user.tenantId, body);
  }

  @Put("groups/:id")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Update asset group" })
  async updateGroup(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateGroupSchema) body: any,
  ) {
    return this.groupService.updateGroup(req.user.tenantId, id, body);
  }

  @Delete("groups/:id")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Delete asset group" })
  async deleteGroup(@Req() req: AuthReq, @Param("id") id: string) {
    return this.groupService.deleteGroup(req.user.tenantId, id);
  }

  @Post("groups/:groupId/assets/:assetId")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Add asset to group" })
  async addToGroup(
    @Req() req: AuthReq,
    @Param("groupId") groupId: string,
    @Param("assetId") assetId: string,
  ) {
    return this.groupService.addAssetToGroup(
      req.user.tenantId,
      groupId,
      assetId,
    );
  }

  @Delete("groups/:groupId/assets/:assetId")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Remove asset from group" })
  async removeFromGroup(
    @Req() req: AuthReq,
    @Param("groupId") groupId: string,
    @Param("assetId") assetId: string,
  ) {
    return this.groupService.removeAssetFromGroup(
      req.user.tenantId,
      groupId,
      assetId,
    );
  }

  @Get("groups/:id/assets")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List assets in group" })
  async getGroupAssets(@Req() req: AuthReq, @Param("id") id: string) {
    return this.groupService.getGroupAssets(req.user.tenantId, id);
  }

  // Budget Allocations
  @Get("budget-allocations")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List budget allocations" })
  async getAllocations(
    @Req() req: AuthReq,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.budgetService.getAllocations(
      req.user.tenantId,
      fiscalYear ? parseInt(fiscalYear) : undefined,
    );
  }

  @Post("budget-allocations")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Create budget allocation" })
  async createAllocation(
    @Req() req: AuthReq,
    @ZodBody(createAllocationSchema) body: any,
  ) {
    if (!req.user.orgId) throw new Error("User session missing orgId");
    return this.budgetService.createAllocation(
      req.user.tenantId,
      req.user.orgId,
      body,
    );
  }

  @Put("budget-allocations/:id")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Update budget allocation" })
  async updateAllocation(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateAllocationSchema) body: any,
  ) {
    return this.budgetService.updateAllocation(req.user.tenantId, id, body);
  }

  @Get("budget-allocations/summary")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "Get budget summary" })
  async getBudgetSummary(
    @Req() req: AuthReq,
    @Query("fiscalYear") fiscalYear?: string,
  ) {
    return this.budgetService.getBudgetSummary(
      req.user.tenantId,
      fiscalYear ? parseInt(fiscalYear) : undefined,
    );
  }

  // Documents
  @Get(":assetId/documents")
  @Permissions("finance.fixed-asset.read")
  @ApiOperation({ summary: "List documents for asset" })
  async getDocuments(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @Query("documentType") documentType?: string,
  ) {
    return this.documentService.getDocuments(
      req.user.tenantId,
      assetId,
      documentType,
    );
  }

  @Post(":assetId/documents")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Upload document for asset" })
  async uploadDocument(
    @Req() req: AuthReq,
    @Param("assetId") assetId: string,
    @ZodBody(uploadDocSchema) body: any,
  ) {
    return this.documentService.uploadDocument(
      req.user.tenantId,
      assetId,
      body,
    );
  }

  @Delete("documents/:id")
  @Permissions("finance.fixed-asset.create")
  @ApiOperation({ summary: "Delete document" })
  async deleteDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.documentService.deleteDocument(req.user.tenantId, id);
  }
}
