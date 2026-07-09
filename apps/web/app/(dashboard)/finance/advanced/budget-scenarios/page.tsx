'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Copy, Lock, Unlock, FileEdit, Trash2, Loader2, Save, Sparkles, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface BudgetScenario {
  id: string;
  name: string;
  description?: string;
  type: string;
  fiscalYear: number;
  isLocked: boolean;
  status: string;
  _count?: { lines: number };
}

interface BudgetScenarioLine {
  id?: string;
  accountId: string;
  month: number;
  amount: number;
  driverType?: string;
  driverValue?: number;
  driverRate?: number;
  notes?: string;
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

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

export default function BudgetScenariosPage() {
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<BudgetScenario | null>(null);
  const [lines, setLines] = useState<BudgetScenarioLine[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [linesLoading, setLinesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [showDriver, setShowDriver] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'BASE',
    fiscalYear: 2026,
  });

  const [cloneForm, setCloneForm] = useState({
    name: '',
    type: 'UPSIDE',
  });

  const [driverForm, setDriverForm] = useState({
    accountId: '',
    driverType: 'HEADCOUNT' as 'HEADCOUNT' | 'UNITS' | 'PERCENTAGE',
    driverValue: '10',
    driverRate: '5000',
  });

  // Track manual cell updates
  const [editedCells, setEditedCells] = useState<Record<string, string>>({}); // keyed by accountId-month

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scenRes, accRes] = await Promise.all([
        fetch(`${API}/budget-scenarios`, { headers: authHeaders() }),
        fetch(`${API}/accounts`, { headers: authHeaders() }),
      ]);
      
