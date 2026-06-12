'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Button, Badge } from '@unerp/ui';
import { Smartphone, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface SyncEntry {
  id: string;
  clientId: string;
  operation: string;
  entityType: string;
  payload: string;
  status: 'PENDING' | 'RECONCILED' | 'CONFLICT';
  errorMessage: string | null;
  createdAt: string;
}

export default function SyncMonitorPage() {
  const [entries, setEntries] = useState<SyncEntry[]>([
    { id: 'sync-1', clientId: 'client-iphone-14-pro', operation: 'CREATE', entityType: 'ServiceTicket', payload: '{"title":"Offline Ticket #1"}', status: 'PENDING', errorMessage: null, createdAt: new Date().toLocaleString() },
    { id: 'sync-2', clientId: 'client-pixel-8', operation: 'UPDATE', entityType: 'StockEntry', payload: '{"qty":10}', status: 'RECONCILED', errorMessage: null, createdAt: new Date(Date.now() - 7200000).toLocaleString() },
    { id: 'sync-3', clientId: 'client-ipad-air', operation: 'CREATE', entityType: 'Attendance', payload: '{"checkIn":"09:00"}', status: 'CONFLICT', errorMessage: 'Duplicate record detected', createdAt: new Date(Date.now() - 14400000).toLocaleString() },
  ]);

  const handleReconcile = (id: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: 'RECONCILED' as const, errorMessage: null } : e
    ));
  };

  const pendingCount = entries.filter((e) => e.status === 'PENDING').length;
  const reconciledCount = entries.filter((e) => e.status === 'RECONCILED').length;
  const conflictCount = entries.filter((e) => e.status === 'CONFLICT').length;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={15} style={{ color: 'var(--color-warning)' }} />;
      case 'RECONCILED': return <CheckCircle size={15} style={{ color: 'var(--color-success)' }} />;
      case 'CONFLICT': return <AlertTriangle size={15} style={{ color: 'var(--color-danger)' }} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Offline Sync Monitor"
        description="Monitor IndexedDB offline queue reconciliation. Review pending sync operations from PWA clients."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Sync Monitor' }]}
        actions={
          <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <RefreshCw size={16} /> Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-warning)' }}>{pendingCount}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Pending</div>
        </Card>
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>{reconciledCount}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Reconciled</div>
        </Card>
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)' }}>{conflictCount}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Conflicts</div>
        </Card>
      </div>

      {/* Queue Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Client</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Operation</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Entity</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Error</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'left', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Time</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {statusIcon(entry.status)}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>{entry.status}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Smartphone size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span style={{ fontSize: 'var(--text-xs)' }}>{entry.clientId}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}><Badge variant="info">{entry.operation}</Badge></td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-medium)' }}>{entry.entityType}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{entry.errorMessage || '—'}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{entry.createdAt}</td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  {entry.status === 'PENDING' || entry.status === 'CONFLICT' ? (
                    <Button variant="outline" onClick={() => handleReconcile(entry.id)} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                      Reconcile
                    </Button>
                  ) : (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Done</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
