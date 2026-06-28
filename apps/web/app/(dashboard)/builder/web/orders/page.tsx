'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { ShoppingCart, Package, DollarSign, Clock, Trash2, Search } from 'lucide-react';

const api = (path: string, opts: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`/api/v1/builder/${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}`, ...(opts.headers || {}) } });
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  PAID: { bg: '#dbeafe', text: '#2563eb' },
  FULFILLED: { bg: '#dcfce7', text: '#16a34a' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
};
const STATUSES = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'];

export default function WebOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, fulfilled: 0, revenue: 0 });
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qp = new URLSearchParams();
    if (filter !== 'ALL') qp.set('status', filter);
    const [oRes, sRes] = await Promise.all([api(`web-orders?${qp}`), api('web-orders/stats')]);
    if (oRes.ok) setOrders(await oRes.json());
    if (sRes.ok) setStats(await sRes.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setStatus = async (id: string, status: string) => {
    await api(`web-orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    fetchData();
    if (selected?.id === id) setSelected({ ...selected, status });
  };
  const executeDeleteOrder = async (id: string) => {
    await api(`web-orders/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    fetchData();
  };

  const filtered = orders.filter((o) => !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || JSON.stringify(o.customer).toLowerCase().includes(search.toLowerCase()));

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: ShoppingCart, color: '#3b82f6' },
    { label: 'Revenue', value: `$${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Fulfilled', value: stats.fulfilled, icon: Package, color: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <PageHeader
        title="Orders"
        description="Storefront orders placed from your public website"
        actions={<button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/web')}>← Web Studio</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-4)' }}>
        {statCards.map((s, i) => (
          <div key={i} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={20} style={{ color: s.color }} /></div>
            <div><div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)' }}>{loading ? '—' : s.value}</div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div className="frappe-card" style={{ flex: selected ? '0 0 56%' : 1, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" style={{ width: '100%', padding: '6px 6px 6px 30px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
            </div>
            {['ALL', ...STATUSES].map((s) => (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: filter === s ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: filter === s ? 'var(--color-primary-bg)' : 'transparent', color: filter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>{s.toLowerCase()}</button>
            ))}
          </div>
          {loading ? <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div> : filtered.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}><ShoppingCart size={40} style={{ opacity: 0.4, marginBottom: 10 }} /><div>No orders yet.</div></div>
          ) : (
            <table className="frappe-table" style={{ width: '100%' }}>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.map((o) => {
                  const c = STATUS_COLORS[o.status] || STATUS_COLORS.PENDING!;
                  return (
                    <tr key={o.id} style={{ cursor: 'pointer', background: selected?.id === o.id ? 'var(--color-primary-bg)' : undefined }} onClick={() => setSelected(o)}>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{o.orderNumber}</td>
                      <td>{(o.customer as any)?.name || '—'}</td>
                      <td style={{ fontWeight: 700 }}>${o.total}</td>
                      <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.text }}>{o.status}</span></td>
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="frappe-card" style={{ flex: 1, padding: 'var(--space-5)', alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontFamily: 'monospace' }}>{selected.orderNumber}</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Customer</div>
              {Object.entries(selected.customer || {}).map(([k, v]) => v ? (
                <div key={k} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}><span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{k}:</span> {String(v)}</div>
              ) : null)}
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Items</div>
              {(selected.items || []).map((it: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{it.name} × {it.qty}</span><strong>${(it.price * it.qty).toFixed(2)}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 800 }}><span>Total</span><span>${selected.total}</span></div>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Update Status</div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(selected.id, s)} style={{ padding: '4px 10px', borderRadius: 'var(--radius-md)', border: selected.status === s ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: selected.status === s ? 'var(--color-primary-bg)' : 'transparent', color: selected.status === s ? 'var(--color-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{s}</button>
              ))}
              <button onClick={() => setDeleteTarget(selected.id)} className="frappe-btn frappe-btn-secondary" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteOrder(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
