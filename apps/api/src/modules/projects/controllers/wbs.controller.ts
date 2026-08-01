import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ProjectsWbsService } from "../services/projects-wbs.service";
import {
  CreateWbsElementSchema,
  UpdateWbsElementSchema,
} from "../dto/projects-deep.dto";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("projects-wbs")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard, RbacGuard)
export class WbsController {
  constructor(private readonly service: ProjectsWbsService) {}

  @ApiOperation({ summary: "Get WBS tree for a project" })
  @Get(":projectId/wbs")
  @Permissions("projects.wbs.read")
  async getWbsTree(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getWbsTree(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Get WBS Gantt chart data" })
  @Get(":projectId/wbs-gantt")
  @Permissions("projects.wbs.read")
  async getWbsGanttData(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getWbsGanttData(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: "Create a WBS task element" })
  @Post("wbs-tasks")
  @Permissions("projects.wbs.create")
  async createWbsTask(
    @Req() req: AuthenticatedRequest,
    @ZodBody(CreateWbsElementSchema) dto: unknown,
  ) {
    return this.service.createWbsTask(req.user.tenantId, dto as any);
  }

  @ApiOperation({ summary: "Update a WBS task element" })
  @Put("wbs-tasks/:taskId")
  @Permissions("projects.wbs.update")
  async updateWbsTask(
    @Req() req: AuthenticatedRequest,
    @Param("taskId") taskId: string,
    @ZodBody(UpdateWbsElementSchema) dto: unknown,
  ) {
    return this.service.updateWbsTask(req.user.tenantId, taskId, dto as any);
  }

  @ApiOperation({ summary: "Delete a WBS task element" })
  @Delete("wbs-tasks/:taskId")
  @Permissions("projects.wbs.delete")
  async deleteWbsTask(
    @Req() req: AuthenticatedRequest,
    @Param("taskId") taskId: string,
  ) {
    return this.service.deleteWbsTask(req.user.tenantId, taskId);
  }

  @ApiOperation({ summary: "Get WBS dashboard" })
  @Get(":projectId/wbs-dashboard")
  @Permissions("projects.wbs.read")
  async getWbsDashboard(
    @Req() req: AuthenticatedRequest,
    @Param("projectId") projectId: string,
  ) {
    return this.service.getWbsDashboard(req.user.tenantId, projectId);
  }
}
