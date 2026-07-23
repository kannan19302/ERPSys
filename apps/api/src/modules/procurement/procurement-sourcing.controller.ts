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
import { ProcurementSourcingService } from "./procurement-sourcing.service";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const createSourcingProjectSchema = z.object({
  projectNumber: z.string().min(1), projectName: z.string().min(1),
  description: z.string().optional(), projectType: z.string().optional(),
  category: z.string().optional(), estimatedValue: z.number().optional(),
  currency: z.string().optional(), startDate: z.string().optional(),
  targetDate: z.string().optional(), buyerId: z.string().optional(),
  expectedSavings: z.number().optional(), notes: z.string().optional(),
  participants: z.array(z.object({ vendorId: z.string(), vendorName: z.string().optional() })).optional(),
});

const createEvaluationSchema = z.object({
  projectId: z.string(), vendorId: z.string(), vendorName: z.string().optional(),
  evaluationDate: z.string().optional(),
  criteria: z.array(z.object({ criterionName: z.string(), weight: z.number().positive(), score: z.number().min(0).max(100).optional(), comments: z.string().optional() })),
});

const createBidAnalysisSchema = z.object({
  projectId: z.string(), bids: z.array(z.object({ vendorId: z.string(), vendorName: z.string().optional(), amount: z.number().optional() })),
  currency: z.string().optional(), awardRecommendation: z.string().optional(), notes: z.string().optional(),
});

const createContractSchema = z.object({
  contractNumber: z.string().min(1), contractName: z.string().min(1),
  contractType: z.string().optional(), vendorId: z.string(), vendorName: z.string().optional(),
  buyerId: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(),
  autoRenew: z.boolean().optional(), autoRenewNoticeDays: z.number().int().optional(),
  contractValue: z.number().optional(), currency: z.string().optional(),
  maximumValue: z.number().optional(), estimatedAnnualValue: z.number().optional(),
  paymentTerms: z.string().optional(), deliveryTerms: z.string().optional(),
  governingLaw: z.string().optional(), notes: z.string().optional(),
  priceSchedules: z.array(z.object({ productId: z.string().optional(), productSku: z.string().optional(), productName: z.string().optional(), negotiatedPrice: z.number().positive(), currency: z.string().optional(), priceType: z.string().optional(), minQty: z.number().optional(), maxQty: z.number().optional(), effectiveDate: z.string(), expirationDate: z.string().optional() })).optional(),
  volumeCommitments: z.array(z.object({ productId: z.string().optional(), productSku: z.string().optional(), committedQty: z.number().positive(), commitmentPeriod: z.string(), startDate: z.string(), endDate: z.string(), uom: z.string().optional(), rebateRate: z.number().optional(), penaltyRate: z.number().optional() })).optional(),
});

const createOnboardingSchema = z.object({
  vendorId: z.string(), vendorName: z.string().optional(), taxId: z.string().optional(),
  notes: z.string().optional(), assignedTo: z.string().optional(),
  documents: z.any().optional(), bankInfo: z.any().optional(), insuranceInfo: z.any().optional(),
});

@ApiTags("procurement / sourcing")
@ApiBearerAuth()
@Controller("procurement")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(ChangeHistoryInterceptor)
export class ProcurementSourcingController {
  constructor(private readonly sourcingSvc: ProcurementSourcingService) {}

  @Get("sourcing-projects")
  @Permissions("procurement.sourcing.read")
  @ApiOperation({ summary: "List sourcing projects" })
  listProjects(@Req() req: AuthRequest, @Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string) {
    return this.sourcingSvc.getSourcingProjects(req.user.tenantId, { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined, status });
  }

  @Get("sourcing-projects/:id")
  @Permissions("procurement.sourcing.read")
  @ApiOperation({ summary: "Get sourcing project by id" })
  getProject(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.sourcingSvc.getSourcingProjectById(req.user.tenantId, id);
  }

  @Post("sourcing-projects")
  @Permissions("procurement.sourcing.create")
  @TrackChanges("SourcingProject")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a sourcing project" })
  createProject(@Req() req: AuthRequest, @ZodBody(createSourcingProjectSchema) body: z.infer<typeof createSourcingProjectSchema>) {
    return this.sourcingSvc.createSourcingProject(req.user.tenantId, body, req.user.userId);
  }

