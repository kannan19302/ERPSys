import { Controller, Get, Post, Put, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmLeadScoringService,
  createLeadScoringRuleSchema,
  updateLeadScoringRuleSchema,
  CreateLeadScoringRuleInput,
  UpdateLeadScoringRuleInput,
} from './crm-lead-scoring.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-lead-scoring')
@ApiBearerAuth()
@Controller('crm')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmLeadScoringController {
  constructor(private readonly svc: CrmLeadScoringService) {}

  @Get('lead-scoring/rules')
  @Permissions('crm.lead-scoring.read')
  @ApiOperation({ summary: 'List lead scoring rules' })
  async list(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.listRules(req.user.tenantId) };
  }

  @Get('lead-scoring/rules/:id')
  @Permissions('crm.lead-scoring.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return { data: await this.svc.getRule(req.user.tenantId, id) };
  }

  @Post('lead-scoring/rules')
  @Permissions('crm.lead-scoring.create')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createLeadScoringRuleSchema) dto: CreateLeadScoringRuleInput) {
    return { data: await this.svc.createRule(req.user.tenantId, dto) };
  }

  @Put('lead-scoring/rules/:id')
  @Permissions('crm.lead-scoring.update')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateLeadScoringRuleSchema) dto: UpdateLeadScoringRuleInput) {
    return { data: await this.svc.updateRule(req.user.tenantId, id, dto) };
  }

  @Delete('lead-scoring/rules/:id')
  @Permissions('crm.lead-scoring.delete')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return { data: await this.svc.deleteRule(req.user.tenantId, id) };
  }

  @Post('leads/:id/recalculate-score')
  @Permissions('crm.lead-scoring.recalculate')
  async recalcOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return { data: await this.svc.recalculateScore(req.user.tenantId, id) };
  }

  @Post('lead-scoring/recalculate-all')
  @Permissions('crm.lead-scoring.recalculate')
  async recalcAll(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.recalculateAll(req.user.tenantId) };
  }
}
