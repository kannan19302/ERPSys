import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { resolveOrgId } from "../../common/utils/pagination.util";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { BudgetDeepService } from "./services/budget-deep.service";

interface AuthenticatedRequest extends Request { user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string } }

const createTemplateSchema = z.object({
  name: z.string().min(1), description: z.string().optional(), fiscalYear: z.string().min(1),
  basedOn: z.string().optional(), adjustmentPct: z.number().optional(), lines: z.any().optional(),
});
const createCommitmentSchema = z.object({
  budgetId: z.string().min(1), commitmentRef: z.string().min(1), commitmentType: z.string().min(1),
  description: z.string().optional(), amount: z.number().positive(), currency: z.string().optional(),
  commitmentDate: z.string().min(1), expectedLiquidationDate: z.string().optional(),
  sourceDocType: z.string().optional(), sourceDocId: z.string().optional(),
  accountId: z.string().optional(), costCenterId: z.string().optional(), projectId: z.string().optional(),
});
const createCarryForwardSchema = z.object({
  name: z.string().min(1), accountType: z.string().optional(), carryForwardPct: z.number().min(0).max(100),
  maxCarryAmount: z.number().optional(), expirationMonths: z.number().optional(),
  requiresApproval: z.boolean().optional(), effectiveFrom: z.string().min(1), effectiveTo: z.string().optional(),
});
const createRevisionSchema = z.object({
  budgetId: z.string().min(1), revisionNumber: z.string().optional(), revisionType: z.string().min(1),
  revisedAmount: z.number(), reason: z.string().optional(),
});

