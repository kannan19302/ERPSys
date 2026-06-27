import { Controller, Get, Post, Put, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ProjectsService } from './projects.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Get projects' })
  @Permissions('projects.read')
  @Get()
  @Permissions('projects.project.read')
  async getProjects(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getProjects(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get resource workload' })
  @Permissions('projects.read')
  @Get('resource-workload')
  @Permissions('projects.project.read')
  async getResourceWorkload(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getResourceWorkload(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get portfolios' })
  @Permissions('projects.read')
  @Get('portfolios')
  @Permissions('projects.project.read')
  async getPortfolios(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.projectsService.getPortfolios(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create portfolio' })
  @Permissions('projects.create')
  @Post('portfolios')
  @Permissions('projects.project.create')
  async createPortfolio(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; description?: string; strategicAlignment?: string; budget?: number }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.projectsService.createPortfolio(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Get project by id' })
  @Permissions('projects.read')
  @Get(':id')
  @Permissions('projects.project.read')
  async getProjectById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getProjectById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create project' })
  @Permissions('projects.create')
  @Post()
  @Permissions('projects.project.create')
  async createProject(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; code: string; description?: string; budget?: number; startDate?: string; endDate?: string }
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.projectsService.createProject(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get tasks' })
  @Permissions('projects.read')
  @Get(':id/tasks')
  @Permissions('projects.project.read')
  async getTasks(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getTasks(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create task' })
  @Permissions('projects.create')
  @Post(':id/tasks')
  @Permissions('projects.task.create')
  async createTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { name: string; description?: string; priority?: string; dueDate?: string; assignedToId?: string }
  ): Promise<unknown> {
    return this.projectsService.createTask(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Log time' })
  @Permissions('projects.create')
  @Post('tasks/:taskId/timesheets')
  @Permissions('projects.timesheet.create')
  async logTime(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @ZodBody(z.any()) dto: { employeeId: string; date: string; hours: number; notes?: string }
  ): Promise<unknown> {
    return this.projectsService.logTime(req.user.tenantId, taskId, dto);
  }

  @ApiOperation({ summary: 'Save baseline' })
  @Permissions('projects.create')
  @Post(':id/baseline')
  @Permissions('projects.project.create')
  async saveBaseline(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { baselineSchedule: string }
  ): Promise<unknown> {
    return this.projectsService.saveBaseline(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Compute critical path' })
  @Permissions('projects.create')
  @Post(':id/critical-path')
  @Permissions('projects.project.read')
  async computeCriticalPath(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<unknown> {
    return this.projectsService.computeCriticalPath(req.user.tenantId, id);
  }

  // --- Risks endpoints ---
  @ApiOperation({ summary: 'Get risks' })
  @Permissions('projects.read')
  @Get(':projectId/risks')
  @Permissions('projects.project.read')
  async getRisks(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string): Promise<unknown> {
    return this.projectsService.getRisks(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Create risk' })
  @Permissions('projects.create')
  @Post(':projectId/risks')
  @Permissions('projects.project.create')
  async createRisk(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @ZodBody(z.any()) dto: { title: string; description?: string; probability: string; impact: string; mitigationPlan?: string }
  ): Promise<unknown> {
    return this.projectsService.createRisk(req.user.tenantId, projectId, dto);
  }

  @ApiOperation({ summary: 'Update risk' })
  @Permissions('projects.update')
  @Put('risks/:riskId')
  @Permissions('projects.project.create')
  async updateRisk(
    @Req() req: AuthenticatedRequest,
    @Param('riskId') riskId: string,
    @ZodBody(z.any()) dto: { title?: string; description?: string; probability?: string; impact?: string; mitigationPlan?: string; status?: string }
  ): Promise<unknown> {
    return this.projectsService.updateRisk(req.user.tenantId, riskId, dto);
  }

  // --- Change Requests endpoints ---
  @ApiOperation({ summary: 'Get change requests' })
  @Permissions('projects.read')
  @Get(':projectId/change-requests')
  @Permissions('projects.project.read')
  async getChangeRequests(@Req() req: AuthenticatedRequest, @Param('projectId') projectId: string): Promise<unknown> {
    return this.projectsService.getChangeRequests(req.user.tenantId, projectId);
  }

  @ApiOperation({ summary: 'Create change request' })
  @Permissions('projects.create')
  @Post(':projectId/change-requests')
  @Permissions('projects.project.create')
  async createChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
    @ZodBody(z.any()) dto: { title: string; description?: string; requestedAmount: number; requestedScheduleDays: number }
  ): Promise<unknown> {
    return this.projectsService.createChangeRequest(req.user.tenantId, projectId, dto);
  }

  @ApiOperation({ summary: 'Approve change request' })
  @Permissions('projects.update')
  @Put('change-requests/:changeRequestId/approve')
  @Permissions('projects.project.create')
  async approveChangeRequest(
    @Req() req: AuthenticatedRequest,
    @Param('changeRequestId') changeRequestId: string
  ): Promise<unknown> {
    return this.projectsService.approveChangeRequest(req.user.tenantId, changeRequestId, req.user.userId || 'system');
  }

  // --- EVM calculator endpoint ---
  @ApiOperation({ summary: 'Get project e v m' })
  @Permissions('projects.read')
  @Get(':id/evm')
  @Permissions('projects.project.read')
  async getProjectEVM(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.getProjectEVM(req.user.tenantId, id);
  }

  // --- Finance Integration Auto-billing endpoint ---
  @ApiOperation({ summary: 'Generate project invoice' })
  @Permissions('projects.create')
  @Post(':id/invoice')
  @Permissions('finance.invoice.create')
  async generateProjectInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.projectsService.generateProjectInvoice(req.user.tenantId, id, req.user.userId || 'system');
  }
}
