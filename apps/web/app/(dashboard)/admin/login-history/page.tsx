'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Key } from 'lucide-react';

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

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

export default function LoginHistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLoginLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      // Force search to filter only login/logout actions by default if search is empty, or join it
      params.set('search', search ? `${search}` : 'LOGIN');

      if (filter !== 'ALL') params.set('severity', filter);

      const res = await apiFetch<{ data: AuditLog[]; meta: PaginationMeta }>(`/audit-logs?${params}`);
      
      // Secondary client filter just to guarantee we only show auth actions if search returns generic matches
      const authActions = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'USER_IMPERSONATED'];
      const filteredData = res.data.filter(l => authActions.some(action => l.action.includes(action) || l.action.toLowerCase().includes('login') || l.action.toLowerCase().includes('logout')));
      
      setLogs(search ? res.data : filteredData);
      setMeta(res.meta);
    } catch (e) {
      console.error('Error fetching login history', e);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchLoginLogs(1);
  }, []);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => { fetchLoginLogs(meta.page); }, 30000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchLoginLogs, meta.page]);

  useEffect(() => {
    const t = setTimeout(() => { fetchLoginLogs(1); }, 400);
    return () => clearTimeout(t);
  }, [search, filter, fetchLoginLogs]);

  const getSeverity = (log: AuditLog): string => {
    if (log.changes?.severity) return log.changes.severity;
    if (log.action.includes('FAILED')) return 'CRITICAL';
    return 'INFO';
  };

  const severityStyles = (s: string) => {
    const map: Record<string, { color: string; background: string }> = {
      INFO: { color: 'var(--color-primary)', background: 'var(--color-primary-light)' },
      WARNING: { color: 'var(--color-warning)', background: 'var(--color-warning-light)' },
      CRITICAL: { color: 'var(--color-error)', background: 'var(--color-error-light)' },
    };
    return map[s] || { color: 'var(--color-text)', background: 'var(--color-bg)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Key style={{ color: 'var(--color-primary)' }} />
          User Login & Session History
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Track authentication success rates, failed logins, impersonation vouchers, and active user session history logs.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}>
            <Search size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter history by user email or IP address..." style={{ flex: 1, border: 'none', background: 'transparent', padding: 'var(--space-2.5) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}>
            <option value="ALL">All Severities</option>
            <option value="INFO">Success (Info)</option>
            <option value="CRITICAL">Failed / Critical</option>
          </select>
          <button onClick={() => fetchLoginLogs(meta.page)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} title="Refresh">
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>

        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['Status', 'Timestamp', 'User Identity', 'Action Type', 'IP Address', 'Location / Device Details'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No authentication logs found.</td></tr>
              )}
              {logs.map(l => {
                const sev = getSeverity(l);
                const isSuccess = l.action === 'LOGIN_SUCCESS' || l.action === 'LOGOUT';
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-bold)', ...severityStyles(sev) }}>
                        {isSuccess ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)' }}>{l.userId}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <code style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{l.action}</code>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{l.ipAddress || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {l.changes?.details || l.changes?.device || 'System login endpoint'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <span>Showing page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button disabled={meta.page <= 1} onClick={() => fetchLoginLogs(meta.page - 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: meta.page <= 1 ? 'default' : 'pointer', opacity: meta.page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button disabled={meta.page >= meta.totalPages} onClick={() => fetchLoginLogs(meta.page + 1)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-1) var(--space-2)', cursor: meta.page >= meta.totalPages ? 'default' : 'pointer', opacity: meta.page >= meta.totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', color: 'var(--color-text)' }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