@ApiTags("advanced-finance-budget-deep")
@ApiBearerAuth()
@Controller("advanced-finance/budget-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class BudgetDeepController {
  constructor(private readonly budgetDeepService: BudgetDeepService) {}

  @Get("templates")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "List budget templates" })
  async getTemplates(@Req() req: AuthenticatedRequest, @Query("fiscalYear") fiscalYear?: string) {
    return this.budgetDeepService.getBudgetTemplates(req.user.tenantId, fiscalYear);
  }

  @Get("templates/:id")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get budget template by ID" })
  async getTemplateById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.getBudgetTemplateById(req.user.tenantId, id);
  }

  @Post("templates")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Create budget template" })
  async createTemplate(@Req() req: AuthenticatedRequest, @ZodBody(createTemplateSchema) dto: any) {
    return this.budgetDeepService.createBudgetTemplate(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("templates/:id")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Update budget template" })
  async updateTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createTemplateSchema.partial()) dto: any) {
    return this.budgetDeepService.updateBudgetTemplate(req.user.tenantId, id, dto);
  }

  @Delete("templates/:id")
  @Permissions("finance.budget.delete")
  @ApiOperation({ summary: "Delete budget template" })
  async deleteTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.deleteBudgetTemplate(req.user.tenantId, id);
  }

  @Post("templates/:id/activate")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Activate budget template" })
  async activateTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.activateBudgetTemplate(req.user.tenantId, id);
  }

  @Post("templates/:id/archive")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Archive budget template" })
  async archiveTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.archiveBudgetTemplate(req.user.tenantId, id);
  }

  @Post("templates/:id/generate")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Generate budgets from template" })
  async generateFromTemplate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.generateBudgetsFromTemplate(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), id);
  }

  @Get("commitments")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "List budget commitments" })
  async getCommitments(@Req() req: AuthenticatedRequest, @Query("budgetId") budgetId?: string, @Query("status") status?: string) {
    return this.budgetDeepService.getBudgetCommitments(req.user.tenantId, budgetId, status);
  }

  @Get("commitments/:id")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get budget commitment by ID" })
  async getCommitmentById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.getBudgetCommitmentById(req.user.tenantId, id);
  }

  @Post("commitments")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Create budget commitment" })
  async createCommitment(@Req() req: AuthenticatedRequest, @ZodBody(createCommitmentSchema) dto: any) {
    return this.budgetDeepService.createBudgetCommitment(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("commitments/:id")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Update budget commitment" })
  async updateCommitment(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createCommitmentSchema.partial()) dto: any) {
    return this.budgetDeepService.updateBudgetCommitment(req.user.tenantId, id, dto);
  }

  @Post("commitments/:id/liquidate")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Liquidate budget commitment" })
  async liquidateCommitment(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ liquidatedAmount: z.number().positive() })) dto: any) {
    return this.budgetDeepService.liquidateBudgetCommitment(req.user.tenantId, id, dto.liquidatedAmount);
  }

  @Post("commitments/:id/cancel")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Cancel budget commitment" })
  async cancelCommitment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.cancelBudgetCommitment(req.user.tenantId, id, req.user.userId);
  }

  @Delete("commitments/:id")
  @Permissions("finance.budget.delete")
  @ApiOperation({ summary: "Delete budget commitment" })
  async deleteCommitment(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.deleteBudgetCommitment(req.user.tenantId, id);
  }

  @Get("commitments/by-budget/:budgetId")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get commitments by budget" })
  async getCommitmentsByBudget(@Req() req: AuthenticatedRequest, @Param("budgetId") budgetId: string) {
    return this.budgetDeepService.getCommitmentsByBudget(req.user.tenantId, budgetId);
  }

  @Get("commitment-summary/:budgetId")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get commitment summary" })
  async getCommitmentSummary(@Req() req: AuthenticatedRequest, @Param("budgetId") budgetId: string) {
    return this.budgetDeepService.getCommitmentSummary(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), budgetId);
  }

  @Get("carry-forward-rules")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "List carry-forward rules" })
  async getCarryForwardRules(@Req() req: AuthenticatedRequest) {
    return this.budgetDeepService.getCarryForwardRules(req.user.tenantId);
  }

  @Get("carry-forward-rules/:id")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get carry-forward rule by ID" })
  async getCarryForwardRuleById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.getCarryForwardRuleById(req.user.tenantId, id);
  }

  @Post("carry-forward-rules")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Create carry-forward rule" })
  async createCarryForwardRule(@Req() req: AuthenticatedRequest, @ZodBody(createCarryForwardSchema) dto: any) {
    return this.budgetDeepService.createCarryForwardRule(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Patch("carry-forward-rules/:id")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Update carry-forward rule" })
  async updateCarryForwardRule(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(createCarryForwardSchema.partial()) dto: any) {
    return this.budgetDeepService.updateCarryForwardRule(req.user.tenantId, id, dto);
  }

  @Delete("carry-forward-rules/:id")
  @Permissions("finance.budget.delete")
  @ApiOperation({ summary: "Delete carry-forward rule" })
  async deleteCarryForwardRule(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.deleteCarryForwardRule(req.user.tenantId, id);
  }

  @Post("compute-carry-forward/:orgId/:fromYear/:toYear")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Compute budget carry forward" })
  async computeCarryForward(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("fromYear") fromYear: string, @Param("toYear") toYear: string) {
    return this.budgetDeepService.computeCarryForward(req.user.tenantId, orgId, fromYear, toYear);
  }

  @Get("revisions")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "List budget revisions" })
  async getRevisions(@Req() req: AuthenticatedRequest, @Query("budgetId") budgetId?: string) {
    return this.budgetDeepService.getBudgetRevisions(req.user.tenantId, budgetId);
  }

  @Get("revisions/:id")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get budget revision by ID" })
  async getRevisionById(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.getBudgetRevisionById(req.user.tenantId, id);
  }

  @Post("revisions")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Create budget revision" })
  async createRevision(@Req() req: AuthenticatedRequest, @ZodBody(createRevisionSchema) dto: any) {
    return this.budgetDeepService.createBudgetRevision(req.user.tenantId, await resolveOrgId(req.user.tenantId, req.user.orgId), dto);
  }

  @Post("revisions/:id/approve")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Approve budget revision" })
  async approveRevision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.approveBudgetRevision(req.user.tenantId, id, req.user.userId);
  }

  @Post("revisions/:id/reject")
  @Permissions("finance.budget.create")
  @ApiOperation({ summary: "Reject budget revision" })
  async rejectRevision(@Req() req: AuthenticatedRequest, @Param("id") id: string, @ZodBody(z.object({ rejectionReason: z.string().optional() })) dto: any) {
    return this.budgetDeepService.rejectBudgetRevision(req.user.tenantId, id, req.user.userId, dto.rejectionReason);
  }

  @Delete("revisions/:id")
  @Permissions("finance.budget.delete")
  @ApiOperation({ summary: "Delete budget revision" })
  async deleteRevision(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.budgetDeepService.deleteBudgetRevision(req.user.tenantId, id);
  }

  @Get("multi-year-plan/:orgId/:startYear/:endYear")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get multi-year budget plan" })
  async getMultiYearPlan(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string, @Param("startYear") startYear: string, @Param("endYear") endYear: string) {
    return this.budgetDeepService.getMultiYearPlan(req.user.tenantId, orgId, startYear, endYear);
  }

  @Get("dashboard/:orgId")
  @Permissions("finance.budget.read")
  @ApiOperation({ summary: "Get budget deep dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest, @Param("orgId") orgId: string) {
    return this.budgetDeepService.getBudgetDeepDashboard(req.user.tenantId, orgId);
  }
}
