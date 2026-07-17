'use client';
import styles from './operations.module.css';
import React, { useState } from 'react';
import {
  Card, StatusBadge, DataTable, type Column, KPICard,
} from '@unerp/ui';
import { MapPin, Truck, Package, Search, RefreshCw } from 'lucide-react';

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

export default function TrackingTab() {
  const [tracked] = useState(MOCK_TRACKED);
  const [search, setSearch] = useState('');

  const filtered = tracked.filter(t => !search || t.shipmentNumber.toLowerCase().includes(search.toLowerCase()) || t.trackingNumber.toLowerCase().includes(search.toLowerCase()));
  const inTransit = tracked.filter(t => t.status === 'IN_TRANSIT').length;

  const columns: Column<TrackedShipment>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.shipmentNumber}</div>
          <div className="ui-text-xs-tertiary">{row.carrierName} · {row.trackingNumber}</div>
        </div>
      ),
    },
    {
      key: 'location', header: 'Last Location',
      render: (row) => (
        <div className="ui-hstack-2">
          <MapPin size={14} className={styles.trackingIcon} />
          <span className="text-sm">{row.lastLocation}</span>
        </div>
      ),
    },
    {
      key: 'progress', header: 'Progress',
      render: (row) => (
        <div className="ui-hstack-2">
          <div className={styles.progressBarTrack}>
            <div className={row.progress >= 90 ? styles.progressBarFillSuccess : styles.progressBarFillDefault} style={{ width: `${row.progress}%` }} />
          </div>
          <span className={styles.progressText}>{row.progress}%</span>
        </div>
      ),
    },
    { key: 'eta', header: 'ETA', render: (row) => <span className="ui-text-xs-muted">{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
    { key: 'lastUpdate', header: 'Updated', render: (row) => <span className="ui-text-xs-tertiary">{timeAgo(row.lastUpdate)}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <button onClick={() => {}} className={styles.refreshButton}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="ui-grid-auto">
        <KPICard title="Active Tracking" value={tracked.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
        <KPICard title="In Transit" value={inTransit} icon={<Truck size={18} />} color="var(--color-warning)" />
        <KPICard title="Out for Delivery" value={tracked.filter(t => t.status === 'OUT_FOR_DELIVERY').length} icon={<Package size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.trackingSearchWrapper}>
          <Search size={16} className={styles.trackingSearchIcon} />
          <input type="text" placeholder="Search by shipment or tracking number..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.trackingSearchInput} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No active shipments to track" emptyMessage="Shipments with tracking numbers will appear here." emptyIcon={<MapPin size={48} />} />
      </Card>
    </div>
  );
}
