'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Play, RefreshCw, AlertTriangle, Plus, Trash2, Edit, Loader2, Calendar, ClipboardList, Check } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface FinancialPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CloseTask {
  id: string;
  name: string;
  description?: string;
  category: string;
  assigneeId?: string;
  dueDate?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

interface VarianceFlag {
  id: string;
  accountId: string;
  currentAmount: string | number;
  priorAmount: string | number;
  varianceAmount: string | number;
  variancePercent: string | number;
  thresholdPercent: string | number;
  severity: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  notes?: string;
}

interface CloseDashboardStats {
  periodId: string;
  totalTasks: number;
  completionPercent: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdueTasks: number;
  openVarianceFlags: number;
  criticalFlags: number;
  topFlags: VarianceFlag[];
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

export default function CloseTasksPage() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const [tasks, setTasks] = useState<CloseTask[]>([]);
  const [flags, setFlags] = useState<VarianceFlag[]>([]);
  const [stats, setStats] = useState<CloseDashboardStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [activeTab, setActiveTab] = useState<'checklist' | 'variance'>('checklist');
  const [threshold, setThreshold] = useState('10');
  
  // New task form state
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    category: 'RECONCILIATION',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await fetch(`${API}/financial-periods`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json() as FinancialPeriod[];
        setPeriods(data);
        if (data.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(data[0]?.id || '');
        }
      }
    } catch {
      setError('Failed to fetch financial periods');
    }
  }, [selectedPeriodId]);

  const fetchPeriodData = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const [tasksRes, flagsRes, statsRes] = await Promise.all([
        fetch(`${API}/close-tasks?periodId=${periodId}`, { headers: authHeaders() }),
        fetch(`${API}/variance-flags?periodId=${periodId}`, { headers: authHeaders() }),
        fetch(`${API}/close-tasks/dashboard?periodId=${periodId}`, { headers: authHeaders() }),
      ]);
      
      if (tasksRes.ok) setTasks(await tasksRes.json() as CloseTask[]);
      if (flagsRes.ok) setFlags(await flagsRes.json() as VarianceFlag[]);
      if (statsRes.ok) setStats(await statsRes.json() as CloseDashboardStats);
    } catch {
      setError('Failed to fetch checklist or variance details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchPeriodData(selectedPeriodId);
    }
  }, [selectedPeriodId, fetchPeriodData]);

  const handleCreateTask = async () => {
    if (!taskForm.name) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/close-tasks`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          financialPeriodId: selectedPeriodId,
          ...taskForm,
        }),
      });
      if (res.ok) {
        setSuccess('Close task created successfully');
        setShowForm(false);
        setTaskForm({
          name: '',
          description: '',
          category: 'RECONCILIATION',
          priority: 'MEDIUM',
          dueDate: new Date().toISOString().slice(0, 10),
        });
        fetchPeriodData(selectedPeriodId);
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to create task');
      }
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'OPEN' : 'DONE';
    try {
      const res = await fetch(`${API}/close-tasks/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchPeriodData(selectedPeriodId);
      }
    } catch {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`${API}/close-tasks/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setSuccess('Task deleted');
        fetchPeriodData(selectedPeriodId);
      }
    } catch {
      setError('Failed to delete task');
    }
  };

  const handleGenerateFromTemplate = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/close-tasks/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ financialPeriodId: selectedPeriodId }),
      });
      if (res.ok) {
        setSuccess('Standard closing checklist generated from template');
        fetchPeriodData(selectedPeriodId);
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to generate templates');
      }
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunVarianceEngine = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API}/variance-flags/run`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          financialPeriodId: selectedPeriodId,
          thresholdPercent: parseFloat(threshold),
        }),
      });
      if (res.ok) {
        const data = await res.json() as { flagsCreated: number };
        setSuccess(`Variance scan complete! Found and flagged ${data.flagsCreated} anomalous accounts.`);
        fetchPeriodData(selectedPeriodId);
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to run variance analysis');
      }
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeFlag = async (id: string) => {
    try {
      const res = await fetch(`${API}/variance-flags/${id}/acknowledge`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ notes: 'Acknowledged during month-end reviews' }),
      });
      if (res.ok) {
        setSuccess('Variance flag acknowledged');
        fetchPeriodData(selectedPeriodId);
      }
    } catch {
      setError('Failed to acknowledge variance flag');
    }
  };

  const handleResolveFlag = async (id: string) => {
    try {
      const res = await fetch(`${API}/variance-flags/${id}/resolve`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ notes: 'Resolved and audited' }),
      });
      if (res.ok) {
        setSuccess('Variance flag marked as resolved');
        fetchPeriodData(selectedPeriodId);
      }
    } catch {
      setError('Failed to resolve variance flag');
    }
  };

  return (
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>Close Process</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">Continuous Close</span>
          </nav>
          <div className="frappe-title-section">
            <ClipboardList className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">Continuous Close Automation</h1>
          </div>
          <p className="frappe-page-subtitle">
            Manage period-end reconciliation checklist tasks, assign close duties, and flag balance variance exceptions.
          </p>
        </div>

        <div className="frappe-page-actions flex items-center gap-2">
          <select
            className="frappe-input min-w-[200px]"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            <option value="">Select Financial Period...</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
          
          <Button variant="secondary" onClick={() => fetchPeriodData(selectedPeriodId)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
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

      {stats && (
        <div className="frappe-grid-3 mb-4">
          <Card className="frappe-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">Checklist Progress</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold">{stats.completionPercent}%</span>
              <span className="text-sm text-gray-500">
                ({tasks.filter((t) => t.status === 'DONE').length} of {stats.totalTasks} complete)
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-green-600 h-2 transition-all duration-300"
                style={{ width: `${stats.completionPercent}%` }}
              ></div>
            </div>
          </Card>

          <Card className="frappe-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">Overdue Checklist Items</h3>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-3xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.overdueTasks}
              </span>
              <Calendar className="text-gray-400" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-3">Requires immediate attention from owners.</p>
          </Card>

          <Card className="frappe-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">Unresolved Variance Flags</h3>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-3xl font-bold ${stats.criticalFlags > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                {stats.openVarianceFlags}
              </span>
              <AlertTriangle className={stats.criticalFlags > 0 ? 'text-red-500' : 'text-amber-500'} size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-3">{stats.criticalFlags} are marked critical (&gt;50% dev).</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`py-2 px-4 font-semibold text-sm ${
            activeTab === 'checklist'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('checklist')}
        >
          Closing Tasks Checklist
        </button>
        <button
          className={`py-2 px-4 font-semibold text-sm ${
            activeTab === 'variance'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('variance')}
        >
          Reconciliation & Variance Flags
        </button>
      </div>

      {activeTab === 'checklist' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} className="mr-1" /> Add Task
              </Button>
              {tasks.length === 0 && (
                <Button variant="secondary" onClick={handleGenerateFromTemplate} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
                  Autogen Closing Checklist
                </Button>
              )}
            </div>
          </div>

          {showForm && (
            <Card className="frappe-form-card mb-4">
              <h3 className="frappe-form-title">Add Closing Duty Task</h3>
              <div className="frappe-form-grid">
                <div className="frappe-form-group col-span-2">
                  <label className="frappe-label">Task Name</label>
                  <input
                    className="frappe-input"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                    placeholder="e.g. Accrue Q3 Software Subscriptions"
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Category</label>
                  <select
                    className="frappe-input"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                  >
                    <option value="RECONCILIATION">Reconciliation</option>
                    <option value="ACCRUALS">Accruals</option>
                    <option value="REPORTING">Reporting & Consolidation</option>
                    <option value="APPROVAL">Sign-off & Approvals</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Priority</label>
                  <select
                    className="frappe-input"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Due Date</label>
                  <input
                    type="date"
                    className="frappe-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="frappe-form-group col-span-2">
                  <label className="frappe-label">Description / Instructions</label>
                  <textarea
                    className="frappe-input"
                    rows={2}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Provide details on how to execute or verify this step..."
                  />
                </div>
              </div>
              <div className="frappe-form-actions">
                <Button onClick={handleCreateTask} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                  Create
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          <Card className="frappe-list-card">
            {loading ? (
              <div className="frappe-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading checklist tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="frappe-empty-state">
                <ClipboardList size={40} className="frappe-empty-icon" />
                <p>No checklist duties registered for this financial period.</p>
                <p className="text-xs text-gray-500 mt-1">Generate a default set or add custom closing steps to start.</p>
              </div>
            ) : (
              <table className="frappe-table">
                <thead>
                  <tr>
                    <th className="frappe-th w-[40px]"></th>
                    <th className="frappe-th">Closing Duty Name</th>
                    <th className="frappe-th">Category</th>
                    <th className="frappe-th">Priority</th>
                    <th className="frappe-th">Due Date</th>
                    <th className="frappe-th">Status</th>
                    <th className="frappe-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className={`frappe-tr ${task.status === 'DONE' ? 'opacity-60 bg-gray-50' : ''}`}>
                      <td className="frappe-td">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                            task.status === 'DONE'
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {task.status === 'DONE' && <Check size={14} />}
                        </button>
                      </td>
                      <td className="frappe-td">
                        <div className="font-semibold">{task.name}</div>
                        {task.description && <div className="text-xs text-gray-500 font-normal">{task.description}</div>}
                      </td>
                      <td className="frappe-td">
                        <span className="text-xs text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                          {task.category}
                        </span>
                      </td>
                      <td className="frappe-td">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="frappe-td text-sm text-gray-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </td>
                      <td className="frappe-td">
                        <span className={`frappe-badge ${
                          task.status === 'DONE' ? 'frappe-badge-green' :
                          task.status === 'IN_PROGRESS' ? 'frappe-badge-blue' : 'frappe-badge-gray'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="frappe-td frappe-td-actions">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
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
        </>
      )}

      {activeTab === 'variance' && (
        <>
          <Card className="frappe-card p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3">Reconciliation Variance Flag Scan</h3>
            <p className="text-xs text-gray-500 mb-4">
              Compare this period's ledger accounts against prior period actual balances. Generate exception flags when PoP deviation exceeds the threshold.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Variance Threshold (%):</label>
                <input
                  type="number"
                  className="frappe-input max-w-[80px]"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
              <Button onClick={handleRunVarianceEngine} disabled={actionLoading}>
                <Play size={16} className="mr-1" /> Scan Ledgers & Flag Variances
              </Button>
            </div>
          </Card>

          <Card className="frappe-list-card">
            <h3 className="font-semibold text-sm p-4 border-b border-gray-100">Flagged Anomalies ({flags.length})</h3>
            {loading ? (
              <div className="frappe-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading anomalies...</div>
            ) : flags.length === 0 ? (
              <div className="frappe-empty-state">
                <CheckCircle2 size={40} className="text-green-500 mb-2" />
                <p>All accounts are within reasonable thresholds. No variance anomalies flagged.</p>
              </div>
            ) : (
              <table className="frappe-table">
                <thead>
                  <tr>
                    <th className="frappe-th">GL Account</th>
                    <th className="frappe-th text-right">Prior Bal</th>
                    <th className="frappe-th text-right">Current Bal</th>
                    <th className="frappe-th text-right">Variance Amount</th>
                    <th className="frappe-th text-right">Deviation (%)</th>
                    <th className="frappe-th">Severity</th>
                    <th className="frappe-th">Status</th>
                    <th className="frappe-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr key={flag.id} className="frappe-tr">
                      <td className="frappe-td font-medium">{flag.accountId}</td>
                      <td className="frappe-td text-right">${Number(flag.priorAmount).toLocaleString()}</td>
                      <td className="frappe-td text-right">${Number(flag.currentAmount).toLocaleString()}</td>
                      <td className="frappe-td text-right font-semibold ${Number(flag.varianceAmount) < 0 ? 'text-red-600' : 'text-green-600'}">
                        ${Number(flag.varianceAmount).toLocaleString()}
                      </td>
                      <td className="frappe-td text-right font-semibold text-red-600">{Number(flag.variancePercent).toFixed(1)}%</td>
                      <td className="frappe-td">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          flag.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          flag.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {flag.severity}
                        </span>
                      </td>
                      <td className="frappe-td">
                        <span className={`frappe-badge ${
                          flag.status === 'RESOLVED' ? 'frappe-badge-green' :
                          flag.status === 'ACKNOWLEDGED' ? 'frappe-badge-blue' : 'frappe-badge-red'
                        }`}>
                          {flag.status}
                        </span>
                      </td>
                      <td className="frappe-td frappe-td-actions flex gap-1">
                        {flag.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledgeFlag(flag.id)}
                            className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Acknowledge
                          </button>
                        )}
                        {flag.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveFlag(flag.id)}
                            className="text-xs bg-green-50 text-green-700 font-semibold px-2 py-1 rounded hover:bg-green-100"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
