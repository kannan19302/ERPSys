'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, Plus, Pencil, Trash2, RefreshCw, CheckCircle, AlertCircle,
  X, Play, Clock, History,
} from 'lucide-react';

/* ───────── types ───────── */
const TRIGGERS = [
  'record.created', 'record.updated', 'record.deleted',
  'schedule.daily', 'schedule.weekly', 'form.submitted', 'field.changed',
] as const;
type Trigger = (typeof TRIGGERS)[number];

const ACTION_TYPES = ['send_email', 'update_field', 'create_record', 'webhook'] as const;
type ActionType = (typeof ACTION_TYPES)[number];

const OPERATORS = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'] as const;
type Status = 'DRAFT' | 'ACTIVE' | 'PAUSED';

interface Condition { field: string; operator: string; value: string; }
interface RuleAction { type: ActionType; config: string; }

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  status: Status;
  conditions: Condition[];
  actions: RuleAction[];
  runOnce: boolean;
  logExecution: boolean;
  haltOnError: boolean;
  runCount: number;
  lastRun: string | null;
  avgExecTime: number | null;
}

interface Execution {
  id: string;
  ruleId: string;
  status: 'SUCCESS' | 'FAILURE';
  triggerData: string;
  result: string;
  duration: number;
  timestamp: string;
}

type FormData = {
  name: string; description: string; trigger: Trigger; status: Status;
  conditions: Condition[]; actions: RuleAction[];
  runOnce: boolean; logExecution: boolean; haltOnError: boolean;
};

const blankForm = (): FormData => ({
  name: '', description: '', trigger: 'record.created', status: 'DRAFT',
  conditions: [], actions: [], runOnce: false, logExecution: true, haltOnError: false,
});

/* ───────── api helpers ───────── */
const API_BASE = '/api/v1/admin/automation-rules';
function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

/* ───────── shared inline styles ───────── */
const th: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' };
const btnPrimary: React.CSSProperties = {
  background: 'var(--color-primary)', color: '#fff', border: 'none',
  padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--color-border)',
  padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
  cursor: 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--space-2) var(--space-3)',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)',
};
const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
  color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)',
};
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modal: React.CSSProperties = {
  background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)', width: '100%', maxWidth: 640,
  maxHeight: '90vh', overflow: 'auto', padding: 'var(--space-6)',
};

const statusColors: Record<Status, { bg: string; color: string }> = {
  DRAFT: { bg: 'var(--color-bg)', color: 'var(--color-text-secondary)' },
  ACTIVE: { bg: 'rgba(var(--color-success-rgb),0.1)', color: 'var(--color-success)' },
  PAUSED: { bg: 'rgba(var(--color-warning-rgb),0.1)', color: 'var(--color-warning)' },
};

