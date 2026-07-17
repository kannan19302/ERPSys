'use client';

import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  MailWarning, AlertTriangle, Play, Loader2, RefreshCw,
  Plus, Trash2, Pause, RotateCcw, BarChart3, TrendingUp,
  CheckCircle2, Mail, DollarSign, Clock
} from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface DunningLevel {
  id: string;
  levelName: string;
  daysOverdue: number;
  feeAmount: number | string;
  status: string;
}

interface DunningRun {
  id: string;
  runDate: string;
  status: string;
  totalInvoices: number;
}

interface DunningStats {
  totalRuns: number;
  completedRuns: number;
  successRate: number;
  totalFeeCollected: number;
  totalEmailsSent: number;
  byLevel: { level: string; count: number; fees: number }[];
}

export default function ARAutomationPage() {
  const client = useApiClient();
  const [levels, setLevels] = useState<DunningLevel[]>([]);
  const [runs, setRuns] = useState<DunningRun[]>([]);
  const [stats, setStats] = useState<DunningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningDunning, setRunningDunning] = useState(false);
  const [showLevelForm, setShowLevelForm] = useState(false);
  const [levelData, setLevelData] = useState({ levelName: '', daysOverdue: '', feeAmount: '' });
  const [pauseInvoiceId, setPauseInvoiceId] = useState('');
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [pauseAction, setPauseAction] = useState<'pause' | 'resume'>('pause');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [levelsResponse, runsResponse, statsResponse] = await Promise.all([
        client.get<DunningLevel[] | { data?: DunningLevel[] }>('/advanced-finance/dunning-levels'),
        client.get<DunningRun[] | { data?: DunningRun[] }>('/advanced-finance/dunning-runs'),
        client.get<DunningStats>('/advanced-finance/dunning-stats'),
      ]);
      setLevels(Array.isArray(levelsResponse) ? levelsResponse : levelsResponse.data ?? []);
      setRuns(Array.isArray(runsResponse) ? runsResponse : runsResponse.data ?? []);
      setStats(statsResponse);
    } catch {
      alert('Unable to load accounts receivable automation data.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/advanced-finance/dunning-levels', {
          levelName: levelData.levelName,
          daysOverdue: parseInt(levelData.daysOverdue) || 0,
          feeAmount: parseFloat(levelData.feeAmount) || 0,
        });
        setShowLevelForm(false);
        setLevelData({ levelName: '', daysOverdue: '', feeAmount: '' });
        fetchData();
    } catch { alert('Unable to create the dunning level.'); }
  };

  const handleDeleteLevel = async (id: string, name: string) => {
    if (!confirm(`Delete dunning level "${name}"? This cannot be undone.`)) return;
    try {
      await client.delete(`/advanced-finance/dunning-levels/${id}`);
      fetchData();
    } catch { alert('Unable to delete the dunning level.'); }
  };

  const handleExecuteDunning = async () => {
    if (!confirm('Execute a dunning run now? This will apply late fees and send reminder emails to all overdue customers.')) return;
    setRunningDunning(true);
    try {
      const result = await client.post<{ totalInvoices?: number }>('/advanced-finance/dunning-runs');
        alert(`Dunning run completed. ${result.totalInvoices ?? 0} invoice(s) processed.`);
        fetchData();
    } catch { alert('Unable to complete the dunning run.'); }
    finally { setRunningDunning(false); }
  };

  const handlePauseResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseInvoiceId.trim()) return;
    try {
      const endpoint = pauseAction === 'pause'
        ? `/advanced-finance/dunning/invoices/${pauseInvoiceId}/pause`
        : `/advanced-finance/dunning/invoices/${pauseInvoiceId}/resume`;
      await client.post(endpoint);
        alert(`Dunning ${pauseAction === 'pause' ? 'paused' : 'resumed'} for invoice.`);
        setShowPauseForm(false);
        setPauseInvoiceId('');
    } catch { alert(`Unable to ${pauseAction} dunning for the invoice.`); }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.receivable.read">
      <div className="p-8 ui-stack-6">
      {/* Header */}
      <div className="ui-flex-between ui-items-start">
        <div>
          <h1 className="text-3xl">AR Automation & Dunning</h1>
          <p className="ui-text-muted mt-1">
            Automated customer reminders, late fees, and collection cadences — NetSuite / Odoo parity.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="mr-2" size={16} />Refresh</Button>
          <Button variant="primary" onClick={handleExecuteDunning} disabled={runningDunning}>
            {runningDunning ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
            Run Dunning
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className={`ui-grid-3 ${styles.s1}`}>
          {[
            { label: 'Total Runs', value: stats.totalRuns, icon: <BarChart3 size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
            { label: 'Success Rate', value: `${stats.successRate}%`, icon: <CheckCircle2 size={20} />, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
            { label: 'Fees Collected', value: `$${stats.totalFeeCollected.toFixed(2)}`, icon: <DollarSign size={20} />, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
            { label: 'Emails Sent', value: stats.totalEmailsSent, icon: <Mail size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
            { label: 'Dunning Levels', value: levels.length, icon: <TrendingUp size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
            { label: 'Completed Runs', value: stats.completedRuns, icon: <Clock size={20} />, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
          ].map((kpi) => (
            <Card key={kpi.label} className="ui-card p-5">
              <div className="ui-flex-between">
                <div>
                  <p className="ui-text-sm-muted">{kpi.label}</p>
                  <p className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value}</p>
                </div>
                <div className={styles.kpiIcon} style={{ background: kpi.bg, color: kpi.color }}>
                  {kpi.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pause/Resume Form */}
      <div className="ui-flex ui-gap-2">
        <Button variant="outline" size="sm" onClick={() => { setPauseAction('pause'); setShowPauseForm(!showPauseForm); }}>
          <Pause size={14} className={styles.s2} />Pause Dunning for Invoice
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setPauseAction('resume'); setShowPauseForm(!showPauseForm); }}>
          <RotateCcw size={14} className={styles.s3} />Resume Dunning for Invoice
        </Button>
      </div>

      {showPauseForm && (
        <Card className="ui-card">
          <div className="p-5">
            <h3 className={styles.s4}>
              {pauseAction === 'pause' ? 'Pause Dunning' : 'Resume Dunning'} for Invoice
            </h3>
            <form onSubmit={handlePauseResume} className={styles.s5}>
              <div className="flex-1">
                <label className="ui-label">Invoice ID</label>
                <input className="ui-input" required placeholder="Enter Invoice ID" value={pauseInvoiceId} onChange={e => setPauseInvoiceId(e.target.value)} />
              </div>
              <Button type="submit" variant={pauseAction === 'pause' ? 'danger' : 'primary'}>
                {pauseAction === 'pause' ? 'Pause Dunning' : 'Resume Dunning'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPauseForm(false)}>Cancel</Button>
            </form>
          </div>
        </Card>
      )}

      {/* Create Level Form */}
      {showLevelForm && (
        <Card className="ui-card">
          <div className={styles.s6}>
            <h3 className={styles.s7}>Create Dunning Level</h3>
          </div>
          <div className="p-5">
            <form onSubmit={handleCreateLevel} className="ui-stack-4">
              <div className="ui-grid-3">
                <div className="ui-form-group">
                  <label className="ui-label">Level Name</label>
                  <input className="ui-input" required placeholder="First Notice" value={levelData.levelName} onChange={e => setLevelData({ ...levelData, levelName: e.target.value })} />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Days Overdue (trigger)</label>
                  <input className="ui-input" type="number" required placeholder="15" value={levelData.daysOverdue} onChange={e => setLevelData({ ...levelData, daysOverdue: e.target.value })} />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Late Fee Amount ($)</label>
                  <input className="ui-input" type="number" step="0.01" placeholder="25.00" value={levelData.feeAmount} onChange={e => setLevelData({ ...levelData, feeAmount: e.target.value })} />
                </div>
              </div>
              <div className="ui-flex-end ui-gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLevelForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Level</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className={`ui-grid-2 ${styles.s8}`}>
        {/* Dunning Levels */}
        <Card className="ui-card ui-flex-col">
          <div className={styles.s9}>
            <div className="ui-hstack-3">
              <div className={styles.s10}>
                <AlertTriangle className={styles.s11} />
              </div>
              <div>
                <h3 className="ui-heading-base">Dunning Levels</h3>
                <p className="ui-text-xs-muted">{levels.length} level{levels.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLevelForm(true)}>
              <Plus size={14} className={styles.s12} />Add Level
            </Button>
          </div>
          <div className={styles.s13}>
            {levels.length === 0 ? (
              <div className={styles.s14}>
                <AlertTriangle className={styles.s15} size={32} />
                <p>No dunning levels configured yet.</p>
                <p className={styles.s16}>Add levels to start automated reminders.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'levelName', header: 'Level Name', render: (v) => <span className="font-medium">{String(v)}</span> },
                  { key: 'daysOverdue', header: 'Trigger (days)', render: (v) => `+${v}d` },
                  { key: 'feeAmount', header: 'Late Fee', render: (v) => <span className={styles.s17}>${Number(v).toFixed(2)}</span> },
                  { key: 'status', header: 'Status', render: (v) => (
                    <span className={`${styles.statusPill} ${v === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}>{String(v)}</span>
                  ) },
                  { key: 'id', header: 'Actions', render: (v, row) => (
                    <button onClick={() => handleDeleteLevel(String(v), String(row.levelName))} className={styles.s18} title="Delete"><Trash2 size={14} /></button>
                  ) },
                ] as ListColumn[]}
                data={(levels as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No dunning levels configured"
                emptyDescription="Add levels to start automated reminders."
              />
            )}
          </div>
        </Card>

        {/* Dunning Runs */}
        <Card className="ui-card ui-flex-col">
          <div className={styles.s19}>
            <div className={styles.s20}>
              <MailWarning className={styles.s21} />
            </div>
            <div>
              <h3 className="ui-heading-base">Dunning Run History</h3>
              <p className="ui-text-xs-muted">{runs.length} run{runs.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <div className={styles.s22}>
            {runs.length === 0 ? (
              <div className={styles.s23}>
                <MailWarning className={styles.s24} size={32} />
                <p>No dunning runs recorded yet.</p>
                <p className={styles.s25}>Click Run Dunning to process overdue invoices.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'runDate', header: 'Run Date', render: (v) => new Date(String(v)).toLocaleString() },
                  { key: 'status', header: 'Status', render: (v) => (
                    <span className={`${styles.statusPill} ${v === 'COMPLETED' ? styles.statusActive : styles.statusWarning}`}>{String(v)}</span>
                  ) },
                  { key: 'totalInvoices', header: 'Invoices Processed', render: (v) => <span className="font-semibold">{String(v)}</span> },
                ] as ListColumn[]}
                data={(runs as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No dunning runs recorded"
                emptyDescription="Click Run Dunning to process overdue invoices."
              />
            )}
          </div>
        </Card>
      </div>

      {/* By-Level Breakdown */}
      {stats && stats.byLevel.length > 0 && (
        <Card className="ui-card">
          <div className={styles.s26}>
            <h3 className="ui-heading-base">Performance by Dunning Level</h3>
          </div>
          <div className={styles.s27}>
            {stats.byLevel.map((lvl) => (
              <div key={lvl.level} className={styles.s28}>
                <p className={styles.s29}>{lvl.level}</p>
                <p className="ui-text-xs-muted mt-1">{lvl.count} invoice(s) processed</p>
                <p className={styles.s30}>${lvl.fees.toFixed(2)}</p>
                <p className="ui-text-xs-muted">fees collected</p>
              </div>
            ))}
          </div>
        </Card>
      )}
      </div>
    </RouteGuard>
  );
}
