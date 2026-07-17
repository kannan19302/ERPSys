'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { AlertTriangle, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../../src/lib/api';
import styles from './page.module.css';

interface RiskAlert {
  id: string;
  opportunityId: string;
  alertType: 'STAGE_STALL' | 'CLOSE_DATE_SLIPPED' | 'LOW_CONFIDENCE' | 'NO_ACTIVITY';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  daysInStage: number | null;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'SNOOZED' | 'RESOLVED';
  createdAt: string;
  opportunity?: { id: string; name: string; stage: string; amount: string | null; probability: number };
}

interface Summary {
  totalOpen: number;
  byRiskLevel: Record<string, number>;
  byType: Record<string, number>;
}

const riskVariant = (level: string): 'danger' | 'warning' | 'info' | 'default' => {
  if (level === 'CRITICAL') return 'danger';
  if (level === 'HIGH') return 'warning';
  if (level === 'MEDIUM') return 'info';
  return 'default';
};

export default function PipelineRiskAlertsPage() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [alertList, summaryData] = await Promise.all([
        apiGet<RiskAlert[]>('/crm/pipeline-risk'),
        apiGet<Summary>('/crm/pipeline-risk/summary'),
      ]);
      setAlerts(Array.isArray(alertList) ? alertList : []);
      setSummary(summaryData);
    } catch (err) {
      toast.error('Could not load pipeline risk alerts', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const recompute = async () => {
    setRecomputing(true);
    try {
      const result = await apiPost<{ scanned: number; created: number; updated: number; resolved: number }>('/crm/pipeline-risk/recompute', {});
      toast.success('Pipeline risk recomputed', `Scanned ${result.scanned} deals — ${result.created} new, ${result.updated} updated, ${result.resolved} resolved.`);
      await load();
    } catch (err) {
      toast.error('Recompute failed', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setRecomputing(false);
    }
  };

  const acknowledge = async (id: string) => {
    try {
      await apiPost(`/crm/pipeline-risk/${id}/acknowledge`, {});
      toast.success('Alert acknowledged');
      await load();
    } catch (err) {
      toast.error('Could not acknowledge alert', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const snooze = async (id: string) => {
    try {
      await apiPost(`/crm/pipeline-risk/${id}/snooze`, { days: 7 });
      toast.success('Alert snoozed for 7 days');
      await load();
    } catch (err) {
      toast.error('Could not snooze alert', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const resolve = async (id: string) => {
    try {
      await apiPost(`/crm/pipeline-risk/${id}/resolve`, {});
      toast.success('Alert resolved');
      await load();
    } catch (err) {
      toast.error('Could not resolve alert', err instanceof ApiRequestError ? err.message : undefined);
    }
  };

  const columns: Column<RiskAlert>[] = [
    { key: 'deal', header: 'Deal', render: (a) => (
      <div>
        <div className="font-semibold">{a.opportunity?.name ?? a.opportunityId}</div>
        <div className="ui-text-xs-muted">{a.opportunity?.stage}</div>
      </div>
    ) },
    { key: 'alertType', header: 'Risk Type', render: (a) => a.alertType.replace(/_/g, ' ') },
    { key: 'riskLevel', header: 'Level', render: (a) => <Badge variant={riskVariant(a.riskLevel)}>{a.riskLevel}</Badge> },
    { key: 'message', header: 'Detail', render: (a) => <span className="text-sm">{a.message}</span> },
    { key: 'status', header: 'Status', render: (a) => <Badge variant={a.status === 'OPEN' ? 'default' : a.status === 'ACKNOWLEDGED' ? 'info' : 'default'}>{a.status}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (a) => (
      <ProtectedComponent permission="crm.opportunity.update">
        <div className="ui-flex-end ui-gap-2">
          {a.status === 'OPEN' && (
            <Button variant="secondary" onClick={() => acknowledge(a.id)} className="ui-flex ui-items-center ui-gap-1">
              <CheckCircle2 size={14} /> Ack
            </Button>
          )}
          {a.status !== 'SNOOZED' && (
            <Button variant="secondary" onClick={() => snooze(a.id)} className="ui-flex ui-items-center ui-gap-1">
              <Clock size={14} /> Snooze
            </Button>
          )}
          <Button variant="secondary" onClick={() => resolve(a.id)} className="ui-flex ui-items-center ui-gap-1">
            <XCircle size={14} /> Resolve
          </Button>
        </div>
      </ProtectedComponent>
    ) },
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Pipeline Risk Alerts"
        description="Einstein Pipeline Inspection-style stage-stall, close-date slippage, low-confidence, and no-activity risk detection across the whole pipeline."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Forecasting', href: '/crm/forecasting' }, { label: 'Pipeline Risk Alerts' }]}
        actions={
          <ProtectedComponent permission="crm.opportunity.update">
            <Button variant="primary" onClick={recompute} disabled={recomputing} className="ui-hstack-2">
              <RefreshCw size={16} /> {recomputing ? 'Recomputing…' : 'Recompute Alerts'}
            </Button>
          </ProtectedComponent>
        }
      />

      {summary && (
        <div className={styles.summaryGrid}>
          <Card><div className="p-4">
            <div className="ui-text-xs-muted">Total Open</div>
            <div className="text-2xl">{summary.totalOpen}</div>
          </div></Card>
          {Object.entries(summary.byRiskLevel).map(([level, count]) => (
            <Card key={level}><div className="p-4">
              <div className="ui-text-xs-muted">{level}</div>
              <div className="text-2xl">{count}</div>
            </div></Card>
          ))}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="ui-center-pad"><Spinner size="lg" /></div>
        ) : alerts.length === 0 ? (
          <div className="ui-empty-state">
            <AlertTriangle size={48} className="ui-hr-faded" />
            <div className="font-semibold">No Risk Alerts</div>
            <div className="text-sm">Click "Recompute Alerts" to scan the pipeline for stalled or at-risk deals.</div>
          </div>
        ) : (
          <DataTable<RiskAlert> columns={columns} data={alerts} rowKey={(a) => a.id} />
        )}
      </Card>
    </div>
  );
}
