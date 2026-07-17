'use client';
import styles from './operations.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, StatusBadge, DataTable, type Column, KPICard, Spinner, Badge,
} from '@unerp/ui';
import { useApiClient, RouteGuard } from '@unerp/framework';
import { MapPin, Truck, Package, Search, RefreshCw } from 'lucide-react';

interface InboundShipment {
  id: string;
  shipmentNumber: string;
  warehouseId: string;
  trackingNumber: string | null;
  status: string;
  expectedArrival: string | null;
  arrivedAt: string | null;
  carrier?: { name: string } | null;
}

interface OutboundShipment {
  id: string;
  shipmentNumber: string;
  warehouseId: string;
  trackingNumber: string | null;
  status: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  carrier?: { name: string } | null;
}

interface DisplayTracking {
  id: string;
  shipmentNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  carrierName: string;
  trackingNumber: string;
  status: string;
  eta: string | null;
  progress: number;
}

export default function TrackingTab() {
  const client = useApiClient();
  const [tracked, setTracked] = useState<DisplayTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inboundRes, outboundRes] = await Promise.all([
        client.get<InboundShipment[] | { data?: InboundShipment[] }>('/supply-chain/inbound-shipments'),
        client.get<OutboundShipment[] | { data?: OutboundShipment[] }>('/supply-chain/outbound-shipments'),
      ]);

      const inbound = Array.isArray(inboundRes) ? inboundRes : inboundRes.data || [];
      const outbound = Array.isArray(outboundRes) ? outboundRes : outboundRes.data || [];

      const displayList: DisplayTracking[] = [
        ...inbound.map(item => {
          let progress = 20;
          if (item.status === 'IN_TRANSIT') progress = 60;
          if (item.status === 'ARRIVED') progress = 85;
          if (item.status === 'COMPLETE') progress = 100;
          if (item.status === 'EXCEPTION') progress = 70;

          return {
            id: item.id,
            shipmentNumber: item.shipmentNumber,
            direction: 'INBOUND' as const,
            carrierName: item.carrier?.name || 'Manual Inbound',
            trackingNumber: item.trackingNumber || '—',
            status: item.status,
            eta: item.expectedArrival,
            progress,
          };
        }),
        ...outbound.map(item => {
          let progress = 15;
          if (item.status === 'PACKED') progress = 30;
          if (item.status === 'SHIPPED') progress = 50;
          if (item.status === 'IN_TRANSIT') progress = 75;
          if (item.status === 'DELIVERED') progress = 100;
          if (item.status === 'EXCEPTION') progress = 60;

          return {
            id: item.id,
            shipmentNumber: item.shipmentNumber,
            direction: 'OUTBOUND' as const,
            carrierName: item.carrier?.name || 'Manual Outbound',
            trackingNumber: item.trackingNumber || '—',
            status: item.status,
            eta: item.estimatedDelivery,
            progress,
          };
        }),
      ];

      setTracked(displayList);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const filtered = tracked.filter(t =>
    t.shipmentNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.trackingNumber.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<DisplayTracking>[] = [
    {
      key: 'shipment', header: 'Shipment',
      render: (row) => (
        <div>
          <div className="ui-heading-sm">{row.shipmentNumber}</div>
          <div className="ui-text-xs-tertiary">
            <Badge variant={row.direction === 'INBOUND' ? 'success' : 'info'} className="mr-1">{row.direction}</Badge>
            {row.carrierName} · {row.trackingNumber}
          </div>
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
    {
      key: 'eta', header: 'ETA / Arrival',
      render: (row) => (
        <span className="ui-text-xs-muted">
          {row.eta ? new Date(row.eta).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) {
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="supply-chain.shipment.read">
      <div className="ui-stack-6">
        <div className="ui-flex-end">
          <button onClick={fetchData} className={styles.refreshButton}><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="ui-grid-auto">
          <KPICard title="Active Tracking" value={tracked.length} icon={<MapPin size={18} />} color="var(--color-primary)" />
          <KPICard title="In Transit / Shipped" value={tracked.filter(t => t.status === 'IN_TRANSIT' || t.status === 'SHIPPED').length} icon={<Truck size={18} />} color="var(--color-warning)" />
          <KPICard title="Delivered / Completed" value={tracked.filter(t => t.status === 'DELIVERED' || t.status === 'COMPLETE').length} icon={<Package size={18} />} color="var(--color-success)" />
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
            emptyTitle="No active shipments to track" emptyMessage="Inbound and outbound shipments with tracking details will appear here." emptyIcon={<MapPin size={48} />} />
        </Card>
      </div>
    </RouteGuard>
  );
}
