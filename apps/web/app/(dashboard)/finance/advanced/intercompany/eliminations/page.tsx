/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, DataTable, type Column } from '@unerp/ui';
import {
  Loader2, RefreshCw, CheckCircle2, AlertCircle,
  ShieldCheck, Scale, FileText, Plus, Trash2, Calendar, CheckSquare
} from 'lucide-react';

interface IntercompanyTransaction {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  date: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
  fromInvoiceId: string | null;
  toInvoiceId: string | null;
  eliminationJournalId: string | null;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

interface EliminationRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sourceOrgId: string | null;
  destinationOrgId: string | null;
  matchingCriteria: string;
  toleranceDays: number;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAccount: { name: string; code: string };
  destinationAccount: { name: string; code: string };
}

interface EliminationRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  runDate: string;
  status: string;
  totalEliminated: number | string;
  rulesAppliedCount: number;
  journalId: string | null;
  journal?: { entryNumber: string } | null;
}

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Entity {
  id: string;
  name: string;
}

const API_BASE = 'http://localhost:3001/api/v1/advanced-finance';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('admin_token') || '' : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function IntercompanyEliminationsPage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'rules' | 'runs'>('ledger');
  
  // Data States
  const [txs, setTxs] = useState<IntercompanyTransaction[]>([]);
  const [stats, setStats] = useState<IntercompanyStats | null>(null);
  const [rules, setRules] = useState<EliminationRule[]>([]);
  const [runs, setRuns] = useState<EliminationRun[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [runningBatch, setRunningBatch] = useState(false);

  // New Rule Form State
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    sourceOrgId: '',
    destinationOrgId: '',
    matchingCriteria: 'AMOUNT_CURRENCY_DATE',
    toleranceDays: 10,
    sourceAccountId: '',
    destinationAccountId: '',
  });

  // Period Execution Form State
  const [runPeriod, setRunPeriod] = useState({
    periodStart: '',
    periodEnd: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, statsRes, rulesRes, runsRes, accountsRes, overviewRes] = await Promise.all([
        fetch(`${API_BASE}/intercompany/transactions`, { headers: authHeaders() }),
        fetch(`${API_BASE}/intercompany/stats`, { headers: authHeaders() }),
        fetch(`${API_BASE}/intercompany/elimination-rules`, { headers: authHeaders() }),
        fetch(`${API_BASE}/intercompany/elimination-runs`, { headers: authHeaders() }),
        fetch(`${API_BASE}/accounts`, { headers: authHeaders() }),
        fetch(`${API_BASE}/consolidation/overview`, { headers: authHeaders() }),
      ]);

      if (txRes.ok) {
        const data = await txRes.json();
        setTxs(data.items || data);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json() as IntercompanyStats);
      }
      if (rulesRes.ok) {
        setRules(await rulesRes.json() as EliminationRule[]);
      }
      if (runsRes.ok) {
        setRuns(await runsRes.json() as EliminationRun[]);
      }
      if (accountsRes.ok) {
        setAccounts(await accountsRes.json() as Account[]);
      }
      if (overviewRes.ok) {
        const over = await overviewRes.json();
        setEntities(over.entities || []);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEliminate = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`${API_BASE}/intercompany/eliminate/${id}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        alert('Netting elimination entry successfully posted to GL ledger.');
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to eliminate: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error posting elimination entry');
    } finally {
      setActingId(null);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.sourceAccountId || !newRule.destinationAccountId) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/intercompany/elimination-rules`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...newRule,
          sourceOrgId: newRule.sourceOrgId || null,
          destinationOrgId: newRule.destinationOrgId || null,
        }),
      });

      if (res.ok) {
        alert('Elimination rule created successfully.');
        setShowRuleForm(false);
        setNewRule({
          name: '',
          description: '',
          sourceOrgId: '',
          destinationOrgId: '',
          matchingCriteria: 'AMOUNT_CURRENCY_DATE',
          toleranceDays: 10,
          sourceAccountId: '',
          destinationAccountId: '',
        });
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to create rule: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error creating rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this elimination rule?')) return;

    try {
      const res = await fetch(`${API_BASE}/intercompany/elimination-rules/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.ok) {
        alert('Elimination rule deleted successfully.');
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to delete rule: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting rule');
    }
  };

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runPeriod.periodStart || !runPeriod.periodEnd) {
      alert('Please select start and end period dates.');
      return;
    }

    setRunningBatch(true);
    try {
      const res = await fetch(`${API_BASE}/intercompany/elimination-runs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(runPeriod),
      });

      if (res.ok) {
        alert('Period Auto-Elimination run executed as Draft. Review and approve the run to post entries to GL.');
        setRunPeriod({ periodStart: '', periodEnd: '' });
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to execute run: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error executing elimination run');
    } finally {
      setRunningBatch(false);
    }
  };

  const handlePostRun = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`${API_BASE}/intercompany/elimination-runs/${id}/post`, {
        method: 'POST',
        headers: authHeaders(),
      });

      if (res.ok) {
        alert('Auto-elimination period run approved and posted successfully to GL.');
        loadData();
      } else {
        const err = await res.json();
        alert(`Failed to post run: ${err.message || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error posting run');
    } finally {
      setActingId(null);
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
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Intercompany Auto-Netting & Eliminations</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Configure elimination rules, run automated batch period close eliminations, and check the compliance offset ledger.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {stats && (
        <div className="frappe-grid-3" style={{ gap: 'var(--space-4)' }}>
          {[
            { label: 'Total Netting Volume (Eliminated)', value: fmt(stats.totalNettedVolume), icon: <Scale size={20} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
            { label: 'Pending Netting Volume', value: fmt(stats.pendingNettingVolume), icon: <Loader2 size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { label: 'Active Rules Configured', value: `${rules.length} Rules`, icon: <ShieldCheck size={20} />, color: 'var(--color-primary)', bg: 'rgba(79,70,229,0.08)' },
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
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        {[
          { id: 'ledger', label: 'Ledger Entries' },
          { id: 'rules', label: 'Auto-Elimination Rules' },
          { id: 'runs', label: 'Auto-Elimination Runs' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              border: 'none',
              background: activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ledger Entries Tab */}
      {activeTab === 'ledger' && (
        <Card className="frappe-card">
          <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Intercompany Ledger Entries</h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Compliance log of matched transaction offsets</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Transaction Date</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Description</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Seller Org</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Buyer Org</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Amount</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Elimination Journal</th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {txs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No matched intercompany transactions found. Configure rules or run matching.
                    </td>
                  </tr>
                ) : (
                  txs.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{t.description}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{t.fromOrgId}</td>
                      <td style={{ padding: 'var(--space-3)' }}>{t.toOrgId}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{fmt(Number(t.amount))}</td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                          background: t.status === 'ELIMINATED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          color: t.status === 'ELIMINATED' ? '#22c55e' : '#f59e0b'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>
                        {t.eliminationJournalId ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={14} /> ID: {t.eliminationJournalId.substring(0,8)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                        {t.status === 'MATCHED' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actingId !== null}
                            onClick={() => handleEliminate(t.id)}
                            style={{ padding: '2px 8px', fontSize: '12px' }}
                          >
                            {actingId === t.id ? <Loader2 size={12} className="animate-spin" /> : 'Eliminate'}
                          </Button>
                        ) : (
                          <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'semibold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Post Eliminated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Auto-Elimination Rules Tab */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={() => setShowRuleForm(!showRuleForm)}>
              <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
              {showRuleForm ? 'Hide Form' : 'New Elimination Rule'}
            </Button>
          </div>

          {showRuleForm && (
            <Card className="frappe-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Create Intercompany Elimination Rule</h3>
              <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Rule Name *</label>
                    <input
                      type="text"
                      className="frappe-input"
                      required
                      placeholder="e.g. Corporate Management Fee Offsets"
                      value={newRule.name}
                      onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Description</label>
                    <input
                      type="text"
                      className="frappe-input"
                      placeholder="Optional details"
                      value={newRule.description}
                      onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Source Organization (Seller)</label>
                    <select
                      className="frappe-input"
                      value={newRule.sourceOrgId}
                      onChange={e => setNewRule({ ...newRule, sourceOrgId: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="">Any Seller Org</option>
                      {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Destination Organization (Buyer)</label>
                    <select
                      className="frappe-input"
                      value={newRule.destinationOrgId}
                      onChange={e => setNewRule({ ...newRule, destinationOrgId: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="">Any Buyer Org</option>
                      {entities.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Source GL Account (IC Receivables) *</label>
                    <select
                      className="frappe-input"
                      required
                      value={newRule.sourceAccountId}
                      onChange={e => setNewRule({ ...newRule, sourceAccountId: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name} ({acc.type})</option>)}
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Destination GL Account (IC Payables) *</label>
                    <select
                      className="frappe-input"
                      required
                      value={newRule.destinationAccountId}
                      onChange={e => setNewRule({ ...newRule, destinationAccountId: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name} ({acc.type})</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Matching Criteria</label>
                    <select
                      className="frappe-input"
                      value={newRule.matchingCriteria}
                      onChange={e => setNewRule({ ...newRule, matchingCriteria: e.target.value })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="AMOUNT_CURRENCY_DATE">Amount, Currency & Date Tolerance</option>
                      <option value="AMOUNT_ONLY">Amount and Currency Only</option>
                    </select>
                  </div>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Date Tolerance Days</label>
                    <input
                      type="number"
                      className="frappe-input"
                      min={0}
                      value={newRule.toleranceDays}
                      onChange={e => setNewRule({ ...newRule, toleranceDays: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                  <Button variant="outline" type="button" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Create Rule</Button>
                </div>
              </form>
            </Card>
          )}

          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Active Elimination Rules</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Name</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Seller org</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Buyer org</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>GL Accounts (Source → Destination)</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Criteria</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No elimination rules configured yet. Create a rule to begin period-close automation.
                      </td>
                    </tr>
                  ) : (
                    rules.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontWeight: 'var(--weight-semibold)' }}>{r.name}</div>
                          {r.description && <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{r.description}</div>}
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>{r.sourceOrgId || 'Any Seller'}</td>
                        <td style={{ padding: 'var(--space-3)' }}>{r.destinationOrgId || 'Any Buyer'}</td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div style={{ fontSize: '12px' }}>
                            <span style={{ color: 'var(--color-primary)' }}>({r.sourceAccount?.code})</span> {r.sourceAccount?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            → <span style={{ color: '#10b981' }}>({r.destinationAccount?.code})</span> {r.destinationAccount?.name}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)', fontSize: '12px' }}>
                          <span style={{ textTransform: 'lowercase' }}>{r.matchingCriteria} (±{r.toleranceDays}d)</span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                            background: r.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                            color: r.isActive ? '#22c55e' : '#ef4444'
                          }}>
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteRule(r.id)} style={{ color: '#ef4444', border: '1px solid #ef4444' }}>
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Auto-Elimination Runs Tab */}
      {activeTab === 'runs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card className="frappe-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
              Trigger Period close Auto-Elimination Run
            </h3>
            <form onSubmit={handleExecuteRun} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
              <div className="frappe-form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Period Start Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  required
                  value={runPeriod.periodStart}
                  onChange={e => setRunPeriod({ ...runPeriod, periodStart: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <div className="frappe-form-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-2)' }}>Period End Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  required
                  value={runPeriod.periodEnd}
                  onChange={e => setRunPeriod({ ...runPeriod, periodEnd: e.target.value })}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>
              <Button variant="primary" type="submit" disabled={runningBatch} style={{ height: '38px' }}>
                {runningBatch ? <Loader2 size={16} className="animate-spin" /> : 'Run Auto-Elimination'}
              </Button>
            </form>
          </Card>

          <Card className="frappe-card">
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Period Run Executions History</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Run Date</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Period Range</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>Total Eliminated</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Rules Applied</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 'var(--weight-medium)' }}>Journal Entry</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Status</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 'var(--weight-medium)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No auto-elimination close runs recorded yet. Select dates above to execute a run.
                      </td>
                    </tr>
                  ) : (
                    runs.map(run => (
                      <tr key={run.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-3)' }}>{new Date(run.runDate).toLocaleString()}</td>
                        <td style={{ padding: 'var(--space-3)', fontWeight: 'var(--weight-semibold)' }}>
                          {new Date(run.periodStart).toLocaleDateString()} – {new Date(run.periodEnd).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>{fmt(Number(run.totalEliminated))}</td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>{run.rulesAppliedCount} Rules</td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          {run.journalId ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                              <FileText size={14} /> GL: {run.journal?.entryNumber || run.journalId.substring(0, 8)}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'var(--weight-semibold)',
                            background: run.status === 'POSTED' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: run.status === 'POSTED' ? '#22c55e' : '#f59e0b'
                          }}>
                            {run.status}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          {run.status === 'DRAFT' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={actingId !== null}
                              onClick={() => handlePostRun(run.id)}
                              style={{ padding: '2px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {actingId === run.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Approve & Post
                            </Button>
                          ) : (
                            <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 'semibold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> GL Posted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
