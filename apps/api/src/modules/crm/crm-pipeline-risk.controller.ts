import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { CrmPipelineRiskService, snoozeAlertSchema, SnoozeAlertInput } from './crm-pipeline-risk.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Pipeline Inspection / stage-change risk alerts admin API (Up Next item 38,
 * benchmark: Salesforce Einstein Pipeline Inspection, HubSpot Breeze).
 */
@ApiTags('crm-pipeline-risk')
@ApiBearerAuth()
@Controller('crm/pipeline-risk')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmPipelineRiskController {
  constructor(private readonly svc: CrmPipelineRiskService) {}

  @ApiOperation({ summary: 'Recompute stage-change risk alerts across the whole pipeline' })
  @Post('recompute')
  @Permissions('crm.opportunity.update')
  @TrackChanges('PipelineRiskAlert')
  async recompute(@Req() req: AuthenticatedRequest) {
    return this.svc.recomputeAlerts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List open risk alerts (dashboard)' })
  @Get()
  @Permissions('crm.opportunity.read')
  async list(@Req() req: AuthenticatedRequest, @Query('status') status?: string, @Query('riskLevel') riskLevel?: string) {
    return this.svc.listAlerts(req.user.tenantId, { status, riskLevel });
  }

  @ApiOperation({ summary: 'Risk alert summary counts (by risk level / type)' })
  @Get('summary')
  @Permissions('crm.opportunity.read')
  async summary(@Req() req: AuthenticatedRequest) {
    return this.svc.getSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List risk alerts for one opportunity' })
  @Get('opportunities/:opportunityId')
  @Permissions('crm.opportunity.read')
  async forOpportunity(@Req() req: AuthenticatedRequest, @Param('opportunityId') opportunityId: string) {
    return this.svc.getAlertsForOpportunity(req.user.tenantId, opportunityId);
  }

  @ApiOperation({ summary: 'Acknowledge a risk alert' })
  @Post(':id/acknowledge')
  @Permissions('crm.opportunity.update')
  @TrackChanges('PipelineRiskAlert')
  async acknowledge(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.acknowledgeAlert(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Snooze a risk alert for N days' })
  @Post(':id/snooze')
  @Permissions('crm.opportunity.update')
  @TrackChanges('PipelineRiskAlert')
  async snooze(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(snoozeAlertSchema) dto: SnoozeAlertInput) {
    return this.svc.snoozeAlert(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Resolve a risk alert' })
  @Post(':id/resolve')
  @Permissions('crm.opportunity.update')
  @TrackChanges('PipelineRiskAlert')
  async resolve(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.resolveAlert(req.user.tenantId, id);
  }
}