  @Patch("sourcing-projects/:id")
  @Permissions("procurement.sourcing.update")
  @TrackChanges("SourcingProject", "id")
  @ApiOperation({ summary: "Update a sourcing project" })
  updateProject(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ projectName: z.string().optional(), description: z.string().optional(), status: z.string().optional(), estimatedValue: z.number().optional(), actualValue: z.number().optional() })) body: any) {
    return this.sourcingSvc.updateSourcingProject(req.user.tenantId, id, body);
  }

  @Post("supplier-evaluations")
  @Permissions("procurement.sourcing.evaluate")
  @TrackChanges("SupplierEvaluation")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a supplier evaluation with criteria" })
  createEvaluation(@Req() req: AuthRequest, @ZodBody(createEvaluationSchema) body: z.infer<typeof createEvaluationSchema>) {
    return this.sourcingSvc.createSupplierEvaluation(req.user.tenantId, body);
  }

  @Post("bid-analyses")
  @Permissions("procurement.sourcing.read")
  @TrackChanges("BidAnalysis")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a bid analysis for a sourcing project" })
  createBidAnalysis(@Req() req: AuthRequest, @ZodBody(createBidAnalysisSchema) body: z.infer<typeof createBidAnalysisSchema>) {
    return this.sourcingSvc.createBidAnalysis(req.user.tenantId, body);
  }

  @Post("contract-awards")
  @Permissions("procurement.sourcing.manage")
  @TrackChanges("ContractAward")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a contract award from a sourcing project" })
  createAward(@Req() req: AuthRequest, @ZodBody(z.object({ awardNumber: z.string(), projectId: z.string(), vendorId: z.string(), vendorName: z.string().optional(), awardAmount: z.number().optional(), currency: z.string().optional(), validUntil: z.string().optional(), termsSummary: z.string().optional() })) body: any) {
    return this.sourcingSvc.createContractAward(req.user.tenantId, body, req.user.userId);
  }

  @Get("contracts")
  @Permissions("procurement.contract.read")
  @ApiOperation({ summary: "List procurement contracts" })
  listContracts(@Req() req: AuthRequest, @Query("status") status?: string, @Query("vendorId") vendorId?: string) {
    return this.sourcingSvc.getContracts(req.user.tenantId, { status, vendorId });
  }

  @Get("contracts/:id")
  @Permissions("procurement.contract.read")
  @ApiOperation({ summary: "Get procurement contract by id" })
  getContract(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.sourcingSvc.getContractById(req.user.tenantId, id);
  }

  @Post("contracts")
  @Permissions("procurement.contract.create")
  @TrackChanges("ProcurementContract")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a procurement contract with price schedules and volume commitments" })
  createContract(@Req() req: AuthRequest, @ZodBody(createContractSchema) body: z.infer<typeof createContractSchema>) {
    return this.sourcingSvc.createContract(req.user.tenantId, body, req.user.userId);
  }

  @Patch("contracts/:id/status")
  @Permissions("procurement.contract.update")
  @TrackChanges("ProcurementContract", "id")
  @ApiOperation({ summary: "Update contract status" })
  updateContractStatus(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ status: z.string() })) body: { status: string }) {
    return this.sourcingSvc.updateContractStatus(req.user.tenantId, id, body.status);
  }

  @Post("contracts/:id/renew")
  @Permissions("procurement.contract.update")
  @TrackChanges("ProcurementContract", "id")
  @ApiOperation({ summary: "Renew a procurement contract" })
  renewContract(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.sourcingSvc.renewContract(req.user.tenantId, id);
  }

  @Get("procurement-intelligence")
  @Permissions("procurement.intelligence.read")
  @ApiOperation({ summary: "Get procurement intelligence reports" })
  getIntelligence(@Req() req: AuthRequest, @Query("category") category?: string) {
    return this.sourcingSvc.getProcurementIntelligence(req.user.tenantId, category);
  }

  @Post("procurement-intelligence/spend-analysis")
  @Permissions("procurement.intelligence.create")
  @TrackChanges("ProcurementIntelligence")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Generate spend analysis report" })
  generateSpendAnalysis(@Req() req: AuthRequest) {
    return this.sourcingSvc.generateSpendAnalysis(req.user.tenantId);
  }

  @Post("procurement-intelligence/supplier-concentration")
  @Permissions("procurement.intelligence.create")
  @TrackChanges("ProcurementIntelligence")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Generate supplier concentration analysis" })
  generateConcentration(@Req() req: AuthRequest) {
    return this.sourcingSvc.generateSupplierConcentration(req.user.tenantId);
  }

  @Get("supplier-onboarding")
  @Permissions("procurement.onboarding.read")
  @ApiOperation({ summary: "List supplier onboarding workflows" })
  listOnboarding(@Req() req: AuthRequest, @Query("status") status?: string) {
    return this.sourcingSvc.getOnboardingWorkflows(req.user.tenantId, { status });
  }

  @Post("supplier-onboarding")
  @Permissions("procurement.onboarding.create")
  @TrackChanges("SupplierOnboarding")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a supplier onboarding workflow" })
  createOnboarding(@Req() req: AuthRequest, @ZodBody(createOnboardingSchema) body: z.infer<typeof createOnboardingSchema>) {
    return this.sourcingSvc.createOnboardingWorkflow(req.user.tenantId, body, req.user.userId);
  }

  @Patch("supplier-onboarding/:id/step")
  @Permissions("procurement.onboarding.update")
  @TrackChanges("SupplierOnboarding", "id")
  @ApiOperation({ summary: "Advance an onboarding workflow step" })
  updateOnboardingStep(@Req() req: AuthRequest, @Param("id") id: string, @ZodBody(z.object({ step: z.string() })) body: { step: string }) {
    return this.sourcingSvc.updateOnboardingStep(req.user.tenantId, id, body.step);
  }
}
