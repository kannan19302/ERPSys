import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

export type CrmDraftType = 'FOLLOWUP_EMAIL' | 'QUOTE_COVER_NOTE' | 'LEAD_OUTREACH_EMAIL';
export type CrmDraftTone = 'PROFESSIONAL' | 'FRIENDLY' | 'URGENT' | 'CONCISE';

const TONE_OPENERS: Record<CrmDraftTone, string> = {
  PROFESSIONAL: 'I hope this note finds you well.',
  FRIENDLY: 'Hope you\'re having a great week!',
  URGENT: 'Reaching out with a time-sensitive update.',
  CONCISE: '',
};

const TONE_SIGNOFFS: Record<CrmDraftTone, string> = {
  PROFESSIONAL: 'Best regards,',
  FRIENDLY: 'Talk soon,',
  URGENT: 'Please let me know at your earliest convenience,',
  CONCISE: 'Regards,',
};

/**
 * AI-assisted email/quote drafting (Up Next item 41, benchmark: Salesforce
 * Einstein GPT, HubSpot Breeze Copilot).
 *
 * Consistent with the deterministic "AI" pattern already sanctioned for
 * `CrmConversationIntelligenceService` (no cross-module call into the
 * `ai` module's self-hosted-Ollama service — that stays scoped to Builder
 * Studio's code-generation use case): draft content is generated from a
 * structured template engine driven by real deal/quote/lead context
 * (amount, stage, product lines, days-to-close, rep name), with tone
 * variants and every draft persisted to `CrmAiDraft` for auditability and
 * "was this AI draft actually sent" tracking — the review/edit/send step
 * always stays a human action, never auto-sent.
 */
@Injectable()
export class CrmAiDraftingService {
  async generateOpportunityFollowup(
    tenantId: string,
    orgId: string,
    opportunityId: string,
    tone: CrmDraftTone,
    generatedBy?: string,
  ) {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { customer: { select: { name: true } }, lineItems: { select: { description: true } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const customerName = opp.customer?.name ?? 'there';
    const amountText = opp.amount ? `$${Number(opp.amount).toLocaleString()}` : 'the proposed investment';
    const stageContext = this.stageFollowupLine(opp.stage);
    const daysToClose = opp.expectedCloseDate
      ? Math.round((opp.expectedCloseDate.getTime() - Date.now()) / 86400_000)
      : null;
    const productLine = opp.lineItems.length > 0
      ? ` around ${opp.lineItems.slice(0, 3).map((li) => li.description).join(', ')}`
      : '';

    const opener = TONE_OPENERS[tone];
    const signoff = TONE_SIGNOFFS[tone];
    const urgencyLine = daysToClose !== null && daysToClose <= 14 && daysToClose >= 0
      ? ` With our target close date ${daysToClose === 0 ? 'today' : `in ${daysToClose} day${daysToClose === 1 ? '' : 's'}`}, I wanted to make sure we're aligned on next steps.`
      : '';

    const subject = `Following up: ${opp.name}`;
    const body = [
      opener,
      `${opener ? ' ' : ''}I wanted to follow up on our conversation${productLine} for ${customerName}, currently at the ${opp.stage} stage with ${amountText} on the table.`,
      stageContext,
      urgencyLine,
      'Happy to jump on a quick call this week if useful — let me know what works.',
      '',
      signoff,
    ].filter(Boolean).join(' ').replace(/  +/g, ' ').trim();

    return this.persistDraft(tenantId, orgId, 'FOLLOWUP_EMAIL', 'OPPORTUNITY', opportunityId, tone, subject, body, generatedBy);
  }

  async generateQuoteCoverNote(
    tenantId: string,
    orgId: string,
    quotationId: string,
    tone: CrmDraftTone,
    generatedBy?: string,
  ) {
    const quote = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId, deletedAt: null },
      include: { customer: { select: { name: true } }, lineItems: { select: { description: true }, take: 5 } },
    });
    if (!quote) throw new NotFoundException('Quotation not found');

    const customerName = quote.customer?.name ?? 'there';
    const totalText = `$${Number(quote.totalAmount).toLocaleString()} ${quote.currency}`;
    const validUntilText = quote.validUntil.toISOString().slice(0, 10);
    const lineSummary = quote.lineItems.length > 0
      ? quote.lineItems.map((li) => `- ${li.description}`).join('\n')
      : '- (see attached line items)';

    const opener = TONE_OPENERS[tone];
    const signoff = TONE_SIGNOFFS[tone];

    const subject = `Your quotation ${quote.quotationNumber} from us`;
    const body = [
      `${opener ? opener + ' ' : ''}Please find attached quotation ${quote.quotationNumber} for ${customerName}, totaling ${totalText}.`,
      '',
      'Summary of what\'s included:',
      lineSummary,
      '',
      `This quote is valid until ${validUntilText}. Let us know if you'd like to walk through any of the line items or discuss adjustments.`,
      '',
      signoff,
    ].join('\n').trim();

