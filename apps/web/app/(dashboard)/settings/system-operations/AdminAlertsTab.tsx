'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Info, AlertTriangle, AlertOctagon, Check, X, Plus, Edit2, Trash2,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { ListPageTemplate, type ListColumn } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import styles from './AdminAlertsTab.module.css';

interface Alert {
  id: string;
  type: 'STORAGE' | 'USER_LIMIT' | 'SECURITY' | 'PERFORMANCE' | 'CUSTOM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Threshold {
  id: string;
  metric: string;
  operator: 'GT' | 'LT' | 'EQ';
  value: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  active: boolean;
  cooldownMinutes: number;
  lastFiredAt: string | null;
}

type SubTab = 'inbox' | 'thresholds';

const API = '/admin/alerts';

const SEVERITY_CFG = {
  INFO: { color: '#3b82f6', icon: Info, label: 'Info' },
  WARNING: { color: '#f59e0b', icon: AlertTriangle, label: 'Warning' },
  CRITICAL: { color: '#dc2626', icon: AlertOctagon, label: 'Critical' },
} as const;

const ALERT_TYPES = ['STORAGE', 'USER_LIMIT', 'SECURITY', 'PERFORMANCE', 'CUSTOM'] as const;
const METRICS = ['STORAGE_USAGE_PCT', 'ACTIVE_USERS_PCT', 'FAILED_LOGINS_1H', 'API_ERROR_RATE', 'DB_QUERY_TIME_MS'] as const;
const OPERATORS = [
  { value: 'GT', label: 'Greater Than' },
  { value: 'LT', label: 'Less Than' },
  { value: 'EQ', label: 'Equals' },
] as const;

const EMPTY_THRESHOLD: { metric: typeof METRICS[number]; operator: 'GT' | 'LT' | 'EQ'; value: number; severity: 'INFO' | 'WARNING' | 'CRITICAL'; active: boolean; cooldownMinutes: number } = { metric: 'STORAGE_USAGE_PCT', operator: 'GT', value: 0, severity: 'WARNING', active: true, cooldownMinutes: 60 };

