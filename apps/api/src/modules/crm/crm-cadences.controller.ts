import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmCadencesService,
  createCadenceSchema,
  createAutoEnrollRuleSchema,
  updateAutoEnrollRuleSchema,
  completeStepTaskSchema,
  CreateCadenceInput,
  CreateAutoEnrollRuleInput,
  UpdateAutoEnrollRuleInput,
  CompleteStepTaskInput,
} from './crm-cadences.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-cadences')
@ApiBearerAuth()
@Controller('crm/cadences')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmCadencesController {
  constructor(private readonly svc: CrmCadencesService) {}

  @ApiOperation({ summary: 'Create a multi-channel sales cadence' })
  @Post()
  @Permissions('crm.settings.create')
  @TrackChanges('EmailSequence')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createCadenceSchema) dto: CreateCadenceInput) {
    return this.svc.createCadence(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get a cadence with steps and auto-enroll rules' })
  @Get(':id')
  @Permissions('crm.settings.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getCadence(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List auto-enroll rules' })
  @Get('auto-enroll-rules/list')
  @Permissions('crm.settings.read')
  async listRules(@Req() req: AuthenticatedRequest, @Query('sequenceId') sequenceId?: string) {
    return this.svc.listAutoEnrollRules(req.user.tenantId, sequenceId);
  }

  @ApiOperation({ summary: 'Create an auto-enroll rule' })
  @Post('auto-enroll-rules')
  @Permissions('crm.settings.create')
  @TrackChanges('CadenceAutoEnrollRule')
  async createRule(@Req() req: AuthenticatedRequest, @ZodBody(createAutoEnrollRuleSchema) dto: CreateAutoEnrollRuleInput) {
    return this.svc.createAutoEnrollRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update an auto-enroll rule' })
  @Put('auto-enroll-rules/:id')
  @Permissions('crm.settings.update')
  @TrackChanges('CadenceAutoEnrollRule')
  async updateRule(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateAutoEnrollRuleSchema) dto: UpdateAutoEnrollRuleInput) {
    return this.svc.updateAutoEnrollRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete an auto-enroll rule' })
  @Delete('auto-enroll-rules/:id')
  @Permissions('crm.settings.delete')
  @TrackChanges('CadenceAutoEnrollRule')
  async deleteRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteAutoEnrollRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Evaluate auto-enroll rules for a lead' })
  @Post('auto-enroll-rules/evaluate/:leadId')
  @Permissions('crm.lead.update')
  async evaluate(@Req() req: AuthenticatedRequest, @Param('leadId') leadId: string) {
    return this.svc.evaluateAutoEnrollForLead(req.user.tenantId, leadId);
  }

  @ApiOperation({ summary: 'Process all due cadence steps now (manual trigger; scheduler-ready)' })
  @Post('process-due-steps')
  @Permissions('crm.settings.update')
  async processDue(@Req() req: AuthenticatedRequest) {
    return this.svc.processDueSteps(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List my pending cadence step tasks (call/task/LinkedIn touchpoints)' })
  @Get('step-tasks/mine')
  @Permissions('crm.lead.read')
  async myTasks(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.svc.listMyStepTasks(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Complete (or skip) a cadence step task' })
  @Post('step-tasks/:id/complete')
  @Permissions('crm.lead.update')
  @TrackChanges('CadenceStepTask')
  async completeTask(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(completeStepTaskSchema) dto: CompleteStepTaskInput) {
    return this.svc.completeStepTask(req.user.tenantId, id, dto, req.user.userId || 'system');
  }
}
