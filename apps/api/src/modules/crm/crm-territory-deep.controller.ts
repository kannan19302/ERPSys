import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  CrmTerritoryDeepService,
  createTerritoryPlanSchema,
  updateTerritoryPlanSchema,
  createAccountTeamMemberSchema,
  updateAccountTeamMemberSchema,
  createNamedAccountSchema,
  updateNamedAccountSchema,
  CreateTerritoryPlanInput,
  UpdateTerritoryPlanInput,
  CreateAccountTeamMemberInput,
  UpdateAccountTeamMemberInput,
  CreateNamedAccountInput,
  UpdateNamedAccountInput,
} from "./crm-territory-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm-territory-deep")
@ApiBearerAuth()
@Controller("crm/territory-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmTerritoryDeepController {
  constructor(private readonly svc: CrmTerritoryDeepService) {}

  // ── Territory Plans ────────────────────────────────────────

  @ApiOperation({ summary: "Get territory plans" })
  @Get("plans")
  @Permissions("crm.territory.plans.read")
  async getPlans(@Req() req: AuthenticatedRequest) {
    return this.svc.getTerritoryPlans(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get territory plan by id" })
  @Get("plans/:id")
  @Permissions("crm.territory.plans.read")
  async getPlan(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getTerritoryPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create territory plan" })
  @Post("plans")
  @Permissions("crm.territory.plans.create")
  async createPlan(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createTerritoryPlanSchema) dto: CreateTerritoryPlanInput,
  ) {
    return this.svc.createTerritoryPlan(
      req.user.tenantId,
      req.user.orgId || "org-system-default",
      dto,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Update territory plan" })
  @Put("plans/:id")
  @Permissions("crm.territory.plans.update")
  async updatePlan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateTerritoryPlanSchema) dto: UpdateTerritoryPlanInput,
  ) {
    return this.svc.updateTerritoryPlan(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete territory plan" })
  @Delete("plans/:id")
  @Permissions("crm.territory.plans.delete")
  async deletePlan(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.deleteTerritoryPlan(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get territory assignment history" })
  @Get("plans/:id/history")
  @Permissions("crm.territory.plans.read")
  async getHistory(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.getTerritoryAssignmentHistory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Rebalance territory assignments" })
  @Post("plans/:id/rebalance")
  @Permissions("crm.territory.plans.update")
  async rebalance(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.svc.rebalanceTerritory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Preview territory rebalance" })
  @Post("plans/:id/preview-rebalance")
  @Permissions("crm.territory.plans.read")
  async previewRebalance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.previewRebalance(req.user.tenantId, id);
  }

  // ── Territory Performance ──────────────────────────────────

  @ApiOperation({ summary: "Get territory performance" })
  @Get("performance/:territoryId")
  @Permissions("crm.territory.performance.read")
  async getPerformance(
    @Req() req: AuthenticatedRequest,
    @Param("territoryId") territoryId: string,
    @Query("period") period?: string,
  ) {
    return this.svc.getTerritoryPerformance(
      req.user.tenantId,
      territoryId,
      period,
    );
  }

  @ApiOperation({ summary: "Get territory dashboard" })
  @Get("dashboard")
  @Permissions("crm.territory.performance.read")
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.svc.getTerritoryDashboard(req.user.tenantId);
  }

  // ── Account Teams ──────────────────────────────────────────

  @ApiOperation({ summary: "Get account teams for a customer" })
  @Get("account-teams/:customerId")
  @Permissions("crm.territory.account-teams.read")
  async getAccountTeams(@Param("customerId") customerId: string) {
    return { data: await this.svc.getAccountTeams(customerId) };
  }

  @ApiOperation({ summary: "Add account team member" })
  @Post("account-teams")
  @Permissions("crm.territory.account-teams.create")
  async addAccountTeamMember(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAccountTeamMemberSchema) dto: CreateAccountTeamMemberInput,
  ) {
    return this.svc.addAccountTeamMember(
      req.user.tenantId,
      req.user.orgId || "org-system-default",
      dto,
    );
  }

  @ApiOperation({ summary: "Update account team member" })
  @Put("account-teams/:id")
  @Permissions("crm.territory.account-teams.update")
  async updateAccountTeamMember(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateAccountTeamMemberSchema) dto: UpdateAccountTeamMemberInput,
  ) {
    return this.svc.updateAccountTeamMember(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Remove account team member" })
  @Delete("account-teams/:id")
  @Permissions("crm.territory.account-teams.delete")
  async removeAccountTeamMember(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.removeAccountTeamMember(req.user.tenantId, id);
  }

  // ── Account Scoring ────────────────────────────────────────

  @ApiOperation({ summary: "Get account scoring" })
  @Get("account-scoring/:customerId")
  @Permissions("crm.territory.account-scoring.read")
  async getAccountScoring(@Param("customerId") customerId: string) {
    return this.svc.getAccountScoring(customerId);
  }

  @ApiOperation({ summary: "Calculate account score" })
  @Post("account-scoring/:customerId/calculate")
  @Permissions("crm.territory.account-scoring.calculate")
  async calculateAccountScore(
    @Req() req: AuthenticatedRequest,
    @Param("customerId") customerId: string,
  ) {
    return this.svc.calculateAccountScore(req.user.tenantId, customerId);
  }

  // ── Named Accounts ─────────────────────────────────────────

  @ApiOperation({ summary: "Get named accounts" })
  @Get("named-accounts")
  @Permissions("crm.territory.named-accounts.read")
  async getNamedAccounts(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getNamedAccounts(req.user.tenantId) };
  }

  @ApiOperation({ summary: "Create named account" })
  @Post("named-accounts")
  @Permissions("crm.territory.named-accounts.create")
  async createNamedAccount(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createNamedAccountSchema) dto: CreateNamedAccountInput,
  ) {
    return this.svc.createNamedAccount(
      req.user.tenantId,
      req.user.orgId || "org-system-default",
      dto,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: "Update named account" })
  @Put("named-accounts/:id")
  @Permissions("crm.territory.named-accounts.update")
  async updateNamedAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateNamedAccountSchema) dto: UpdateNamedAccountInput,
  ) {
    return this.svc.updateNamedAccount(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Remove named account" })
  @Delete("named-accounts/:id")
  @Permissions("crm.territory.named-accounts.delete")
  async removeNamedAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.svc.removeNamedAccount(req.user.tenantId, id);
  }
}
