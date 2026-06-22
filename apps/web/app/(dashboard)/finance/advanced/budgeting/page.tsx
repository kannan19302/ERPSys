/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Plus, PieChart, Layers, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface GLAccount {
  id: string;
  code: string;
  name: string;
}

interface BudgetScenario {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface BudgetAllocation {
  id: string;
  startDate: string;
  endDate: string;
  amount: number;
  account?: {
    name: string;
  };
  costCenter?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [budgetData, setBudgetData] = useState({ accountId: '', amount: '', startDate: '', endDate: '' });
  const [scenarioData, setScenarioData] = useState({ name: '', description: '', status: 'DRAFT' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const [budRes, scnRes, accRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/budgets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/forecast-scenarios', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (budRes.ok) setBudgets(await budRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (scnRes.ok) setScenarios(await scnRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (accRes.ok) setAccounts(await accRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountId: budgetData.accountId,
          amount: parseFloat(budgetData.amount) || 0,
          startDate: budgetData.startDate,
          endDate: budgetData.endDate
        })
      });
      if (res.ok) {
        setShowBudgetForm(false);
        setBudgetData({ accountId: '', amount: '', startDate: '', endDate: '' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to create budget: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/forecast-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(scenarioData)
      });
      if (res.ok) {
        setShowScenarioForm(false);
        setScenarioData({ name: '', description: '', status: 'DRAFT' });
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Failed to create scenario: ' + (err.message || 'Error'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Budgeting & Planning</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Cost center budgets, project budgets, and rolling forecast scenarios.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="outline" onClick={() => setShowScenarioForm(!showScenarioForm)}><Plus style={{ marginRight: 'var(--space-2)' }} /> New Scenario</Button>
          <Button onClick={() => setShowBudgetForm(!showBudgetForm)}><Plus style={{ marginRight: 'var(--space-2)' }} /> New Budget</Button>
        </div>
      </div>

      {showBudgetForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Allocate New Budget</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateBudget} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-4">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>GL Account</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={budgetData.accountId} onChange={e => setBudgetData({ ...budgetData, accountId: e.target.value })}>
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Budget Amount</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="number" required placeholder="50000" value={budgetData.amount} onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Start Date</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={budgetData.startDate} onChange={e => setBudgetData({ ...budgetData, startDate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>End Date</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={budgetData.endDate} onChange={e => setBudgetData({ ...budgetData, endDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowBudgetForm(false)}>Cancel</Button>
                <Button type="submit">Allocate Budget</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showScenarioForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Create Forecast Scenario</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreateScenario} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Scenario Name</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required placeholder="FY2027 Optimistic Case" value={scenarioData.name} onChange={e => setScenarioData({ ...scenarioData, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Description</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} placeholder="Reflects 15% revenue growth projection" value={scenarioData.description} onChange={e => setScenarioData({ ...scenarioData, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Status</label>
                  <select style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={scenarioData.status} onChange={e => setScenarioData({ ...scenarioData, status: e.target.value })}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowScenarioForm(false)}>Cancel</Button>
                <Button type="submit">Create Scenario</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-3">
        {/* Scenarios Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <TrendingUp style={{ height: '20px', width: '20px' }} />
                  <h3 style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>Forecast Scenarios</h3>
                </div>
                <Button variant="ghost" size="sm" style={{ paddingInline: 'var(--space-2)' }}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {scenarios.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', paddingBlock: 'var(--space-4)' }}>No scenarios defined.</p>
              ) : (
                scenarios.map(scn => (
                  <div key={scn.id} className="hover:border-primary/50 transition-colors bg-card" style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>{scn.name}</span>
                      <span style={{ fontWeight: 'var(--weight-bold)', paddingInline: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>{scn.status}</span>
                    </div>
                    {scn.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{scn.description}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Budgets Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <Card className="border-primary/20">
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30" style={{ borderRadius: 'var(--radius-lg)' }}>
                  <Target className="text-blue-700 dark:text-blue-400" style={{ height: '20px', width: '20px' }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 'var(--weight-bold)' }}>Allocated Budgets</h3>
                </div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Account</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Dimension</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>Period</th>
                    <th style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No budget allocations found.
                      </td>
                    </tr>
                  ) : (
                    budgets.map(b => (
                      <tr key={b.id} className="hover:bg-muted/30" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{b.account?.name || 'Unknown Account'}</td>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
                          {b.costCenter ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}><Layers className="h-3 w-3"/> {b.costCenter.name}</span>
                          ) : b.project ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}><PieChart className="h-3 w-3"/> {b.project.name}</span>
                          ) : (
                            'Company Wide'
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                          {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>${Number(b.amount).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
