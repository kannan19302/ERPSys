'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Badge, DataTable, type Column, Pagination, Select,
} from '@unerp/ui';
import { Search, RefreshCw, History } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './AuditLogTable.module.css';

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
  const client = useApiClient();
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

      const data = await client.get<{ data?: AuditLog[]; meta?: PaginationMeta }>(`/admin/security/audit-logs?${params}`);
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
  }, [search, severityFilter, actionFilter, client]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

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
        <span className={styles.s1}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'userId', header: 'User',
      render: (row) => (
        <span className="ui-heading-sm">{row.userId}</span>
      ),
    },
    {
      key: 'action', header: 'Action',
      render: (row) => (
        <code className={styles.s2}>
          {row.action}
        </code>
      ),
    },
    {
      key: 'entityType', header: 'Entity',
      render: (row) => (
        <div>
          <div className="text-sm">{row.entityType}</div>
          <div className={styles.s3}>{row.entityId}</div>
        </div>
      ),
    },
    {
      key: 'ipAddress', header: 'IP Address',
      render: (row) => (
        <span className="ui-text-xs-tertiary">
          {row.ipAddress || '—'}
        </span>
      ),
    },
    {
      key: 'details', header: 'Details',
      render: (row) => (
        <span className={styles.s4}>
          {getDetails(row)}
        </span>
      ),
    },
  ];

  return (
    <div className="ui-stack-4">
      <Card>
        <div className={styles.s5}>
          <div className={styles.s6}>
            <Search size={16} className={styles.s7} />
            <input
              type="text"
              placeholder={actionFilter === 'LOGIN' ? 'Filter by user email or IP address...' : 'Search by user, action, entity, or details...'}
              value={search} onChange={(e) => setSearch(e.target.value)}
              className={styles.s8}
            />
          </div>
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={styles.s9}>
            <option value="ALL">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </Select>
          <button
            onClick={() => fetchLogs(meta.page)}
            title="Refresh"
            className={styles.s10}
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
