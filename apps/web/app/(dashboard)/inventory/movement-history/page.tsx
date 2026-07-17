'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { Card, PageHeader, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { Search, Printer } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Movement {
  type: string;
  timestamp: string;
  productName: string;
  warehouseId: string;
  voucherType: string;
  voucherNumber: string;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
}

export default function MovementHistoryPage() {
  const client = useApiClient();
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [labelLookupId, setLabelLookupId] = useState('');
  const [labelType, setLabelType] = useState<'product' | 'batch' | 'license-plate' | 'bin'>('product');
  const [label, setLabel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (productId) params.set('productId', productId);
      if (warehouseId) params.set('warehouseId', warehouseId);
      const data = await client.get<{ movements?: Movement[] }>(`/inventory/movement-history?${params.toString()}`);
      setMovements(data.movements || []);
    } catch {
      setError('Serving local mock fallback registry.');
      setMovements([
        { type: 'LEDGER', timestamp: new Date().toISOString(), productName: 'Refined Vibranium Alloy Ingot', warehouseId: 'wh-1', voucherType: 'STOCK_ENTRY', voucherNumber: 'STE-2026-00042', qtyIn: 50, qtyOut: 0, balanceQty: 150 },
      ]);
    }
  };

  const lookupLabel = async () => {
    setError(null);
    try {
      setLabel(await client.get(`/inventory/labels/${labelType}/${labelLookupId}`));
    } catch {
      setError('Serving local mock fallback registry.');
      setLabel({ type: labelType.toUpperCase(), barcodeValue: 'SKU-VIB-001' });
    }
  };

  return (
    <RouteGuard permission="inventory.movement-history.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Movement History & Barcode Labels"
        description="Consolidated per-product/per-warehouse movement timeline, plus barcode label lookups for SKU, batch, license-plate, and bin printing."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Movement History & Labels' }]}
      />

      {error && (
        <div className={styles.s1}>
          Note: {error}
        </div>
      )}

      <Card className="p-5">
        <div className={styles.s2}>Movement History</div>
        <div className={styles.s3}>
          <input className="ui-input flex-1" placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
          <input className="ui-input flex-1" placeholder="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
          <Button variant="primary" onClick={search} className="ui-hstack-2">
            <Search size={14} /> Search
          </Button>
        </div>
        <ListPageTemplate
          columns={[
            { key: 'timestamp', header: 'Date', render: (v) => new Date(String(v)).toLocaleString() },
            { key: 'productName', header: 'Product' },
            { key: 'voucherNumber', header: 'Voucher', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'qtyIn', header: 'In' },
            { key: 'qtyOut', header: 'Out' },
            { key: 'balanceQty', header: 'Balance' },
          ] as ListColumn[]}
          data={movements as unknown as Record<string, unknown>[]}
          loading={false}
          emptyTitle="No movements found"
          emptyDescription="Search for movements using the filters above."
        />
      </Card>

      <Card className="p-5">
        <div className={styles.s2}>Barcode Label Lookup</div>
        <div className={styles.s3}>
          <select className={`ui-input ${styles.s4}`}  value={labelType} onChange={(e) => setLabelType(e.target.value as typeof labelType)}>
            <option value="product">Product</option>
            <option value="batch">Batch</option>
            <option value="license-plate">License Plate</option>
            <option value="bin">Bin</option>
          </select>
          <input className="ui-input flex-1" placeholder="Record ID" value={labelLookupId} onChange={(e) => setLabelLookupId(e.target.value)} />
          <Button variant="primary" onClick={lookupLabel} className="ui-hstack-2">
            <Printer size={14} /> Get Label
          </Button>
        </div>
        {label && (
          <div className={styles.s5}>
            {label.barcodeValue}
          </div>
        )}
      </Card>
    </div>
    </RouteGuard>
  );
}
