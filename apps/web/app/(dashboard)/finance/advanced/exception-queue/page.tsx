'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw, Filter } from 'lucide-react';
import { Card, Button } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface APMatchException {
  id: string;
  invoiceId: string;
  poLineId: string;
  varianceType: string;
  varianceAmount: string | number;
  variancePercent: string | number;
  expectedValue: string | null;
  actualValue: string | null;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'ui-badge-yellow',
  APPROVED: 'ui-badge-green',
  REJECTED: 'ui-badge-red',
};

export default function ExceptionQueuePage() {
  const client = useApiClient();
  const [exceptions, setExceptions] = useState<APMatchException[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      setExceptions(await client.get<APMatchException[]>(`/advanced-finance/payables/exceptions${statusFilter ? `?status=${statusFilter}` : ''}`));
    } catch { /* network error */ } finally { setLoading(false); }
  }, [client, statusFilter]);

  useEffect(() => { fetchExceptions(); }, [fetchExceptions]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id);
    try {
      await client.post(`/advanced-finance/payables/exceptions/${id}/${action}`, { notes: noteMap[id] || undefined });
      fetchExceptions();
    } catch { /* error */ } finally { setActioningId(null); }
  };

  const pendingCount = exceptions.filter((e) => e.status === 'PENDING').length;

  return (
    <RouteGuard permission="finance.payables.read">
      <div className="ui-page-container">
      <div className="ui-page-head">
        <div className="ui-page-head-content">
          <nav className="ui-breadcrumb">
            <span>Finance</span><span className="ui-breadcrumb-sep">/</span>
            <span>Payables</span><span className="ui-breadcrumb-sep">/</span>
            <span className="ui-breadcrumb-current">Exception Queue</span>
          </nav>
          <div className="ui-title-section">
            <AlertTriangle className="ui-title-icon" size={20} />
            <h1 className="ui-page-title">AP Match Exception Queue</h1>
            {pendingCount > 0 && (
              <span className="ui-badge ui-badge-yellow ml-2">{pendingCount} pending</span>
            )}
          </div>
          <p className="ui-page-subtitle">
            Review and resolve purchase orders with price or quantity variances outside configured tolerances.
          </p>
        </div>
        <div className="ui-page-actions">
          <Button variant="secondary" onClick={fetchExceptions}>
            <RefreshCw size={16} className="mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="ui-filter-bar mb-4">
        <Filter size={16} />
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            className={`ui-filter-chip ${statusFilter === s ? 'ui-filter-chip-active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <Card className="ui-list-card">
        {loading ? (
          <div className="ui-loading"><Loader2 className="animate-spin" size={20} /> Loading exceptions…</div>
        ) : exceptions.length === 0 ? (
          <div className="ui-empty-state">
            <CheckCircle size={40} className="ui-empty-icon text-green-500" />
            <p>No {statusFilter.toLowerCase()} exceptions. All matched invoices are within tolerance.</p>
          </div>
        ) : (
          <div className="ui-list-body">
            {exceptions.map((exc) => (
              <div key={exc.id} className="ui-list-row">
                <div className="ui-list-row-main">
                  <div className="ui-list-row-title">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <span className="font-medium">{exc.varianceType.replace('_', ' ')}</span>
                    <span className={`ui-badge ${STATUS_COLORS[exc.status] ?? 'ui-badge-gray'}`}>{exc.status}</span>
                  </div>
                  <div className="ui-list-row-meta">
                    <span>PO: {exc.invoiceId.slice(0, 12)}…</span>
                    <span>Variance: {Number(exc.variancePercent).toFixed(2)}% (${Number(exc.varianceAmount).toFixed(2)})</span>
                    <span>Expected: {exc.expectedValue ?? '—'} | Actual: {exc.actualValue ?? '—'}</span>
                    <span className="text-gray-400">{new Date(exc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {exc.resolutionNotes && (
                    <p className="ui-list-row-note">Note: {exc.resolutionNotes}</p>
                  )}
                </div>
                {exc.status === 'PENDING' && (
                  <div className="ui-list-row-actions">
                    <input
                      className="ui-input ui-input-sm"
                      placeholder="Resolution note (optional)"
                      value={noteMap[exc.id] ?? ''}
                      onChange={(e) => setNoteMap({ ...noteMap, [exc.id]: e.target.value })}
                    />
                    <Button
                      onClick={() => handleAction(exc.id, 'approve')}
                      disabled={actioningId === exc.id}
                    >
                      {actioningId === exc.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleAction(exc.id, 'reject')}
                      disabled={actioningId === exc.id}
                    >
                      <XCircle size={14} /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      </div>
    </RouteGuard>
  );
}
