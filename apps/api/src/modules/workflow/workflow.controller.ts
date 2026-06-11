import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { WorkflowService } from './workflow.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('workflows')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  @Permissions('admin.setting.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.workflowService.getWorkflows(req.user.tenantId);
  }

  @Post()
  @Permissions('admin.setting.create')
  async createWorkflow(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; triggerType: string; steps: { stepOrder: number; actionType: string; assigneeRole: string }[] }
  ) {
    return this.workflowService.createWorkflow(req.user.tenantId, dto);
  }

  @Get('approvals')
  @Permissions('admin.setting.read')
  async getApprovalChains(@Req() req: AuthenticatedRequest) {
    return this.workflowService.getApprovalChains(req.user.tenantId);
  }

  @Put('approvals/:id')
  @Permissions('admin.setting.create')
  async submitApprovalAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: 'APPROVED' | 'REJECTED'; comments?: string }
  ) {
    const userId = req.user.userId || 'system';
    return this.workflowService.submitApprovalAction(req.user.tenantId, id, dto, userId);
  }
}
