'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, DataTable, type Column, Pagination, Select,
} from '@unerp/ui';
import { Search, RefreshCw, History } from 'lucide-react';

export interface AuditLog {
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

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` };
}

function getSeverity(log: AuditLog): string {
  if (log.changes?.severity) return log.changes.severity;
  if (['LOGIN_FAILED', 'UNAUTHORIZED'].includes(log.action)) return 'CRITICAL';
  if (['DELETE', 'PERMISSION_CHANGE'].includes(log.action)) return 'WARNING';
  return 'INFO';
}

function getDetails(log: AuditLog): string {
  if (log.changes?.details) return log.changes.details;
  return `${log.action} on ${log.entityType} ${log.entityId}`;
}

const severityVariant: Record<string, string> = {
  INFO: 'info', WARNING: 'warning', CRITICAL: 'danger',
};

/**
 * Shared table for both the "Audit Trail" tab and the "Login History" tab.
 * Per UI_CONSOLIDATION_PLAN.md 2a, these two tabs render the identical
 * AuditLog shape against /api/v1/admin/security/audit-logs — this is one
 * component with a different default `actionFilter`, not two implementations.
 */
export default function AuditLogTable({
  actionFilter,
  emptyMessage = 'Adjust your search or filters to find specific events.',
}: {
  /** When set, forces the search term server-side (e.g. 'LOGIN' for the Login History tab). */
  actionFilter?: string;
  emptyMessage?: string;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const effectiveSearch = search || actionFilter || '';
      if (effectiveSearch) params.set('search', effectiveSearch);
      if (severityFilter !== 'ALL') params.set('severity', severityFilter);

      const res = await fetch(`/api/v1/admin/security/audit-logs?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      let rows: AuditLog[] = data.data || [];
      if (actionFilter === 'LOGIN' && !search) {
        const authActions = ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'USER_IMPERSONATED'];
        rows = rows.filter((l) => authActions.some((a) => l.action.includes(a) || l.action.toLowerCase().includes('login') || l.action.toLowerCase().includes('logout')));
      }
      setLogs(rows);
      if (data.meta) setMeta(data.meta);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter, actionFilter]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, severityFilter]);

  const columns: Column<AuditLog>[] = [
    {
      key: 'severity', header: 'Severity', width: '100px',
      render: (row) => {
        const sev = getSeverity(row);
        return <Badge variant={severityVariant[sev] as any}>{sev}</Badge>;
      },
    },
    {
      key: 'timestamp', header: 'Timestamp', width: '160px',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'userId', header: 'User',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{row.userId}</span>
      ),
    },
    {
      key: 'action', header: 'Action',
      render: (row) => (
        <code style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-sm)',
          background: 'var(--color-bg-sunken)', color: 'var(--color-text)',
        }}>
          {row.action}
        </code>
      ),
    },
    {
      key: 'entityType', header: 'Entity',
      render: (row) => (
        <div>
          <div style={{ fontSize: 'var(--text-sm)' }}>{row.entityType}</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{row.entityId}</div>
        </div>
      ),
    },
    {
      key: 'ipAddress', header: 'IP Address',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
          {row.ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'details', header: 'Details',
      render: (row) => (
        <span style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
          maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
        }}>
          {getDetails(row)}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              placeholder={actionFilter === 'LOGIN' ? 'Filter by user email or IP address...' : 'Search by user, action, entity, or details...'}
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)',
                color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ width: 160 }}>
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </Select>
          <button
            onClick={() => fetchLogs(meta.page)}
            title="Refresh"
            style={{
              display: 'flex', alignItems: 'center', padding: 8,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}
          >
            <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>
      </Card>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          rowKey={(row) => row.id}
          emptyTitle="No logs found"
          emptyMessage={emptyMessage}
          emptyIcon={<History size={48} />}
        />
      </Card>

      {meta.totalPages > 1 && (
        <Pagination page={meta.page} pageCount={meta.totalPages} onChange={(p) => fetchLogs(p)} />
      )}
    </div>
  );
}
