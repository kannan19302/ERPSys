import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { CrmAiDraftingService, CrmDraftTone } from './crm-ai-drafting.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

const VALID_TONES: CrmDraftTone[] = ['PROFESSIONAL', 'FRIENDLY', 'URGENT', 'CONCISE'];
function resolveTone(tone?: string): CrmDraftTone {
  return VALID_TONES.includes(tone as CrmDraftTone) ? (tone as CrmDraftTone) : 'PROFESSIONAL';
}

/**
 * AI-assisted email/quote drafting API (Up Next item 41).
 */
@ApiTags('crm-ai-drafting')
@ApiBearerAuth()
@Controller('crm/ai-drafting')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmAiDraftingController {
  constructor(private readonly svc: CrmAiDraftingService) {}

  @ApiOperation({ summary: 'Generate a follow-up email draft for an opportunity/deal' })
  @ApiQuery({ name: 'tone', required: false, enum: VALID_TONES })
  @Post('opportunities/:opportunityId/followup')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async generateOpportunityFollowup(
    @Req() req: AuthenticatedRequest,
    @Param('opportunityId') opportunityId: string,
    @Query('tone') tone?: string,
  ) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.generateOpportunityFollowup(req.user.tenantId, orgId, opportunityId, resolveTone(tone), req.user.userId);
  }

  @ApiOperation({ summary: 'Generate an AI cover note draft for a quotation' })
  @ApiQuery({ name: 'tone', required: false, enum: VALID_TONES })
  @Post('quotations/:quotationId/cover-note')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async generateQuoteCoverNote(
    @Req() req: AuthenticatedRequest,
    @Param('quotationId') quotationId: string,
    @Query('tone') tone?: string,
  ) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.generateQuoteCoverNote(req.user.tenantId, orgId, quotationId, resolveTone(tone), req.user.userId);
  }

  @ApiOperation({ summary: 'Generate an AI outreach email draft for a lead' })
  @ApiQuery({ name: 'tone', required: false, enum: VALID_TONES })
  @Post('leads/:leadId/outreach')
  @Permissions('crm.lead.update')
  @TrackChanges('CrmAiDraft')
  async generateLeadOutreach(
    @Req() req: AuthenticatedRequest,
    @Param('leadId') leadId: string,
    @Query('tone') tone?: string,
  ) {
    const orgId = req.user.orgId ?? req.user.tenantId;
    return this.svc.generateLeadOutreach(req.user.tenantId, orgId, leadId, resolveTone(tone), req.user.userId);
  }

  @ApiOperation({ summary: 'Regenerate an existing draft (same context, optionally a new tone)' })
  @ApiQuery({ name: 'tone', required: false, enum: VALID_TONES })
  @Post(':draftId/regenerate')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async regenerate(@Req() req: AuthenticatedRequest, @Param('draftId') draftId: string, @Query('tone') tone?: string) {
    return this.svc.regenerate(req.user.tenantId, draftId, resolveTone(tone), req.user.userId);
  }

  @ApiOperation({ summary: 'List drafts, optionally scoped to a context (opportunity/quotation/lead)' })
  @ApiQuery({ name: 'contextType', required: false })
  @ApiQuery({ name: 'contextId', required: false })
  @Get()
  @Permissions('crm.opportunity.read')
  async list(@Req() req: AuthenticatedRequest, @Query('contextType') contextType?: string, @Query('contextId') contextId?: string) {
    return this.svc.listDrafts(req.user.tenantId, contextType, contextId);
  }

  @ApiOperation({ summary: 'Get a single draft' })
  @Get(':draftId')
  @Permissions('crm.opportunity.read')
  async getOne(@Req() req: AuthenticatedRequest, @Param('draftId') draftId: string) {
    return this.svc.getDraft(req.user.tenantId, draftId);
  }

  @ApiOperation({ summary: 'Edit a draft\'s subject/body before sending' })
  @Patch(':draftId')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('draftId') draftId: string,
    @Body() body: { subject?: string; body: string },
  ) {
    return this.svc.updateDraftText(req.user.tenantId, draftId, body.subject, body.body);
  }

  @ApiOperation({ summary: 'Mark a draft as used (sent by the rep through their own email client)' })
  @Post(':draftId/mark-used')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async markUsed(@Req() req: AuthenticatedRequest, @Param('draftId') draftId: string) {
    return this.svc.markUsed(req.user.tenantId, draftId);
  }

  @ApiOperation({ summary: 'Discard a draft' })
  @Post(':draftId/discard')
  @Permissions('crm.opportunity.update')
  @TrackChanges('CrmAiDraft')
  async discard(@Req() req: AuthenticatedRequest, @Param('draftId') draftId: string) {
    return this.svc.discard(req.user.tenantId, draftId);
  }
}
