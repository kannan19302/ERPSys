'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { ListPageTemplate, type ListColumn, StatCardRow } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
const API_BASE = '/admin/automation-rules';

/* ───────── shared inline styles ───────── */
const th: React.CSSProperties = {
  padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' };
const btnPrimary: React.CSSProperties = {
  background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none',
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
  const client = useApiClient();
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
      setRules(await client.get<AutomationRule[]>(API_BASE));
    } catch { setRules([]); }
    finally { setLoading(false); }
  }, [client]);

  /* fetch executions */
  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    try {
      setExecutions(await client.get<Execution[]>(`${API_BASE}/executions`));
    } catch { setExecutions([]); }
    finally { setLoading(false); }
  }, [client]);

  useEffect(() => {
    if (tab === 'rules') fetchRules(); else fetchExecutions();
  }, [tab, fetchRules, fetchExecutions]);

  /* save */
  const handleSave = async () => {
    const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
    try {
      if (editingId) await client.patch(url, form); else await client.post(url, form);
      showToast(editingId ? 'Rule updated' : 'Rule created'); setShowModal(false); void fetchRules();
    } catch { showToast('Network error', 'error'); }
  };

  /* delete */
  const handleDelete = async (id: string) => {
    try {
      await client.delete(`${API_BASE}/${id}`); showToast('Rule deleted'); void fetchRules();
    } catch { showToast('Network error', 'error'); }
    finally { setConfirmDeleteId(null); }
  };

  /* test */
  const handleTest = async () => {
    if (!testModal) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const data = await client.post(`${API_BASE}/${testModal}/test`, JSON.parse(testInput) as unknown);
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
    color: tab === t ? 'var(--color-primary-text)' : undefined,
    borderColor: tab === t ? 'var(--color-primary)' : undefined,
  });

  return (
    <div className="ui-stack-6">
      {/* header */}
      <div className={styles.p1}>
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <Zap className="ui-text-primary" /> Automation Rules
          </h1>
          <p className="ui-text-sm-muted">
            Create event-driven automation rules with conditions and actions.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
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
        <div style={{ background: toast.type === 'success' ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)', border: `1px solid var(--color-${toast.type === 'success' ? 'success' : 'danger'})`, color: `var(--color-${toast.type === 'success' ? 'success' : 'danger'})` }} className={styles.s1}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* RULES TAB */}
      {tab === 'rules' && (
        loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'name', header: 'Name', render: (v, row) => <div><div className="font-semibold">{String(v)}</div>{Boolean(row.description) && <div className="ui-text-xs-muted">{String(row.description)}</div>}</div> },
              { key: 'trigger', header: 'Trigger', render: (v) => <span className={styles.p2}>{String(v)}</span> },
              { key: 'status', header: 'Status', render: (v) => { const s = statusColors[String(v) as Status]; return <span style={{ background: s?.bg, color: s?.color }} className={styles.s2}>{String(v)}</span>; } },
              { key: 'runCount', header: 'Run Count' },
              { key: 'lastRun', header: 'Last Run', render: (v) => v ? new Date(String(v)).toLocaleString() : '—' },
              { key: 'avgExecTime', header: 'Avg Time', render: (v) => v != null ? `${v}ms` : '—' },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className="ui-flex-end ui-gap-2">
                  <button onClick={() => { setTestModal(String(v)); setTestInput('{}'); setTestResult(null); }} style={{ ...btnGhost }} className={styles.s3} title="Test"><Play size={14} /></button>
                  <button onClick={() => openEdit(row as unknown as AutomationRule)} style={{ ...btnGhost }} className={styles.s3} title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDeleteId(String(v))} style={{ ...btnGhost }} className={styles.s4} title="Delete"><Trash2 size={14} /></button>
                </div>
              ) },
            ] as ListColumn[]}
            data={rules as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No automation rules defined"
            emptyDescription="Create your first automation rule to get started."
          />
        )
      )}

      {/* EXECUTION HISTORY TAB */}
      {tab === 'history' && (
        loading ? (
          <div className="ui-flex-center p-8">
            <RefreshCw size={24} className="spin ui-text-muted" />
          </div>
        ) : (
          <ListPageTemplate
            columns={[
              { key: 'ruleId', header: 'Rule ID', render: (v) => <span className={styles.p3}>{String(v)}</span> },
              { key: 'status', header: 'Status', render: (v) => <span style={{ background: String(v) === 'SUCCESS' ? 'rgba(var(--color-success-rgb),0.1)' : 'rgba(var(--color-danger-rgb),0.1)', color: String(v) === 'SUCCESS' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s2}>{String(v)}</span> },
              { key: 'triggerData', header: 'Trigger Data' },
              { key: 'result', header: 'Result' },
              { key: 'duration', header: 'Duration', render: (v) => `${v}ms` },
              { key: 'timestamp', header: 'Timestamp', render: (v) => new Date(String(v)).toLocaleString() },
            ] as ListColumn[]}
            data={executions as unknown as Record<string, unknown>[]}
            loading={false}
            emptyTitle="No execution history"
            emptyDescription="No automation rules have been executed yet."
          />
        )
      )}

      {/* delete confirm */}
      {confirmDeleteId && (
        <div style={overlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={{ ...modal }} className={styles.s5} onClick={e => e.stopPropagation()}>
            <h3 className={styles.p4}>Delete Rule?</h3>
            <p className={styles.p5}>
              This will permanently remove this automation rule and all associated execution history.
            </p>
            <div className="ui-flex-end ui-gap-2">
              <button onClick={() => setConfirmDeleteId(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} style={{ ...btnPrimary }} className={styles.s6}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* test modal */}
      {testModal && (
        <div style={overlay} onClick={() => setTestModal(null)}>
          <div style={{ ...modal }} className={styles.s7} onClick={e => e.stopPropagation()}>
            <div className="ui-flex-between mb-4">
              <h3 className="ui-heading-lg">Test Rule</h3>
              <button onClick={() => setTestModal(null)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            <div style={labelStyle}>Sample Trigger Data (JSON)</div>
            <textarea
              style={{ ...inputStyle }} className={styles.s8}
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
            />
            <button onClick={handleTest} disabled={testRunning} style={{ ...btnPrimary }} className={styles.s9}>
              <Play size={14} /> {testRunning ? 'Running...' : 'Run Test'}
            </button>
            {testResult && (
              <div className={styles.s10}>
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
            <div className="ui-flex-between mb-4">
              <h3 className="ui-heading-lg">
                {editingId ? 'Edit Rule' : 'Create Rule'}
              </h3>
              <button onClick={() => setShowModal(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>

            <div className="ui-stack-4">
              {/* name */}
              <div>
                <div style={labelStyle}>Name</div>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Send welcome email on signup" />
              </div>

              {/* description */}
              <div>
                <div style={labelStyle}>Description</div>
                <textarea style={{ ...inputStyle }} className={styles.s11} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* trigger & status */}
              <div className="ui-grid-2 ui-gap-3">
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
              <div className={styles.p6}>
                <div className="ui-flex-between mb-2">
                  <div style={labelStyle}>Conditions</div>
                  <button onClick={addCondition} style={{ ...btnGhost }} className={styles.s12}><Plus size={12} /> Add</button>
                </div>
                {form.conditions.length === 0 && (
                  <p className="ui-text-xs-muted">No conditions. Rule will trigger unconditionally.</p>
                )}
                {form.conditions.map((c, idx) => (
                  <div key={idx} className={styles.p7}>
                    <input style={{ ...inputStyle }} className={styles.s13} value={c.field} onChange={e => updateCondition(idx, { field: e.target.value })} placeholder="Field" />
                    <select style={{ ...inputStyle }} className={styles.s13} value={c.operator} onChange={e => updateCondition(idx, { operator: e.target.value })}>
                      {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input style={{ ...inputStyle }} className={styles.s13} value={c.value} onChange={e => updateCondition(idx, { value: e.target.value })} placeholder="Value" />
                    <button onClick={() => removeCondition(idx)} className={styles.p8}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className={styles.p9}>
                <div className="ui-flex-between mb-2">
                  <div style={labelStyle}>Actions</div>
                  <button onClick={addAction} style={{ ...btnGhost }} className={styles.s12}><Plus size={12} /> Add</button>
                </div>
                {form.actions.length === 0 && (
                  <p className="ui-text-xs-muted">No actions defined.</p>
                )}
                {form.actions.map((a, idx) => (
                  <div key={idx} className={styles.p10}>
                    <select style={{ ...inputStyle }} className={styles.s14} value={a.type} onChange={e => updateAction(idx, { type: e.target.value as ActionType })}>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                    <input style={{ ...inputStyle }} className={styles.s13} value={a.config} onChange={e => updateAction(idx, { config: e.target.value })} placeholder="Config (JSON or value)" />
                    <button onClick={() => removeAction(idx)} className={styles.p11}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* settings */}
              <div className={styles.p12}>
                <div style={{ ...labelStyle }} className={styles.s15}>Settings</div>
                <div className="ui-stack-2">
                  <label className={styles.p13}>
                    <input type="checkbox" checked={form.runOnce} onChange={e => setForm({ ...form, runOnce: e.target.checked })} />
                    Run once only
                  </label>
                  <label className={styles.p14}>
                    <input type="checkbox" checked={form.logExecution} onChange={e => setForm({ ...form, logExecution: e.target.checked })} />
                    Log execution history
                  </label>
                  <label className={styles.p15}>
                    <input type="checkbox" checked={form.haltOnError} onChange={e => setForm({ ...form, haltOnError: e.target.checked })} />
                    Halt on error
                  </label>
                </div>
              </div>
            </div>

            {/* footer */}
            <div className={styles.p16}>
              <button onClick={() => setShowModal(false)} style={btnGhost}>Cancel</button>
              <button onClick={handleSave} style={btnPrimary}>{editingId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