export default function AdminAlertsTab() {
  const client = useApiClient();
  const [subTab, setSubTab] = useState<SubTab>('inbox');

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertFilter, setAlertFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_THRESHOLD);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const params = alertFilter ? `?type=${alertFilter}` : '';
      const res = await client.get<{ data: Alert[] }>(`${API}${params}`);
      setAlerts(res.data);
    } catch { /* ignore */ } finally { setAlertsLoading(false); }
  }, [alertFilter, client]);

  const fetchThresholds = useCallback(async () => {
    setThresholdsLoading(true);
    try {
      const res = await client.get<{ data: Threshold[] }>(`${API}/thresholds`);
      setThresholds(res.data);
    } catch { /* ignore */ } finally { setThresholdsLoading(false); }
  }, [client]);

  useEffect(() => { if (subTab === 'inbox') fetchAlerts(); }, [subTab, fetchAlerts]);
  useEffect(() => { if (subTab === 'thresholds') fetchThresholds(); }, [subTab, fetchThresholds]);

  const markRead = async (id: string) => {
    try {
      await client.post(`${API}/${id}/read`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch { showToast('Failed to mark read', 'error'); }
  };

  const dismiss = async (id: string) => {
    try {
      await client.post(`${API}/${id}/dismiss`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast('Alert dismissed');
    } catch { showToast('Failed to dismiss', 'error'); }
  };

  const markAllRead = async () => {
    try {
      await client.post(`${API}/mark-all-read`);
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      showToast('All alerts marked as read');
    } catch { showToast('Failed', 'error'); }
  };

  const saveThreshold = async () => {
    try {
      if (editingId) {
        await client.request(`${API}/thresholds/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Threshold updated');
      } else {
        await client.post(`${API}/thresholds`, form);
        showToast('Threshold created');
      }
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_THRESHOLD);
      fetchThresholds();
    } catch { showToast('Failed to save', 'error'); }
  };

  const deleteThreshold = async (id: string) => {
    try {
      await client.delete(`${API}/thresholds/${id}`);
      showToast('Threshold deleted');
      fetchThresholds();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const toggleActive = async (t: Threshold) => {
    try {
      await client.request(`${API}/thresholds/${t.id}`, { method: 'PUT', body: JSON.stringify({ ...t, active: !t.active }) });
      fetchThresholds();
    } catch { showToast('Failed to toggle', 'error'); }
  };

  const openEdit = (t: Threshold) => {
    setEditingId(t.id);
    setForm({ metric: t.metric as typeof METRICS[number], operator: t.operator, value: t.value, severity: t.severity, active: t.active, cooldownMinutes: t.cooldownMinutes });
    setShowModal(true);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
    border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
  });

  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
    padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
    border: 'none', background: 'var(--color-bg-brand)', color: '#fff',
    cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
  };

  const btnGhost: React.CSSProperties = {
    padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-primary)', background: 'transparent',
    color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)',
    display: 'flex', alignItems: 'center', gap: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
  };

  return (
    <div>
      {toast && (
        <div className={styles.s1} style={{background: toast.type === 'success' ? '#059669' : '#dc2626'}}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {showModal && (
        <div className={styles.s2}
        >
          <div className={styles.s3}
          >
            <div className={styles.s4}>
              <h3 className={styles.s5}>
                {editingId ? 'Edit Threshold' : 'Add Threshold'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(EMPTY_THRESHOLD); }} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>

            <div className="ui-stack-3">
              <div>
                <label className={styles.s6}>Metric</label>
                <select value={form.metric} onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as any }))} style={inputStyle}>
                  {METRICS.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="ui-flex ui-gap-3">
                <div className="flex-1">
                  <label className={styles.s7}>Operator</label>
                  <select value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value as any }))} style={inputStyle}>
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={styles.s8}>Value</label>
                  <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <div className="ui-flex ui-gap-3">
                <div className="flex-1">
                  <label className={styles.s9}>Severity</label>
                  <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as any }))} style={inputStyle}>
                    {(['INFO', 'WARNING', 'CRITICAL'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className={styles.s10}>Cooldown (min)</label>
                  <input type="number" value={form.cooldownMinutes} onChange={(e) => setForm((f) => ({ ...f, cooldownMinutes: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <label className={styles.s11}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Active
              </label>
            </div>

            <div className={styles.s12}>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(EMPTY_THRESHOLD); }} className={styles.s13}
              >Cancel
              </button>
              <button onClick={saveThreshold} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.s14}
      >
        <button onClick={() => setSubTab('inbox')} style={tabStyle(subTab === 'inbox')}>Alert Inbox</button>
        <button onClick={() => setSubTab('thresholds')} style={tabStyle(subTab === 'thresholds')}>Threshold Configuration</button>
      </div>

      {subTab === 'inbox' && (
        <div>
          <div className="ui-flex-between mb-4">
            <select value={alertFilter} onChange={(e) => setAlertFilter(e.target.value)} className={styles.s15}
            >
              <option value="">All Types</option>
              {ALERT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <button onClick={markAllRead} style={btnPrimary}>
              <Check size={14} /> Mark All Read
            </button>
          </div>

          {alertsLoading && (
            <p className={styles.s16}>Loading...</p>
          )}

          <div className="ui-stack-2">
            {!alertsLoading && alerts.length === 0 && (
              <p className={styles.s17}>No alerts</p>
            )}
            {alerts.map((alert) => {
              const cfg = SEVERITY_CFG[alert.severity];
              const Icon = cfg.icon;
              const expanded = expandedId === alert.id;
              return (
                <div key={alert.id} className={styles.s18} style={{borderLeft: !alert.read ? `3px solid ${cfg.color}` : '1px solid var(--color-border-primary)'}}
                >
                  <div
                    onClick={() => setExpandedId(expanded ? null : alert.id)}
                    className={styles.s19}
                  >
                    <Icon size={18} color={cfg.color} />
                    <div className="flex-1">
                      <div className={styles.s20} style={{fontWeight: !alert.read ? 'var(--weight-semibold)' : 'var(--weight-normal)'}}
                      >{alert.title}
                      </div>
                      <div className={styles.s21}>
                        {new Date(alert.createdAt).toLocaleString()} &middot; {alert.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="ui-hstack-2">
                      <span className={styles.s22} style={{background: `${cfg.color}18`, color: cfg.color}}
                      >{cfg.label}
                      </span>
                      {expanded ? <ChevronUp size={16} color="var(--color-text-tertiary)" /> : <ChevronDown size={16} color="var(--color-text-tertiary)" />}
                    </div>
                  </div>
                  {expanded && (
                    <div className={styles.s23}>
                      <p className={styles.s24}>
                        {alert.message}
                      </p>
                      <div className="ui-flex ui-gap-2">
                        {!alert.read && (
                          <button onClick={(e) => { e.stopPropagation(); markRead(alert.id); }} style={btnGhost}>
                            <Check size={12} /> Mark Read
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); dismiss(alert.id); }} className={styles.s25}>
                          <X size={12} /> Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'thresholds' && (
        <div>
          <div className={styles.s26}>
            <button onClick={() => { setEditingId(null); setForm(EMPTY_THRESHOLD); setShowModal(true); }} style={btnPrimary}>
              <Plus size={14} /> Add Threshold
            </button>
          </div>

          <ListPageTemplate
            columns={[
              { key: 'metric', header: 'Metric', render: (v) => <span className={styles.s27}>{String(v).replace(/_/g, ' ')}</span> },
              { key: 'operator', header: 'Operator', render: (v) => OPERATORS.find((o) => o.value === v)?.label || String(v) },
              { key: 'value', header: 'Value', render: (v) => <span className="font-mono">{String(v)}</span> },
              { key: 'severity', header: 'Severity', render: (v) => {
                const sev = SEVERITY_CFG[v as keyof typeof SEVERITY_CFG];
                return (
                  <span className={styles.s28} style={{background: `${sev.color}18`, color: sev.color}}
                  >{sev.label}
                  </span>
                );
              } },
              { key: 'active', header: 'Active', render: (v, row) => (
                <button onClick={() => toggleActive(row as unknown as Threshold)} className={styles.s29} style={{background: v ? '#059669' : 'var(--color-bg-tertiary)'}}
                >
                  <span className={styles.s30} style={{left: v ? 18 : 2}}
                  />
                </button>
              ) },
              { key: 'cooldownMinutes', header: 'Cooldown', render: (v) => `${v}m` },
              { key: 'lastFiredAt', header: 'Last Fired', render: (v) => (v ? new Date(String(v)).toLocaleString() : 'Never') },
              { key: 'id', header: 'Actions', render: (v, row) => (
                <div className="ui-flex ui-gap-2">
                  <button onClick={() => openEdit(row as unknown as Threshold)} style={btnGhost}><Edit2 size={12} /> Edit</button>
                  <button onClick={() => deleteThreshold(String(v))} className={styles.s31}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ) },
            ] as ListColumn[]}
            data={thresholds as unknown as Record<string, unknown>[]}
            loading={thresholdsLoading}
            emptyTitle="No thresholds"
            emptyDescription="No thresholds configured."
          />
        </div>
      )}
    </div>
  );
}
