'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function EcommerceExpOrdersPage() {
  const client = useApiClient(); const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(''); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(''); const [selected, setSelected] = useState<any>(null);
  useEffect(() => { if (storeId) load(); }, [storeId, page, statusFilter]);
  const load = async () => { setLoading(true); try { const params = new URLSearchParams({ page: String(page), limit: '20' }); if (statusFilter) params.set('status', statusFilter); const d = await client.get<any>(`/ecommerce/exp/${storeId}/orders?${params}`); if (d?.data) { setOrders(d.data); setTotalPages(d.meta?.totalPages || 1); } } catch {} setLoading(false); };
  const updateStatus = async (id: string, status: string) => { try { await client.patch(`/ecommerce/exp/orders/${id}/status`, { status }); load(); setSelected(null); } catch {} };
  return (
    <RouteGuard permission="ecommerce.order.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl ui-hstack-2"><ShoppingBag className="ui-text-primary" /> Orders</h1><p className="ui-text-sm-muted">View and manage ecommerce orders.</p></div>
          <div className="ui-hstack-2"><input className="ui-input" placeholder="Store ID" value={storeId} onChange={e => setStoreId(e.target.value)} /><select className="ui-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="PROCESSING">Processing</option><option value="SHIPPED">Shipped</option><option value="DELIVERED">Delivered</option><option value="CANCELLED">Cancelled</option></select></div>
        </div>
        {selected ? (
          <div className="ui-card p-5">
            <button onClick={() => setSelected(null)} className="ui-text-primary mb-4">← Back</button>
            <div className="ui-grid-3">
              <div><strong>Order #:</strong> {selected.orderNumber}</div><div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Customer:</strong> {selected.customerName || selected.customerEmail || '-'}</div>
              <div><strong>Total:</strong> ${Number(selected.grandTotal).toFixed(2)}</div>
              <div><strong>Date:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
              <div><strong>Items:</strong> {(selected.items || []).length}</div>
            </div>
            <div className="ui-hstack-2 mt-4">
              {selected.status === 'PENDING' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'CONFIRMED')}>Confirm</button>}
              {selected.status === 'CONFIRMED' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'PROCESSING')}>Process</button>}
              {selected.status === 'PROCESSING' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'SHIPPED')}>Mark Shipped</button>}
              {selected.status === 'SHIPPED' && <button className="ui-btn" onClick={() => updateStatus(selected.id, 'DELIVERED')}>Mark Delivered</button>}
              {!['DELIVERED', 'CANCELLED'].includes(selected.status) && <button className="ui-btn-secondary ui-text-error" onClick={() => updateStatus(selected.id, 'CANCELLED')}>Cancel Order</button>}
            </div>
          </div>
        ) : (
          <div className="ui-card">
            <table className="ui-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>{loading ? <tr><td colSpan={6} className="text-center p-4">Loading...</td></tr> : orders.map(o => (
                <tr key={o.id}><td>{o.orderNumber}</td><td>{o.customerName || o.customerEmail || '-'}</td><td><span className={`ui-badge-${o.status === 'DELIVERED' ? 'success' : o.status === 'CANCELLED' ? 'error' : o.status === 'PROCESSING' ? 'info' : ''}`}>{o.status}</span></td><td>${Number(o.grandTotal).toFixed(2)}</td><td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td><button className="ui-btn-icon" onClick={async () => { const d = await client.get<any>(`/ecommerce/exp/orders/${o.id}`); setSelected(d); }}><Eye size={14} /></button></td></tr>
              ))}</tbody>
            </table>
            <div className="flex items-center justify-between p-4"><span className="ui-text-sm-muted">Page {page} of {totalPages}</span><div className="ui-hstack-1"><button className="ui-btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button><button className="ui-btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button></div></div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
