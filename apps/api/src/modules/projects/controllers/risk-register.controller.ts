import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsRiskRegisterService } from "../services/projects-risk-register.service";
import {
  CreateRiskEntrySchema,
  AssessRiskSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-risk-register")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RiskRegisterController {
  constructor(private readonly service: ProjectsRiskRegisterService) {}

  @ApiOperation({ summary: "Get risk matrix with heatmap" })
  @Get(":projectId/risk-matrix")
  @Permissions("projects.risk.read")
  async getRiskMatrix(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getRiskMatrix(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get probability-impact matrix grid" })
  @Get(":projectId/risk-impact-matrix")
  @Permissions("projects.risk.read")
  async getRiskImpactMatrix(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getRiskImpactMatrix(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get risk by ID" })
  @Get("risks/:riskId")
  @Permissions("projects.risk.read")
  async getRiskById(
    @Req() req: AuthenticatedRequest,
    @Param("riskId") riskId: string,
  ) {
    return this.service.getRiskById(req.user.tenantId, riskId);
  }

  @ApiOperation({ summary: "Create a risk register entry" })
  @Post("risks")
  @Permissions("projects.risk.create")
  async createRisk(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateRiskEntrySchema) dto: unknown,
  ) {
    return this.service.createRisk(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Assess a risk with probability/impact" })
  @Put("risks/:riskId/assess")
  @Permissions("projects.risk.update")
  async assessRisk(
    @Req() req: AuthenticatedRequest,
    @Param("riskId") riskId: string,
    @ZodBody(AssessRiskSchema) dto: unknown,
  ) {
    return this.service.assessRisk(req.user.tenantId, riskId, dto as any);
  }

  @ApiOperation({ summary: "Get risk dashboard" })
  @Get("risk-dashboard")
  @Permissions("projects.risk.read")
  async getRiskDashboard(
    @Req() req: AuthenticatedRequest,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.getRiskDashboard(req.user.tenantId, projectId);
  }
}