      if (scenRes.ok) setScenarios(await scenRes.json() as BudgetScenario[]);
      if (accRes.ok) setAccounts(await accRes.json() as GLAccount[]);
    } catch {
      setError('Failed to fetch scenarios or chart of accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScenarioLines = useCallback(async (scenarioId: string) => {
    setLinesLoading(true);
    setEditedCells({});
    try {
      const res = await fetch(`${API}/budget-scenarios/${scenarioId}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as { lines: BudgetScenarioLine[] };
        setLines(data.lines);
      }
    } catch {
      setError('Failed to load budget scenario lines');
    } finally {
      setLinesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    if (selectedScenario) {
      fetchScenarioLines(selectedScenario.id);
    }
  }, [selectedScenario, fetchScenarioLines]);

  const handleCreate = async () => {
    if (!createForm.name) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/budget-scenarios`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setSuccess('Budget scenario created successfully');
        setShowCreate(false);
        setCreateForm({ name: '', description: '', type: 'BASE', fiscalYear: 2026 });
        fetchScenarios();
      }
    } catch {
      setError('Failed to create scenario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClone = async () => {
    if (!selectedScenario || !cloneForm.name) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/budget-scenarios/${selectedScenario.id}/clone`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(cloneForm),
      });
      if (res.ok) {
        setSuccess('Scenario cloned successfully');
        setShowClone(false);
        fetchScenarios();
      }
    } catch {
      setError('Failed to clone scenario');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLockToggle = async () => {
    if (!selectedScenario) return;
    setActionLoading(true);
    const endpoint = selectedScenario.isLocked ? 'unlock' : 'lock';
    try {
      const res = await fetch(`${API}/budget-scenarios/${selectedScenario.id}/${endpoint}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess(selectedScenario.isLocked ? 'Scenario unlocked' : 'Scenario approved and locked');
        // Refresh scenario
        const updatedRes = await fetch(`${API}/budget-scenarios/${selectedScenario.id}`, { headers: authHeaders() });
        if (updatedRes.ok) {
          const updatedScen = await updatedRes.json() as BudgetScenario;
          setSelectedScenario(updatedScen);
        }
        fetchScenarios();
      }
    } catch {
      setError('Failed to toggle lock status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete/archive this budget scenario?')) return;
    try {
      const res = await fetch(`${API}/budget-scenarios/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess('Scenario archived');
        if (selectedScenario?.id === id) setSelectedScenario(null);
        fetchScenarios();
      }
    } catch {
      setError('Failed to delete scenario');
    }
  };

  const handleDriverApply = async () => {
    if (!selectedScenario || !driverForm.accountId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/budget-scenarios/${selectedScenario.id}/driver`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          accountId: driverForm.accountId,
          driverType: driverForm.driverType,
          driverValue: parseFloat(driverForm.driverValue),
          driverRate: parseFloat(driverForm.driverRate),
        }),
      });
      if (res.ok) {
        setSuccess('Driver parameters computed and applied to Q1-Q4 months.');
        setShowDriver(false);
        fetchScenarioLines(selectedScenario.id);
      }
    } catch {
      setError('Failed to apply driver calculation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCellChange = (accountId: string, month: number, value: string) => {
    setEditedCells((prev) => ({
      ...prev,
      [`${accountId}-${month}`]: value,
    }));
  };

  const handleSaveCell = async (accountId: string, month: number) => {
    if (!selectedScenario) return;
    const key = `${accountId}-${month}`;
    const value = editedCells[key];
    if (value === undefined) return;
    
    try {
      const res = await fetch(`${API}/budget-scenarios/${selectedScenario.id}/lines`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          accountId,
          month,
          amount: parseFloat(value) || 0,
        }),
      });
      if (res.ok) {
        // Clear edited indicator
        setEditedCells((prev) => {
          const c = { ...prev };
          delete c[key];
          return c;
        });
        fetchScenarioLines(selectedScenario.id);
      }
    } catch {
      setError('Failed to save budget cell change');
    }
  };

  // Organize scenario lines by accountId-month for rendering lookup
  const lineMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) {
      map.set(`${line.accountId}-${line.month}`, Number(line.amount));
    }
    return map;
  }, [lines]);

  return (
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>FP&A</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">Budget Scenarios</span>
          </nav>
          <div className="frappe-title-section">
            <Layers className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">Budget Scenarios & Drivers</h1>
          </div>
          <p className="frappe-page-subtitle">
            Configure month-by-month budget planning, clone base scenarios, and calculate labor or unit driver projections.
          </p>
        </div>

        <div className="frappe-page-actions">
          {selectedScenario ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setSelectedScenario(null)}>
                Back to List
              </Button>
              <Button variant="secondary" onClick={() => setShowClone(true)}>
                <Copy size={16} className="mr-1" /> Branch Scenario
              </Button>
              {!selectedScenario.isLocked && (
                <Button variant="secondary" onClick={() => setShowDriver(true)}>
                  <Sparkles size={16} className="mr-1 text-purple-600" /> Apply Driver
                </Button>
              )}
              <Button
                variant={selectedScenario.isLocked ? 'secondary' : 'primary'}
                onClick={handleLockToggle}
                disabled={actionLoading}
              >
                {selectedScenario.isLocked ? (
                  <>
                    <Unlock size={16} className="mr-1" /> Unlock Draft
                  </>
                ) : (
                  <>
                    <Lock size={16} className="mr-1" /> Approve & Lock
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} className="mr-1" /> New Scenario
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="frappe-alert frappe-alert-error mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="frappe-alert frappe-alert-success mb-4">
          <Check size={16} /> {success}
        </div>
      )}

      {/* Main Scenarios List View */}
      {!selectedScenario ? (
        <Card className="frappe-list-card">
          {loading ? (
            <div className="frappe-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading budget scenarios...</div>
          ) : scenarios.length === 0 ? (
            <div className="frappe-empty-state">
              <Layers size={40} className="frappe-empty-icon" />
              <p>No budget scenarios found for this tenant.</p>
              <p className="text-xs text-gray-500 mt-1">Create a "FY2026 Base" draft scenario to start driver budgeting.</p>
            </div>
          ) : (
            <table className="frappe-table">
              <thead>
                <tr>
                  <th className="frappe-th">Scenario Name</th>
                  <th className="frappe-th">Type</th>
                  <th className="frappe-th text-center">Fiscal Year</th>
                  <th className="frappe-th text-center">Lines Entered</th>
                  <th className="frappe-th">Status</th>
                  <th className="frappe-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((sc) => (
                  <tr
                    key={sc.id}
                    className="frappe-tr cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedScenario(sc)}
                  >
                    <td className="frappe-td">
                      <div className="font-semibold text-blue-600 hover:underline">{sc.name}</div>
                      {sc.description && <div className="text-xs text-gray-500 font-normal">{sc.description}</div>}
                    </td>
                    <td className="frappe-td">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded">
                        {sc.type}
                      </span>
                    </td>
                    <td className="frappe-td text-center">{sc.fiscalYear}</td>
                    <td className="frappe-td text-center font-medium text-gray-600">
                      {sc._count?.lines || 0}
                    </td>
                    <td className="frappe-td">
                      <span className={`frappe-badge ${
                        sc.isLocked ? 'frappe-badge-green' : 'frappe-badge-gray'
                      }`}>
                        {sc.isLocked ? 'LOCKED / APPROVED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="frappe-td frappe-td-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(sc.id)}
                        className="frappe-action-btn frappe-action-btn-danger"
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
        </Card>
      ) : (
        /* Scenario Details & Monthly Grid View */
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-blue-800">Current View:</span> {selectedScenario.name} ({selectedScenario.type}) | Fiscal Year: {selectedScenario.fiscalYear}
            </div>
            {selectedScenario.isLocked && (
              <div className="flex items-center gap-1 text-green-700 font-semibold">
                <Lock size={12} /> Approved / Read-Only
              </div>
            )}
          </div>

          <Card className="frappe-list-card overflow-x-auto">
            <h3 className="font-semibold text-sm p-4 border-b border-gray-100">Monthly Budget Grid</h3>
            {linesLoading ? (
              <div className="frappe-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading grid...</div>
            ) : (
              <table className="frappe-table min-w-[1200px]">
                <thead>
                  <tr>
                    <th className="frappe-th sticky left-0 bg-white z-10 w-[200px]">GL Account</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i + 1} className="frappe-th text-right w-[90px]">Month {i + 1}</th>
                    ))}
                    <th className="frappe-th text-right w-[110px]">Row Total</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => {
                    let rowTotal = 0;
                    return (
                      <tr key={acc.id} className="frappe-tr">
                        <td className="frappe-td sticky left-0 bg-white z-10 font-medium">
                          <div className="text-xs text-gray-400">{acc.code}</div>
                          <div className="truncate font-semibold text-gray-700">{acc.name}</div>
                        </td>
                        
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = i + 1;
                          const cellKey = `${acc.id}-${month}`;
                          const val = lineMap.get(cellKey) || 0;
                          rowTotal += val;
                          
                          const isEdited = editedCells[cellKey] !== undefined;
                          const displayVal = isEdited ? editedCells[cellKey] : val.toString();
                          
                          return (
                            <td key={month} className="frappe-td text-right p-1">
                              <input
                                type="number"
                                className={`w-full text-right p-1 text-sm border rounded focus:ring-1 focus:outline-none ${
                                  selectedScenario.isLocked ? 'bg-gray-50 border-transparent cursor-not-allowed' :
                                  isEdited ? 'border-amber-400 bg-amber-50 focus:ring-amber-500' : 'border-gray-200 focus:ring-blue-500'
                                }`}
                                value={displayVal}
                                onChange={(e) => handleCellChange(acc.id, month, e.target.value)}
                                onBlur={() => handleSaveCell(acc.id, month)}
                                disabled={selectedScenario.isLocked}
                              />
                            </td>
                          );
                        })}
                        
                        <td className="frappe-td text-right font-bold text-gray-800">
                          ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <Card className="frappe-form-card max-w-md w-full p-6">
            <h3 className="frappe-form-title">Create Budget Scenario</h3>
            <div className="flex flex-col gap-3 my-4">
              <div className="frappe-form-group">
                <label className="frappe-label">Scenario Name</label>
                <input
                  className="frappe-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. FY2026 Base Draft"
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Description</label>
                <input
                  className="frappe-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Notes or scope guidelines..."
                />
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Type</label>
                  <select
                    className="frappe-input"
                    value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  >
                    <option value="BASE">Base Case</option>
                    <option value="UPSIDE">Upside Case</option>
                    <option value="DOWNSIDE">Downside Case</option>
                    <option value="CUSTOM">Custom Scenario</option>
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Fiscal Year</label>
                  <input
                    type="number"
                    className="frappe-input"
                    value={createForm.fiscalYear}
                    onChange={(e) => setCreateForm({ ...createForm, fiscalYear: parseInt(e.target.value, 10) || 2026 })}
                  />
                </div>
              </div>
            </div>
            <div className="frappe-form-actions mt-6">
              <Button onClick={handleCreate} disabled={actionLoading}>Create</Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Clone Dialog */}
      {showClone && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <Card className="frappe-form-card max-w-md w-full p-6">
            <h3 className="frappe-form-title">Branch Scenario</h3>
            <p className="text-xs text-gray-500 my-2">
              Clone scenario metadata and all budget lines to create a new branch.
            </p>
            <div className="flex flex-col gap-3 my-4">
              <div className="frappe-form-group">
                <label className="frappe-label">New Scenario Name</label>
                <input
                  className="frappe-input"
                  value={cloneForm.name}
                  onChange={(e) => setCloneForm({ ...cloneForm, name: e.target.value })}
                  placeholder="e.g. FY2026 High Inflation"
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Scenario Type</label>
                <select
                  className="frappe-input"
                  value={cloneForm.type}
                  onChange={(e) => setCloneForm({ ...cloneForm, type: e.target.value })}
                >
                  <option value="BASE">Base Case</option>
                  <option value="UPSIDE">Upside Case</option>
                  <option value="DOWNSIDE">Downside Case</option>
                  <option value="CUSTOM">Custom Scenario</option>
                </select>
              </div>
            </div>
            <div className="frappe-form-actions mt-6">
              <Button onClick={handleClone} disabled={actionLoading}>Clone Scenario</Button>
              <Button variant="secondary" onClick={() => setShowClone(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Driver Dialog */}
      {showDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <Card className="frappe-form-card max-w-md w-full p-6">
            <h3 className="frappe-form-title">Apply Driver Calculation</h3>
            <p className="text-xs text-gray-500 my-2">
              Generate monthly budget amounts using structural driver computations.
            </p>
            <div className="flex flex-col gap-3 my-4">
              <div className="frappe-form-group">
                <label className="frappe-label">Target GL Account</label>
                <select
                  className="frappe-input"
                  value={driverForm.accountId}
                  onChange={(e) => setDriverForm({ ...driverForm, accountId: e.target.value })}
                >
                  <option value="">Select Account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Driver Type</label>
                <select
                  className="frappe-input"
                  value={driverForm.driverType}
                  onChange={(e) => setDriverForm({ ...driverForm, driverType: e.target.value as any })}
                >
                  <option value="HEADCOUNT">Headcount (FTEs × Monthly Rate)</option>
                  <option value="UNITS">Sales Units (Units Sold × Price Per Unit)</option>
                  <option value="PERCENTAGE">Markup Percentage</option>
                </select>
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">
                    {driverForm.driverType === 'HEADCOUNT' ? 'FTE Count' :
                     driverForm.driverType === 'UNITS' ? 'Unit Quantity' : 'Base Amount'}
                  </label>
                  <input
                    type="number"
                    className="frappe-input"
                    value={driverForm.driverValue}
                    onChange={(e) => setDriverForm({ ...driverForm, driverValue: e.target.value })}
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">
                    {driverForm.driverType === 'HEADCOUNT' ? 'Salary Rate / Mo' :
                     driverForm.driverType === 'UNITS' ? 'Rate per Unit' : 'Multiplier %'}
                  </label>
                  <input
                    type="number"
                    className="frappe-input"
                    value={driverForm.driverRate}
                    onChange={(e) => setDriverForm({ ...driverForm, driverRate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="frappe-form-actions mt-6">
              <Button onClick={handleDriverApply} disabled={actionLoading}>Compute & Populate</Button>
              <Button variant="secondary" onClick={() => setShowDriver(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
