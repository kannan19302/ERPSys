'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { Send, RefreshCw, Inbox } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../../src/lib/api';

interface DigestRun {
  id: string;
  recipientUserId: string;
  scope: 'REP' | 'MANAGER';
  periodStart: string;
  periodEnd: string;
  newAlertCount: number;
  openAlertCount: number;
  criticalCount: number;
  atRiskDealCount: number;
  atRiskPipelineValue: string;
  sentAt: string;
}

interface GenerateResult {
  periodStart: string;
  periodEnd: string;
  repDigestsSent: number;
  managerDigestsSent: number;
  totalOpenAlerts: number;
}

export default function RevenueIntelligenceDigestPage() {
  const [runs, setRuns] = useState<DigestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<DigestRun[]>('/crm/revenue-intelligence/digest/runs');
      setRuns(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Could not load digest history', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const generate = async (windowHours: number) => {
    setGenerating(true);
    try {
      const result = await apiPost<GenerateResult>(`/crm/revenue-intelligence/digest/generate?windowHours=${windowHours}`, {});
      toast.success(
        'Deal-risk digest sent',
        `${result.repDigestsSent} rep digest(s), ${result.managerDigestsSent} manager digest(s) — ${result.totalOpenAlerts} open alerts covered.`,
      );
      await load();
    } catch (err) {
      toast.error('Could not generate digest', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setGenerating(false);
    }
  };

  const columns: Column<DigestRun>[] = [
    { key: 'recipient', header: 'Recipient', render: (r) => (
      <div>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>{r.recipientUserId}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          <Badge variant={r.scope === 'MANAGER' ? 'info' : 'default'}>{r.scope === 'MANAGER' ? 'Team rollup' : 'Rep digest'}</Badge>
        </div>
      </div>
    ) },
    { key: 'openAlertCount', header: 'Open Alerts', render: (r) => r.openAlertCount },
    { key: 'newAlertCount', header: 'New', render: (r) => r.newAlertCount },
    { key: 'criticalCount', header: 'Critical', render: (r) => r.criticalCount > 0 ? <Badge variant="danger">{r.criticalCount}</Badge> : r.criticalCount },
    { key: 'atRiskDealCount', header: 'Deals at Risk', render: (r) => r.atRiskDealCount },
    { key: 'atRiskPipelineValue', header: 'Pipeline Value at Risk', render: (r) => `$${Number(r.atRiskPipelineValue).toLocaleString()}` },
    { key: 'sentAt', header: 'Sent', render: (r) => new Date(r.sentAt).toLocaleString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Revenue Intelligence — Deal-Risk Digest"
        description="Gong/Clari-style daily or weekly digest of new and open pipeline risk alerts, sent to each rep and rolled up for managers."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Forecasting', href: '/crm/forecasting' }, { label: 'Revenue Intelligence' }]}
        actions={
          <ProtectedComponent permission="crm.opportunity.update">
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => generate(24)} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Send size={16} /> Send Daily Digest
              </Button>
              <Button variant="primary" onClick={() => generate(168)} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <RefreshCw size={16} /> {generating ? 'Sending…' : 'Send Weekly Digest'}
              </Button>
            </div>
          </ProtectedComponent>
        }
      />

      <Card>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <Inbox size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Digests Sent Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Send a daily or weekly digest to notify reps and managers of at-risk deals.</div>
          </div>
        ) : (
          <DataTable<DigestRun> columns={columns} data={runs} rowKey={(r) => r.id} />
        )}
      </Card>
    </div>
  );
}
