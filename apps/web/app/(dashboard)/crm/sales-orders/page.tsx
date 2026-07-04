'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, StatusBadge, DataTable, type Column, type SortOrder,
  KPICard, Badge, Modal,
} from '@unerp/ui';
import {
  ClipboardList, Search, DollarSign, Truck, CheckCircle, Clock, Plus,
  Download, Eye, Package,
} from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  customerName: string;
  orderDate: string;
  deliveryDate?: string;
  items?: number;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const FALLBACK: SalesOrder[] = [
  { id: 'so1', orderNumber: 'SO-2026-001', status: 'CONFIRMED', totalAmount: 45000, customerName: 'Stark Industries', orderDate: '2026-06-01', items: 3 },
  { id: 'so2', orderNumber: 'SO-2026-002', status: 'DELIVERED', totalAmount: 85000, customerName: 'Wayne Enterprises', orderDate: '2026-05-15', deliveryDate: '2026-06-10', items: 5 },
  { id: 'so3', orderNumber: 'SO-2026-003', status: 'DRAFT', totalAmount: 120000, customerName: 'Stark Industries', orderDate: '2026-06-10', items: 8 },
  { id: 'so4', orderNumber: 'SO-2026-004', status: 'SHIPPED', totalAmount: 32500, customerName: 'Daily Planet', orderDate: '2026-06-15', items: 2 },
];

export default function CrmSalesOrdersPage() {
  const [allOrders, setAllOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<SalesOrder | null>(null);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // NOTE: GET /sales/orders does not support server-side pagination/sorting yet
  // (only `channel`/`status` filters) — see apps/api/src/modules/sales/sales.controller.ts.
  // We fetch the full list once per status filter and sort/paginate client-side below.
  // Backend follow-up: add page/limit/sortBy/sortOrder/search support to getSalesOrders.
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await fetch(`/api/v1/sales/orders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (res.ok) {
        const d = await res.json();
        const list: SalesOrder[] = Array.isArray(d) ? d : (d?.data || []);
        setAllOrders(list);
      } else {
        setAllOrders(FALLBACK);
      }
    } catch {
      setAllOrders(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Client-side search + sort + pagination (backend does not support these params yet)
  const filteredOrders = allOrders.filter((o) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
  });
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'totalAmount') cmp = Number(a.totalAmount) - Number(b.totalAmount);
    else if (sortBy === 'orderNumber') cmp = a.orderNumber.localeCompare(b.orderNumber);
    else if (sortBy === 'orderDate' || sortBy === 'createdAt') cmp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
    return sortOrder === 'desc' ? -cmp : cmp;
  });
  const totalCount = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const data = sortedOrders.slice((page - 1) * limit, page * limit);

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const approveCredit = async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`/api/v1/sales/orders/${id}/approve-credit`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setDetailOpen(false);
        setSelected(null);
        fetchOrders();
      } else {
        alert('Failed to approve credit hold');
      }
    } catch {
      alert('Failed to approve credit hold');
    }
  };

  const recordPayment = async (id: string, amount: number) => {
    const token = getToken();
    try {
      const res = await fetch(`/api/v1/sales/orders/${id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ amount, method: 'CASH' })
      });
      if (res.ok) {
        setDetailOpen(false);
        setSelected(null);
        fetchOrders();
      } else {
        alert('Failed to record payment');
      }
    } catch {
      alert('Failed to record payment');
    }
  };

  const [convertingPO, setConvertingPO] = useState(false);

  const convertToPurchaseOrder = async (id: string) => {
    setConvertingPO(true);
    const token = getToken();
    try {
      const res = await fetch(`/api/v1/sales/orders/${id}/purchase-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        alert('Purchase Order draft(s) created successfully!');
        setDetailOpen(false);
        setSelected(null);
        fetchOrders();
      } else {
        const errorData = await res.json();
        alert(errorData?.message || 'Failed to convert to purchase order');
      }
    } catch {
      alert('Failed to convert to purchase order');
    } finally {
      setConvertingPO(false);
    }
  };

  const totalValue = sortedOrders.reduce((a, o) => a + Number(o.totalAmount), 0);
  const confirmedCount = sortedOrders.filter(o => o.status === 'CONFIRMED').length;
  const deliveredCount = sortedOrders.filter(o => o.status === 'DELIVERED').length;

  const columns: Column<SalesOrder>[] = [
    {
      key: 'order', header: 'Order',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardList size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.orderNumber}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.customerName}</div>
          </div>
        </div>
      ),
    },
    { key: 'items', header: 'Items', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.items || '—'}</span> },
    { key: 'totalAmount', header: 'Amount', align: 'right' as const, sortable: true, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.totalAmount)}</span> },
    { key: 'orderDate', header: 'Order Date', sortable: true, render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(row.orderDate).toLocaleDateString()}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '60px',
      render: (row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Eye size={14} /></button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Sales Orders"
        description="Track customer orders from confirmation through delivery"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Sales Orders' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => {}}><Download size={14} style={{ marginRight: 6 }} /> Export</Button>
            <Button variant="primary" onClick={() => {}}><Plus size={14} style={{ marginRight: 6 }} /> New Order</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Orders" value={totalCount} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
        <KPICard title="Order Value" value={fmtCurrency(totalValue)} icon={<DollarSign size={18} />} color="var(--color-success)" />
        <KPICard title="Confirmed" value={confirmedCount} icon={<CheckCircle size={18} />} color="var(--color-info)" />
        <KPICard title="Delivered" value={deliveredCount} icon={<Truck size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => {
            const parts = e.target.value.split(':');
            if (parts[0] && parts[1]) {
              setSortBy(parts[0]);
              setSortOrder(parts[1] as 'asc' | 'desc');
            }
          }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="createdAt:desc">Newest First</option>
            <option value="totalAmount:desc">Amount (Highest)</option>
            <option value="orderNumber:asc">Order No. (A-Z)</option>
          </select>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'DRAFT', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                border: '1px solid', borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
                background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)',
                color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.id}
          onRowClick={(r) => { setSelected(r); setDetailOpen(true); }}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange}
          emptyTitle="No sales orders" emptyMessage="Create your first sales order." emptyIcon={<ClipboardList size={48} />} />
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} title={selected?.orderNumber || 'Order'} size="sm"
        footer={
          selected ? <>
            {selected.status === 'CONFIRMED' && (
              <Button variant="primary" onClick={() => convertToPurchaseOrder(selected.id)} disabled={convertingPO}>
                {convertingPO ? 'Converting...' : 'Generate Purchase Order'}
              </Button>
            )}
            {selected.status === 'CREDIT_HOLD' && (
              <Button variant="primary" onClick={() => approveCredit(selected.id)}>Approve Credit Hold</Button>
            )}
            {selected.paymentStatus !== 'PAID' && (
              <Button variant="primary" onClick={() => recordPayment(selected.id, selected.totalAmount)}>Record Payment</Button>
            )}
            <Button variant="secondary" onClick={() => { setDetailOpen(false); setSelected(null); }}>Close</Button>
          </> : undefined
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Customer</div><div style={{ fontWeight: 'var(--weight-semibold)' }}>{selected.customerName}</div></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Status</div><StatusBadge status={selected.status} /></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Order Date</div><div>{new Date(selected.orderDate).toLocaleDateString()}</div></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Items</div><div>{selected.items || '—'}</div></div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{fmtCurrency(selected.totalAmount)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
