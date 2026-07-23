import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Asc606DeepService } from "./services/asc606-deep.service";

interface AuthenticatedRequest extends Request { user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string } }

const createPerformanceObligationSchema = z.object({
  contractRef: z.string().optional(), description: z.string().min(1), transactionPrice: z.number().positive(),
  ssp: z.number().positive().optional(), obligationType: z.string().min(1), satisfactionTiming: z.string().min(1),
  satisfactionMethod: z.string().optional(), startDate: z.string().min(1), endDate: z.string().optional(),
});
const updateObligationSchema = z.object({
  description: z.string().optional(), transactionPrice: z.number().positive().optional(),
  ssp: z.number().positive().optional(), satisfactionTiming: z.string().optional(),
  satisfactionMethod: z.string().optional(), endDate: z.string().optional(),
});
const createContractModSchema = z.object({
  contractRef: z.string().min(1), modNumber: z.string().min(1), modificationDate: z.string().min(1),
  modType: z.string().min(1), originalConsideration: z.number(), modifiedConsideration: z.number(),
  accountingMethod: z.string().min(1), notes: z.string().optional(),
});
const createRollForwardSchema = z.object({
  period: z.string().min(1), openingBalance: z.number(), additions: z.number(), recognized: z.number(),
  writeOffs: z.number().optional(),
});
const allocatePriceSchema = z.object({ contractRef: z.string().min(1) });

@ApiTags("advanced-finance-asc606")
@ApiBearerAuth()
@Controller("advanced-finance/asc606")
@UseGuards(JwtAuthGuard, RbacGuard)
export class Asc606DeepController {
  constructor(private readonly asc606Service: Asc606DeepService) {}