    return this.persistDraft(tenantId, orgId, 'QUOTE_COVER_NOTE', 'QUOTATION', quotationId, tone, subject, body, generatedBy);
  }

  async generateLeadOutreach(
    tenantId: string,
    orgId: string,
    leadId: string,
    tone: CrmDraftTone,
    generatedBy?: string,
  ) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId, deletedAt: null },
      include: { source: { select: { name: true } } },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const firstName = lead.firstName || 'there';
    const companyLine = lead.company ? ` at ${lead.company}` : '';
    const sourceLine = lead.source?.name ? ` I noticed you came in through ${lead.source.name}` : '';

    const opener = TONE_OPENERS[tone];
    const signoff = TONE_SIGNOFFS[tone];

    const subject = `Quick hello from our team${lead.company ? ` — ${lead.company}` : ''}`;
    const body = [
      `${opener ? opener + ' ' : ''}Hi ${firstName}, I'm reaching out to you${companyLine}.${sourceLine} — thanks for your interest.`,
      'I\'d love to learn more about what you\'re looking to solve and see if we\'re a good fit. Would you have 15 minutes this week for a quick call?',
      '',
      signoff,
    ].join(' ').replace(/  +/g, ' ').trim();

    return this.persistDraft(tenantId, orgId, 'LEAD_OUTREACH_EMAIL', 'LEAD', leadId, tone, subject, body, generatedBy);
  }

  async regenerate(tenantId: string, draftId: string, tone: CrmDraftTone, generatedBy?: string) {
    const existing = await prisma.crmAiDraft.findFirst({ where: { id: draftId, tenantId } });
    if (!existing) throw new NotFoundException('Draft not found');
    if (existing.draftType === 'FOLLOWUP_EMAIL') {
      return this.generateOpportunityFollowup(tenantId, existing.orgId, existing.contextId, tone, generatedBy);
    }
    if (existing.draftType === 'QUOTE_COVER_NOTE') {
      return this.generateQuoteCoverNote(tenantId, existing.orgId, existing.contextId, tone, generatedBy);
    }
    return this.generateLeadOutreach(tenantId, existing.orgId, existing.contextId, tone, generatedBy);
  }

  async listDrafts(tenantId: string, contextType?: string, contextId?: string) {
    return prisma.crmAiDraft.findMany({
      where: {
        tenantId,
        ...(contextType && { contextType }),
        ...(contextId && { contextId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getDraft(tenantId: string, draftId: string) {
    const draft = await prisma.crmAiDraft.findFirst({ where: { id: draftId, tenantId } });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  async markUsed(tenantId: string, draftId: string) {
    const draft = await prisma.crmAiDraft.findFirst({ where: { id: draftId, tenantId } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.status !== 'DRAFT') throw new BadRequestException(`Draft is already ${draft.status.toLowerCase()}`);
    return prisma.crmAiDraft.update({ where: { id: draftId }, data: { status: 'USED', usedAt: new Date() } });
  }

  async discard(tenantId: string, draftId: string) {
    const draft = await prisma.crmAiDraft.findFirst({ where: { id: draftId, tenantId } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.status !== 'DRAFT') throw new BadRequestException(`Draft is already ${draft.status.toLowerCase()}`);
    return prisma.crmAiDraft.update({ where: { id: draftId }, data: { status: 'DISCARDED', discardedAt: new Date() } });
  }

  async updateDraftText(tenantId: string, draftId: string, subject: string | undefined, body: string) {
    const draft = await prisma.crmAiDraft.findFirst({ where: { id: draftId, tenantId } });
    if (!draft) throw new NotFoundException('Draft not found');
    if (draft.status !== 'DRAFT') throw new BadRequestException('Only drafts in DRAFT status can be edited');
    if (!body || body.trim().length === 0) throw new BadRequestException('Body cannot be empty');
    return prisma.crmAiDraft.update({ where: { id: draftId }, data: { subject, body } });
  }

  // ---- internal helpers ----

  private stageFollowupLine(stage: string): string {
    switch (stage.toUpperCase()) {
      case 'PROPOSAL':
        return 'I wanted to check in on the proposal and see if you had any questions before moving forward.';
      case 'NEGOTIATION':
        return 'I know we\'re working through the final details — happy to hop on a call to close the gap.';
      case 'QUALIFICATION':
        return 'I\'d love to learn more about your evaluation timeline and how we can best support it.';
      default:
        return 'I wanted to check in and see how things are progressing on your end.';
    }
  }

  private async persistDraft(
    tenantId: string,
    orgId: string,
    draftType: CrmDraftType,
    contextType: 'OPPORTUNITY' | 'QUOTATION' | 'LEAD',
    contextId: string,
    tone: CrmDraftTone,
    subject: string,
    body: string,
    generatedBy?: string,
  ) {
    return prisma.crmAiDraft.create({
      data: { tenantId, orgId, draftType, contextType, contextId, tone, subject, body, generatedBy },
    });
  }
}
