/* eslint-disable no-console */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Plus, Layers, CheckCircle, Archive, FileEdit, Loader2, BarChart3 } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';

interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  createdAt: string;
  budgets?: Budget[];
}

interface Budget {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  account?: { name: string; code: string };
}

interface GLAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  APPROVED: 'success',
  ARCHIVED: 'info',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT: <FileEdit size={12} />,
  APPROVED: <CheckCircle size={12} />,
  ARCHIVED: <Archive size={12} />,
};

export default function ForecastScenariosPage() {
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<ForecastScenario | null>(null);
  const [saving, setSaving] = useState(false);

  const [scenarioForm, setScenarioForm] = useState({ name: '', description: '', status: 'DRAFT' });
  const [budgetForm, setBudgetForm] = useState({ accountId: '', amount: '', startDate: '', endDate: '' });
  const [addingBudget, setAddingBudget] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = getToken();
      const [scnRes, accRes] = await Promise.all([
        fetch(`${API}/forecast-scenarios`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (scnRes.ok) {
        const data = await scnRes.json();
        setScenarios(Array.isArray(data) ? data : data.data || []);
      }
      if (accRes.ok) {
        const data = await accRes.json();
        const all: GLAccount[] = Array.isArray(data) ? data : data.data || [];
        setAccounts(all.filter(a => a.type === 'REVENUE' || a.type === 'EXPENSE'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/forecast-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(scenarioForm),
      });
      if (res.ok) {
        setShowNew(false);
        setScenarioForm({ name: '', description: '', status: 'DRAFT' });
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addBudgetLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountId: budgetForm.accountId,
          amount: parseFloat(budgetForm.amount),
          startDate: budgetForm.startDate,
          endDate: budgetForm.endDate,
          forecastScenarioId: selected.id,
        }),
      });
      if (res.ok) {
        setBudgetForm({ accountId: '', amount: '', startDate: '', endDate: '' });
        setAddingBudget(false);
        await fetchData();
        // Re-select updated scenario
        const updated = await fetch(`${API}/forecast-scenarios`, { headers: { Authorization: `Bearer ${token}` } });
        if (updated.ok) {
          const data = await updated.json();
          const list: ForecastScenario[] = Array.isArray(data) ? data : data.data || [];
          setSelected(list.find(s => s.id === selected.id) || null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = (s: ForecastScenario) => (s.budgets || []).reduce((sum, b) => sum + b.amount, 0);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--color-primary)', width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <TrendingUp style={{ color: 'var(--color-primary)' }} />
            Rolling Forecasts & Scenarios
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Model financial futures with multiple planning scenarios. Compare forecasts vs. actuals.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} style={{ marginRight: 'var(--space-2)' }} /> New Scenario
        </Button>
      </div>

      {/* New Scenario Form */}
      {showNew && (
        <Card>
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>
              Create Forecast Scenario
            </h3>
            <form onSubmit={createScenario} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Scenario Name *</label>
                  <input
                    className="frappe-input"
                    required
                    placeholder="e.g. Base Case 2026, Upside, Stress Test"
                    value={scenarioForm.name}
                    onChange={e => setScenarioForm({ ...scenarioForm, name: e.target.value })}
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Status</label>
                  <select
                    className="frappe-input"
                    value={scenarioForm.status}
                    onChange={e => setScenarioForm({ ...scenarioForm, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Description</label>
                <textarea
                  className="frappe-input"
                  rows={2}
                  placeholder="Assumptions, key drivers, or notes for this scenario…"
                  value={scenarioForm.description}
                  onChange={e => setScenarioForm({ ...scenarioForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 'var(--space-2)' }} /> : null}
                  Create Scenario
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-2" style={{ alignItems: 'start' }}>
        {/* Scenario List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
            {scenarios.length} Scenario{scenarios.length !== 1 ? 's' : ''}
          </h2>

          {scenarios.length === 0 && (
            <Card>
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <BarChart3 size={40} style={{ margin: '0 auto var(--space-4)', opacity: 0.4 }} />
                <p style={{ fontWeight: 'var(--weight-medium)' }}>No forecast scenarios yet</p>
                <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                  Create a scenario to start modeling your financial future.
                </p>
              </div>
            </Card>
          )}

          {scenarios.map(s => (
            <Card
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                cursor: 'pointer',
                border: selected?.id === s.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Layers size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{s.name}</span>
                  </div>
                  <Badge variant={STATUS_COLORS[s.status] as 'default' | 'success' | 'info'}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {STATUS_ICONS[s.status]} {s.status}
                    </span>
                  </Badge>
                </div>
                {s.description && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                    {s.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  <span>{(s.budgets || []).length} budget line{(s.budgets || []).length !== 1 ? 's' : ''}</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--weight-medium)' }}>
                    ${totalBudget(s).toLocaleString(undefined, { minimumFractionDigits: 0 })} total
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Scenario Detail Panel */}
        {selected ? (
          <Card>
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
                <div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{selected.name}</h2>
                  {selected.description && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                      {selected.description}
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_COLORS[selected.status] as 'default' | 'success' | 'info'}>{selected.status}</Badge>
              </div>

              {/* Budget Lines */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>
                    BUDGET LINES
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setAddingBudget(!addingBudget)}>
                    <Plus size={12} style={{ marginRight: 4 }} /> Add Line
                  </Button>
                </div>

                {addingBudget && (
                  <form onSubmit={addBudgetLine} style={{ padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div className="frappe-form-group">
                      <label className="frappe-label">GL Account *</label>
                      <select
                        className="frappe-input"
                        required
                        value={budgetForm.accountId}
                        onChange={e => setBudgetForm({ ...budgetForm, accountId: e.target.value })}
                      >
                        <option value="">Select account…</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="frappe-grid-3">
                      <div className="frappe-form-group">
                        <label className="frappe-label">Amount *</label>
                        <input className="frappe-input" type="number" step="0.01" required placeholder="0.00" value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })} />
                      </div>
                      <div className="frappe-form-group">
                        <label className="frappe-label">From *</label>
                        <input className="frappe-input" type="date" required value={budgetForm.startDate} onChange={e => setBudgetForm({ ...budgetForm, startDate: e.target.value })} />
                      </div>
                      <div className="frappe-form-group">
                        <label className="frappe-label">To *</label>
                        <input className="frappe-input" type="date" required value={budgetForm.endDate} onChange={e => setBudgetForm({ ...budgetForm, endDate: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <Button type="button" variant="outline" size="sm" onClick={() => setAddingBudget(false)}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? <Loader2 size={12} className="animate-spin" style={{ marginRight: 4 }} /> : null}
                        Save Line
                      </Button>
                    </div>
                  </form>
                )}

                {(selected.budgets || []).length === 0 ? (
                  <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    No budget lines yet. Add revenue and expense projections to build your forecast.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {(selected.budgets || []).map(b => (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: 'var(--space-3) var(--space-4)',
                          background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 'var(--weight-medium)' }}>{b.account?.name || 'Account'}</span>
                          <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                            {new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
                          ${b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', borderTop: '2px solid var(--color-border)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                      <span>Total Forecast</span>
                      <span style={{ color: 'var(--color-primary)' }}>${totalBudget(selected).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <Layers size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.3 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Select a scenario to view its budget lines and projections.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
