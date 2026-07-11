'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, Input, Textarea, type Column } from '@unerp/ui';
import { Phone, PlusCircle, Smile, Meh, Frown, X } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

interface CallActivity {
  id: string;
  subject: string;
  description: string | null;
  opportunityId: string | null;
  leadId: string | null;
  customerId: string | null;
  callDurationSec: number | null;
  aiSummary: string | null;
  aiSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null;
  aiActionItems: string[] | null;
  aiTalkTrackScore: number | null;
  createdAt: string;
}

interface InsightsSummary {
  totalCallsAnalyzed: number;
  bySentiment: Record<string, number>;
  averageTalkTrackScore: number | null;
  totalActionItemsExtracted: number;
}

const sentimentIcon = (s: string | null) => {
  if (s === 'POSITIVE') return <Smile size={14} color="var(--color-success)" />;
  if (s === 'NEGATIVE') return <Frown size={14} color="var(--color-danger)" />;
  return <Meh size={14} color="var(--color-text-secondary)" />;
};

const sentimentVariant = (s: string | null): 'success' | 'danger' | 'default' => {
  if (s === 'POSITIVE') return 'success';
  if (s === 'NEGATIVE') return 'danger';
  return 'default';
};

export default function ConversationIntelligencePage() {
  const [calls, setCalls] = useState<CallActivity[]>([]);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', opportunityId: '', transcriptText: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [callList, summaryData] = await Promise.all([
        apiGet<CallActivity[]>('/crm/conversation-intelligence/calls'),
        apiGet<InsightsSummary>('/crm/conversation-intelligence/insights/summary'),
      ]);
      setCalls(Array.isArray(callList) ? callList : []);
      setSummary(summaryData);
    } catch (err) {
      toast.error('Could not load conversation intelligence', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const logCall = async () => {
    if (!form.subject.trim() || !form.transcriptText.trim() || !form.opportunityId.trim()) {
      toast.error('Subject, deal ID, and transcript are required');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/crm/conversation-intelligence/calls', {
        subject: form.subject,
        opportunityId: form.opportunityId,
        transcriptText: form.transcriptText,
      });
      toast.success('Call logged', 'AI summary, sentiment, and action items generated.');
      setForm({ subject: '', opportunityId: '', transcriptText: '' });
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error('Could not log call', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<CallActivity>[] = [
    { key: 'subject', header: 'Call', render: (c) => (
      <div>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>{c.subject}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(c.createdAt).toLocaleString()}</div>
      </div>
    ) },
    { key: 'aiSentiment', header: 'Sentiment', render: (c) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        {sentimentIcon(c.aiSentiment)}
        <Badge variant={sentimentVariant(c.aiSentiment)}>{c.aiSentiment ?? 'N/A'}</Badge>
      </div>
    ) },
    { key: 'aiTalkTrackScore', header: 'Engagement Score', render: (c) => c.aiTalkTrackScore ?? '—' },
    { key: 'aiSummary', header: 'AI Summary', render: (c) => <span style={{ fontSize: 'var(--text-sm)' }}>{c.aiSummary ?? '—'}</span> },
    { key: 'aiActionItems', header: 'Action Items', render: (c) => (
      Array.isArray(c.aiActionItems) && c.aiActionItems.length > 0
        ? <span style={{ fontSize: 'var(--text-sm)' }}>{c.aiActionItems.join('; ')}</span>
        : <span style={{ color: 'var(--color-text-secondary)' }}>None detected</span>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Conversation Intelligence"
        description="Einstein Conversation Insights / HubSpot Breeze-style call logging with AI-generated summary, sentiment, and action items auto-attached to the deal timeline."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Conversation Intelligence' }]}
        actions={
          <ProtectedComponent permission="crm.activity.create">
            <Button variant="primary" onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {showForm ? <X size={16} /> : <PlusCircle size={16} />} {showForm ? 'Cancel' : 'Log Call'}
            </Button>
          </ProtectedComponent>
        }
      />

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
          <Card><div style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Calls Analyzed</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.totalCallsAnalyzed}</div>
          </div></Card>
          <Card><div style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Avg Engagement Score</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.averageTalkTrackScore ?? '—'}</div>
          </div></Card>
          <Card><div style={{ padding: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Action Items Extracted</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{summary.totalActionItemsExtracted}</div>
          </div></Card>
          {Object.entries(summary.bySentiment).map(([s, count]) => (
            <Card key={s}><div style={{ padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{s}</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{count}</div>
            </div></Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input placeholder="Call subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <Input placeholder="Opportunity ID" value={form.opportunityId} onChange={(e) => setForm((f) => ({ ...f, opportunityId: e.target.value }))} />
            <Textarea
              placeholder="Paste the call transcript here…"
              rows={6}
              value={form.transcriptText}
              onChange={(e) => setForm((f) => ({ ...f, transcriptText: e.target.value }))}
            />
            <div>
              <Button variant="primary" onClick={logCall} disabled={saving}>{saving ? 'Analyzing…' : 'Log Call & Generate Summary'}</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : calls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <Phone size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Calls Logged Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Log a call to get an AI-generated summary, sentiment, and action items.</div>
          </div>
        ) : (
          <DataTable<CallActivity> columns={columns} data={calls} rowKey={(c) => c.id} />
        )}
      </Card>
    </div>
  );
}