  @Get("performance-obligations")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "List performance obligations" })
  async getPerformanceObligations(@Req() req: AuthenticatedRequest, @Query("status") status?: string) {
    return this.asc606Service.getPerformanceObligations(req.user.tenantId, status);
  }

  @Get("performance-obligations/:id")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get performance obligation by ID" })
  async getPerformanceObligationById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.getPerformanceObligationById(req.user.tenantId, id);
  }

  @Post("performance-obligations")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Create performance obligation" })
  async createPerformanceObligation(@Req() req: AuthenticatedRequest, @ZodBody(createPerformanceObligationSchema) dto: any) {
    return this.asc606Service.createPerformanceObligation(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("performance-obligations/:id")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Update performance obligation" })
  async updatePerformanceObligation(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(updateObligationSchema) dto: any) {
    return this.asc606Service.updatePerformanceObligation(req.user.tenantId, id, dto);
  }

  @Delete("performance-obligations/:id")
  @Permissions("finance.revenue.delete")
  @ApiOperation({ summary: "Delete performance obligation" })
  async deletePerformanceObligation(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.deletePerformanceObligation(req.user.tenantId, id);
  }

  @Post("performance-obligations/:id/satisfy")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Mark obligation as satisfied" })
  async satisfyObligation(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ satisfiedDate: z.string().optional() })) dto: any) {
    return this.asc606Service.satisfyPerformanceObligation(req.user.tenantId, id, dto.satisfiedDate);
  }

  @Post("performance-obligations/:id/partial-satisfy")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Partially satisfy obligation" })
  async partialSatisfy(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ recognizedAmount: z.number().positive() })) dto: any) {
    return this.asc606Service.partiallySatisfyPerformanceObligation(req.user.tenantId, id, dto.recognizedAmount);
  }

  @Post("allocate-transaction-price")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Allocate transaction price across obligations" })
  async allocatePrice(@Req() req: AuthenticatedRequest, @ZodBody(allocatePriceSchema) dto: any) {
    return this.asc606Service.allocateTransactionPrice(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto.contractRef);
  }

  @Get("obligations/by-contract/:contractRef")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get obligations by contract" })
  async getObligationsByContract(@Req() req: AuthenticatedRequest, @Param("contractRef") contractRef: string) {
    return this.asc606Service.getObligationsByContract(req.user.tenantId, contractRef);
  }

  @Get("obligations/hierarchy/:parentId")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get obligation hierarchy" })
  async getObligationHierarchy(@Req() req: AuthenticatedRequest, @Param("parentId") parentId: string) {
    return this.asc606Service.getObligationHierarchy(req.user.tenantId, parentId);
  }

  @Get("contract-modifications")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "List contract modifications" })
  async getContractModifications(@Req() req: AuthenticatedRequest, @Query("contractRef") contractRef?: string) {
    return this.asc606Service.getContractModifications(req.user.tenantId, contractRef);
  }

  @Get("contract-modifications/:id")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get contract modification by ID" })
  async getContractModificationById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.getContractModificationById(req.user.tenantId, id);
  }

  @Post("contract-modifications")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Create contract modification" })
  async createContractModification(@Req() req: AuthenticatedRequest, @ZodBody(createContractModSchema) dto: any) {
    return this.asc606Service.createContractModification(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("contract-modifications/:id")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Update contract modification" })
  async updateContractModification(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createContractModSchema.partial()) dto: any) {
    return this.asc606Service.updateContractModification(req.user.tenantId, id, dto);
  }

  @Post("contract-modifications/:id/approve")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Approve contract modification" })
  async approveContractModification(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.approveContractModification(req.user.tenantId, id, req.user.userId);
  }

  @Post("contract-modifications/:id/apply")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Apply contract modification" })
  async applyContractModification(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.applyContractModification(req.user.tenantId, id);
  }

  @Delete("contract-modifications/:id")
  @Permissions("finance.revenue.delete")
  @ApiOperation({ summary: "Delete contract modification" })
  async deleteContractModification(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.deleteContractModification(req.user.tenantId, id);
  }

  @Get("contract-modifications/by-contract/:contractRef")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get modifications by contract" })
  async getModsByContract(@Req() req: AuthenticatedRequest, @Param("contractRef") contractRef: string) {
    return this.asc606Service.getModificationsByContract(req.user.tenantId, contractRef);
  }

  @Post("contract-modifications/:id/compute-catch-up")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Compute cumulative catch-up" })
  async computeCatchUp(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.computeCumulativeCatchUp(req.user.tenantId, id);
  }

  @Get("deferred-revenue-roll-forwards")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "List deferred revenue roll-forwards" })
  async getRollForwards(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.asc606Service.getDeferredRevenueRollForwards(req.user.tenantId, period);
  }

  @Get("deferred-revenue-roll-forwards/:id")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get roll-forward by ID" })
  async getRollForwardById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.getDeferredRevenueRollForwardById(req.user.tenantId, id);
  }

  @Post("deferred-revenue-roll-forwards")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Create deferred revenue roll-forward" })
  async createRollForward(@Req() req: AuthenticatedRequest, @ZodBody(createRollForwardSchema) dto: any) {
    return this.asc606Service.createDeferredRevenueRollForward(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("deferred-revenue-roll-forwards/:id")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Update deferred revenue roll-forward" })
  async updateRollForward(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createRollForwardSchema.partial()) dto: any) {
    return this.asc606Service.updateDeferredRevenueRollForward(req.user.tenantId, id, dto);
  }

  @Post("deferred-revenue-roll-forwards/:id/finalize")
  @Permissions("finance.revenue.update")
  @ApiOperation({ summary: "Finalize roll-forward" })
  async finalizeRollForward(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.finalizeRollForward(req.user.tenantId, id);
  }

  @Delete("deferred-revenue-roll-forwards/:id")
  @Permissions("finance.revenue.delete")
  @ApiOperation({ summary: "Delete roll-forward" })
  async deleteRollForward(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.asc606Service.deleteDeferredRevenueRollForward(req.user.tenantId, id);
  }

  @Get("deferred-revenue-roll-forwards/by-period/:orgId/:period")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get roll-forward by org & period" })
  async getRollForwardByPeriod(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("period") period: string) {
    return this.asc606Service.getRollForwardByPeriod(req.user.tenantId, orgId, period);
  }

  @Post("compute-roll-forward/:orgId/:period")
  @Permissions("finance.revenue.create")
  @ApiOperation({ summary: "Compute roll-forward from schedules" })
  async computeRollForward(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("period") period: string) {
    return this.asc606Service.computeRollForwardFromSchedules(req.user.tenantId, orgId, period);
  }

  @Get("multi-element-summary")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get multi-element arrangement summary" })
  async getMultiElementSummary(@Req() req: AuthenticatedRequest, @Query("contractRef") contractRef?: string) {
    return this.asc606Service.getMultiElementSummary(req.user.tenantId, contractRef);
  }

  @Get("variable-consideration/:contractRef")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get variable consideration estimate" })
  async getVariableConsideration(@Req() req: AuthenticatedRequest, @Param("contractRef") contractRef: string) {
    return this.asc606Service.getVariableConsiderationEstimate(req.user.tenantId, contractRef);
  }

  @Get("revenue-aging/:orgId")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get revenue aging report" })
  async getRevenueAging(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.asc606Service.getRevenueAging(req.user.tenantId, orgId);
  }

  @Get("revenue-forecast/:orgId")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get revenue forecast" })
  async getRevenueForecast(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Query("months") months?: string) {
    return this.asc606Service.getRevenueForecast(req.user.tenantId, orgId, months ? parseInt(months) : 12);
  }

  @Get("contract-summary/:contractRef")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get contract revenue summary" })
  async getContractSummary(@Req() req: AuthenticatedRequest, @Param("contractRef") contractRef: string) {
    return this.asc606Service.getContractRevenueSummary(req.user.tenantId, contractRef);
  }

  @Get("dashboard/:orgId")
  @Permissions("finance.revenue.read")
  @ApiOperation({ summary: "Get ASC 606 dashboard" })
  async getAsc606Dashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.asc606Service.getAsc606Dashboard(req.user.tenantId, orgId);
  }
}
