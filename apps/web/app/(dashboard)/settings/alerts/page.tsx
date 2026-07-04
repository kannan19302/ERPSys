'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Info, AlertTriangle, AlertOctagon, Check, X, Plus, Edit2, Trash2,
  ChevronDown, ChevronUp,
} from 'lucide-react';

/* ─── types ─── */
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

type Tab = 'inbox' | 'thresholds';

/* ─── api helpers ─── */
const API = '/api/v1/admin/alerts';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ─── constants ─── */
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

/* ─── component ─── */
export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>('inbox');

  /* inbox state */
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertFilter, setAlertFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  /* thresholds state */
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

  /* ─── fetchers ─── */
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const params = alertFilter ? `?type=${alertFilter}` : '';
      const res = await apiFetch<{ data: Alert[] }>(`${API}${params}`);
      setAlerts(res.data);
    } catch { /* ignore */ } finally { setAlertsLoading(false); }
  }, [alertFilter]);

  const fetchThresholds = useCallback(async () => {
    setThresholdsLoading(true);
    try {
      const res = await apiFetch<{ data: Threshold[] }>(`${API}/thresholds`);
      setThresholds(res.data);
    } catch { /* ignore */ } finally { setThresholdsLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'inbox') fetchAlerts(); }, [tab, fetchAlerts]);
  useEffect(() => { if (tab === 'thresholds') fetchThresholds(); }, [tab, fetchThresholds]);

  /* ─── alert actions ─── */
  const markRead = async (id: string) => {
    try {
      await apiFetch<void>(`${API}/${id}/read`, { method: 'POST' });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch { showToast('Failed to mark read', 'error'); }
  };

  const dismiss = async (id: string) => {
    try {
      await apiFetch<void>(`${API}/${id}/dismiss`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== id));
      showToast('Alert dismissed');
    } catch { showToast('Failed to dismiss', 'error'); }
  };

  const markAllRead = async () => {
    try {
      await apiFetch<void>(`${API}/mark-all-read`, { method: 'POST' });
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      showToast('All alerts marked as read');
    } catch { showToast('Failed', 'error'); }
  };

  /* ─── threshold actions ─── */
  const saveThreshold = async () => {
    try {
      if (editingId) {
        await apiFetch<void>(`${API}/thresholds/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        showToast('Threshold updated');
      } else {
        await apiFetch<void>(`${API}/thresholds`, { method: 'POST', body: JSON.stringify(form) });
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
      await fetch(`${API}/thresholds/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Threshold deleted');
      fetchThresholds();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const toggleActive = async (t: Threshold) => {
    try {
      await apiFetch<void>(`${API}/thresholds/${t.id}`, { method: 'PUT', body: JSON.stringify({ ...t, active: !t.active }) });
      fetchThresholds();
    } catch { showToast('Failed to toggle', 'error'); }
  };

  const openEdit = (t: Threshold) => {
    setEditingId(t.id);
    setForm({ metric: t.metric as typeof METRICS[number], operator: t.operator, value: t.value, severity: t.severity, active: t.active, cooldownMinutes: t.cooldownMinutes });
    setShowModal(true);
  };

  /* ─── styles ─── */
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
    <div style={{ padding: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? '#059669' : '#dc2626', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)', width: 480, maxWidth: '90vw',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                {editingId ? 'Edit Threshold' : 'Add Threshold'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(EMPTY_THRESHOLD); }} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)',
              }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Metric</label>
                <select value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value as any }))} style={inputStyle}>
                  {METRICS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Operator</label>
                  <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value as any }))} style={inputStyle}>
                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Value</label>
                  <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as any }))} style={inputStyle}>
                    {(['INFO', 'WARNING', 'CRITICAL'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>Cooldown (min)</label>
                  <input type="number" value={form.cooldownMinutes} onChange={e => setForm(f => ({ ...f, cooldownMinutes: Number(e.target.value) }))} style={inputStyle} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}>
              <button onClick={() => { setShowModal(false); setEditingId(null); setForm(EMPTY_THRESHOLD); }} style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-primary)', background: 'transparent',
                color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 'var(--text-sm)',
              }}>Cancel</button>
              <button onClick={saveThreshold} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <Bell size={24} color="var(--color-text-primary)" />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-primary)', margin: 0 }}>
          Alerts &amp; Monitoring
        </h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-5)',
        padding: 'var(--space-1)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)',
        width: 'fit-content',
      }}>
        <button onClick={() => setTab('inbox')} style={tabStyle(tab === 'inbox')}>Alert Inbox</button>
        <button onClick={() => setTab('thresholds')} style={tabStyle(tab === 'thresholds')}>Threshold Configuration</button>
      </div>

      {/* ═══ TAB 1: INBOX ═══ */}
      {tab === 'inbox' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)} style={{
              padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}>
              <option value="">All Types</option>
              {ALERT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <button onClick={markAllRead} style={btnPrimary}>
              <Check size={14} /> Mark All Read
            </button>
          </div>

          {alertsLoading && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', padding: 'var(--space-8)' }}>Loading...</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {!alertsLoading && alerts.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)', padding: 'var(--space-8)' }}>No alerts</p>
            )}
            {alerts.map(alert => {
              const cfg = SEVERITY_CFG[alert.severity];
              const Icon = cfg.icon;
              const expanded = expandedId === alert.id;
              return (
                <div key={alert.id} style={{
                  border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)',
                  borderLeft: !alert.read ? `3px solid ${cfg.color}` : '1px solid var(--color-border-primary)',
                  background: 'var(--color-bg-primary)', overflow: 'hidden',
                }}>
                  <div
                    onClick={() => setExpandedId(expanded ? null : alert.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                    }}
                  >
                    <Icon size={18} color={cfg.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                        fontWeight: !alert.read ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                      }}>{alert.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {new Date(alert.createdAt).toLocaleString()} &middot; {alert.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)', background: `${cfg.color}18`, color: cfg.color,
                        fontWeight: 'var(--weight-medium)',
                      }}>{cfg.label}</span>
                      {expanded ? <ChevronUp size={16} color="var(--color-text-tertiary)" /> : <ChevronDown size={16} color="var(--color-text-tertiary)" />}
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ padding: '0 var(--space-4) var(--space-4)', borderTop: '1px solid var(--color-border-primary)' }}>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-3) 0' }}>
                        {alert.message}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {!alert.read && (
                          <button onClick={e => { e.stopPropagation(); markRead(alert.id); }} style={btnGhost}>
                            <Check size={12} /> Mark Read
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); dismiss(alert.id); }} style={{ ...btnGhost, color: '#dc2626', borderColor: '#dc262640' }}>
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

      {/* ═══ TAB 2: THRESHOLDS ═══ */}
      {tab === 'thresholds' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button onClick={() => { setEditingId(null); setForm(EMPTY_THRESHOLD); setShowModal(true); }} style={btnPrimary}>
              <Plus size={14} /> Add Threshold
            </button>
          </div>

          <div style={{
            border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                  {['Metric', 'Operator', 'Value', 'Severity', 'Active', 'Cooldown', 'Last Fired', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: 'var(--space-3) var(--space-4)', textAlign: 'left',
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)',
                      color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--color-border-primary)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {thresholdsLoading && (
                  <tr><td colSpan={8} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>Loading...</td></tr>
                )}
                {!thresholdsLoading && thresholds.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No thresholds configured</td></tr>
                )}
                {!thresholdsLoading && thresholds.map(t => {
                  const sev = SEVERITY_CFG[t.severity];
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border-primary)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 'var(--weight-medium)' }}>
                        {t.metric.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        {OPERATORS.find(o => o.value === t.operator)?.label || t.operator}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                        {t.value}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-xs)', background: `${sev.color}18`, color: sev.color,
                          fontWeight: 'var(--weight-medium)',
                        }}>{sev.label}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <button onClick={() => toggleActive(t)} style={{
                          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: t.active ? '#059669' : 'var(--color-bg-tertiary)',
                          position: 'relative', transition: 'background .2s',
                        }}>
                          <span style={{
                            position: 'absolute', top: 2, left: t.active ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%', background: '#fff',
                            transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                          }} />
                        </button>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        {t.cooldownMinutes}m
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
                        {t.lastFiredAt ? new Date(t.lastFiredAt).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button onClick={() => openEdit(t)} style={btnGhost}><Edit2 size={12} /> Edit</button>
                          <button onClick={() => deleteThreshold(t.id)} style={{ ...btnGhost, color: '#dc2626', borderColor: '#dc262640' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
