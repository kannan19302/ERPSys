import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
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
  async getProjects(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getProjects(req.user.tenantId);
  }

  @Get('resource-workload')
  @Permissions('projects.project.read')
  async getResourceWorkload(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getResourceWorkload(req.user.tenantId);
  }

  @Get('portfolios')
  @Permissions('projects.project.read')
  async getPortfolios(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getPortfolios(req.user.tenantId);
  }

  @Post('portfolios')
  @Permissions('projects.project.create')
  async createPortfolio(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; description?: string; strategicAlignment?: string; budget?: number }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.projectsService.createPortfolio(req.user.tenantId, orgId, dto);
  }

  @Get(':id')
  @Permissions('projects.project.read')
  async getProjectById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getProjectById(req.user.tenantId, id);
  }

  @Post()
  @Permissions('projects.project.create')
  async createProject(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; code: string; description?: string; budget?: number; startDate?: string; endDate?: string }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.projectsService.createProject(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Get(':id/tasks')
  @Permissions('projects.project.read')
  async getTasks(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getTasks(req.user.tenantId, id);
  }

  @Post(':id/tasks')
  @Permissions('projects.task.create')
  async createTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { name: string; description?: string; priority?: string; dueDate?: string; assignedToId?: string }
  ): Promise<unknown> {
    return this.projectsService.createTask(req.user.tenantId, id, dto);
  }

  @Post('tasks/:taskId/timesheets')
  @Permissions('projects.timesheet.create')
  async logTime(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() dto: { employeeId: string; date: string; hours: number; notes?: string }
  ): Promise<unknown> {
    return this.projectsService.logTime(req.user.tenantId, taskId, dto);
  }

  @Post(':id/baseline')
  @Permissions('projects.project.create')
  async saveBaseline(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { baselineSchedule: string }
  ): Promise<unknown> {
    return this.projectsService.saveBaseline(req.user.tenantId, id, dto);
  }

  @Post(':id/critical-path')
  @Permissions('projects.project.read')
  async computeCriticalPath(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<unknown> {
    return this.projectsService.computeCriticalPath(req.user.tenantId, id);
  }

  // --- Risks endpoints ---
  @Get(':projectId/risks')
  @Permissions('projects.project.read')
  async getRisks(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string): Promise<unknown> {
    return this.projectsService.getRisks(req.user.tenantId, projectId);
  }

  @Post(':projectId/risks')
  @Permissions('projects.project.create')
  async createRisk(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() dto: { title: string; description?: string; probability: string; impact: string; mitigationPlan?: string }
  ): Promise<unknown> {
    return this.projectsService.createRisk(req.user.tenantId, projectId, dto);
  }

  @Put('risks/:riskId')
  @Permissions('projects.project.create')
  async updateRisk(
    @Req() req: AuthenticatedRequest,
    @Param('riskId') riskId: string,
    @Body() dto: { title?: string; description?: string; probability?: string; impact?: string; mitigationPlan?: string; status?: string }
  ): Promise<unknown> {
    return this.projectsService.updateRisk(req.user.tenantId, riskId, dto);
  }

  // --- Change Requests endpoints ---
  @Get(':projectId/change-requests')
  @Permissions('projects.project.read')
  async getChangeRequests(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string): Promise<unknown> {
    return this.projectsService.getChangeRequests(req.user.tenantId, projectId);
  }

  @Post(':projectId/change-requests')
  @Permissions('projects.project.create')
  async createChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @Body() dto: { title: string; description?: string; requestedAmount: number; requestedScheduleDays: number }
  ): Promise<unknown> {
    return this.projectsService.createChangeRequest(req.user.tenantId, projectId, dto);
  }

  @Put('change-requests/:changeRequestId/approve')
  @Permissions('projects.project.create')
  async approveChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param('changeRequestId') changeRequestId: string
  ): Promise<unknown> {
    return this.projectsService.approveChangeRequest(req.user.tenantId, changeRequestId, req.user.userId || 'system');
  }

  // --- EVM calculator endpoint ---
  @Get(':id/evm')
  @Permissions('projects.project.read')
  async getProjectEVM(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getProjectEVM(req.user.tenantId, id);
  }

  // --- Finance Integration Auto-billing endpoint ---
  @Post(':id/invoice')
  @Permissions('finance.invoice.create')
  async generateProjectInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.generateProjectInvoice(req.user.tenantId, id, req.user.userId || 'system');
  }
}
