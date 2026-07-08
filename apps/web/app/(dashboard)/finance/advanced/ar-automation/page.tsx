/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MailWarning, AlertTriangle, Play, Loader2, RefreshCw,
  Plus, Trash2, Pause, RotateCcw, BarChart3, TrendingUp,
  CheckCircle2, Mail, DollarSign, Clock
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

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

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

export default function ARAutomationPage() {
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
      const [lvlRes, runRes, statsRes] = await Promise.all([
        fetch(`${API}/dunning-levels`, { headers: authHeaders() }),
        fetch(`${API}/dunning-runs`, { headers: authHeaders() }),
        fetch(`${API}/dunning-stats`, { headers: authHeaders() }),
      ]);
      if (lvlRes.ok) setLevels(await lvlRes.json().then((d: unknown) => Array.isArray(d) ? d : ((d as { data?: DunningLevel[] })?.data || [])));
      if (runRes.ok) setRuns(await runRes.json().then((d: unknown) => Array.isArray(d) ? d : ((d as { data?: DunningRun[] })?.data || [])));
      if (statsRes.ok) setStats(await statsRes.json() as DunningStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/dunning-levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          levelName: levelData.levelName,
          daysOverdue: parseInt(levelData.daysOverdue) || 0,
          feeAmount: parseFloat(levelData.feeAmount) || 0,
        }),
      });
      if (res.ok) {
        setShowLevelForm(false);
        setLevelData({ levelName: '', daysOverdue: '', feeAmount: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Failed to save dunning level: ' + (err.message || 'Error'));
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteLevel = async (id: string, name: string) => {
    if (!confirm(`Delete dunning level "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/dunning-levels/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) fetchData();
      else alert('Failed to delete dunning level.');
    } catch (e) { console.error(e); }
  };

  const handleExecuteDunning = async () => {
    if (!confirm('Execute a dunning run now? This will apply late fees and send reminder emails to all overdue customers.')) return;
    setRunningDunning(true);
    try {
      const res = await fetch(`${API}/dunning-runs`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const result = await res.json() as { totalInvoices?: number };
        alert(`Dunning run completed. ${result.totalInvoices ?? 0} invoice(s) processed.`);
        fetchData();
      } else {
        alert('Failed to start dunning run.');
      }
    } catch (e) { console.error(e); }
    finally { setRunningDunning(false); }
  };

  const handlePauseResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseInvoiceId.trim()) return;
    try {
      const endpoint = pauseAction === 'pause'
        ? `${API}/dunning/invoices/${pauseInvoiceId}/pause`
        : `${API}/dunning/invoices/${pauseInvoiceId}/resume`;
      const res = await fetch(endpoint, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        alert(`Dunning ${pauseAction === 'pause' ? 'paused' : 'resumed'} for invoice.`);
        setShowPauseForm(false);
        setPauseInvoiceId('');
      } else {
        const err = await res.json().catch(() => ({})) as { message?: string };
        alert('Action failed: ' + (err.message || 'Error'));
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>AR Automation & Dunning</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Automated customer reminders, late fees, and collection cadences — NetSuite / Odoo parity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={fetchData}><RefreshCw style={{ marginRight: 'var(--space-2)' }} size={16} />Refresh</Button>
          <Button variant="primary" onClick={handleExecuteDunning} disabled={runningDunning}>
            {runningDunning ? <Loader2 className="animate-spin" style={{ marginRight: 'var(--space-2)' }} size={16} /> : <Play style={{ marginRight: 'var(--space-2)' }} size={16} />}
            Run Dunning
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
          {[
            { label: 'Total Runs', value: stats.totalRuns, icon: <BarChart3 size={20} />, color: 'var(--color-primary)', bg: 'rgba(var(--color-primary-rgb, 79,70,229),0.08)' },
            { label: 'Success Rate', value: `${stats.successRate}%`, icon: <CheckCircle2 size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Fees Collected', value: `$${stats.totalFeeCollected.toFixed(2)}`, icon: <DollarSign size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Emails Sent', value: stats.totalEmailsSent, icon: <Mail size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            { label: 'Dunning Levels', value: levels.length, icon: <TrendingUp size={20} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
            { label: 'Completed Runs', value: stats.completedRuns, icon: <Clock size={20} />, color: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
          ].map((kpi) => (
            <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
                  <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)', color: kpi.color }}>{kpi.value}</p>
                </div>
                <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>
                  {kpi.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pause/Resume Form */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button variant="outline" size="sm" onClick={() => { setPauseAction('pause'); setShowPauseForm(!showPauseForm); }}>
          <Pause size={14} style={{ marginRight: 'var(--space-1)' }} />Pause Dunning for Invoice
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setPauseAction('resume'); setShowPauseForm(!showPauseForm); }}>
          <RotateCcw size={14} style={{ marginRight: 'var(--space-1)' }} />Resume Dunning for Invoice
        </Button>
      </div>

      {showPauseForm && (
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>
              {pauseAction === 'pause' ? 'Pause Dunning' : 'Resume Dunning'} for Invoice
            </h3>
            <form onSubmit={handlePauseResume} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="frappe-label">Invoice ID</label>
                <input className="frappe-input" required placeholder="Enter Invoice ID" value={pauseInvoiceId} onChange={e => setPauseInvoiceId(e.target.value)} />
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
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Create Dunning Level</h3>
          </div>
          <div style={{ padding: 'var(--space-5)' }}>
            <form onSubmit={handleCreateLevel} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div className="frappe-form-group">
                  <label className="frappe-label">Level Name</label>
                  <input className="frappe-input" required placeholder="First Notice" value={levelData.levelName} onChange={e => setLevelData({ ...levelData, levelName: e.target.value })} />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Days Overdue (trigger)</label>
                  <input className="frappe-input" type="number" required placeholder="15" value={levelData.daysOverdue} onChange={e => setLevelData({ ...levelData, daysOverdue: e.target.value })} />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Late Fee Amount ($)</label>
                  <input className="frappe-input" type="number" step="0.01" placeholder="25.00" value={levelData.feeAmount} onChange={e => setLevelData({ ...levelData, feeAmount: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowLevelForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Level</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
        {/* Dunning Levels */}
        <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: 'rgba(245,158,11,0.1)' }}>
                <AlertTriangle style={{ color: '#f59e0b', height: '20px', width: '20px' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Dunning Levels</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{levels.length} level{levels.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLevelForm(true)}>
              <Plus size={14} style={{ marginRight: 'var(--space-1)' }} />Add Level
            </Button>
          </div>
          <div style={{ overflow: 'auto' }}>
            {levels.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <AlertTriangle style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} size={32} />
                <p>No dunning levels configured yet.</p>
                <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Add levels to start automated reminders.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'left' }}>Level Name</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Trigger (days)</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Late Fee</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((lvl) => (
                    <tr key={lvl.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)' }}>{lvl.levelName}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>+{lvl.daysOverdue}d</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: '#f59e0b' }}>
                        ${Number(lvl.feeAmount).toFixed(2)}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                          borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                          background: lvl.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.15)',
                          color: lvl.status === 'ACTIVE' ? '#16a34a' : '#6b7280',
                        }}>{lvl.status}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteLevel(lvl.id, lvl.levelName)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 'var(--space-1)' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Dunning Runs */}
        <Card className="frappe-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', background: 'rgba(239,68,68,0.1)' }}>
              <MailWarning style={{ color: '#ef4444', height: '20px', width: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Dunning Run History</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{runs.length} run{runs.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <div style={{ overflow: 'auto' }}>
            {runs.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <MailWarning style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} size={32} />
                <p>No dunning runs recorded yet.</p>
                <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>Click Run Dunning to process overdue invoices.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'left' }}>Run Date</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Invoices Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)' }}>{new Date(run.runDate).toLocaleString()}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                          borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                          background: run.status === 'COMPLETED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          color: run.status === 'COMPLETED' ? '#16a34a' : '#d97706',
                        }}>{run.status}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{run.totalInvoices}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* By-Level Breakdown */}
      {stats && stats.byLevel.length > 0 && (
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Performance by Dunning Level</h3>
          </div>
          <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {stats.byLevel.map((lvl) => (
              <div key={lvl.level} style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                minWidth: '180px', flex: '1',
              }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>{lvl.level}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>{lvl.count} invoice(s) processed</p>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: '#f59e0b', marginTop: 'var(--space-2)' }}>${lvl.fees.toFixed(2)}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>fees collected</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
