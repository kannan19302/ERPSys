'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Play, RefreshCw, AlertTriangle, Plus, Trash2, Edit, Loader2, Calendar, ClipboardList, Check } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

export default function CloseTasksPage() {
  const client = useApiClient();
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
      const data = await client.get<FinancialPeriod[]>('/advanced-finance/financial-periods');
        setPeriods(data);
        if (data.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(data[0]?.id || '');
        }
    } catch {
      setError('Failed to fetch financial periods');
    }
  }, [client, selectedPeriodId]);

  const fetchPeriodData = useCallback(async (periodId: string) => {
    if (!periodId) return;
    setLoading(true);
    setError('');
    try {
      const [tasks, flags, stats] = await Promise.all([
        client.get<CloseTask[]>(`/advanced-finance/close-tasks?periodId=${periodId}`),
        client.get<VarianceFlag[]>(`/advanced-finance/variance-flags?periodId=${periodId}`),
        client.get<CloseDashboardStats>(`/advanced-finance/close-tasks/dashboard?periodId=${periodId}`),
      ]);
      setTasks(tasks); setFlags(flags); setStats(stats);
    } catch {
      setError('Failed to fetch checklist or variance details');
    } finally {
      setLoading(false);
    }
  }, [client]);

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
      await client.post('/advanced-finance/close-tasks', {
          financialPeriodId: selectedPeriodId,
          ...taskForm,
        });
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
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await client.patch(`/advanced-finance/close-tasks/${id}`, { status: nextStatus });
      fetchPeriodData(selectedPeriodId);
    } catch {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await client.delete(`/advanced-finance/close-tasks/${id}`);
        setSuccess('Task deleted');
        fetchPeriodData(selectedPeriodId);
    } catch {
      setError('Failed to delete task');
    }
  };

  const handleGenerateFromTemplate = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await client.post('/advanced-finance/close-tasks/generate', { financialPeriodId: selectedPeriodId });
        setSuccess('Standard closing checklist generated from template');
        fetchPeriodData(selectedPeriodId);
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
      const data = await client.post<{ flagsCreated: number }>('/advanced-finance/variance-flags/run', {
          financialPeriodId: selectedPeriodId,
          thresholdPercent: parseFloat(threshold),
        });
        setSuccess(`Variance scan complete! Found and flagged ${data.flagsCreated} anomalous accounts.`);
        fetchPeriodData(selectedPeriodId);
    } catch {
      setError('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcknowledgeFlag = async (id: string) => {
    try {
      await client.post(`/advanced-finance/variance-flags/${id}/acknowledge`, { notes: 'Acknowledged during month-end reviews' });
        setSuccess('Variance flag acknowledged');
        fetchPeriodData(selectedPeriodId);
    } catch {
      setError('Failed to acknowledge variance flag');
    }
  };

  const handleResolveFlag = async (id: string) => {
    try {
      await client.post(`/advanced-finance/variance-flags/${id}/resolve`, { notes: 'Resolved and audited' });
        setSuccess('Variance flag marked as resolved');
        fetchPeriodData(selectedPeriodId);
    } catch {
      setError('Failed to resolve variance flag');
    }
  };

  return (
    <RouteGuard permission="finance.close.read">
      <div className="ui-page-container">
      <div className="ui-page-head">
        <div className="ui-page-head-content">
          <nav className="ui-breadcrumb">
            <span>Finance</span><span className="ui-breadcrumb-sep">/</span>
            <span>Close Process</span><span className="ui-breadcrumb-sep">/</span>
            <span className="ui-breadcrumb-current">Continuous Close</span>
          </nav>
          <div className="ui-title-section">
            <ClipboardList className="ui-title-icon" size={20} />
            <h1 className="ui-page-title">Continuous Close Automation</h1>
          </div>
          <p className="ui-page-subtitle">
            Manage period-end reconciliation checklist tasks, assign close duties, and flag balance variance exceptions.
          </p>
        </div>

        <div className="ui-page-actions flex items-center gap-2">
          <select
            className="ui-input min-w-[200px]"
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
        <div className="ui-alert ui-alert-error mb-4">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="ui-alert ui-alert-success mb-4">
          <Check size={16} /> {success}
        </div>
      )}

      {stats && (
        <div className="ui-grid-3 mb-4">
          <Card className="ui-card p-4">
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

          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">Overdue Checklist Items</h3>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-3xl font-bold ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.overdueTasks}
              </span>
              <Calendar className="text-gray-400" size={24} />
            </div>
            <p className="text-xs text-gray-500 mt-3">Requires immediate attention from owners.</p>
          </Card>

          <Card className="ui-card p-4">
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
            <Card className="ui-form-card mb-4">
              <h3 className="ui-form-title">Add Closing Duty Task</h3>
              <div className="ui-form-grid">
                <div className="ui-form-group col-span-2">
                  <label className="ui-label">Task Name</label>
                  <input
                    className="ui-input"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                    placeholder="e.g. Accrue Q3 Software Subscriptions"
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Category</label>
                  <select
                    className="ui-input"
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
                <div className="ui-form-group">
                  <label className="ui-label">Priority</label>
                  <select
                    className="ui-input"
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Due Date</label>
                  <input
                    type="date"
                    className="ui-input"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="ui-form-group col-span-2">
                  <label className="ui-label">Description / Instructions</label>
                  <textarea
                    className="ui-input"
                    rows={2}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Provide details on how to execute or verify this step..."
                  />
                </div>
              </div>
              <div className="ui-form-actions">
                <Button onClick={handleCreateTask} disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
                  Create
                </Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          <Card className="ui-list-card">
            {loading ? (
              <div className="ui-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading checklist tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="ui-empty-state">
                <ClipboardList size={40} className="ui-empty-icon" />
                <p>No checklist duties registered for this financial period.</p>
                <p className="text-xs text-gray-500 mt-1">Generate a default set or add custom closing steps to start.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'id', header: '', render: (v, row) => (
                    <button
                      onClick={() => handleToggleTaskStatus(String(v), String(row.status))}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${row.status === 'DONE' ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 hover:border-blue-500'}`}
                    >
                      {row.status === 'DONE' && <Check size={14} />}
                    </button>
                  ) },
                  { key: 'name', header: 'Closing Duty Name', render: (v, row) => (
                    <div>
                      <div className="font-semibold">{String(v)}</div>
                      {Boolean(row.description) && <div className="text-xs text-gray-500 font-normal">{String(row.description)}</div>}
                    </div>
                  ) },
                  { key: 'category', header: 'Category', render: (v) => <span className="text-xs text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded-full">{String(v)}</span> },
                  { key: 'priority', header: 'Priority', render: (v) => (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === 'CRITICAL' ? 'bg-red-100 text-red-700' : v === 'HIGH' ? 'bg-orange-100 text-orange-700' : v === 'MEDIUM' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{String(v)}</span>
                  ) },
                  { key: 'dueDate', header: 'Due Date', render: (v) => v ? new Date(String(v)).toLocaleDateString() : 'No due date' },
                  { key: 'status', header: 'Status', render: (v) => (
                    <span className={`ui-badge ${v === 'DONE' ? 'ui-badge-green' : v === 'IN_PROGRESS' ? 'ui-badge-blue' : 'ui-badge-gray'}`}>{String(v)}</span>
                  ) },
                  { key: 'id', header: 'Actions', render: (v) => (
                    <button onClick={() => handleDeleteTask(String(v))} className="ui-action-btn ui-action-btn-danger" title="Delete"><Trash2 size={14} /></button>
                  ) },
                ] as ListColumn[]}
                data={(tasks as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No tasks"
                emptyDescription="No checklist duties registered for this financial period."
              />
            )}
          </Card>
        </>
      )}

      {activeTab === 'variance' && (
        <>
          <Card className="ui-card p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3">Reconciliation Variance Flag Scan</h3>
            <p className="text-xs text-gray-500 mb-4">
              Compare this period's ledger accounts against prior period actual balances. Generate exception flags when PoP deviation exceeds the threshold.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Variance Threshold (%):</label>
                <input
                  type="number"
                  className="ui-input max-w-[80px]"
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

          <Card className="ui-list-card">
            <h3 className="font-semibold text-sm p-4 border-b border-gray-100">Flagged Anomalies ({flags.length})</h3>
            {loading ? (
              <div className="ui-loading"><Loader2 className="animate-spin mr-2" size={20} /> Loading anomalies...</div>
            ) : flags.length === 0 ? (
              <div className="ui-empty-state">
                <CheckCircle2 size={40} className="text-green-500 mb-2" />
                <p>All accounts are within reasonable thresholds. No variance anomalies flagged.</p>
              </div>
            ) : (
              <ListPageTemplate
                columns={[
                  { key: 'accountId', header: 'GL Account', render: (v) => <span className="font-medium">{String(v)}</span> },
                  { key: 'priorAmount', header: 'Prior Bal', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'currentAmount', header: 'Current Bal', render: (v) => `$${Number(v).toLocaleString()}` },
                  { key: 'varianceAmount', header: 'Variance Amount', render: (v) => <span className={`font-semibold ${Number(v) < 0 ? 'text-red-600' : 'text-green-600'}`}>${Number(v).toLocaleString()}</span> },
                  { key: 'variancePercent', header: 'Deviation (%)', render: (v) => <span className="font-semibold text-red-600">{Number(v).toFixed(1)}%</span> },
                  { key: 'severity', header: 'Severity', render: (v) => (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v === 'CRITICAL' ? 'bg-red-100 text-red-700' : v === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{String(v)}</span>
                  ) },
                  { key: 'status', header: 'Status', render: (v) => (
                    <span className={`ui-badge ${v === 'RESOLVED' ? 'ui-badge-green' : v === 'ACKNOWLEDGED' ? 'ui-badge-blue' : 'ui-badge-red'}`}>{String(v)}</span>
                  ) },
                  { key: 'id', header: 'Actions', render: (v, row) => (
                    <div className="flex gap-1">
                      {row.status === 'OPEN' && <button onClick={() => handleAcknowledgeFlag(String(v))} className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded hover:bg-blue-100">Acknowledge</button>}
                      {row.status !== 'RESOLVED' && <button onClick={() => handleResolveFlag(String(v))} className="text-xs bg-green-50 text-green-700 font-semibold px-2 py-1 rounded hover:bg-green-100">Mark Resolved</button>}
                    </div>
                  ) },
                ] as ListColumn[]}
                data={(flags as unknown as Record<string, unknown>[])}
                loading={false}
                emptyTitle="No anomalies"
                emptyDescription="All accounts are within reasonable thresholds."
              />
            )}
          </Card>
        </>
      )}
      </div>
    </RouteGuard>
  );
}
