'use client';
import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function SaasExpInvoicesPage() {
  const client = useApiClient(); const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [statusFilter, setStatusFilter] = useState('');
  useEffect(() => { load(); }, [page, statusFilter]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (statusFilter) params.set('status', statusFilter); const d = await client.get<any>(`/saas/exp/invoices?${params}`); if (d?.data) { setItems(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  return (
    <RouteGuard permission="saas.billing.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><FileText className="ui-text-primary" /> Invoices</h1><p className="ui-text-sm-muted">View and manage SaaS invoices.</p></div>
          <select className="ui-input w-48" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All</option><option value="DRAFT">Draft</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option><option value="CANCELLED">Cancelled</option><option value="REFUNDED">Refunded</option></select>
        </div>
        <div className="ui-card">
          <table className="ui-table">
            <thead><tr><th>Invoice #</th><th>Tenant</th><th>Subscription</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr> : items.map(i => (
              <tr key={i.id}><td>{i.invoiceNumber}</td><td>{i.tenantId}</td><td>{i.subscriptionId || '-'}</td><td>{i.currency} {Number(i.total).toFixed(2)}</td><td><span className={`ui-badge-${i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'error' : i.status === 'DRAFT' ? '' : 'info'}`}>{i.status}</span></td><td>{i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-'}</td>
                <td className="ui-hstack-1"><button className="ui-btn-icon" title="View"><Eye size={14} /></button><button className="ui-btn-icon" title="Download"><Download size={14} /></button></td></tr>
            ))}</tbody>
          </table>
          <div className="flex items-center justify-between p-4"><span className="ui-text-sm-muted">Page {page} of {totalPages}</span><div className="ui-hstack-1"><button className="ui-btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><button className="ui-btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div></div>
        </div>
      </div>
    </RouteGuard>
  );
}
