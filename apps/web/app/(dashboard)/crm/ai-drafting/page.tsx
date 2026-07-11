'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, Input, Textarea, Select, type Column } from '@unerp/ui';
import { Sparkles, RefreshCw, Check, Trash2, Edit2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch, ApiRequestError } from '../../../../src/lib/api';

type DraftType = 'FOLLOWUP_EMAIL' | 'QUOTE_COVER_NOTE' | 'LEAD_OUTREACH_EMAIL';
type Tone = 'PROFESSIONAL' | 'FRIENDLY' | 'URGENT' | 'CONCISE';

interface AiDraft {
  id: string;
  draftType: DraftType;
  contextType: 'OPPORTUNITY' | 'QUOTATION' | 'LEAD';
  contextId: string;
  tone: Tone;
  subject: string | null;
  body: string;
  status: 'DRAFT' | 'USED' | 'DISCARDED';
  createdAt: string;
}

const DRAFT_KIND_LABEL: Record<DraftType, string> = {
  FOLLOWUP_EMAIL: 'Opportunity Follow-Up',
  QUOTE_COVER_NOTE: 'Quote Cover Note',
  LEAD_OUTREACH_EMAIL: 'Lead Outreach',
};

const statusVariant = (s: AiDraft['status']): 'success' | 'danger' | 'default' =>
  s === 'USED' ? 'success' : s === 'DISCARDED' ? 'danger' : 'default';

export default function AiDraftingPage() {
  const [drafts, setDrafts] = useState<AiDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [kind, setKind] = useState<DraftType>('FOLLOWUP_EMAIL');
  const [contextId, setContextId] = useState('');
  const [tone, setTone] = useState<Tone>('PROFESSIONAL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<AiDraft[]>('/crm/ai-drafting');
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Could not load AI drafts', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const endpointFor = (draftKind: DraftType) => {
    if (draftKind === 'FOLLOWUP_EMAIL') return `/crm/ai-drafting/opportunities/${contextId}/followup`;
    if (draftKind === 'QUOTE_COVER_NOTE') return `/crm/ai-drafting/quotations/${contextId}/cover-note`;
    return `/crm/ai-drafting/leads/${contextId}/outreach`;
  };

  const generate = async () => {
    if (!contextId.trim()) {
      toast.error('Enter an opportunity/quotation/lead ID to generate a draft for');
      return;
    }
    setGenerating(true);
    try {
      await apiPost(`${endpointFor(kind)}?tone=${tone}`, {});
      toast.success('Draft generated', 'Review, edit, and send it from your own email client — nothing is auto-sent.');
      setContextId('');
      await load();
    } catch (err) {
      toast.error('Could not generate draft', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setGenerating(false);
    }
  };

  const regenerate = async (draftId: string, newTone: Tone) => {
    try {
      await apiPost(`/crm/ai-drafting/${draftId}/regenerate?tone=${newTone}`, {});
      toast.success('Draft regenerated');
      await load();
    } catch (err) {
      toast.error('Could not regenerate draft', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const markUsed = async (draftId: string) => {
    try {
      await apiPost(`/crm/ai-drafting/${draftId}/mark-used`, {});
      toast.success('Marked as used');
      await load();
    } catch (err) {
      toast.error('Could not update draft', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const discard = async (draftId: string) => {
    try {
      await apiPost(`/crm/ai-drafting/${draftId}/discard`, {});
      toast.success('Draft discarded');
      await load();
    } catch (err) {
      toast.error('Could not discard draft', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const startEdit = (draft: AiDraft) => {
    setEditingId(draft.id);
    setEditSubject(draft.subject ?? '');
    setEditBody(draft.body);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await apiPatch(`/crm/ai-drafting/${editingId}`, { subject: editSubject, body: editBody });
      toast.success('Draft updated');
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error('Could not save edits', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const columns: Column<AiDraft>[] = [
    { key: 'draftType', header: 'Type', render: (d) => (
      <div>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>{DRAFT_KIND_LABEL[d.draftType]}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{d.contextId}</div>
      </div>
    ) },
    { key: 'tone', header: 'Tone', render: (d) => <Badge variant="default">{d.tone}</Badge> },
    { key: 'subject', header: 'Subject', render: (d) => d.subject ?? '—' },
    { key: 'body', header: 'Preview', render: (d) => (
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{d.body.slice(0, 90)}{d.body.length > 90 ? '…' : ''}</span>
    ) },
    { key: 'status', header: 'Status', render: (d) => <Badge variant={statusVariant(d.status)}>{d.status}</Badge> },
    { key: 'actions', header: 'Actions', render: (d) => (
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="ghost" onClick={() => startEdit(d)} disabled={d.status !== 'DRAFT'} title="Edit"><Edit2 size={14} /></Button>
        <Button variant="ghost" onClick={() => regenerate(d.id, d.tone)} title="Regenerate"><RefreshCw size={14} /></Button>
        <Button variant="ghost" onClick={() => markUsed(d.id)} disabled={d.status !== 'DRAFT'} title="Mark used"><Check size={14} /></Button>
        <Button variant="ghost" onClick={() => discard(d.id)} disabled={d.status !== 'DRAFT'} title="Discard"><Trash2 size={14} /></Button>
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="AI-Assisted Email & Quote Drafting"
        description="Einstein GPT / Breeze Copilot-style follow-up email and quote cover-note drafting from real deal context. Every draft is reviewed and sent by a human — nothing is auto-sent."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'AI Drafting' }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Draft Type</div>
            <Select value={kind} onChange={(e) => setKind(e.target.value as DraftType)}>
              <option value="FOLLOWUP_EMAIL">Opportunity Follow-Up</option>
              <option value="QUOTE_COVER_NOTE">Quote Cover Note</option>
              <option value="LEAD_OUTREACH_EMAIL">Lead Outreach</option>
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
              {kind === 'FOLLOWUP_EMAIL' ? 'Opportunity ID' : kind === 'QUOTE_COVER_NOTE' ? 'Quotation ID' : 'Lead ID'}
            </div>
            <Input value={contextId} onChange={(e) => setContextId(e.target.value)} placeholder="Paste ID…" />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Tone</div>
            <Select value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
              <option value="PROFESSIONAL">Professional</option>
              <option value="FRIENDLY">Friendly</option>
              <option value="URGENT">Urgent</option>
              <option value="CONCISE">Concise</option>
            </Select>
          </div>
          <Button variant="primary" onClick={generate} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles size={16} /> {generating ? 'Generating…' : 'Generate Draft'}
          </Button>
        </div>
      </Card>

      {editingId && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>Edit Draft</div>
            <Input placeholder="Subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            <Textarea rows={8} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="primary" onClick={saveEdit}>Save</Button>
              <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <Sparkles size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Drafts Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Generate a follow-up email, quote cover note, or lead outreach draft above.</div>
          </div>
        ) : (
          <DataTable<AiDraft> columns={columns} data={drafts} rowKey={(d) => d.id} />
        )}
      </Card>
    </div>
  );
}
