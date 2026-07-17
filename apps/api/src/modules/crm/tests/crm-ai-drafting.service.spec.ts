import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmAiDraftingService } from '../crm-ai-drafting.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: { findFirst: vi.fn() },
    quotation: { findFirst: vi.fn() },
    lead: { findFirst: vi.fn() },
    crmAiDraft: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';

describe('CrmAiDraftingService', () => {
  let service: CrmAiDraftingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmAiDraftingService();
    (prisma.crmAiDraft.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: unknown }) => Promise.resolve({ id: 'draft-1', status: 'DRAFT', ...(data as object) }));
  });

  describe('generateOpportunityFollowup', () => {
    it('throws NotFoundException when the opportunity does not exist', async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.generateOpportunityFollowup(TENANT, ORG, 'opp-x', 'PROFESSIONAL')).rejects.toThrow('Opportunity not found');
    });

    it('generates a follow-up email referencing deal context and persists it', async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'opp-1', name: 'Acme Renewal', stage: 'Negotiation', amount: { toString: () => '50000', valueOf: () => 50000 },
        expectedCloseDate: new Date(Date.now() + 5 * 86400_000),
        customer: { name: 'Acme Corp' },
        lineItems: [{ description: 'Enterprise Plan' }],
      });

      const draft = await service.generateOpportunityFollowup(TENANT, ORG, 'opp-1', 'PROFESSIONAL', 'user-1');

      expect(draft.body).toContain('Acme Corp');
      expect(draft.body).toContain('Negotiation');
      expect(draft.subject).toContain('Acme Renewal');
      expect(prisma.crmAiDraft.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ draftType: 'FOLLOWUP_EMAIL', contextType: 'OPPORTUNITY', contextId: 'opp-1', tone: 'PROFESSIONAL' }),
      }));
    });
  });

  describe('generateQuoteCoverNote', () => {
    it('throws NotFoundException when the quotation does not exist', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.generateQuoteCoverNote(TENANT, ORG, 'q-x', 'FRIENDLY')).rejects.toThrow('Quotation not found');
    });

    it('generates a cover note including quote number and total', async () => {
      (prisma.quotation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'q-1', quotationNumber: 'QTN-100', totalAmount: 1200, currency: 'USD',
        validUntil: new Date('2026-08-01'),
        customer: { name: 'Beta LLC' },
        lineItems: [{ description: 'Widget A' }, { description: 'Widget B' }],
      });

      const draft = await service.generateQuoteCoverNote(TENANT, ORG, 'q-1', 'FRIENDLY', 'user-1');
      expect(draft.subject).toContain('QTN-100');
      expect(draft.body).toContain('Beta LLC');
      expect(draft.body).toContain('Widget A');
    });
  });

  describe('generateLeadOutreach', () => {
    it('generates an outreach email referencing the lead source', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-1', firstName: 'Sam', lastName: 'Rivera', company: 'Rivera Co',
        source: { name: 'Trade Show' },
      });

      const draft = await service.generateLeadOutreach(TENANT, ORG, 'lead-1', 'CONCISE', 'user-1');
      expect(draft.body).toContain('Sam');
      expect(draft.body).toContain('Rivera Co');
      expect(draft.body).toContain('Trade Show');
    });
  });

  describe('draft lifecycle', () => {
    it('marks a draft as used', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'DRAFT' });
      (prisma.crmAiDraft.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'USED' });

      const result = await service.markUsed(TENANT, 'd1');
      expect(result.status).toBe('USED');
    });

    it('rejects marking an already-used draft as used again', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'USED' });
      await expect(service.markUsed(TENANT, 'd1')).rejects.toThrow('already used');
    });

    it('discards a draft', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'DRAFT' });
      (prisma.crmAiDraft.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'DISCARDED' });

      const result = await service.discard(TENANT, 'd1');
      expect(result.status).toBe('DISCARDED');
    });

    it('rejects editing a non-draft-status draft', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'USED' });
      await expect(service.updateDraftText(TENANT, 'd1', 'Subj', 'body text')).rejects.toThrow('Only drafts');
    });

    it('rejects an empty-body edit', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'DRAFT' });
      await expect(service.updateDraftText(TENANT, 'd1', 'Subj', '   ')).rejects.toThrow('Body cannot be empty');
    });

    it('updates draft text when in DRAFT status', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', status: 'DRAFT' });
      (prisma.crmAiDraft.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'd1', subject: 'New', body: 'New body' });

      const result = await service.updateDraftText(TENANT, 'd1', 'New', 'New body');
      expect(result.body).toBe('New body');
    });
  });

  describe('regenerate', () => {
    it('re-runs the same generator for the draft context type', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'd1', tenantId: TENANT, orgId: ORG, draftType: 'LEAD_OUTREACH_EMAIL', contextId: 'lead-1',
      });
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-1', firstName: 'Sam', lastName: 'Rivera', company: null, source: null,
      });

      const draft = await service.regenerate(TENANT, 'd1', 'URGENT');
      expect(draft.tone).toBe('URGENT');
    });

    it('throws NotFoundException when the draft to regenerate does not exist', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.regenerate(TENANT, 'missing', 'PROFESSIONAL')).rejects.toThrow('Draft not found');
    });
  });

  describe('listDrafts / getDraft', () => {
    it('lists drafts scoped to tenant and optional context', async () => {
      (prisma.crmAiDraft.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'd1' }]);
      const result = await service.listDrafts(TENANT, 'LEAD', 'lead-1');
      expect(result).toHaveLength(1);
      expect(prisma.crmAiDraft.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ tenantId: TENANT, contextType: 'LEAD', contextId: 'lead-1' }),
      }));
    });

    it('throws NotFoundException for a missing draft', async () => {
      (prisma.crmAiDraft.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getDraft(TENANT, 'missing')).rejects.toThrow('Draft not found');
    });
  });
});
