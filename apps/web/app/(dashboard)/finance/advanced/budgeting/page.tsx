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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgeting & Planning</h1>
          <p className="text-muted-foreground mt-1">Cost center budgets, project budgets, and rolling forecast scenarios.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScenarioForm(!showScenarioForm)}><Plus className="mr-2 h-4 w-4" /> New Scenario</Button>
          <Button onClick={() => setShowBudgetForm(!showBudgetForm)}><Plus className="mr-2 h-4 w-4" /> New Budget</Button>
        </div>
      </div>

      {showBudgetForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Allocate New Budget</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">GL Account</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={budgetData.accountId} onChange={e => setBudgetData({ ...budgetData, accountId: e.target.value })}>
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Amount</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" required placeholder="50000" value={budgetData.amount} onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="date" required value={budgetData.startDate} onChange={e => setBudgetData({ ...budgetData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="date" required value={budgetData.endDate} onChange={e => setBudgetData({ ...budgetData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowBudgetForm(false)}>Cancel</Button>
                <Button type="submit">Allocate Budget</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showScenarioForm && (
        <Card className="border-primary/20">
          <div className="p-6 pb-2">
            <h3 className="text-xl font-semibold leading-none tracking-tight">Create Forecast Scenario</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateScenario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scenario Name</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required placeholder="FY2027 Optimistic Case" value={scenarioData.name} onChange={e => setScenarioData({ ...scenarioData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Reflects 15% revenue growth projection" value={scenarioData.description} onChange={e => setScenarioData({ ...scenarioData, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required value={scenarioData.status} onChange={e => setScenarioData({ ...scenarioData, status: e.target.value })}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowScenarioForm(false)}>Cancel</Button>
                <Button type="submit">Create Scenario</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col border-primary/20">
            <div className="p-6 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-lg">Forecast Scenarios</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {scenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No scenarios defined.</p>
              ) : (
                scenarios.map(scn => (
                  <div key={scn.id} className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer transition-colors bg-card">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{scn.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted rounded">{scn.status}</span>
                    </div>
                    {scn.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scn.description}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Budgets Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <div className="p-6 border-b bg-muted/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold">Allocated Budgets</h3>
                </div>
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-4 font-medium">Account</th>
                    <th className="p-4 font-medium">Dimension</th>
                    <th className="p-4 font-medium">Period</th>
                    <th className="p-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No budget allocations found.
                      </td>
                    </tr>
                  ) : (
                    budgets.map(b => (
                      <tr key={b.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 font-medium">{b.account?.name || 'Unknown Account'}</td>
                        <td className="p-4 text-muted-foreground">
                          {b.costCenter ? (
                            <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3"/> {b.costCenter.name}</span>
                          ) : b.project ? (
                            <span className="inline-flex items-center gap-1"><PieChart className="h-3 w-3"/> {b.project.name}</span>
                          ) : (
                            'Company Wide'
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right font-bold text-primary">${Number(b.amount).toLocaleString()}</td>
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
