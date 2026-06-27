'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Badge, StatusBadge, DataTable, type Column, KPICard, Spinner,
} from '@unerp/ui';
import { MapPin, Truck, Package, Clock, CheckCircle, Search, RefreshCw } from 'lucide-react';

interface TrackedShipment {
  id: string;
  shipmentNumber: string;
  carrierName: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string | null;
  lastLocation: string;
  lastUpdate: string;
  progress: number;
}

const MOCK_TRACKED: TrackedShipment[] = [
  { id: '1', shipmentNumber: 'SHP-2026-001', carrierName: 'FedEx', trackingNumber: '1Z999AA10123456784', status: 'IN_TRANSIT', estimatedDelivery: '2026-07-02', lastLocation: 'Memphis, TN Hub', lastUpdate: new Date(Date.now() - 3600000).toISOString(), progress: 65 },
  { id: '2', shipmentNumber: 'SHP-2026-002', carrierName: 'UPS', trackingNumber: '1Z999AA10987654321', status: 'OUT_FOR_DELIVERY', estimatedDelivery: '2026-06-27', lastLocation: 'Local Delivery Facility', lastUpdate: new Date(Date.now() - 1800000).toISOString(), progress: 90 },
  { id: '3', shipmentNumber: 'SHP-2026-003', carrierName: 'DHL', trackingNumber: 'JD014600003888912414', status: 'IN_TRANSIT', estimatedDelivery: '2026-07-05', lastLocation: 'Frankfurt, DE Gateway', lastUpdate: new Date(Date.now() - 7200000).toISOString(), progress: 40 },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function TrackingPage() {
  const [tracked] = useState(MOCK_TRACKED);
  const [search, setSearch] = useState('');

  const filtered = tracked.filter(t => !search || t.shipmentNumber.toLowerCase().includes(search.toLowerCase()) || t.trackingNumber.toLowerCase().includes(search.toLowerCase()));
  const inTransit = tracked.filter(t => t.status === 'IN_TRANSIT').length;

  const columns: Column<TrackedShipment>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.shipmentNumber}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.carrierName} · {row.trackingNumber}</div>
        </div>
      ),
    },
    {
      key: 'location', header: 'Last Location',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MapPin size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)' }}>{row.lastLocation}</span>
        </div>
      ),
    },
    {
      key: 'progress', header: 'Progress',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ flex: 1, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-sunken)', overflow: 'hidden', maxWidth: 100 }}>
            <div style={{ height: '100%', width: `${row.progress}%`, background: row.progress >= 90 ? 'var(--color-success)' : 'var(--color-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', minWidth: 32 }}>{row.progress}%</span>
        </div>
      ),
    },
    { key: 'eta', header: 'ETA', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
    { key: 'lastUpdate', header: 'Updated', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{timeAgo(row.lastUpdate)}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Shipment Tracking" description="Real-time tracking of all active shipments"
        breadcrumbs={[{ label: 'Supply Chain', href: '/supply-chain' }, { label: 'Tracking' }]}
        actions={<button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}><RefreshCw size={14} /> Refresh</button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Active Tracking" value={tracked.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
        <KPICard title="In Transit" value={inTransit} icon={<Truck size={18} />} color="var(--color-warning)" />
        <KPICard title="Out for Delivery" value={tracked.filter(t => t.status === 'OUT_FOR_DELIVERY').length} icon={<Package size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search by shipment or tracking number..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No active shipments to track" emptyMessage="Shipments with tracking numbers will appear here." emptyIcon={<MapPin size={48} />} />
      </Card>
    </div>
  );
}
