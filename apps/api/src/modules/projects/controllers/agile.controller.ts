import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { ZodBody } from "../../../common/decorators/zod-body.decorator";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsAgileService } from "../services/projects-agile.service";
import {
  CreateSprintSchema,
  CreateBacklogItemSchema,
  MoveToSprintSchema,
  RetrospectiveSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-agile")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AgileController {
  constructor(private readonly service: ProjectsAgileService) {}

  @Get(":projectId/sprints")
  @Permissions("projects.sprint.read")
  async getSprints(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getSprints(req.user.tenantId, projectId);
  }

  @Get("sprints/:sprintId")
  @Permissions("projects.sprint.read")
  async getSprintById(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
  ) {
    return this.service.getSprintById(req.user.tenantId, sprintId);
  }

  @Post("sprints")
  @Permissions("projects.sprint.create")
  async createSprint(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateSprintSchema) dto: unknown,
  ) {
    return this.service.createSprint(req.user.tenantId, dto as any);
  }

  @Post("sprints/:sprintId/start")
  @Permissions("projects.sprint.update")
  async startSprint(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
  ) {
    return this.service.startSprint(req.user.tenantId, sprintId);
  }

  @Post("sprints/:sprintId/complete")
  @Permissions("projects.sprint.update")
  async completeSprint(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
  ) {
    return this.service.completeSprint(req.user.tenantId, sprintId);
  }

  @Get(":projectId/backlog")
  @Permissions("projects.backlog.read")
  async getBacklog(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getBacklog(req.user.tenantId, projectId);
  }

  @Post("backlog")
  @Permissions("projects.backlog.create")
  async addBacklogItem(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateBacklogItemSchema) dto: unknown,
  ) {
    return this.service.addBacklogItem(req.user.tenantId, dto as any);
  }

  @Post("sprints/:sprintId/items")
  @Permissions("projects.sprint.update")
  async moveToSprint(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
    @ZodBody(MoveToSprintSchema) dto: unknown,
  ) {
    return this.service.moveToSprint(req.user.tenantId, sprintId, dto as any);
  }

  @Get("sprints/:sprintId/burndown")
  @Permissions("projects.sprint.read")
  async getBurndownData(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
  ) {
    return this.service.getBurndownData(req.user.tenantId, sprintId);
  }

  @Get(":projectId/scrum-dashboard")
  @Permissions("projects.sprint.read")
  async getScrumDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getScrumDashboard(req.user.tenantId, projectId);
  }

  @Post("sprints/:sprintId/retrospectives")
  @Permissions("projects.sprint.create")
  async addRetrospective(
    @Req() req: AuthenticatedRequest,
    @Param("sprintId") sprintId: string,
    @ZodBody(RetrospectiveSchema) dto: unknown,
  ) {
    return this.service.addRetrospective(
      req.user.tenantId,
      sprintId,
      dto as any,
    );
  }
}
