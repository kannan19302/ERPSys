'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Search, Key, Smartphone,
  Globe, Monitor, AlertTriangle, CheckCircle, LogOut,
  XCircle, CreditCard, RefreshCw, ChevronLeft, ChevronRight, Lock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string | null;
  changes: any;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  user: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  startedAt: string;
  lastActivity: string;
  current: boolean;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAge: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

const API_BASE = '/api/v1/admin/security';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Mock fallbacks                                                     */
/* ------------------------------------------------------------------ */

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'al-1', userId: 'admin@unerp.dev', action: 'LOGIN', entityType: 'Session', entityId: 'sess-4521', ipAddress: '192.168.1.100', changes: { severity: 'INFO', details: 'Successful login via password' }, createdAt: '2026-06-14T14:32:00Z' },
  { id: 'al-2', userId: 'jane@acme.com', action: 'UPDATE', entityType: 'Invoice', entityId: 'INV-0198', ipAddress: '10.0.0.45', changes: { severity: 'INFO', details: 'Changed status from DRAFT to SENT' }, createdAt: '2026-06-14T14:28:00Z' },
  { id: 'al-3', userId: 'mike@acme.com', action: 'DELETE', entityType: 'Employee', entityId: 'emp-0023', ipAddress: '10.0.0.52', changes: { severity: 'WARNING', details: 'Deleted employee record' }, createdAt: '2026-06-14T14:15:00Z' },
  { id: 'al-4', userId: 'unknown', action: 'LOGIN_FAILED', entityType: 'Session', entityId: 'N/A', ipAddress: '203.45.67.89', changes: { severity: 'CRITICAL', details: 'Failed login attempt — invalid credentials (3 attempts)' }, createdAt: '2026-06-14T13:45:00Z' },
  { id: 'al-5', userId: 'admin@unerp.dev', action: 'PERMISSION_CHANGE', entityType: 'Role', entityId: 'role-admin', ipAddress: '192.168.1.100', changes: { severity: 'WARNING', details: 'Added finance.write scope to Admin role' }, createdAt: '2026-06-14T12:30:00Z' },
  { id: 'al-6', userId: 'sarah@acme.com', action: 'EXPORT', entityType: 'Report', entityId: 'rpt-0045', ipAddress: '10.0.0.38', changes: { severity: 'INFO', details: 'Exported Financial Report as CSV (4,521 rows)' }, createdAt: '2026-06-14T11:20:00Z' },
];

const MOCK_SESSIONS: ActiveSession[] = [
  { id: 'ses-1', user: 'admin@unerp.dev', device: 'Windows 11', browser: 'Chrome 126', ip: '192.168.1.100', location: 'New York, US', startedAt: '2026-06-14 08:00', lastActivity: '2 min ago', current: true },
  { id: 'ses-2', user: 'admin@unerp.dev', device: 'iPhone 16', browser: 'Safari Mobile', ip: '172.16.0.5', location: 'New York, US', startedAt: '2026-06-14 10:30', lastActivity: '45 min ago', current: false },
  { id: 'ses-3', user: 'jane@acme.com', device: 'macOS 15', browser: 'Firefox 130', ip: '10.0.0.45', location: 'San Francisco, US', startedAt: '2026-06-14 09:15', lastActivity: '12 min ago', current: false },
  { id: 'ses-4', user: 'mike@acme.com', device: 'Ubuntu 24', browser: 'Chrome 126', ip: '10.0.0.52', location: 'London, UK', startedAt: '2026-06-14 06:00', lastActivity: '3 hrs ago', current: false },
];