/* ───────── component ───────── */
export default function AutomationRulesPage() {
  const [tab, setTab] = useState<'rules' | 'history'>('rules');
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(blankForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [testModal, setTestModal] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('{}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* fetch rules */
  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers: authHeaders() });
      if (res.ok) setRules(await res.json()); else setRules([]);
    } catch { setRules([]); }
    finally { setLoading(false); }
  }, []);

  /* fetch executions */
  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/executions`, { headers: authHeaders() });
      if (res.ok) setExecutions(await res.json()); else setExecutions([]);
    } catch { setExecutions([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'rules') fetchRules(); else fetchExecutions();
  }, [tab, fetchRules, fetchExecutions]);

  /* save */
  const handleSave = async () => {
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
    try {
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      if (res.ok) { showToast(editingId ? 'Rule updated' : 'Rule created'); setShowModal(false); fetchRules(); }
      else showToast('Save failed', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  /* delete */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { showToast('Rule deleted'); fetchRules(); } else showToast('Delete failed', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setConfirmDeleteId(null); }
  };

  /* test */
  const handleTest = async () => {
    if (!testModal) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/${testModal}/test`, {
        method: 'POST', headers: authHeaders(), body: testInput,
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch { setTestResult('Error running test'); }
    finally { setTestRunning(false); }
  };

  const openCreate = () => { setEditingId(null); setForm(blankForm()); setShowModal(true); };
  const openEdit = (r: AutomationRule) => {
    setEditingId(r.id);
    setForm({
      name: r.name, description: r.description, trigger: r.trigger, status: r.status,
      conditions: r.conditions ?? [], actions: r.actions ?? [],
      runOnce: r.runOnce, logExecution: r.logExecution, haltOnError: r.haltOnError,
    });
    setShowModal(true);
  };

  /* condition / action helpers */
  const addCondition = () => setForm({ ...form, conditions: [...form.conditions, { field: '', operator: 'equals', value: '' }] });
  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    const c = [...form.conditions]; c[idx] = { ...c[idx], ...patch } as Condition; setForm({ ...form, conditions: c });
  };
  const removeCondition = (idx: number) => setForm({ ...form, conditions: form.conditions.filter((_, i) => i !== idx) });

  const addAction = () => setForm({ ...form, actions: [...form.actions, { type: 'send_email', config: '' }] });
  const updateAction = (idx: number, patch: Partial<RuleAction>) => {
    const a = [...form.actions]; a[idx] = { ...a[idx], ...patch } as RuleAction; setForm({ ...form, actions: a });
  };
  const removeAction = (idx: number) => setForm({ ...form, actions: form.actions.filter((_, i) => i !== idx) });

  const tabBtn = (t: 'rules' | 'history', label: string, icon: React.ReactNode): React.CSSProperties & Record<string, unknown> => ({
    ...btnGhost,
    background: tab === t ? 'var(--color-primary)' : 'transparent',
    color: tab === t ? '#fff' : undefined,
    borderColor: tab === t ? 'var(--color-primary)' : undefined,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Zap style={{ color: 'var(--color-primary)' }} /> Automation Rules
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Create event-driven automation rules with conditions and actions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={() => setTab('rules')} style={tabBtn('rules', 'Rules', <Zap size={14} />)}>
            <Zap size={14} /> Rules
          </button>
          <button onClick={() => setTab('history')} style={tabBtn('history', 'History', <History size={14} />)}>
            <History size={14} /> Executions
          </button>
          {tab === 'rules' && (
            <>
              <button onClick={fetchRules} disabled={loading} style={btnGhost}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
              <button onClick={openCreate} style={btnPrimary}>
                <Plus size={14} /> Create Rule
              </button>
            </>
          )}
          {tab === 'history' && (
            <button onClick={fetchExecutions} disabled={loading} style={btnGhost}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div style={{
          padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          background: toast.type === 'success' ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)',
          border: `1px solid var(--color-${toast.type === 'success' ? 'success' : 'danger'})`,
          color: `var(--color-${toast.type === 'success' ? 'success' : 'danger'})`,
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* RULES TAB */}
      {tab === 'rules' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Trigger</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...th, textAlign: 'center' }}>Run Count</th>
                  <th style={th}>Last Run</th>
                  <th style={th}>Avg Time</th>
                  <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>No automation rules defined.</td></tr>
                ) : rules.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...td, fontWeight: 'var(--weight-semibold)' }}>
                      <div>{r.name}</div>
                      {r.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{r.description}</div>}
                    </td>
                    <td style={td}>
                      <span style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)' }}>
                        {r.trigger}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{
                        padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                        background: statusColors[r.status].bg, color: statusColors[r.status].color,
                      }}>{r.status}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>{r.runCount}</td>
                    <td style={td}>{r.lastRun ? new Date(r.lastRun).toLocaleString() : '—'}</td>
                    <td style={td}>{r.avgExecTime != null ? `${r.avgExecTime}ms` : '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setTestModal(r.id); setTestInput('{}'); setTestResult(null); }} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)' }} title="Test"><Play size={14} /></button>
                        <button onClick={() => openEdit(r)} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)' }} title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setConfirmDeleteId(r.id)} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)', color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* EXECUTION HISTORY TAB */}
      {tab === 'history' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : (
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={th}>Rule ID</th>
                  <th style={{ ...th, textAlign: 'center' }}>Status</th>
                  <th style={th}>Trigger Data</th>
                  <th style={th}>Result</th>
                  <th style={th}>Duration</th>
                  <th style={th}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {executions.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-8)' }}>No execution history found.</td></tr>
                ) : executions.map(ex => (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{ex.ruleId}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{
                        padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                        background: ex.status === 'SUCCESS' ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)',
                        color: ex.status === 'SUCCESS' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}>{ex.status}</span>
                    </td>
                    <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.triggerData}</td>
                    <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.result}</td>
                    <td style={td}>{ex.duration}ms</td>
                    <td style={td}>{new Date(ex.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* delete confirm */}
      {confirmDeleteId && (
        <div style={overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ ...modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Delete Rule?</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              This will permanently remove this automation rule and all associated execution history.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} style={{ ...btnPrimary, background: 'var(--color-danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* test modal */}
      {testModal && (
        <div style={overlay} onClick={() => setTestModal(null)}>
          <div style={{ ...modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Test Rule</h3>
              <button onClick={() => setTestModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={labelStyle}>Sample Trigger Data (JSON)</div>
            <textarea
              style={{ ...inputStyle, minHeight: 120, fontFamily: 'monospace', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
            />
            <button onClick={handleTest} disabled={testRunning} style={{ ...btnPrimary, marginBottom: 'var(--space-3)' }}>
              <Play size={14} /> {testRunning ? 'Running...' : 'Run Test'}
            </button>
            {testResult && (
              <div style={{
                padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                fontSize: 'var(--text-xs)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto',
              }}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}

      {/* create/edit modal */}
      {showModal && (
        <div style={overlay} onClick={() => setShowModal(false)}>
          <div style={modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                {editingId ? 'Edit Rule' : 'Create Rule'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* name */}
              <div>
                <div style={labelStyle}>Name</div>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Send welcome email on signup" />
              </div>

              {/* description */}
              <div>
                <div style={labelStyle}>Description</div>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* trigger & status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <div style={labelStyle}>Trigger</div>
                  <select style={inputStyle} value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value as Trigger })}>
                    {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Status</div>
                  <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                  </select>
                </div>
              </div>

              {/* conditions */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div style={labelStyle}>Conditions</div>
                  <button onClick={addCondition} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}><Plus size={12} /> Add</button>
                </div>
                {form.conditions.length === 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No conditions. Rule will trigger unconditionally.</p>
                )}
                {form.conditions.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={c.field} onChange={e => updateCondition(idx, { field: e.target.value })} placeholder="Field" />
                    <select style={{ ...inputStyle, flex: 1 }} value={c.operator} onChange={e => updateCondition(idx, { operator: e.target.value })}>
                      {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input style={{ ...inputStyle, flex: 1 }} value={c.value} onChange={e => updateCondition(idx, { value: e.target.value })} placeholder="Value" />
                    <button onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0 }}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div style={labelStyle}>Actions</div>
                  <button onClick={addAction} style={{ ...btnGhost, padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}><Plus size={12} /> Add</button>
                </div>
                {form.actions.length === 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No actions defined.</p>
                )}
                {form.actions.map((a, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                    <select style={{ ...inputStyle, flex: '0 0 160px' }} value={a.type} onChange={e => updateAction(idx, { type: e.target.value as ActionType })}>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                    <input style={{ ...inputStyle, flex: 1 }} value={a.config} onChange={e => updateAction(idx, { config: e.target.value })} placeholder="Config (JSON or value)" />
                    <button onClick={() => removeAction(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 0 }}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* settings */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ ...labelStyle, marginBottom: 'var(--space-2)' }}>Settings</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.runOnce} onChange={e => setForm({ ...form, runOnce: e.target.checked })} />
                    Run once only
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.logExecution} onChange={e => setForm({ ...form, logExecution: e.target.checked })} />
                    Log execution history
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.haltOnError} onChange={e => setForm({ ...form, haltOnError: e.target.checked })} />
                    Halt on error
                  </label>
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
              <button onClick={() => setShowModal(false)} style={btnGhost}>Cancel</button>
              <button onClick={handleSave} style={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
