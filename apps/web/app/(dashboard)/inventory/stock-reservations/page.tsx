'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Badge, StatCardRow, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Plus, AlertCircle, BarChart3 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Reservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number | string;
  sourceType: string;
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED';
  product?: { name: string; sku: string };
  warehouse?: { name: string };
}

interface AbcResult {
  counts: { A: number; B: number; C: number };
  totalValue: number;
}

interface DeadStockResult {
  deadStockItems: Array<{ productName: string; sku: string; quantity: number; value: number }>;
  totalDeadValue: number;
}

const makeColumns = (
  handleFulfill: (id: string) => void,
  handleRelease: (id: string) => void,
): ListColumn[] => [
  {
    key: 'product',
    header: 'Product',
    render: (v, row) => {
      const r = row as unknown as Reservation;
      return r.product?.name || r.productId;
    },
  },
  {
    key: 'warehouse',
    header: 'Warehouse',
    render: (v, row) => {
      const r = row as unknown as Reservation;
      return r.warehouse?.name || r.warehouseId;
    },
  },
  { key: 'quantity', header: 'Quantity' },
  { key: 'sourceType', header: 'Source' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <Badge variant={v === 'ACTIVE' ? 'warning' : v === 'FULFILLED' ? 'success' : 'default'}>{String(v)}</Badge>
    ),
  },
  {
    key: 'id',
    header: '',
    render: (v, row) => {
      const r = row as unknown as Reservation;
      return r.status === 'ACTIVE' ? (
        <div className={styles.s1}>
          <button onClick={() => handleFulfill(String(v))} className={`ui-btn ui-btn-primary ${styles.s2}`} >Fulfill</button>
          <button onClick={() => handleRelease(String(v))} className={`ui-btn ui-btn-primary ${styles.s3}`} >Release</button>
        </div>
      ) : null;
    },
  },
];

export default function StockReservationsPage() {
  const client = useApiClient();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [abc, setAbc] = useState<AbcResult | null>(null);
  const [deadStock, setDeadStock] = useState<DeadStockResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reservationData, abcData, deadStockData] = await Promise.all([
        client.get<Reservation[] | { data?: Reservation[] }>('/inventory/stock-reservations?status=ACTIVE'),
        client.get<AbcResult>('/inventory/analytics/abc-classification'),
        client.get<DeadStockResult>('/inventory/analytics/dead-stock'),
      ]);
      setReservations(Array.isArray(reservationData) ? reservationData : reservationData.data || []);
      setAbc(abcData);
      setDeadStock(deadStockData);
    } catch {
      setError('Could not load reservation data. Please try again.');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/inventory/stock-reservations', { productId, warehouseId, quantity, sourceType: 'MANUAL' });
      setIsCreateModalOpen(false);
      loadData();
    } catch {
      setError('Could not create reservation.');
      setIsCreateModalOpen(false);
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await client.post(`/inventory/stock-reservations/${id}/release`);
      loadData();
    } catch {
      setError('Could not release reservation.');
    }
  };

  const handleFulfill = async (id: string) => {
    try {
      await client.post(`/inventory/stock-reservations/${id}/fulfill`);
      loadData();
    } catch {
      setError('Could not fulfill reservation.');
    }
  };

  const columns = makeColumns(handleFulfill, handleRelease);

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Stock Reservations & Inventory Analytics"
        description="Allocation reservations against sales orders/transfers, plus ABC classification and dead-stock analytics."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Reservations & Analytics' }]}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="ui-hstack-2">
            <Plus size={14} />
            New Reservation
          </Button>
        }
      />

      {error && (
        <div className={styles.s4}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      <StatCardRow stats={[
        ...(abc ? [
          { label: 'ABC: A Items', value: abc.counts.A, icon: <BarChart3 size={16} />, color: 'success' as const },
          { label: 'ABC: B Items', value: abc.counts.B, icon: <BarChart3 size={16} />, color: 'info' as const },
          { label: 'ABC: C Items', value: abc.counts.C, icon: <BarChart3 size={16} />, color: 'default' as const },
        ] : []),
        ...(deadStock ? [
          { label: 'Dead Stock Value (90d)', value: `$${deadStock.totalDeadValue.toLocaleString()}`, color: 'warning' as const },
        ] : []),
      ]} />

      <ListPageTemplate
        columns={columns}
        data={reservations as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
      />

      {isCreateModalOpen && (
        <div className={styles.s5}>
          <div className={`ui-card modal-card ${styles.s6}`} >
            <div className={styles.s7}>
              <span className="ui-heading-base">New Stock Reservation</span>
              <button onClick={() => setIsCreateModalOpen(false)} className="ui-btn-icon ui-text-muted">Close</button>
            </div>
            <div className="ui-card-body p-5">
              <form onSubmit={handleCreate} className="ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label">Product ID *</label>
                  <input type="text" className="ui-input" value={productId} onChange={(e) => setProductId(e.target.value)} required />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Warehouse ID *</label>
                  <input type="text" className="ui-input" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Quantity *</label>
                  <input type="number" className="ui-input" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required min={1} />
                </div>
                <div className={styles.s8}>
                  <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" type="submit">Create reservation</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
