'use client';
import styles from './SyncMonitorTab.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Smartphone, RefreshCw, CheckCircle, AlertTriangle, Clock, X } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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

const FALLBACK_ENTRIES: SyncEntry[] = [
  { id: 'sync-1', clientId: 'client-iphone-14-pro', operation: 'CREATE', entityType: 'ServiceTicket', payload: '{"title":"Offline Ticket #1"}', status: 'PENDING', errorMessage: null, createdAt: new Date().toLocaleString() },
  { id: 'sync-2', clientId: 'client-pixel-8', operation: 'UPDATE', entityType: 'StockEntry', payload: '{"qty":10}', status: 'RECONCILED', errorMessage: null, createdAt: new Date(Date.now() - 7200000).toLocaleString() },
  { id: 'sync-3', clientId: 'client-ipad-air', operation: 'CREATE', entityType: 'Attendance', payload: '{"checkIn":"09:00"}', status: 'CONFLICT', errorMessage: 'Duplicate record detected', createdAt: new Date(Date.now() - 14400000).toLocaleString() },
];

export default function SyncMonitorTab() {
  const client = useApiClient();
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

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await client.get<SyncEntry[]>('/admin/pwa-sync/queue');
      setEntries(Array.isArray(data) ? data : FALLBACK_ENTRIES);
    } catch {
      if (!silent) setEntries(FALLBACK_ENTRIES);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  useEffect(() => {
    const interval = setInterval(() => fetchQueue(true), 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleReconcile = async (id: string, status: 'RECONCILED' | 'CONFLICT' = 'RECONCILED', errorMessage?: string) => {
    setReconciling(id);
    try {
      const body: any = { status };
      if (errorMessage) body.errorMessage = errorMessage;
      await client.request(`/admin/pwa-sync/reconcile/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status, errorMessage: errorMessage ?? null } : e)));
      showToast(status === 'RECONCILED' ? 'Entry reconciled' : 'Marked as conflict', 'success');
    } catch {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status, errorMessage: errorMessage ?? null } : e)));
      showToast('Updated locally (API unavailable)', 'error');
    } finally {
      setReconciling(null);
      setConflictModal(null);
    }
  };

  const handleRetry = (id: string) => handleReconcile(id, 'RECONCILED');

  const filtered = filterTab === 'ALL' ? entries : entries.filter((e) => e.status === filterTab);

  const pendingCount = entries.filter((e) => e.status === 'PENDING').length;
  const reconciledCount = entries.filter((e) => e.status === 'RECONCILED').length;
  const conflictCount = entries.filter((e) => e.status === 'CONFLICT').length;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={15} className="ui-text-warning" />;
      case 'RECONCILED': return <CheckCircle size={15} className="ui-text-success" />;
      case 'CONFLICT': return <AlertTriangle size={15} className="ui-text-danger" />;
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
      <div className={styles.s1}>
        <Spinner />
      </div>
    );
  }

  return (
    <RouteGuard permission="settings.import-export.read">
    <div className="ui-stack-6">
      {toast && (
        <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s2}
        >
          {toast.message}
        </div>
      )}

      <div className="ui-flex-end">
        <Button variant="outline" onClick={() => fetchQueue()} className="ui-hstack-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="ui-grid-auto">
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
          <div className={styles.s3}>{pendingCount}</div>
          <div className={styles.s4}>Pending</div>
        </Card>
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #22c55e' }}>
          <div className={styles.s5}>{reconciledCount}</div>
          <div className={styles.s4}>Reconciled</div>
        </Card>
        <Card padding="lg" style={{ textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
          <div className={styles.s6}>{conflictCount}</div>
          <div className={styles.s4}>Conflicts</div>
        </Card>
      </div>

      <div className="ui-flex ui-gap-2">
        <button style={tabStyle('ALL')} onClick={() => setFilterTab('ALL')}>All ({entries.length})</button>
        <button style={tabStyle('PENDING')} onClick={() => setFilterTab('PENDING')}>Pending ({pendingCount})</button>
        <button style={tabStyle('RECONCILED')} onClick={() => setFilterTab('RECONCILED')}>Reconciled ({reconciledCount})</button>
        <button style={tabStyle('CONFLICT')} onClick={() => setFilterTab('CONFLICT')}>Conflicts ({conflictCount})</button>
      </div>

      <ListPageTemplate
        columns={[
          { key: 'status', header: 'Status', render: (v) => (
            <div className="ui-hstack-2">
              {statusIcon(String(v))}
              <span className={styles.s7}>{String(v)}</span>
            </div>
          ) },
          { key: 'clientId', header: 'Client', render: (v) => (
            <div className="ui-hstack-2">
              <Smartphone size={14} className="ui-text-tertiary" />
              <span className="text-xs">{String(v)}</span>
            </div>
          ) },
          { key: 'operation', header: 'Operation', render: (v) => <Badge variant="info">{String(v)}</Badge> },
          { key: 'entityType', header: 'Entity', render: (v) => <span className="font-medium">{String(v)}</span> },
          { key: 'errorMessage', header: 'Error', render: (v) => <span className={styles.s8}>{v ? String(v) : '—'}</span> },
          { key: 'createdAt', header: 'Time', render: (v) => <span className={styles.s9}>{String(v)}</span> },
          { key: 'id', header: 'Action', render: (v, row) => {
            const status = row.status as string;
            const id = String(v);
            if (status === 'PENDING') {
              return (
                <Button variant="outline" onClick={() => handleReconcile(id)} disabled={reconciling === id} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                  {reconciling === id ? 'Reconciling...' : 'Reconcile'}
                </Button>
              );
            }
            if (status === 'CONFLICT') {
              return (
                <div className={styles.s10}>
                  <Button variant="outline" onClick={() => setConflictModal(row as unknown as SyncEntry)} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                    Resolve
                  </Button>
                  <Button variant="outline" onClick={() => handleRetry(id)} disabled={reconciling === id} style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-3)' }}>
                    {reconciling === id ? '...' : 'Retry'}
                  </Button>
                </div>
              );
            }
            return <span className="ui-text-xs-tertiary">Done</span>;
          } },
        ] as ListColumn[]}
        data={filtered as unknown as Record<string, unknown>[]}
        loading={false}
        emptyTitle="No sync entries"
        emptyDescription="No sync entries found."
      />

      {conflictModal && (
        <div className={styles.s11}>
          <div className={styles.s12}>
            <div className={styles.s13}>
              <h3 className={styles.s14}>Resolve Conflict</h3>
              <button onClick={() => setConflictModal(null)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            <div className="p-5 ui-stack-4">
              <div>
                <div className={styles.s15}>
                  {conflictModal.operation} {conflictModal.entityType} from {conflictModal.clientId}
                </div>
                {conflictModal.errorMessage && (
                  <div className={styles.s16}>
                    Error: {conflictModal.errorMessage}
                  </div>
                )}
              </div>
              <div>
                <div className={styles.s15}>Payload</div>
                <pre className={styles.s17}>
                  {(() => { try { return JSON.stringify(JSON.parse(conflictModal.payload), null, 2); } catch { return conflictModal.payload; } })()}
                </pre>
              </div>
              <div className={styles.s18}>
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
    </RouteGuard>
  );
}
