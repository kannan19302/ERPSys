import { Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import {
  CrmTerritoryRulesService,
  createTerritoryRuleSchema,
  updateTerritoryRuleSchema,
  assignLeadSchema,
  CreateTerritoryRuleInput,
  UpdateTerritoryRuleInput,
  AssignLeadInput,
} from './crm-territory-rules.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('crm-territory-rules')
@ApiBearerAuth()
@Controller('crm/territory-rules')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmTerritoryRulesController {
  constructor(private readonly svc: CrmTerritoryRulesService) {}

  @ApiOperation({ summary: 'List territory assignment rules' })
  @Get()
  @Permissions('crm.settings.read')
  async list(@Req() req: AuthenticatedRequest, @Query('territoryId') territoryId?: string) {
    return this.svc.listRules(req.user.tenantId, territoryId);
  }

  @ApiOperation({ summary: 'Get a territory assignment rule' })
  @Get(':id')
  @Permissions('crm.settings.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a territory assignment rule' })
  @Post()
  @Permissions('crm.settings.create')
  @TrackChanges('TerritoryAssignmentRule')
  async create(@Req() req: AuthenticatedRequest, @ZodBody(createTerritoryRuleSchema) dto: CreateTerritoryRuleInput) {
    return this.svc.createRule(req.user.tenantId, req.user.orgId || 'org-system-default', dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update a territory assignment rule' })
  @Put(':id')
  @Permissions('crm.settings.update')
  @TrackChanges('TerritoryAssignmentRule')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateTerritoryRuleSchema) dto: UpdateTerritoryRuleInput) {
    return this.svc.updateRule(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a territory assignment rule' })
  @Delete(':id')
  @Permissions('crm.settings.delete')
  @TrackChanges('TerritoryAssignmentRule')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.deleteRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get territory assignment audit log' })
  @Get('log/entries')
  @Permissions('crm.report.read')
  async log(@Req() req: AuthenticatedRequest, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.svc.getAssignmentLog(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Run territory assignment rules against a lead' })
  @Post('assign')
  @Permissions('crm.lead.update')
  @TrackChanges('Lead')
  async assign(@Req() req: AuthenticatedRequest, @ZodBody(assignLeadSchema) dto: AssignLeadInput) {
    return this.svc.assignLead(req.user.tenantId, dto.leadId);
  }

  @ApiOperation({ summary: 'Bulk re-run territory assignment for all open leads' })
  @Post('reassign-all')
  @Permissions('crm.lead.update')
  @TrackChanges('Lead')
  async reassignAll(@Req() req: AuthenticatedRequest) {
    return this.svc.reassignAllOpenLeads(req.user.tenantId);
  }
}
