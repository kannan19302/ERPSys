'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Badge, Spinner } from '@unerp/ui';
import { Smartphone, RefreshCw, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';

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

type FilterTab = 'ALL' | 'PENDING' | 'RECONCILED' | 'CONFLICT';

/* ── mock fallback ── */
const FALLBACK_ENTRIES: SyncEntry[] = [
  { id: 'sync-1', clientId: 'client-iphone-14-pro', operation: 'CREATE', entityType: 'ServiceTicket', payload: '{"title":"Offline Ticket #1"}', status: 'PENDING', errorMessage: null, createdAt: new Date().toLocaleString() },
  { id: 'sync-2', clientId: 'client-pixel-8', operation: 'UPDATE', entityType: 'StockEntry', payload: '{"qty":10}', status: 'RECONCILED', errorMessage: null, createdAt: new Date(Date.now() - 7200000).toLocaleString() },
  { id: 'sync-3', clientId: 'client-ipad-air', operation: 'CREATE', entityType: 'Attendance', payload: '{"checkIn":"09:00"}', status: 'CONFLICT', errorMessage: 'Duplicate record detected', createdAt: new Date(Date.now() - 14400000).toLocaleString() },
];

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function SyncMonitorPage() {
  const [entries, setEntries] = useState<SyncEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [conflictModal, setConflictModal] = useState<SyncEntry | null>(null);
  const [reconciling, setReconciling] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── fetch queue ── */
  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/pwa-sync/queue', { headers: authHeaders() });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : FALLBACK_ENTRIES);
    } catch {
      if (!silent) setEntries(FALLBACK_ENTRIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  /* ── auto-refresh every 15s ── */
  useEffect(() => {
    const interval = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  /* ── reconcile ── */
  const handleReconcile = async (id: string, status: 'RECONCILED' | 'CONFLICT' = 'RECONCILED', errorMessage?: string) => {
    setReconciling(id);
    try {
      const body: any = { status };
      if (errorMessage) body.errorMessage = errorMessage;
      const res = await fetch(`/api/v1/admin/pwa-sync/reconcile/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Reconcile failed');
      setEntries((prev) => prev.map((e) =>
        e.id === id ? { ...e, status, errorMessage: errorMessage ?? null } : e
      ));
      showToast(status === 'RECONCILED' ? 'Entry reconciled' : 'Marked as conflict', 'success');
    } catch {
      /* local fallback */
      setEntries((prev) => prev.map((e) =>
        e.id === id ? { ...e, status, errorMessage: errorMessage ?? null } : e
      ));
      showToast('Updated locally (API unavailable)', 'error');
    } finally {
      setReconciling(null);
      setConflictModal(null);
    }
  };

  /* ── retry (force reconcile) ── */
  const handleRetry = (id: string) => handleReconcile(id, 'RECONCILED');

  /* ── filter ── */
  const filtered = filterTab === 'ALL' ? entries : entries.filter((e) => e.status === filterTab);

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

  const tabStyle = (tab: FilterTab): React.CSSProperties => ({
    padding: 'var(--space-2) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background: filterTab === tab ? 'var(--color-primary)' : 'var(--color-bg)',
    color: filterTab === tab ? '#fff' : 'var(--color-text)',
    cursor: 'pointer',
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)',
    transition: 'all 0.15s ease',
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 'var(--space-4)', right: 'var(--space-4)', zIndex: 500,
          padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.2s ease-out',
        }}>
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Offline Sync Monitor"
        description="Monitor IndexedDB offline queue reconciliation. Review pending sync operations from PWA clients."
        breadcrumbs={[{ label: 'Administration' }, { label: 'Sync Monitor' }]}
        actions={
          <Button variant="outline" onClick={() => fetchQueue()} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button style={tabStyle('ALL')} onClick={() => setFilterTab('ALL')}>All ({entries.length})</button>
        <button style={tabStyle('PENDING')} onClick={() => setFilterTab('PENDING')}>Pending ({pendingCount})</button>
        <button style={tabStyle('RECONCILED')} onClick={() => setFilterTab('RECONCILED')}>Reconciled ({reconciledCount})</button>
        <button style={tabStyle('CONFLICT')} onClick={() => setFilterTab('CONFLICT')}>Conflicts ({conflictCount})</button>
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
            {filtered.map((entry) => (
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
                  {entry.status === 'PENDING' && (
                    <Button variant="outline" onClick={() => handleReconcile(entry.id)} disabled={reconciling === entry.id} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                      {reconciling === entry.id ? 'Reconciling...' : 'Reconcile'}
                    </Button>
                  )}
                  {entry.status === 'CONFLICT' && (
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <Button variant="outline" onClick={() => setConflictModal(entry)} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                        Resolve
                      </Button>
                      <Button variant="outline" onClick={() => handleRetry(entry.id)} disabled={reconciling === entry.id} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                        {reconciling === entry.id ? '...' : 'Retry'}
                      </Button>
                    </div>
                  )}
                  {entry.status === 'RECONCILED' && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Done</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                  No sync entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Conflict Resolution Modal */}
      {conflictModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '560px', boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>Resolve Conflict</h3>
              <button onClick={() => setConflictModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
                  {conflictModal.operation} {conflictModal.entityType} from {conflictModal.clientId}
                </div>
                {conflictModal.errorMessage && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
                    Error: {conflictModal.errorMessage}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>Payload</div>
                <pre style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', overflow: 'auto', maxHeight: '200px', margin: 0, color: 'var(--color-text)' }}>
                  {(() => { try { return JSON.stringify(JSON.parse(conflictModal.payload), null, 2); } catch { return conflictModal.payload; } })()}
                </pre>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <Button variant="outline" onClick={() => setConflictModal(null)}>Cancel</Button>
                <Button variant="outline" onClick={() => handleReconcile(conflictModal.id, 'CONFLICT', conflictModal.errorMessage ?? 'Manually kept as conflict')} disabled={reconciling === conflictModal.id}>
                  Keep Conflict
                </Button>
                <Button variant="primary" onClick={() => handleReconcile(conflictModal.id, 'RECONCILED')} disabled={reconciling === conflictModal.id}>
                  {reconciling === conflictModal.id ? 'Reconciling...' : 'Force Reconcile'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
