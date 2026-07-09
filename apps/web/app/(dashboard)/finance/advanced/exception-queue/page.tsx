'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw, Filter } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

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

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'frappe-badge-yellow',
  APPROVED: 'frappe-badge-green',
  REJECTED: 'frappe-badge-red',
};

export default function ExceptionQueuePage() {
  const [exceptions, setExceptions] = useState<APMatchException[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API}/payables/exceptions${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) setExceptions(await res.json() as APMatchException[]);
    } catch { /* network error */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchExceptions(); }, [fetchExceptions]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id);
    try {
      await fetch(`${API}/payables/exceptions/${id}/${action}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ notes: noteMap[id] || undefined }),
      });
      fetchExceptions();
    } catch { /* error */ } finally { setActioningId(null); }
  };

  const pendingCount = exceptions.filter((e) => e.status === 'PENDING').length;

  return (
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>Payables</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">Exception Queue</span>
          </nav>
          <div className="frappe-title-section">
            <AlertTriangle className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">AP Match Exception Queue</h1>
            {pendingCount > 0 && (
              <span className="frappe-badge frappe-badge-yellow ml-2">{pendingCount} pending</span>
            )}
          </div>
          <p className="frappe-page-subtitle">
            Review and resolve purchase orders with price or quantity variances outside configured tolerances.
          </p>
        </div>
        <div className="frappe-page-actions">
          <Button variant="secondary" onClick={fetchExceptions}>
            <RefreshCw size={16} className="mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="frappe-filter-bar mb-4">
        <Filter size={16} />
        {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            className={`frappe-filter-chip ${statusFilter === s ? 'frappe-filter-chip-active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <Card className="frappe-list-card">
        {loading ? (
          <div className="frappe-loading"><Loader2 className="animate-spin" size={20} /> Loading exceptions…</div>
        ) : exceptions.length === 0 ? (
          <div className="frappe-empty-state">
            <CheckCircle size={40} className="frappe-empty-icon text-green-500" />
            <p>No {statusFilter.toLowerCase()} exceptions. All matched invoices are within tolerance.</p>
          </div>
        ) : (
          <div className="frappe-list-body">
            {exceptions.map((exc) => (
              <div key={exc.id} className="frappe-list-row">
                <div className="frappe-list-row-main">
                  <div className="frappe-list-row-title">
                    <AlertTriangle size={16} className="text-yellow-500" />
                    <span className="font-medium">{exc.varianceType.replace('_', ' ')}</span>
                    <span className={`frappe-badge ${STATUS_COLORS[exc.status] ?? 'frappe-badge-gray'}`}>{exc.status}</span>
                  </div>
                  <div className="frappe-list-row-meta">
                    <span>PO: {exc.invoiceId.slice(0, 12)}…</span>
                    <span>Variance: {Number(exc.variancePercent).toFixed(2)}% (${Number(exc.varianceAmount).toFixed(2)})</span>
                    <span>Expected: {exc.expectedValue ?? '—'} | Actual: {exc.actualValue ?? '—'}</span>
                    <span className="text-gray-400">{new Date(exc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {exc.resolutionNotes && (
                    <p className="frappe-list-row-note">Note: {exc.resolutionNotes}</p>
                  )}
                </div>
                {exc.status === 'PENDING' && (
                  <div className="frappe-list-row-actions">
                    <input
                      className="frappe-input frappe-input-sm"
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
  );
}
