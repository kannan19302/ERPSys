'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, History } from 'lucide-react';

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

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditLoading, setAuditLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    } catch (e) {
      console.error('Error fetching audit logs', e);
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditFilter]);

  useEffect(() => {
    fetchAuditLogs(1);
  }, []);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => { fetchAuditLogs(auditMeta.page); }, 30000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [fetchAuditLogs, auditMeta.page]);

  useEffect(() => {
    const t = setTimeout(() => { fetchAuditLogs(1); }, 400);
    return () => clearTimeout(t);
  }, [auditSearch, auditFilter, fetchAuditLogs]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <History style={{ color: 'var(--color-primary)' }} />
          Audit Trail Viewer
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Inspect record mutations, security exceptions, permission updates, and login attempts across the workspace.
        </p>
      </div>

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
              <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['Severity', 'Timestamp', 'User', 'Action', 'EntityType', 'EntityID', 'IP Address', 'Details'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No audit logs found.</td></tr>
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
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{l.entityType}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '11px' }}>{l.entityId}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{l.ipAddress || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDetails(l)}</td>
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
      </div>
    </div>
  );
}
