import { Controller, Get, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { CrmConversationIntelligenceService, logCallSchema, LogCallInput } from './crm-conversation-intelligence.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

/**
 * Conversation Intelligence API (Up Next item 35, benchmark: Salesforce
 * Einstein Conversation Insights, HubSpot Breeze).
 */
@ApiTags('crm-conversation-intelligence')
@ApiBearerAuth()
@Controller('crm/conversation-intelligence')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmConversationIntelligenceController {
  constructor(private readonly svc: CrmConversationIntelligenceService) {}

  @ApiOperation({ summary: 'Log a call and auto-generate its AI summary/sentiment/action items' })
  @Post('calls')
  @Permissions('crm.activity.create')
  @TrackChanges('Activity')
  async logCall(@Req() req: AuthenticatedRequest, @ZodBody(logCallSchema) dto: LogCallInput) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.logCall(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Re-run AI analysis on a logged call (e.g. after a transcript correction)' })
  @Post('calls/:id/regenerate-summary')
  @Permissions('crm.activity.update')
  @TrackChanges('Activity')
  async regenerateSummary(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.regenerateSummary(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get one logged call with its full transcript + AI analysis' })
  @Get('calls/:id')
  @Permissions('crm.activity.read')
  async getCall(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.svc.getCall(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List logged calls, optionally filtered by deal/lead/customer/sentiment' })
  @Get('calls')
  @Permissions('crm.activity.read')
  async listCalls(
    @Req() req: AuthenticatedRequest,
    @Query('opportunityId') opportunityId?: string,
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,
    @Query('sentiment') sentiment?: string,
  ) {
    return this.svc.listCalls(req.user.tenantId, { opportunityId, leadId, customerId, sentiment });
  }

  @ApiOperation({ summary: 'Tenant-wide conversation intelligence rollup (sentiment mix, avg engagement score)' })
  @Get('insights/summary')
  @Permissions('crm.activity.read')
  async insightsSummary(@Req() req: AuthenticatedRequest) {
    return this.svc.getInsightsSummary(req.user.tenantId);
  }
}
