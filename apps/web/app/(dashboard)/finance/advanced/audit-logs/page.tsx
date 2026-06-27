'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Badge, Spinner, DataTable, type Column, Pagination, Select,
} from '@unerp/ui';
import { Search, RefreshCw, Eye, FileText, Clock } from 'lucide-react';

interface FinanceAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName?: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const MOCK_LOGS: FinanceAuditLog[] = [
  { id: '1', entityType: 'Invoice', entityId: 'INV-2026-001', action: 'STATUS_CHANGE', userId: 'admin', userName: 'System Admin', changes: { status: { from: 'DRAFT', to: 'SENT' } }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', entityType: 'Payment', entityId: 'PAY-0001', action: 'CREATE', userId: 'admin', userName: 'System Admin', changes: null, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', entityType: 'Journal', entityId: 'JE-001', action: 'POST', userId: 'admin', userName: 'System Admin', changes: { status: { from: 'DRAFT', to: 'POSTED' } }, createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: '4', entityType: 'Account', entityId: '1000', action: 'UPDATE', userId: 'admin', userName: 'System Admin', changes: { name: { from: 'Cash', to: 'Cash & Equivalents' } }, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', entityType: 'Invoice', entityId: 'INV-2026-001', action: 'PAYMENT_RECEIVED', userId: 'admin', userName: 'System Admin', changes: { paidAmount: { from: 0, to: 500 } }, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export default function FinanceAuditTrailPage() {
  const [logs] = useState(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filtered = logs.filter(l => {
    const matchesSearch = !search || l.entityId.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === 'ALL' || l.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const columns: Column<FinanceAuditLog>[] = [
    { key: 'createdAt', header: 'Time', width: '160px', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(row.createdAt).toLocaleString()}</span> },
    {
      key: 'entity', header: 'Entity',
      render: (row) => (
        <div>
          <Badge variant="info">{row.entityType}</Badge>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>{row.entityId}</span>
        </div>
      ),
    },
    { key: 'action', header: 'Action', render: (row) => <code style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-sunken)' }}>{row.action}</code> },
    { key: 'user', header: 'User', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.userName || row.userId}</span> },
    {
      key: 'changes', header: 'Changes',
      render: (row) => row.changes ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
          {Object.entries(row.changes).map(([k, v]) => (
            <span key={k}>{k}: <span style={{ color: 'var(--color-danger)' }}>{String(v.from)}</span> → <span style={{ color: 'var(--color-success)' }}>{String(v.to)}</span></span>
          ))}
        </div>
      ) : <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>—</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Finance Audit Trail" description="Track all changes to financial records for compliance and auditing"
        breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Advanced', href: '/finance/advanced' }, { label: 'Audit Trail' }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search by entity ID or action..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} style={{ width: 140 }}>
            <option value="ALL">All Entities</option>
            <option value="Invoice">Invoice</option>
            <option value="Payment">Payment</option>
            <option value="Journal">Journal</option>
            <option value="Account">Account</option>
          </Select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={(r) => r.id} emptyTitle="No audit logs" emptyMessage="Financial audit events will appear here." emptyIcon={<Eye size={48} />} />
      </Card>
    </div>
  );
}
