'use client';
import styles from './operations.module.css';
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Badge, StatusBadge, DataTable, type Column, Drawer,
} from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Package, Search } from 'lucide-react';

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

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ShipmentsTab() {
  const client = useApiClient();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter] = useState('ALL');
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<Shipment[] | { data?: Shipment[] }>('/supply-chain/shipments');
        setShipments(Array.isArray(d) ? d : d.data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

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
        <div className="ui-hstack-3">
          <div className={row.type === 'OUTBOUND' ? styles.iconWellOutbound : styles.iconWellInbound}>
            <Package size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.shipmentNumber}</div>
            <div className="ui-text-xs-tertiary">{row.carrierName || 'No carrier assigned'}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <Badge variant={row.type === 'OUTBOUND' ? 'info' : row.type === 'INBOUND' ? 'success' : 'warning'}>{row.type}</Badge> },
    { key: 'tracking', header: 'Tracking', render: (row) => row.trackingNumber ? <code className={styles.trackingCode}>{row.trackingNumber}</code> : <span className={styles.trackingFallback}>—</span> },
    { key: 'weight', header: 'Weight', render: (row) => <span className="ui-text-sm-muted">{row.weight ? `${row.weight} ${row.weightUnit || 'kg'}` : '—'}</span> },
    { key: 'cost', header: 'Cost', align: 'right' as const, render: (row) => <span className="font-semibold">{fmtCurrency(row.shippingCost)}</span> },
    { key: 'eta', header: 'ETA', render: (row) => <span className="ui-text-xs-muted">{row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <RouteGuard permission="supply-chain.shipments.read">
    <div className="ui-stack-6">
      <Card>
        <div className={styles.filterBar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search by number or carrier..." value={search} onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput} />
          </div>
          <div className="ui-flex ui-gap-2">
            {['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={statusFilter === s ? styles.filterButtonActive : styles.filterButton}>
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
          <div className="ui-stack-4">
            <div className="ui-flex-between">
              <h3 className={styles.modalTitle}>{selected.shipmentNumber}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <DetailField label="Type" value={selected.type} />
              <DetailField label="Carrier" value={selected.carrierName || '—'} />
              <DetailField label="Tracking" value={selected.trackingNumber || '—'} />
              <DetailField label="Weight" value={selected.weight ? `${selected.weight} ${selected.weightUnit || 'kg'}` : '—'} />
              <DetailField label="Shipping Cost" value={fmtCurrency(selected.shippingCost)} />
              <DetailField label="Currency" value={selected.currency} />
              <DetailField label="ETA" value={selected.estimatedDelivery ? new Date(selected.estimatedDelivery).toLocaleDateString() : '—'} />
              <DetailField label="Delivered" value={selected.actualDelivery ? new Date(selected.actualDelivery).toLocaleDateString() : '—'} />
            </div>
            {selected.notes && <div><div className={styles.notesLabel}>Notes</div><div className="text-sm">{selected.notes}</div></div>}
          </div>
        )}
      </Drawer>
    </div>
    </RouteGuard>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={styles.fieldLabel}>{label}</div>
      <div className="ui-heading-sm">{value}</div>
    </div>
  );
}
