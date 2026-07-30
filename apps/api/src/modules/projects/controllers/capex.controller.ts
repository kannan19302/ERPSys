// @ts-nocheck
import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsCapexService } from "../services/projects-capex.service";
import {
  CreateCapexProjectSchema,
  AddCapexBudgetLineSchema,
  ConductGateReviewSchema,
  ApproveBudgetSchema,
  CapitalizationSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("projects-capex")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CapexController {
  constructor(private readonly service: ProjectsCapexService) {}

  @Get("capex")
  @Permissions("projects.capex.read")
  async getCapexProjects(@Req() req: AuthenticatedRequest) {
    return this.service.getCapexProjects(req.user.tenantId);
  }

  @Get("capex/:id")
  @Permissions("projects.capex.read")
  async getCapexProjectById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getCapexProjectById(req.user.tenantId, id);
  }

  @Post("capex")
  @Permissions("projects.capex.create")
  async createCapexProject(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateCapexProjectSchema) dto: unknown,
  ) {
    const orgId = req.user.orgId || "org-system-default";
    return this.service.createCapexProject(
      req.user.tenantId,
      orgId,
      dto as any,
    );
  }

  @Post("capex/:id/approve")
  @Permissions("projects.capex.update")
  async submitBudgetApproval(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(ApproveBudgetSchema) dto: unknown,
  ) {
    return this.service.submitBudgetApproval(
      req.user.tenantId,
      id,
      (dto as any).approvedBudget,
    );
  }

  @Post("capex-budget-lines")
  @Permissions("projects.capex.create")
  async addBudgetLine(
    @Req() req: AuthenticatedRequest,
    @ZodBody(AddCapexBudgetLineSchema) dto: unknown,
  ) {
    return this.service.addBudgetLine(req.user.tenantId, dto as any);
  }

  @Get("capex/:capexId/budget-lines")
  @Permissions("projects.capex.read")
  async getBudgetLines(
    @Req() req: AuthenticatedRequest,
    @Param("capexId") capexId: string,
  ) {
    return this.service.getBudgetLines(req.user.tenantId, capexId);
  }

  @Post("capex-gate-reviews")
  @Permissions("projects.capex.create")
  async conductGateReview(
    @Req() req: AuthenticatedRequest,
    @ZodBody(ConductGateReviewSchema) dto: unknown,
  ) {
    return this.service.conductGateReview(req.user.tenantId, dto as any);
  }

  @Get("capex/:capexId/gate-reviews")
  @Permissions("projects.capex.read")
  async getGateReviews(
    @Req() req: AuthenticatedRequest,
    @Param("capexId") capexId: string,
  ) {
    return this.service.getGateReviews(req.user.tenantId, capexId);
  }

  @Post("capex/:capexId/capitalizations")
  @Permissions("projects.capex.create")
  async performCapitalization(
    @Req() req: AuthenticatedRequest,
    @Param("capexId") capexId: string,
    @ZodBody(CapitalizationSchema) dto: unknown,
  ) {
    return this.service.performCapitalization(
      req.user.tenantId,
      capexId,
      dto as any,
    );
  }

  @Get("capex-dashboard")
  @Permissions("projects.capex.read")
  async getCapexDashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getCapexDashboard(req.user.tenantId);
  }
}
