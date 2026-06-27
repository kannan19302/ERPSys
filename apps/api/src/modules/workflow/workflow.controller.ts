import { Controller, Get, Post, Put, Param, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { WorkflowService } from './workflow.service';
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

@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflows')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @ApiOperation({ summary: 'Get workflows' })
  @Permissions('workflow.read')
  @Get()
  @Permissions('admin.setting.read')
  async getWorkflows(@Req() req: AuthenticatedRequest) {
    return this.workflowService.getWorkflows(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create workflow' })
  @Permissions('workflow.create')
  @Post()
  @Permissions('admin.setting.create')
  async createWorkflow(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { name: string; triggerType: string; steps: { stepOrder: number; actionType: string; assigneeRole: string; slaLimitHours?: number; backupAssigneeRole?: string }[] }
  ) {
    return this.workflowService.createWorkflow(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get approval chains' })
  @Permissions('workflow.read')
  @Get('approvals')
  @Permissions('admin.setting.read')
  async getApprovalChains(@Req() req: AuthenticatedRequest) {
    return this.workflowService.getApprovalChains(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Submit approval action' })
  @Permissions('workflow.update')
  @Put('approvals/:id')
  @Permissions('admin.setting.create')
  async submitApprovalAction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: 'APPROVED' | 'REJECTED'; comments?: string }
  ) {
    const userId = req.user.userId || 'system';
    return this.workflowService.submitApprovalAction(req.user.tenantId, id, dto, userId);
  }

  @ApiOperation({ summary: 'Check sla breaches' })
  @Permissions('workflow.create')
  @Post('sla-check')
  @Permissions('admin.setting.create')
  async checkSlaBreaches(@Req() req: AuthenticatedRequest) {
    return this.workflowService.checkSlaBreaches(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Simulate workflow' })
  @Permissions('workflow.create')
  @Post('simulate')
  @Permissions('admin.setting.create')
  async simulateWorkflow(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { triggerType: string; entityType: string; entityId: string }
  ) {
    return this.workflowService.simulateWorkflow(req.user.tenantId, dto.triggerType, dto.entityType, dto.entityId);
  }
}
