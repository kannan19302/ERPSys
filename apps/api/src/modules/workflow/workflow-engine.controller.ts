import { Controller, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { WorkflowEngineService } from './workflow-engine.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('workflow')
@ApiBearerAuth()
@Controller('workflows/engine')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class WorkflowEngineController {
  constructor(private readonly engine: WorkflowEngineService) {}

  @ApiOperation({ summary: 'Execute workflow' })
  @Permissions('workflow.create')
  @Post(':id/execute')
  async executeWorkflow(@Req() req: AuthReq, @Param('id') id: string, @ZodBody(z.any()) body: { entityType: string; entityId: string; data?: Record<string, unknown> }) {
    return this.engine.executeWorkflow(req.user.tenantId, id, {
      tenantId: req.user.tenantId,
      triggeredBy: req.user.userId,
      entityType: body.entityType,
      entityId: body.entityId,
      data: body.data || {} });
  }

  @ApiOperation({ summary: 'Process event trigger' })
  @Permissions('workflow.create')
  @Post('trigger')
  async processEventTrigger(@Req() req: AuthReq, @ZodBody(z.any()) body: { triggerType: string; entityType: string; entityId: string; data?: Record<string, unknown> }) {
    return this.engine.processEventTrigger(req.user.tenantId, body.triggerType, body.entityType, body.entityId, body.data || {}, req.user.userId);
  }
}
