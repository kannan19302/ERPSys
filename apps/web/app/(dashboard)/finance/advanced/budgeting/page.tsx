'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, Modal, TextField, FormField, Select,
  KPICard
} from '@unerp/ui';
import {
  Target, TrendingUp, Plus, PieChart, Layers, RefreshCw,
  Edit2, Trash2, BarChart2, DollarSign, AlertTriangle, CheckCircle, X,
  Shield, ArrowRight, Check, Ban
} from 'lucide-react';

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
  accountId: string;
  startDate: string;
  endDate: string;
  amount: number;
  costCenterId?: string | null;
  projectId?: string | null;
  account?: {
    code: string;
    name: string;
  };
  costCenter?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

interface BudgetVsActualData {
  fiscalYear: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  items: Array<{
    accountId: string;
    accountName: string;
    accountCode: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;
  }>;
}

interface BudgetControlConfig {
  enforcementAction: 'ALLOW' | 'WARN' | 'BLOCK';
  checkInvoices: boolean;
  checkJournals: boolean;
  checkExpenses: boolean;
  tolerancePercentage: number;
}

interface ReallocationLine {
  id: string;
  budgetId: string;
  type: 'SOURCE' | 'DESTINATION';
  amount: number;
  budget?: BudgetAllocation;
}

interface BudgetReallocation {
  id: string;
  number: string;
  description?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string;
  createdAt: string;
  lines: ReallocationLine[];
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function fmtBalance(b: string | number) {
  const val = typeof b === 'string' ? parseFloat(b) : b;
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BudgetingPage() {
  const [activeTab, setActiveTab] = useState<'budgets' | 'reallocations' | 'config'>('budgets');
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [reallocations, setReallocations] = useState<BudgetReallocation[]>([]);
  const [config, setConfig] = useState<BudgetControlConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Budget Create/Edit State
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetAllocation | null>(null);
  const [budgetData, setBudgetData] = useState({
    accountId: '',
    amount: '',
    startDate: '',
    endDate: '',
    costCenterId: '',
    projectId: '',
    spreadMethod: 'EVEN'
  });
  const [savingBudget, setSavingBudget] = useState(false);

  // Reallocation Create State
  const [showReallocForm, setShowReallocForm] = useState(false);
  const [reallocData, setReallocData] = useState({
    sourceBudgetId: '',
    destBudgetId: '',
    amount: '',
    description: ''
  });
  const [savingRealloc, setSavingRealloc] = useState(false);

  // Scenario Create State
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [scenarioData, setScenarioData] = useState({ name: '', description: '', status: 'DRAFT' });
  const [savingScenario, setSavingScenario] = useState(false);

  // Budget Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBudget, setDeletingBudget] = useState<BudgetAllocation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Vs Actuals Modal State
  const [vsActualOpen, setVsActualOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetAllocation | null>(null);
  const [vsActualData, setVsActualData] = useState<BudgetVsActualData | null>(null);
  const [vsActualLoading, setVsActualLoading] = useState(false);

  // Config Update Saving state
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = getToken() || '';
      const [budRes, scnRes, accRes, configRes, reallocRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/budgets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/forecast-scenarios', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/budget-control/config', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/v1/advanced-finance/budget-reallocations', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (budRes.ok) setBudgets(await budRes.json());
      if (scnRes.ok) setScenarios(await scnRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
      if (configRes.ok) setConfig(await configRes.json());
      if (reallocRes.ok) setReallocations(await reallocRes.json());
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setBudgetData({ accountId: '', amount: '', startDate: '', endDate: '', costCenterId: '', projectId: '', spreadMethod: 'EVEN' });
    setShowBudgetForm(true);
  };

  const handleOpenEdit = (budget: BudgetAllocation) => {
    setEditingBudget(budget);
    setBudgetData({
      accountId: budget.accountId,
      amount: String(budget.amount),
      startDate: new Date(budget.startDate).toISOString().split('T')[0] || '',
      endDate: new Date(budget.endDate).toISOString().split('T')[0] || '',
      costCenterId: budget.costCenterId || '',
      projectId: budget.projectId || '',
      spreadMethod: 'EVEN' // default to even on edit
    });
    setShowBudgetForm(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const url = editingBudget
        ? `http://localhost:3001/api/v1/advanced-finance/budgets/${editingBudget.id}`
        : 'http://localhost:3001/api/v1/advanced-finance/budgets';
      const method = editingBudget ? 'PATCH' : 'POST';

      const body: Record<string, any> = {
        accountId: budgetData.accountId,
        amount: parseFloat(budgetData.amount) || 0,
        startDate: budgetData.startDate,
        endDate: budgetData.endDate,
        costCenterId: budgetData.costCenterId || null,
        projectId: budgetData.projectId || null,
        spreadMethod: budgetData.spreadMethod
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowBudgetForm(false);
        setEditingBudget(null);
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed to save budget: ' + (err.message || 'Error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingBudget(false);
    }
  };

  const confirmDelete = (budget: BudgetAllocation) => {
    setDeletingBudget(budget);
    setDeleteOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/budgets/${deletingBudget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        setDeleteOpen(false);
        setDeletingBudget(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete budget.');
      }
    } catch {
      alert('Network error');
    } finally {
      setDeleting(false);
    }
  };

  const loadVsActuals = async (budget: BudgetAllocation) => {
    setSelectedBudget(budget);
    setVsActualLoading(true);
    setVsActualOpen(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/budgets/${budget.id}/vs-actuals`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        setVsActualData(await res.json());
      }
    } catch { /* handled */ }
    finally { setVsActualLoading(false); }
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingScenario(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/forecast-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(scenarioData)
      });
      if (res.ok) {
        setShowScenarioForm(false);
        setScenarioData({ name: '', description: '', status: 'DRAFT' });
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed to create scenario: ' + (err.message || 'Error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingScenario(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSavingConfig(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/budget-control/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({
          enforcementAction: config.enforcementAction,
          checkInvoices: config.checkInvoices,
          checkJournals: config.checkJournals,
          checkExpenses: config.checkExpenses,
          tolerancePercentage: Number(config.tolerancePercentage)
        })
      });
      if (res.ok) {
        alert('Budget control configurations updated successfully!');
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed to update config: ' + (err.message || 'Error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveRealloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reallocData.sourceBudgetId === reallocData.destBudgetId) {
      alert('Source and destination budgets must be different.');
      return;
    }
    setSavingRealloc(true);
    try {
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/budget-reallocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({
          description: reallocData.description,
          lines: [
            { budgetId: reallocData.sourceBudgetId, type: 'SOURCE', amount: parseFloat(reallocData.amount) || 0 },
            { budgetId: reallocData.destBudgetId, type: 'DESTINATION', amount: parseFloat(reallocData.amount) || 0 }
          ]
        })
      });
      if (res.ok) {
        setShowReallocForm(false);
        setReallocData({ sourceBudgetId: '', destBudgetId: '', amount: '', description: '' });
        fetchData();
      } else {
        const err = await res.json();
        alert('Failed to create reallocation: ' + (err.message || 'Error'));
      }
    } catch {
      alert('Network error');
    } finally {
      setSavingRealloc(false);
    }
  };

  const executeReallocAction = async (id: string, action: 'submit' | 'approve' | 'reject') => {
    try {
      const token = getToken() || '';
      let body = undefined;
      if (action === 'reject') {
        const notes = prompt('Please enter rejection notes:');
        if (notes === null) return;
        body = JSON.stringify({ notes });
      }

      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/budget-reallocations/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(`Failed to ${action} reallocation: ` + (err.message || 'Error'));
      }
    } catch {
      alert('Network error');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Budgeting & Planning"
        description="Allocate general ledger budgets, configure rolling forecasts, and track performance vs actuals"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Budgeting & Planning' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowScenarioForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> New Scenario
            </Button>
            <Button variant="outline" onClick={() => setShowReallocForm(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Reallocate Budget
            </Button>
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus size={14} style={{ marginRight: 6 }} /> Allocate Budget
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => setActiveTab('budgets')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'budgets' ? '2px solid var(--color-primary)' : 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'budgets' ? 'bold' : 'normal',
            color: activeTab === 'budgets' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          Allocated Budgets
        </button>
        <button
          onClick={() => setActiveTab('reallocations')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'reallocations' ? '2px solid var(--color-primary)' : 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'reallocations' ? 'bold' : 'normal',
            color: activeTab === 'reallocations' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          Budget Reallocations
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'config' ? '2px solid var(--color-primary)' : 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: activeTab === 'config' ? 'bold' : 'normal',
            color: activeTab === 'config' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }}
        >
          Active Control Config
        </button>
      </div>

      {showBudgetForm && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 'var(--weight-semibold)' }}>
              {editingBudget ? 'Edit Budget Allocation' : 'Allocate New Budget'}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setShowBudgetForm(false)}>
              <X size={16} />
            </Button>
          </div>
          <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              <FormField label="GL Account" required>
                <Select value={budgetData.accountId} onChange={e => setBudgetData({ ...budgetData, accountId: e.target.value })}>
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </Select>
              </FormField>
              <TextField label="Budget Amount ($)" type="number" required placeholder="50000" value={budgetData.amount} onChange={e => setBudgetData({ ...budgetData, amount: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
              <TextField label="Start Date" type="date" required value={budgetData.startDate} onChange={e => setBudgetData({ ...budgetData, startDate: e.target.value })} />
              <TextField label="End Date" type="date" required value={budgetData.endDate} onChange={e => setBudgetData({ ...budgetData, endDate: e.target.value })} />
              <FormField label="Spread Method" required>
                <Select value={budgetData.spreadMethod} onChange={e => setBudgetData({ ...budgetData, spreadMethod: e.target.value })}>
                  <option value="EVEN">EVEN Spread</option>
                  <option value="HISTORICAL_PROPORTIONAL">HISTORICAL PROPORTIONAL</option>
                </Select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              <FormField label="Cost Center (Optional)">
                <Select value={budgetData.costCenterId} onChange={e => setBudgetData({ ...budgetData, costCenterId: e.target.value })}>
                  <option value="">Company-wide</option>
                </Select>
              </FormField>
              <FormField label="Project (Optional)">
                <Select value={budgetData.projectId} onChange={e => setBudgetData({ ...budgetData, projectId: e.target.value })}>
                  <option value="">None</option>
                </Select>
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setShowBudgetForm(false)} disabled={savingBudget}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={savingBudget}>
                {savingBudget ? <Spinner size="sm" /> : 'Save Budget'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showScenarioForm && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 'var(--weight-semibold)' }}>Create Forecast Scenario</h3>
            <Button variant="outline" size="sm" onClick={() => setShowScenarioForm(false)}>
              <X size={16} />
            </Button>
          </div>
          <form onSubmit={handleCreateScenario} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              <TextField label="Scenario Name" required placeholder="FY2027 Optimistic Case" value={scenarioData.name} onChange={e => setScenarioData({ ...scenarioData, name: e.target.value })} />
              <FormField label="Status" required>
                <Select value={scenarioData.status} onChange={e => setScenarioData({ ...scenarioData, status: e.target.value })}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                </Select>
              </FormField>
            </div>
            <TextField label="Description" placeholder="Reflects 15% revenue growth projection" value={scenarioData.description} onChange={e => setScenarioData({ ...scenarioData, description: e.target.value })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setShowScenarioForm(false)} disabled={savingScenario}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={savingScenario}>
                {savingScenario ? <Spinner size="sm" /> : 'Create Scenario'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showReallocForm && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', margin: 0, fontWeight: 'var(--weight-semibold)' }}>Create Budget Reallocation</h3>
            <Button variant="outline" size="sm" onClick={() => setShowReallocForm(false)}>
              <X size={16} />
            </Button>
          </div>
          <form onSubmit={handleSaveRealloc} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              <FormField label="Source Budget (Transfer FROM)" required>
                <Select value={reallocData.sourceBudgetId} onChange={e => setReallocData({ ...reallocData, sourceBudgetId: e.target.value })}>
                  <option value="">Select Source Budget</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.account ? `${b.account.code} - ${b.account.name}` : b.accountId} (Balance: {fmtBalance(b.amount)})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Destination Budget (Transfer TO)" required>
                <Select value={reallocData.destBudgetId} onChange={e => setReallocData({ ...reallocData, destBudgetId: e.target.value })}>
                  <option value="">Select Destination Budget</option>
                  {budgets.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.account ? `${b.account.code} - ${b.account.name}` : b.accountId} (Balance: {fmtBalance(b.amount)})
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              <TextField label="Reallocation Amount ($)" type="number" required placeholder="5000" value={reallocData.amount} onChange={e => setReallocData({ ...reallocData, amount: e.target.value })} />
              <TextField label="Description" placeholder="Reallocate surplus department funds" value={reallocData.description} onChange={e => setReallocData({ ...reallocData, description: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setShowReallocForm(false)} disabled={savingRealloc}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={savingRealloc}>
                {savingRealloc ? <Spinner size="sm" /> : 'Request Reallocation'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'budgets' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Scenarios Sidebar */}
          <Card padding="none">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'var(--weight-bold)' }}>Forecast Scenarios</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scenarios.length === 0 ? (
                <div style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: 11, padding: '16px 0', color: 'var(--color-text-tertiary)' }}>No scenarios defined</div>
              ) : (
                scenarios.map(scn => (
                  <div key={scn.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 'bold' }}>{scn.name}</span>
                      <Badge variant={scn.status === 'ACTIVE' ? 'success' : 'info'}>{scn.status}</Badge>
                    </div>
                    {scn.description && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{scn.description}</div>}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Budgets Main Table */}
          <Card padding="none">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={20} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'var(--weight-bold)' }}>Allocated Budgets</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 12 }}>Account</th>
                    <th style={{ padding: 12 }}>Dimension</th>
                    <th style={{ padding: 12 }}>Period</th>
                    <th style={{ padding: 12, textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: 12, width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        No budget allocations found.
                      </td>
                    </tr>
                  ) : (
                    budgets.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 12, fontWeight: 'bold' }}>
                          {b.account ? `${b.account.code} - ${b.account.name}` : b.accountId}
                        </td>
                        <td style={{ padding: 12, color: 'var(--color-text-secondary)' }}>
                          {b.costCenter ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Layers size={12} /> {b.costCenter.name}</span>
                          ) : b.project ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><PieChart size={12} /> {b.project.name}</span>
                          ) : (
                            'Company-wide'
                          )}
                        </td>
                        <td style={{ padding: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          {fmtBalance(b.amount)}
                        </td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="outline" onClick={() => loadVsActuals(b)} title="View Budget vs Actuals">
                              <BarChart2 size={12} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(b)} title="Edit Budget">
                              <Edit2 size={12} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => confirmDelete(b)} title="Delete Budget" style={{ color: 'var(--color-danger)' }}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
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

      {activeTab === 'reallocations' && (
        <Card padding="none">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={20} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'var(--weight-bold)' }}>Budget Reallocations</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: 12 }}>Req Number</th>
                  <th style={{ padding: 12 }}>Description</th>
                  <th style={{ padding: 12 }}>Transfer Detail</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Requested By</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reallocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No budget reallocations found.
                    </td>
                  </tr>
                ) : (
                  reallocations.map(r => {
                    const sourceLine = r.lines.find(l => l.type === 'SOURCE');
                    const destLine = r.lines.find(l => l.type === 'DESTINATION');
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: 12, fontWeight: 'bold' }}>{r.number}</td>
                        <td style={{ padding: 12 }}>{r.description || 'N/A'}</td>
                        <td style={{ padding: 12 }}>
                          {sourceLine && destLine ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: 'var(--color-danger)', fontWeight: 'semibold' }}>
                                {sourceLine.budget?.account?.name || 'Source'}
                              </span>
                              <ArrowRight size={14} />
                              <span style={{ color: 'var(--color-success)', fontWeight: 'semibold' }}>
                                {destLine.budget?.account?.name || 'Destination'}
                              </span>
                              <span>({fmtBalance(sourceLine.amount)})</span>
                            </div>
                          ) : 'Invalid Lines'}
                        </td>
                        <td style={{ padding: 12 }}>
                          <Badge variant={
                            r.status === 'APPROVED' ? 'success' :
                            r.status === 'REJECTED' ? 'danger' :
                            r.status === 'SUBMITTED' ? 'info' : 'warning'
                          }>
                            {r.status}
                          </Badge>
                        </td>
                        <td style={{ padding: 12, color: 'var(--color-text-secondary)' }}>{r.requestedBy}</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {r.status === 'DRAFT' && (
                              <Button size="sm" variant="outline" onClick={() => executeReallocAction(r.id, 'submit')}>
                                Submit
                              </Button>
                            )}
                            {r.status === 'SUBMITTED' && (
                              <>
                                <Button size="sm" variant="outline" style={{ color: 'var(--color-success)' }} onClick={() => executeReallocAction(r.id, 'approve')}>
                                  <Check size={14} style={{ marginRight: 4 }} /> Approve
                                </Button>
                                <Button size="sm" variant="outline" style={{ color: 'var(--color-danger)' }} onClick={() => executeReallocAction(r.id, 'reject')}>
                                  <Ban size={14} style={{ marginRight: 4 }} /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'config' && config && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-6)' }}>
            <Shield size={22} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 'var(--weight-bold)' }}>Active Budget Enforcement Control</h3>
          </div>

          <form onSubmit={handleUpdateConfig} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-6)' }}>
              <FormField label="Enforcement Action Policy" required>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Define what happens when a transaction exceeds the remaining budget balance.
                </div>
                <Select value={config.enforcementAction} onChange={e => setConfig({ ...config, enforcementAction: e.target.value as any })}>
                  <option value="ALLOW">ALLOW (Disabled - No checks/warnings)</option>
                  <option value="WARN">WARN (Log warning, but allow post)</option>
                  <option value="BLOCK">BLOCK (Strict validation - Prevent execution)</option>
                </Select>
              </FormField>

              <TextField
                label="Tolerance Buffer (%)"
                type="number"
                required
                hint="Allowed percentage override buffer above the strict budget limit."
                value={config.tolerancePercentage}
                onChange={e => setConfig({ ...config, tolerancePercentage: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Enforcement Channels</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.checkJournals}
                    onChange={e => setConfig({ ...config, checkJournals: e.target.checked })}
                  />
                  Verify General Ledger Journal Entries
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.checkExpenses}
                    onChange={e => setConfig({ ...config, checkExpenses: e.target.checked })}
                  />
                  Verify Employee Expense Reports
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.checkInvoices}
                    onChange={e => setConfig({ ...config, checkInvoices: e.target.checked })}
                  />
                  Verify Accounts Payable & Vendor Invoices
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button type="submit" variant="primary" disabled={savingConfig}>
                {savingConfig ? <Spinner size="sm" /> : 'Save Enforcement Configuration'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Delete Budget Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Budget Allocation"
        description="Are you sure you want to delete this allocation case?" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="primary" onClick={handleDeleteBudget} disabled={deleting} style={{ background: 'var(--color-danger)' }}>
              {deleting ? <Spinner size="sm" /> : 'Confirm Delete'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, margin: 0 }}>
          Deletes the selected budget allocation. This action is permanent.
        </p>
      </Modal>

      {/* Budget vs Actuals Analysis Modal */}
      <Modal open={vsActualOpen} onClose={() => setVsActualOpen(false)} title="Budget vs Actuals Analysis"
        description={`Account performance tracking for budget period`} size="lg"
        footer={<Button variant="secondary" onClick={() => setVsActualOpen(false)}>Close Analysis</Button>}
      >
        {vsActualLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size="lg" /></div>
        ) : vsActualData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <KPICard title="Budget Allocation" value={fmtBalance(vsActualData.totalBudget)} color="var(--color-text)" />
              <KPICard title="Actual Posting" value={fmtBalance(vsActualData.totalActual)} color="var(--color-text)" />
              <KPICard title="Variance" value={fmtBalance(vsActualData.totalVariance)} color={vsActualData.totalVariance >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
            </div>

            {/* Status Alert Indicator */}
            {vsActualData.totalVariance < 0 ? (
              <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 13, alignItems: 'center' }}>
                <AlertTriangle size={16} />
                <span>Budget Exceeded! Actual expenditures are over-budget by {fmtBalance(Math.abs(vsActualData.totalVariance))}.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)', fontSize: 13, alignItems: 'center' }}>
                <CheckCircle size={16} />
                <span>On Target. Expenditures remain within the allocated budget threshold.</span>
              </div>
            )}

            {/* Variance Table */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Account Code / Name</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Budget Amount</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Actual Amount</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Variance</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>% Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {vsActualData.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 10, fontWeight: 'bold' }}>{item.accountCode} - {item.accountName}</td>
                      <td style={{ padding: 10, textAlign: 'right' }}>{fmtBalance(item.budgetAmount)}</td>
                      <td style={{ padding: 10, textAlign: 'right', color: 'var(--color-primary)' }}>{fmtBalance(item.actualAmount)}</td>
                      <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: item.variance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {fmtBalance(item.variance)}
                      </td>
                      <td style={{ padding: 10, textAlign: 'right', fontWeight: 'bold', color: item.variance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {item.variancePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-tertiary)' }}>No budget analysis loaded.</div>
        )}
      </Modal>
    </div>
  );
}
