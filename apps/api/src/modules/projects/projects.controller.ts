import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProjectsService } from './projects.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Permissions('projects.project.read')
  async getProjects(@Req() req: AuthenticatedRequest) {
    return this.projectsService.getProjects(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('projects.project.read')
  async getProjectById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.getProjectById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('projects.project.create')
  async createProject(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; code: string; description?: string; budget?: number; startDate?: string; endDate?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.projectsService.createProject(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Get(':id/tasks')
  @Permissions('projects.project.read')
  async getTasks(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectsService.getTasks(req.user.tenantId, id);
  }

  @Post(':id/tasks')
  @Permissions('projects.task.create')
  async createTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { name: string; description?: string; priority?: string; dueDate?: string; assignedToId?: string }
  ) {
    return this.projectsService.createTask(req.user.tenantId, id, dto);
  }

  @Post('tasks/:taskId/timesheets')
  @Permissions('projects.timesheet.create')
  async logTime(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() dto: { employeeId: string; date: string; hours: number; notes?: string }
  ) {
    return this.projectsService.logTime(req.user.tenantId, taskId, dto);
  }
}
