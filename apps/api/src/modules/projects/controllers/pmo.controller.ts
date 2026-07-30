// @ts-nocheck
import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsPmoService } from "../services/projects-pmo.service";
import {
  CreateScorecardSchema,
  AssessStageGateSchema,
  ComplianceSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-pmo")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class PmoController {
  constructor(private readonly service: ProjectsPmoService) {}

  @Get(":projectId/scorecards")
  @Permissions("projects.scorecard.read")
  async getHealthScorecard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getHealthScorecard(req.user.tenantId, projectId);
  }

  @Post("scorecards")
  @Permissions("projects.scorecard.create")
  async createScorecard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateScorecardSchema) dto: unknown,
  ) {
    return this.service.createScorecard(req.user.tenantId, dto as any);
  }

  @Post("stage-gates")
  @Permissions("projects.stage-gate.create")
  async assessStageGate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(AssessStageGateSchema) dto: unknown,
  ) {
    return this.service.assessStageGate(req.user.tenantId, dto as any);
  }

  @Get(":projectId/stage-gates")
  @Permissions("projects.stage-gate.read")
  async getStageGates(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getStageGates(req.user.tenantId, projectId);
  }

  @Get("portfolio-heatmap")
  @Permissions("projects.scorecard.read")
  async getPortfolioHeatmap(@Req() req: AuthenticatedRequest) {
    return this.service.getPortfolioHeatmap(req.user.tenantId);
  }

  @Post(":projectId/compliance")
  @Permissions("projects.compliance.create")
  async trackCompliance(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
    @ZodBody(ComplianceSchema) dto: unknown,
  ) {
    return this.service.trackCompliance(
      req.user.tenantId,
      projectId,
      dto as any,
    );
  }

  @Get("pmo-dashboard")
  @Permissions("projects.pmo.read")
  async getPMODashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getPMODashboard(req.user.tenantId);
  }
}
