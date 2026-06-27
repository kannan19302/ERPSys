'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, Pagination, Drawer,
} from '@unerp/ui';
import { Package, Plus, Search, Truck, MapPin, Calendar, Eye, Edit2 } from 'lucide-react';

interface Shipment {
  id: string;
  shipmentNumber: string;
  type: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  weight: number | null;
  weightUnit: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  originAddress: any;
  destAddress: any;
  notes: string | null;
  createdAt: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ShipmentsListPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/supply-chain/shipments', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setShipments(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = shipments.filter(s => {
    const matchSearch = !search || s.shipmentNumber.toLowerCase().includes(search.toLowerCase()) || (s.carrierName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchType = typeFilter === 'ALL' || s.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const columns: Column<Shipment>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: row.type === 'OUTBOUND' ? 'var(--color-primary-light)' : 'var(--color-success-light)', color: row.type === 'OUTBOUND' ? 'var(--color-primary)' : 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.shipmentNumber}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.carrierName || 'No carrier assigned'}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'OUTBOUND' ? 'info' : row.type === 'INBOUND' ? 'success' : 'warning'}>{row.type}</Badge> },
    { key: 'tracking', header: 'Tracking', render: (row) => row.trackingNumber ? <code style={{ fontSize: '11px' }}>{row.trackingNumber}</code> : <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>—</span> },
    { key: 'weight', header: 'Weight', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.weight ? `${row.weight} ${row.weightUnit || 'kg'}` : '—'}</span> },
    { key: 'cost', header: 'Cost', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.shippingCost)}</span> },
    { key: 'eta', header: 'ETA', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Shipments" description="View and manage all shipments across your supply chain"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Shipments' }]} />

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search by number or carrier..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', border: '1px solid', borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)', background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={r => r.id}
          onRowClick={r => { setSelected(r); setDrawerOpen(true); }}
          emptyTitle="No shipments found" emptyMessage="Create a shipment from the dashboard." emptyIcon={<Package size={48} />} />
      </Card>

      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelected(null); }} title="Shipment Details"
        footer={<Button variant="secondary" onClick={() => setDrawerOpen(false)}>Close</Button>}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{selected.shipmentNumber}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <DetailField label="Type" value={selected.type} />
              <DetailField label="Carrier" value={selected.carrierName || '—'} />
              <DetailField label="Tracking" value={selected.trackingNumber || '—'} />
              <DetailField label="Weight" value={selected.weight ? `${selected.weight} ${selected.weightUnit || 'kg'}` : '—'} />
              <DetailField label="Shipping Cost" value={fmtCurrency(selected.shippingCost)} />
              <DetailField label="Currency" value={selected.currency} />
              <DetailField label="ETA" value={selected.estimatedDelivery ? new Date(selected.estimatedDelivery).toLocaleDateString() : '—'} />
              <DetailField label="Delivered" value={selected.actualDelivery ? new Date(selected.actualDelivery).toLocaleDateString() : '—'} />
            </div>
            {selected.notes && <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Notes</div><div style={{ fontSize: 'var(--text-sm)' }}>{selected.notes}</div></div>}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>{value}</div>
    </div>
  );
}
