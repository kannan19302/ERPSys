'use client';
import React, { useState, useEffect } from 'react';
import { Radio, Eye, Search, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasExpSubscriptionsPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [statusFilter, setStatusFilter] = useState('');
  useEffect(() => { load(); }, [page, statusFilter]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (statusFilter) params.set('status', statusFilter); const d = await client.get<any>(`/saas/exp/subscriptions?${params}`); if (d?.data) { setItems(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  const cancel = async (id: string) => { try { await client.patch(`/saas/exp/subscriptions/${id}/status`, { status: 'CANCELLED', reason: 'Cancelled by admin' }); load(); } catch {} };
  return (
    <RouteGuard permission="saas.billing.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><Radio className="ui-text-primary" /> Subscriptions</h1><p className="ui-text-sm-muted">Manage tenant subscriptions.</p></div>
          <select className="ui-input w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All Status</option><option value="ACTIVE">Active</option><option value="TRIALING">Trialing</option><option value="PAST_DUE">Past Due</option><option value="CANCELLED">Cancelled</option><option value="EXPIRED">Expired</option></select>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Tenant</th><th>Plan</th><th>Status</th><th>Current Period</th><th>Renewal</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.tenantId}</td><td>{i.plan?.name || i.planId}</td><td><span className={`ui-badge-${i.status === 'ACTIVE' ? 'success' : i.status === 'TRIALING' ? 'info' : i.status === 'PAST_DUE' ? 'warning' : ''}`}>{i.status}</span></td><td>{new Date(i.currentPeriodStart).toLocaleDateString()} - {new Date(i.currentPeriodEnd).toLocaleDateString()}</td><td>{i.renewalDate ? new Date(i.renewalDate).toLocaleDateString() : '-'}</td>
                <td>{i.status === 'ACTIVE' && <button className="ui-btn-icon ui-text-error" onClick={() => cancel(i.id)}><XCircle size={14} /></button>}</td></tr>
            ))}</tbody>
          </table>
          <div className="flex items-center justify-between p-4"><span className="ui-text-sm-muted">Page {page} of {totalPages}</span><div className="ui-hstack-1"><button className="ui-btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><button className="ui-btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div></div>
        </div>
      </div>
    </RouteGuard>
  );
}
