import { Controller, Post, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { WorkflowEngineService } from './workflow-engine.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('workflows/engine')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class WorkflowEngineController {
  constructor(private readonly engine: WorkflowEngineService) {}

  @Post(':id/execute')
  async executeWorkflow(@Req() req: AuthReq, @Param('id') id: string, @Body() body: { entityType: string; entityId: string; data?: Record<string, unknown> }) {
    return this.engine.executeWorkflow(req.user.tenantId, id, {
      tenantId: req.user.tenantId,
      triggeredBy: req.user.userId,
      entityType: body.entityType,
      entityId: body.entityId,
      data: body.data || {},
    });
  }

  @Post('trigger')
  async processEventTrigger(@Req() req: AuthReq, @Body() body: { triggerType: string; entityType: string; entityId: string; data?: Record<string, unknown> }) {
    return this.engine.processEventTrigger(req.user.tenantId, body.triggerType, body.entityType, body.entityId, body.data || {}, req.user.userId);
  }
}