const DEFAULT_POLICY: PasswordPolicy = { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: false, maxAge: 90 };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'mfa' | 'ip' | 'sessions' | 'billing'>('audit');

  /* Audit logs state */
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [auditMeta, setAuditMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 6, totalPages: 1 });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditLoading, setAuditLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Sessions state */
  const [sessions, setSessions] = useState<ActiveSession[]>(MOCK_SESSIONS);

  /* Password policy state */
  const [policy, setPolicy] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);

  /* ---- Fetch audit logs ---- */
  const fetchAuditLogs = useCallback(async (page = 1) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (auditSearch) params.set('search', auditSearch);
      if (auditFilter !== 'ALL') params.set('severity', auditFilter);

      const res = await apiFetch<{ data: AuditLog[]; meta: PaginationMeta }>(`/audit-logs?${params}`);
      setAuditLogs(res.data);
      setAuditMeta(res.meta);
    } catch {
      // keep mock fallback
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditFilter]);

  /* ---- Fetch sessions ---- */
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch<ActiveSession[]>('/sessions');
      setSessions(res);
    } catch {
      // keep mock
    }
  }, []);

  /* ---- Fetch password policy ---- */
  const fetchPolicy = useCallback(async () => {
    try {
      const res = await apiFetch<PasswordPolicy>('/password-policy');
      setPolicy(res);
    } catch {
      // keep default
    }
  }, []);

  /* ---- Save password policy ---- */
  const savePolicy = async () => {
    setPolicySaving(true);
    setPolicySaved(false);
    try {
      await apiFetch('/password-policy', { method: 'POST', body: JSON.stringify(policy) });
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 3000);
    } catch {
      // silent
    } finally {
      setPolicySaving(false);
    }
  };

  /* ---- Initial load ---- */
  useEffect(() => {
    fetchAuditLogs();
    fetchSessions();
    fetchPolicy();
  }, [fetchAuditLogs, fetchSessions, fetchPolicy]);

  /* ---- 30s auto-refresh for audit logs ---- */
  useEffect(() => {
    if (activeTab === 'audit') {
      refreshTimerRef.current = setInterval(() => { fetchAuditLogs(auditMeta.page); }, 30000);
    }
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [activeTab, fetchAuditLogs, auditMeta.page]);

  /* ---- Debounced search ---- */
  useEffect(() => {
    const t = setTimeout(() => { fetchAuditLogs(1); }, 400);
    return () => clearTimeout(t);
  }, [auditSearch, auditFilter, fetchAuditLogs]);

  /* ---- Helpers ---- */
  const getSeverity = (log: AuditLog): string => {
    if (log.changes?.severity) return log.changes.severity;
    if (['LOGIN_FAILED', 'UNAUTHORIZED'].includes(log.action)) return 'CRITICAL';
    if (['DELETE', 'PERMISSION_CHANGE'].includes(log.action)) return 'WARNING';
    return 'INFO';
  };

  const getDetails = (log: AuditLog): string => {
    if (log.changes?.details) return log.changes.details;
    return `${log.action} on ${log.entityType} ${log.entityId}`;
  };

  const severityStyles = (s: string) => {
    const map: Record<string, { color: string; background: string }> = {
      INFO: { color: 'var(--color-primary)', background: 'var(--color-primary-light)' },
      WARNING: { color: 'var(--color-warning)', background: 'var(--color-warning-light)' },
      CRITICAL: { color: 'var(--color-error)', background: 'var(--color-error-light)' },
    };
    return map[s] || { color: 'var(--color-text)', background: 'var(--color-bg)' };
  };

  const tabs = [
    { id: 'audit' as const, label: 'Audit Logs', icon: <Search size={14} /> },
    { id: 'mfa' as const, label: 'Password Policy', icon: <Lock size={14} /> },
    { id: 'ip' as const, label: 'IP Allowlist', icon: <Globe size={14} /> },
    { id: 'sessions' as const, label: 'Sessions', icon: <Monitor size={14} /> },
    { id: 'billing' as const, label: 'Tenant Billing', icon: <CreditCard size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Shield style={{ color: 'var(--color-primary)' }} />
          Security & Administration
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Searchable audit logs, password policy, IP allowlisting, session management, and tenant billing.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)', whiteSpace: 'nowrap',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ============ Audit Logs ============ */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
              <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search by user, action, entity, or details..." style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
            </div>
            <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}>
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <button onClick={() => fetchAuditLogs(auditMeta.page)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} title="Refresh">
              <RefreshCw size={16} style={auditLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  {['Severity', 'Timestamp', 'User', 'Action', 'Entity', 'IP', 'Details'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No audit logs found.</td></tr>
                )}
                {auditLogs.map(l => {
                  const sev = getSeverity(l);
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', ...severityStyles(sev) }}>{sev}</span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{l.userId}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{l.action}</code>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{l.entityType} ({l.entityId})</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{l.ipAddress || '—'}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDetails(l)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {auditMeta.totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              <span>Showing page {auditMeta.page} of {auditMeta.totalPages} ({auditMeta.total} total)</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button disabled={auditMeta.page <= 1} onClick={() => fetchAuditLogs(auditMeta.page - 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: auditMeta.page <= 1 ? 'default' : 'pointer', opacity: auditMeta.page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <button disabled={auditMeta.page >= auditMeta.totalPages} onClick={() => fetchAuditLogs(auditMeta.page + 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: auditMeta.page >= auditMeta.totalPages ? 'default' : 'pointer', opacity: auditMeta.page >= auditMeta.totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            Auto-refreshes every 30 seconds
          </div>
        </div>
      )}

      {/* ============ Password Policy (was MFA) ============ */}
      {activeTab === 'mfa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <CheckCircle size={28} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{policy.minLength}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Min Password Length</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <Key size={28} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>{policy.maxAge}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Max Age (days)</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', textAlign: 'center' }}>
              <AlertTriangle size={28} style={{ color: 'var(--color-warning)', margin: '0 auto var(--space-2)' }} />
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
                {[policy.requireUppercase, policy.requireNumbers, policy.requireSpecial].filter(Boolean).length}/3
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Complexity Rules Active</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Password Policy Settings</h3>

            {/* Min length slider */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Minimum Length</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Minimum number of characters required</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="range" min={6} max={24} value={policy.minLength}
                  onChange={e => setPolicy({ ...policy, minLength: +e.target.value })}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', minWidth: '24px', textAlign: 'center' }}>{policy.minLength}</span>
              </div>
            </div>

            {/* Max age */}
            <div style={{ padding: 'var(--space-2.5) 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Max Password Age (days)</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Force password change after this many days (0 = never)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="number" min={0} max={365} value={policy.maxAge}
                  onChange={e => setPolicy({ ...policy, maxAge: +e.target.value })}
                  style={{ width: '70px', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Toggles */}
            {[
              { key: 'requireUppercase' as const, label: 'Require Uppercase Letter', desc: 'At least one A-Z character' },
              { key: 'requireNumbers' as const, label: 'Require Numbers', desc: 'At least one 0-9 digit' },
              { key: 'requireSpecial' as const, label: 'Require Special Characters', desc: 'At least one !@#$%^&* or similar' },
            ].map((opt, i) => (
              <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{opt.desc}</div>
                </div>
                <div
                  onClick={() => setPolicy({ ...policy, [opt.key]: !policy[opt.key] })}
                  style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: policy[opt.key] ? 'var(--color-primary)' : 'var(--color-border)', position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: policy[opt.key] ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </div>
              </div>
            ))}

            {/* Save button */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button onClick={savePolicy} disabled={policySaving} style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                cursor: policySaving ? 'wait' : 'pointer', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)', opacity: policySaving ? 0.7 : 1,
              }}>
                {policySaving ? 'Saving...' : 'Save Policy'}
              </button>
              {policySaved && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <CheckCircle size={12} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ IP Allowlist ============ */}
      {activeTab === 'ip' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>IP Allowlist Rules</h3>
              <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Add Rule</button>
            </div>
            {[
              { cidr: '192.168.1.0/24', label: 'Office Network', enabled: true },
              { cidr: '10.0.0.0/16', label: 'VPN Range', enabled: true },
              { cidr: '172.16.0.0/12', label: 'Cloud Infrastructure', enabled: true },
              { cidr: '203.45.67.0/24', label: 'Partner Office', enabled: false },
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)', opacity: rule.enabled ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Globe size={16} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <code style={{ fontSize: '12px', fontWeight: 'var(--weight-semibold)' }}>{rule.cidr}</code>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{rule.label}</div>
                  </div>
                </div>
                <div style={{ width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer', background: rule.enabled ? 'var(--color-success)' : 'var(--color-border)', position: 'relative' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: rule.enabled ? '20px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Sessions ============ */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Active Sessions ({sessions.length})</h3>
            <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <LogOut size={14} /> Revoke All Others
            </button>
          </div>
          {sessions.map(s => (
            <div key={s.id} style={{
              background: 'var(--color-bg-elevated)', border: s.current ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Monitor size={20} style={{ color: s.current ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                <div>
                  <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {s.device} — {s.browser}
                    {s.current && <span style={{ fontSize: '9px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>Current</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{s.user} • {s.ip} • {s.location}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Started: {s.startedAt} • Last: {s.lastActivity}</div>
                </div>
              </div>
              {!s.current && (
                <button style={{ background: 'none', border: '1px solid var(--color-error)', padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '11px', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={12} /> Revoke
                </button>
              )}
            </div>
          ))}

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Session Policy</h3>
            {[
              { label: 'Max Concurrent Sessions', value: '5' },
              { label: 'Session Timeout (idle)', value: '30 min' },
              { label: 'Absolute Session Lifetime', value: '8 hours' },
              { label: 'Force Logout on Password Change', value: 'Enabled' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{p.label}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ Tenant Billing ============ */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Current Plan</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>Business</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>$199/mo • 25 users</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Current Usage</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>18 / 25</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Active users this month</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Next Invoice</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>$199.00</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Due: Jul 1, 2026</div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Invoice History</h3>
            {[
              { date: 'Jun 1, 2026', amount: '$199.00', status: 'PAID' },
              { date: 'May 1, 2026', amount: '$199.00', status: 'PAID' },
              { date: 'Apr 1, 2026', amount: '$149.00', status: 'PAID' },
              { date: 'Mar 1, 2026', amount: '$149.00', status: 'PAID' },
            ].map((inv, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CreditCard size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontSize: 'var(--text-sm)' }}>{inv.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{inv.amount}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{inv.status}</span>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '11px' }}>Download</button>
                </div>
              </div>
            ))}
          </div>

          <button style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', alignSelf: 'flex-start' }}>
            Upgrade Plan
          </button>
        </div>
      )}
    </div>
  );
}
