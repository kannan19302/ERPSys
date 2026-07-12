'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Button } from '@unerp/ui';
import { Search, Printer } from 'lucide-react';

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
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [labelLookupId, setLabelLookupId] = useState('');
  const [labelType, setLabelType] = useState<'product' | 'batch' | 'license-plate' | 'bin'>('product');
  const [label, setLabel] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const search = async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (productId) params.set('productId', productId);
      if (warehouseId) params.set('warehouseId', warehouseId);
      const res = await fetch(`/api/v1/inventory/movement-history?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
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
      const res = await fetch(`/api/v1/inventory/labels/${labelType}/${labelLookupId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setLabel(await res.json());
    } catch {
      setError('Serving local mock fallback registry.');
      setLabel({ type: labelType.toUpperCase(), barcodeValue: 'SKU-VIB-001' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Movement History & Barcode Labels"
        description="Consolidated per-product/per-warehouse movement timeline, plus barcode label lookups for SKU, batch, license-plate, and bin printing."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Movement History & Labels' }]}
      />

      {error && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          Note: {error}
        </div>
      )}

      <Card style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Movement History</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <input className="frappe-input" style={{ flex: 1 }} placeholder="Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} />
          <input className="frappe-input" style={{ flex: 1 }} placeholder="Warehouse ID" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
          <Button variant="primary" onClick={search} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Search size={14} /> Search
          </Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Product</th>
              <th style={{ padding: '8px' }}>Voucher</th>
              <th style={{ padding: '8px' }}>In</th>
              <th style={{ padding: '8px' }}>Out</th>
              <th style={{ padding: '8px' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '8px' }}>{new Date(m.timestamp).toLocaleString()}</td>
                <td style={{ padding: '8px' }}>{m.productName}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{m.voucherNumber}</td>
                <td style={{ padding: '8px' }}>{m.qtyIn}</td>
                <td style={{ padding: '8px' }}>{m.qtyOut}</td>
                <td style={{ padding: '8px' }}>{m.balanceQty}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No movements found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-3)' }}>Barcode Label Lookup</div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <select className="frappe-input" style={{ width: '160px' }} value={labelType} onChange={(e) => setLabelType(e.target.value as typeof labelType)}>
            <option value="product">Product</option>
            <option value="batch">Batch</option>
            <option value="license-plate">License Plate</option>
            <option value="bin">Bin</option>
          </select>
          <input className="frappe-input" style={{ flex: 1 }} placeholder="Record ID" value={labelLookupId} onChange={(e) => setLabelLookupId(e.target.value)} />
          <Button variant="primary" onClick={lookupLabel} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Printer size={14} /> Get Label
          </Button>
        </div>
        {label && (
          <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-lg)', padding: 'var(--space-4)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            {label.barcodeValue}
          </div>
        )}
      </Card>
    </div>
  );
}
