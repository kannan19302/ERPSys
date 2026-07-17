'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, Input, Textarea, type Column } from '@unerp/ui';
import { Phone, PlusCircle, Smile, Meh, Frown, X } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';
import styles from './page.module.css';

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
        <div className="font-semibold">{c.subject}</div>
        <div className="ui-text-xs-muted">{new Date(c.createdAt).toLocaleString()}</div>
      </div>
    ) },
    { key: 'aiSentiment', header: 'Sentiment', render: (c) => (
      <div className="ui-flex ui-items-center ui-gap-1">
        {sentimentIcon(c.aiSentiment)}
        <Badge variant={sentimentVariant(c.aiSentiment)}>{c.aiSentiment ?? 'N/A'}</Badge>
      </div>
    ) },
    { key: 'aiTalkTrackScore', header: 'Engagement Score', render: (c) => c.aiTalkTrackScore ?? '—' },
    { key: 'aiSummary', header: 'AI Summary', render: (c) => <span className="text-sm">{c.aiSummary ?? '—'}</span> },
    { key: 'aiActionItems', header: 'Action Items', render: (c) => (
      Array.isArray(c.aiActionItems) && c.aiActionItems.length > 0
        ? <span className="text-sm">{c.aiActionItems.join('; ')}</span>
        : <span className="ui-text-muted">None detected</span>
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Conversation Intelligence"
        description="Einstein Conversation Insights / HubSpot Breeze-style call logging with AI-generated summary, sentiment, and action items auto-attached to the deal timeline."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Conversation Intelligence' }]}
        actions={
          <ProtectedComponent permission="crm.activity.create">
            <Button variant="primary" onClick={() => setShowForm((v) => !v)} className="ui-hstack-2">
              {showForm ? <X size={16} /> : <PlusCircle size={16} />} {showForm ? 'Cancel' : 'Log Call'}
            </Button>
          </ProtectedComponent>
        }
      />

      {summary && (
        <div className={styles.summaryGrid}>
          <Card><div className="p-4">
            <div className="ui-text-xs-muted">Calls Analyzed</div>
            <div className="text-2xl">{summary.totalCallsAnalyzed}</div>
          </div></Card>
          <Card><div className="p-4">
            <div className="ui-text-xs-muted">Avg Engagement Score</div>
            <div className="text-2xl">{summary.averageTalkTrackScore ?? '—'}</div>
          </div></Card>
          <Card><div className="p-4">
            <div className="ui-text-xs-muted">Action Items Extracted</div>
            <div className="text-2xl">{summary.totalActionItemsExtracted}</div>
          </div></Card>
          {Object.entries(summary.bySentiment).map(([s, count]) => (
            <Card key={s}><div className="p-4">
              <div className="ui-text-xs-muted">{s}</div>
              <div className="text-2xl">{count}</div>
            </div></Card>
          ))}
        </div>
      )}

      {showForm && (
        <Card>
          <div className="p-4 ui-stack-3">
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
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : calls.length === 0 ? (
          <div className="ui-empty-state">
            <Phone size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Calls Logged Yet</div>
            <div className="text-sm">Log a call to get an AI-generated summary, sentiment, and action items.</div>
          </div>
        ) : (
          <DataTable<CallActivity> columns={columns} data={calls} rowKey={(c) => c.id} />
        )}
      </Card>
    </div>
  );
}
