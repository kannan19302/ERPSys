import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsBaselineService } from "../services/projects-baseline.service";
import {
  CreateBaselineSchema,
  CreateMilestoneSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-baseline")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectBaselineController {
  constructor(private readonly service: ProjectsBaselineService) {}

  @ApiOperation({ summary: "Get baselines for a project" })
  @Get(":projectId/baselines")
  @Permissions("projects.baseline.read")
  async getBaselines(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getBaselines(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get a baseline by ID" })
  @Get("baselines/:id")
  @Permissions("projects.baseline.read")
  async getBaselineById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.getBaselineById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create a project baseline" })
  @Post("baselines")
  @Permissions("projects.baseline.create")
  async createBaseline(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateBaselineSchema) dto: unknown,
  ) {
    return this.service.createBaseline(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Get milestone variance analysis" })
  @Get(":projectId/milestone-variance")
  @Permissions("projects.baseline.read")
  async getMilestoneVariance(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getMilestoneVariance(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Create a milestone" })
  @Post("milestones")
  @Permissions("projects.milestone.create")
  async createMilestone(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateMilestoneSchema) dto: unknown,
  ) {
    return this.service.createMilestone(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Complete a milestone" })
  @Post("milestones/:milestoneId/complete")
  @Permissions("projects.milestone.update")
  async completeMilestone(
    @Req() req: AuthenticatedRequest,
    @Param("milestoneId") milestoneId: string,
  ) {
    return this.service.completeMilestone(req.user.tenantId, milestoneId);
  }

  @ApiOperation({ summary: "Get baseline & milestone dashboard" })
  @Get(":projectId/baseline-dashboard")
  @Permissions("projects.baseline.read")
  async getBaselineDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getBaselineDashboard(req.user.tenantId, projectId);
  }
}
