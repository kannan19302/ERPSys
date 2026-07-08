/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@unerp/ui';
import {
  Loader2, RefreshCw, Calculator, ShieldCheck,
  Plus, Calendar, Info, Scale, ArrowRightLeft, FileText, CheckCircle2
} from 'lucide-react';

interface FxRevaluationDetail {
  id: string;
  accountId: string;
  entityType: string;
  entityId: string;
  balanceInForeign: number | string;
  originalAmountBase: number | string;
  revaluedAmountBase: number | string;
  unrealizedGainLoss: number | string;
  account?: {
    code: string;
    name: string;
  };
}

interface FxRevaluationRun {
  id: string;
  runDate: string;
  targetCurrency: string;
  status: string;
  notes: string | null;
  journalId: string | null;
  createdAt: string;
  details?: FxRevaluationDetail[];
}

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function FxRevaluationPage() {
  const [runs, setRuns] = useState<FxRevaluationRun[]>([]);
  const [loading, setLoading] = useState(true);

  // New Run wizard state
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [runDate, setRunDate] = useState(new Date().toISOString().substring(0, 10));
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview details state
  const [draftRun, setDraftRun] = useState<FxRevaluationRun | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fx-revaluation/runs`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setRuns(await res.json() as FxRevaluationRun[]);
      }
    } catch (e) {
      console.error('Error fetching FX revaluation runs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/fx-revaluation/runs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          runDate,
          targetCurrency,
          notes,
        }),
      });
      if (res.ok) {
        const data = await res.json() as FxRevaluationRun;
        // Fetch full draft details
        const detailsRes = await fetch(`${API_BASE}/fx-revaluation/runs/${data.id}/details`, {
          headers: authHeaders(),
        });
        if (detailsRes.ok) {
          setDraftRun(await detailsRes.json() as FxRevaluationRun);
          setShowNewRunModal(false);
          setShowPreviewModal(true);
        }
      } else {
        alert('Failed to generate draft revaluation.');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating FX revaluation draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostRun = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/fx-revaluation/runs/${id}/post`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        alert('FX Revaluation Posted Successfully! Unrealized Gains/Losses logged in General Ledger.');
        setShowPreviewModal(false);
        setDraftRun(null);
        loadData();
      } else {
        alert('Failed to post revaluation.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const viewDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fx-revaluation/runs/${id}/details`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setDraftRun(await res.json() as FxRevaluationRun);
        setShowPreviewModal(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>FX Currency Revaluation</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Revalue foreign currency balances (open invoices, payments, and cash accounts) at period-end and post unrealized FX gain/loss entries.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="primary" onClick={() => setShowNewRunModal(true)}>
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} /> Run FX Revaluation
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
        {[
          { label: 'Revaluation Runs Count', value: runs.length, icon: <Scale size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
          { label: 'Posted Adjustments', value: runs.filter(r => r.status === 'POSTED').length, icon: <ShieldCheck size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Draft Calculations', value: runs.filter(r => r.status === 'DRAFT').length, icon: <Calculator size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        ].map(kpi => (
          <Card key={kpi.label} className="frappe-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{kpi.label}</p>
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: kpi.color, marginTop: 'var(--space-2)' }}>{kpi.value}</p>
              </div>
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-xl)', background: kpi.bg, color: kpi.color }}>{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Runs history list */}
      <Card className="frappe-card">
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Revaluation Execution Logs</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Revaluation Date</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Target Currency</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Status</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Linked Journal</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Notes</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No FX revaluation runs posted yet. Click Run FX Revaluation to configure a currency adjustment wizard.
                  </td>
                </tr>
              ) : (
                runs.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{new Date(r.runDate).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3)' }}>{r.targetCurrency}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                        background: r.status === 'POSTED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: r.status === 'POSTED' ? '#22c55e' : '#f59e0b'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                      {r.journalId ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={14} /> GL ID: {r.journalId.substring(0,8)}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>{r.notes || '—'}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <Button variant="outline" size="sm" onClick={() => viewDetails(r.id)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Run Wizard Modal */}
      {showNewRunModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <Card className="frappe-card" style={{ width: '450px', background: 'var(--color-surface-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Execute FX Revaluation</h3>
              <Button variant="outline" size="sm" onClick={() => setShowNewRunModal(false)}>Close</Button>
            </div>
            <form onSubmit={handleCreateDraft} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Period-End Revaluation Date
                </label>
                <input
                  type="date"
                  className="frappe-input"
                  value={runDate}
                  onChange={e => setRunDate(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Select Foreign Target Currency
                </label>
                <select
                  className="frappe-input"
                  value={targetCurrency}
                  onChange={e => setTargetCurrency(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                </select>
              </div>

              <div className="frappe-form-group">
                <label className="frappe-label" style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
                  Notes / Audit Comments
                </label>
                <input
                  type="text"
                  className="frappe-input"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. June 2026 month-end revaluation check"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setShowNewRunModal(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  Calculate Adjustments
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Draft calculations Preview Modal */}
      {showPreviewModal && draftRun && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <Card className="frappe-card" style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--color-surface-primary)', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>
                  Revaluation Details ({draftRun.targetCurrency} revalued to USD)
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Run Date: {new Date(draftRun.runDate).toLocaleDateString()} • Status: <span style={{ fontWeight: 'semibold' }}>{draftRun.status}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                setShowPreviewModal(false);
                setDraftRun(null);
              }}>Close</Button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>GL Account</th>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Entity Type</th>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Foreign Balance</th>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Original value (Base)</th>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Revalued value (Base)</th>
                      <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Unrealized Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftRun.details && draftRun.details.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No open foreign transactions found on this revaluation date.
                        </td>
                      </tr>
                    ) : (
                      draftRun.details?.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 'semibold' }}>{d.account?.code || '1200-AR'}</span> — {d.account?.name || 'A/R'}
                          </td>
                          <td style={{ padding: 'var(--space-2)' }}>{d.entityType}</td>
                          <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                            {d.balanceInForeign} {draftRun.targetCurrency}
                          </td>
                          <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{fmt(Number(d.originalAmountBase))}</td>
                          <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{fmt(Number(d.revaluedAmountBase))}</td>
                          <td style={{
                            padding: 'var(--space-2)', textAlign: 'right', fontWeight: 'var(--weight-semibold)',
                            color: Number(d.unrealizedGainLoss) >= 0 ? '#22c55e' : '#ef4444'
                          }}>
                            {Number(d.unrealizedGainLoss) > 0 ? '+' : ''}{fmt(Number(d.unrealizedGainLoss))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {draftRun.status === 'DRAFT' && draftRun.details && draftRun.details.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Button variant="outline" type="button" onClick={() => {
                    setShowPreviewModal(false);
                    setDraftRun(null);
                  }}>Discard Draft</Button>
                  <Button variant="primary" type="button" onClick={() => handlePostRun(draftRun.id)} disabled={submitting}>
                    {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle2 size={14} style={{ marginRight: 'var(--space-2)' }} />}
                    Post Adjustments to General Ledger
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
