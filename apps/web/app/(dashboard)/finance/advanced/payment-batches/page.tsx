'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Loader2, Play, Download, Trash2, RefreshCw,
  CreditCard, CheckCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface PaymentBatchLine {
  id: string;
  invoiceId: string;
  amount: string | number;
  scheduledPaymentDate: string;
  status: string;
}

interface PaymentBatch {
  id: string;
  batchNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: string | number;
  currency: string;
  settlementDate: string | null;
  notes: string | null;
  createdAt: string;
  submittedAt: string | null;
  lines: PaymentBatchLine[];
  _count?: { lines: number };
}

const API = 'http://localhost:3001/api/v1/advanced-finance';

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}
function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...extra };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  DRAFT: <Clock size={14} className="text-gray-400" />,
  READY: <Clock size={14} className="text-blue-500" />,
  COMPLETED: <CheckCircle size={14} className="text-green-500" />,
  CANCELLED: <AlertTriangle size={14} className="text-red-400" />,
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'frappe-badge-gray',
  READY: 'frappe-badge-blue',
  RUNNING: 'frappe-badge-yellow',
  COMPLETED: 'frappe-badge-green',
  CANCELLED: 'frappe-badge-red',
};

export default function PaymentBatchesPage() {
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [newBatchForm, setNewBatchForm] = useState({
    paymentMethod: 'ACH',
    settlementDate: '',
    currency: 'USD',
    notes: '',
  });
  const [lineForm, setLineForm] = useState({
    referenceId: '',
    amount: '',
    scheduledPaymentDate: new Date().toISOString().slice(0, 10),
  });

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payables/payment-batches`, { headers: authHeaders() });
      if (res.ok) setBatches(await res.json() as PaymentBatch[]);
    } catch { /* network error */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const createBatch = async () => {
    setError('');
    try {
      const res = await fetch(`${API}/payables/payment-batches`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          paymentMethod: newBatchForm.paymentMethod,
          settlementDate: newBatchForm.settlementDate || undefined,
          currency: newBatchForm.currency,
          notes: newBatchForm.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowNewForm(false);
        fetchBatches();
      } else {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to create batch');
      }
    } catch { setError('Network error'); }
  };

  const addLine = async () => {
    if (!selectedBatch) return;
    setError('');
    try {
      await fetch(`${API}/payables/payment-batches/${selectedBatch.id}/lines`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          referenceId: lineForm.referenceId,
          amount: parseFloat(lineForm.amount),
          scheduledPaymentDate: lineForm.scheduledPaymentDate,
        }),
      });
      setShowAddLine(false);
      const res = await fetch(`${API}/payables/payment-batches/${selectedBatch.id}`, { headers: authHeaders() });
      if (res.ok) setSelectedBatch(await res.json() as PaymentBatch);
      fetchBatches();
    } catch { setError('Network error'); }
  };

  const removeLine = async (batchId: string, lineId: string) => {
    await fetch(`${API}/payables/payment-batches/${batchId}/lines/${lineId}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    const res = await fetch(`${API}/payables/payment-batches/${batchId}`, { headers: authHeaders() });
    if (res.ok) setSelectedBatch(await res.json() as PaymentBatch);
    fetchBatches();
  };

  const runBatch = async (batchId: string) => {
    if (!confirm('Run this payment batch? This will settle all lines and post a GL journal entry.')) return;
    setActioningId(batchId);
    try {
      const res = await fetch(`${API}/payables/payment-batches/${batchId}/run`, {
        method: 'POST', headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json() as { message?: string };
        setError(d.message || 'Failed to run batch');
      }
      fetchBatches();
      if (selectedBatch?.id === batchId) {
        const updated = await fetch(`${API}/payables/payment-batches/${batchId}`, { headers: authHeaders() });
        if (updated.ok) setSelectedBatch(await updated.json() as PaymentBatch);
      }
    } catch { setError('Network error'); } finally { setActioningId(null); }
  };

  const exportBatch = async (batchId: string, format: string) => {
    const res = await fetch(`${API}/payables/payment-batches/${batchId}/export?format=${format}`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json() as { content: string; format: string };
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `payment-batch-${batchId}.${format.toLowerCase()}`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  const totalDraft = batches
    .filter((b) => b.status === 'DRAFT' || b.status === 'READY')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  return (
    <div className="frappe-page-container">
      <div className="frappe-page-head">
        <div className="frappe-page-head-content">
          <nav className="frappe-breadcrumb">
            <span>Finance</span><span className="frappe-breadcrumb-sep">/</span>
            <span>Payables</span><span className="frappe-breadcrumb-sep">/</span>
            <span className="frappe-breadcrumb-current">Payment Batches</span>
          </nav>
          <div className="frappe-title-section">
            <CreditCard className="frappe-title-icon" size={20} />
            <h1 className="frappe-page-title">Vendor Payment Runs</h1>
          </div>
          <p className="frappe-page-subtitle">
            Batch open vendor invoices into payment runs. Export as NACHA ACH or SEPA XML for your bank.
          </p>
        </div>
        <div className="frappe-page-actions">
          <Button onClick={fetchBatches} variant="secondary"><RefreshCw size={16} /></Button>
          <Button onClick={() => setShowNewForm(true)}><Plus size={16} className="mr-1" /> New Batch</Button>
        </div>
      </div>

      {error && (
        <div className="frappe-alert frappe-alert-error">
          <AlertTriangle size={16} /> {error}
          <button className="ml-auto" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Summary stats */}
      <div className="frappe-stat-row mb-4">
        <Card className="frappe-stat-card">
          <div className="frappe-stat-value">{batches.length}</div>
          <div className="frappe-stat-label">Total Batches</div>
        </Card>
        <Card className="frappe-stat-card">
          <div className="frappe-stat-value">{batches.filter((b) => b.status === 'DRAFT').length}</div>
          <div className="frappe-stat-label">Draft</div>
        </Card>
        <Card className="frappe-stat-card">
          <div className="frappe-stat-value">${totalDraft.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="frappe-stat-label">Pending Disbursement</div>
        </Card>
        <Card className="frappe-stat-card">
          <div className="frappe-stat-value">{batches.filter((b) => b.status === 'COMPLETED').length}</div>
          <div className="frappe-stat-label">Completed</div>
        </Card>
      </div>

      {showNewForm && (
        <Card className="frappe-form-card mb-4">
          <h3 className="frappe-form-title">New Payment Batch</h3>
          <div className="frappe-form-grid">
            <div className="frappe-form-group">
              <label className="frappe-label">Payment Method</label>
              <select
                className="frappe-input"
                value={newBatchForm.paymentMethod}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, paymentMethod: e.target.value })}
              >
                <option value="ACH">ACH (NACHA)</option>
                <option value="SEPA">SEPA XML</option>
                <option value="WIRE">Wire Transfer</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Currency</label>
              <select
                className="frappe-input"
                value={newBatchForm.currency}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Settlement Date</label>
              <input
                type="date"
                className="frappe-input"
                value={newBatchForm.settlementDate}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, settlementDate: e.target.value })}
              />
            </div>
            <div className="frappe-form-group frappe-form-group-full">
              <label className="frappe-label">Notes</label>
              <input
                className="frappe-input"
                value={newBatchForm.notes}
                onChange={(e) => setNewBatchForm({ ...newBatchForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="frappe-form-actions">
            <Button onClick={createBatch}>Create Batch</Button>
            <Button variant="secondary" onClick={() => setShowNewForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="frappe-split-layout">
        {/* Batch list */}
        <Card className="frappe-list-card frappe-split-left">
          {loading ? (
            <div className="frappe-loading"><Loader2 className="animate-spin" size={20} /> Loading batches…</div>
          ) : batches.length === 0 ? (
            <div className="frappe-empty-state">
              <CreditCard size={40} className="frappe-empty-icon" />
              <p>No payment batches yet. Create one to start batching vendor payments.</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.id}
                className={`frappe-list-row frappe-list-row-clickable ${selectedBatch?.id === batch.id ? 'frappe-list-row-selected' : ''}`}
                onClick={() => setSelectedBatch(batch)}
              >
                <div className="frappe-list-row-main">
                  <div className="frappe-list-row-title">
                    {STATUS_ICON[batch.status]}
                    <span className="font-medium">{batch.batchNumber}</span>
                    <span className={`frappe-badge ${STATUS_COLOR[batch.status] ?? 'frappe-badge-gray'}`}>{batch.status}</span>
                  </div>
                  <div className="frappe-list-row-meta">
                    <span>{batch.paymentMethod}</span>
                    <span className="font-semibold">{batch.currency} {Number(batch.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span>{batch._count?.lines ?? batch.lines?.length ?? 0} lines</span>
                    <span className="text-gray-400">{new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>

        {/* Batch detail */}
        {selectedBatch && (
          <Card className="frappe-detail-card frappe-split-right">
            <div className="frappe-detail-header">
              <h3 className="frappe-detail-title">{selectedBatch.batchNumber}</h3>
              <div className="frappe-detail-actions">
                {['DRAFT', 'READY'].includes(selectedBatch.status) && (
                  <>
                    <Button
                      onClick={() => runBatch(selectedBatch.id)}
                      disabled={actioningId === selectedBatch.id || selectedBatch.lines.length === 0}
                    >
                      {actioningId === selectedBatch.id
                        ? <Loader2 size={14} className="animate-spin mr-1" />
                        : <Play size={14} className="mr-1" />}
                      Run Batch
                    </Button>
                    <Button variant="secondary" onClick={() => setShowAddLine(true)}>
                      <Plus size={14} className="mr-1" /> Add Line
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => exportBatch(selectedBatch.id, selectedBatch.paymentMethod === 'SEPA' ? 'SEPA_XML' : 'NACHA')}>
                  <Download size={14} className="mr-1" /> Export
                </Button>
              </div>
            </div>

            {showAddLine && (
              <div className="frappe-inline-form mb-4 p-4 border rounded">
                <div className="frappe-form-grid">
                  <div className="frappe-form-group">
                    <label className="frappe-label">PO / Invoice Reference ID</label>
                    <input
                      className="frappe-input"
                      value={lineForm.referenceId}
                      onChange={(e) => setLineForm({ ...lineForm, referenceId: e.target.value })}
                      placeholder="Purchase order or invoice ID"
                    />
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="frappe-input"
                      value={lineForm.amount}
                      onChange={(e) => setLineForm({ ...lineForm, amount: e.target.value })}
                    />
                  </div>
                  <div className="frappe-form-group">
                    <label className="frappe-label">Payment Date</label>
                    <input
                      type="date"
                      className="frappe-input"
                      value={lineForm.scheduledPaymentDate}
                      onChange={(e) => setLineForm({ ...lineForm, scheduledPaymentDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="frappe-form-actions">
                  <Button onClick={addLine}>Add</Button>
                  <Button variant="secondary" onClick={() => setShowAddLine(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <table className="frappe-table">
              <thead>
                <tr>
                  <th className="frappe-th">Reference</th>
                  <th className="frappe-th">Amount</th>
                  <th className="frappe-th">Payment Date</th>
                  <th className="frappe-th">Status</th>
                  <th className="frappe-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedBatch.lines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="frappe-td text-center text-gray-400 py-4">
                      No lines added yet. Click &quot;Add Line&quot; to include vendor invoices.
                    </td>
                  </tr>
                ) : (
                  selectedBatch.lines.map((line) => (
                    <tr key={line.id} className="frappe-tr">
                      <td className="frappe-td font-mono text-sm">{line.invoiceId.slice(0, 16)}…</td>
                      <td className="frappe-td font-semibold">${Number(line.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="frappe-td">{new Date(line.scheduledPaymentDate).toLocaleDateString()}</td>
                      <td className="frappe-td">
                        <span className={`frappe-badge ${line.status === 'SETTLED' ? 'frappe-badge-green' : 'frappe-badge-gray'}`}>
                          {line.status}
                        </span>
                      </td>
                      <td className="frappe-td frappe-td-actions">
                        {['DRAFT', 'READY'].includes(selectedBatch.status) && (
                          <button
                            className="frappe-action-btn frappe-action-btn-danger"
                            onClick={() => removeLine(selectedBatch.id, line.id)}
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td className="frappe-td font-semibold" colSpan={1}>Total</td>
                  <td className="frappe-td font-semibold">
                    {selectedBatch.currency} {Number(selectedBatch.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
