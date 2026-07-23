'use client';
import React, { useState, useEffect } from 'react';
import { RotateCcw, Eye, Check, X } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function POSRefundsPage() {
  const client = useApiClient();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const data = await client.get<any>(`/pos/exp/refunds?${params}`);
      if (data?.data) { setRefunds(data.data); setTotalPages(data.meta?.totalPages || 1); }
    } catch {}
    setLoading(false);
  };

  const approve = async (id: string, approved: boolean) => {
    try { await client.put(`/pos/exp/refunds/${id}/approve`, { approved }); load(); setSelected(null); } catch {}
  };

  return (
    <RouteGuard permission="pos.return.read">
      <div className="ui-stack-6">
        <div><h1 className="text-2xl ui-hstack-2"><RotateCcw className="ui-text-primary" /> Refunds & Returns</h1><p className="ui-text-sm-muted">Process and manage refund requests.</p></div>
        {selected ? (
          <div className="ui-card p-5">
            <button onClick={() => setSelected(null)} className="ui-text-primary mb-4">← Back</button>
            <div className="ui-grid-3">
              <div><strong>Refund #:</strong> {selected.refundNumber}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Amount:</strong> ${Number(selected.refundAmount).toFixed(2)}</div>
              <div><strong>Method:</strong> {selected.refundMethod || '-'}</div>
              <div><strong>Reason:</strong> {selected.reason || '-'}</div>
              <div><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
            </div>
            {selected.status === 'PENDING' && (
              <div className="ui-hstack-2 mt-4">
                <button className="ui-btn" onClick={() => approve(selected.id, true)}><Check size={14} /> Approve</button>
                <button className="ui-btn-secondary ui-text-error" onClick={() => approve(selected.id, false)}><X size={14} /> Reject</button>
              </div>
            )}
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead><tr><th>Refund #</th><th>Status</th><th>Amount</th><th>Method</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> :
                  refunds.map(r => (
                    <tr key={r.id}>
                      <td>{r.refundNumber}</td>
                      <td><span className={`ui-badge-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : r.status === 'REJECTED' ? 'error' : ''}`}>{r.status}</span></td>
                      <td>${Number(r.refundAmount).toFixed(2)}</td>
                      <td>{r.refundMethod || '-'}</td>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/pos/exp/refunds/${r.id}`); setSelected(d); }}><Eye size={14} /></button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
