'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, Badge } from '@unerp/ui';
import {
  Search,
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Warehouse as WhIcon,
  Package as ProdIcon
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface StockLedgerEntry {
  id: string;
  createdAt: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  valuationRate: number;
  balanceQty: number;
  voucherType: string;
  voucherNumber: string;
  voucherId: string;
  batchNumber?: string | null;
  serialNumber?: string | null;
  product: { name: string; sku: string; unit: string };
  warehouse: { name: string; code: string };
}

export default function StockLedgerPage() {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  const loadFilterData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };
    try {
      const [pRes, wRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/warehouses', { headers })
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(Array.isArray(pData) ? pData : (pData?.data || []));
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWarehouses(Array.isArray(wData) ? wData : (wData?.data || []));
      }
    } catch (e) {
      console.error('Failed to load filters', e);
    }
  };

  const loadLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };
      
      let url = '/api/v1/inventory/stock-ledger?limit=100';
      if (selectedProductId) url += `&productId=${selectedProductId}`;
      if (selectedWarehouseId) url += `&warehouseId=${selectedWarehouseId}`;
      if (searchQuery) url += `&search=${searchQuery}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const entries = Array.isArray(data) ? data : (data?.data || []);
      
      setLedgerEntries(entries.map((entry: any) => ({
        ...entry,
        quantity: Number(entry.quantity),
        valuationRate: Number(entry.valuationRate),
        balanceQty: Number(entry.balanceQty)
      })));
    } catch {
      setError('Could not load data. Please try again.');
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadLedger();
  }, [selectedProductId, selectedWarehouseId, searchQuery]);

  const handleExportCSV = () => {
    if (ledgerEntries.length === 0) return;
    const headers = ['Date/Time', 'Product SKU', 'Product Name', 'Warehouse', 'Qty Change', 'Valuation Rate', 'Balance Qty', 'Voucher Number', 'Voucher Type', 'Batch No', 'Serial No'];
    const rows = ledgerEntries.map(entry => [
      new Date(entry.createdAt).toISOString(),
      entry.product?.sku || '',
      entry.product?.name || '',
      entry.warehouse?.name || '',
      entry.quantity,
      entry.valuationRate,
      entry.balanceQty,
      entry.voucherNumber || '',
      entry.voucherType || '',
      entry.batchNumber || '',
      entry.serialNumber || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Stock Ledger Audit"
        description="Immutable chronological record of all stock transactions, receipts, issues, and adjustments."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Ledger' }]}
        actions={
          <Button variant="secondary" onClick={handleExportCSV} disabled={ledgerEntries.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Download size={14} />
            Export CSV
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <Card padding="md" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          <Filter size={12} />
          Ledger Filter Criteria
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Product SKU</label>
            <select
              className="frappe-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Warehouse Location</label>
            <select
              className="frappe-input"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Voucher / Batch / Serial Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 'var(--space-2.5)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                className="frappe-input"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 'var(--space-8)' }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Stock Ledger Entries Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Date/Time</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product (SKU)</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Qty Adjustment</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Valuation Rate</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Running Balance</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Details</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Voucher Reference</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    {entry.product ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Link href={`/inventory/products/${entry.productId}`} style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)', textDecoration: 'none' }}>
                          {entry.product.name}
                        </Link>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{entry.product.sku}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-secondary)' }}>Unknown SKU</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                    {entry.warehouse?.name || 'Virtual Warehouse'}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: entry.quantity >= 0 ? 'var(--color-success)' : 'var(--color-danger-text)' }}>
                    {entry.quantity >= 0 ? `+${entry.quantity}` : entry.quantity} {entry.product?.unit}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    ${entry.valuationRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>
                    {entry.balanceQty} {entry.product?.unit}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {entry.batchNumber && (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Batch: <strong style={{ color: 'var(--color-text)' }}>{entry.batchNumber}</strong></span>
                      )}
                      {entry.serialNumber && (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Serial: <strong style={{ color: 'var(--color-text)' }}>{entry.serialNumber}</strong></span>
                      )}
                      {!entry.batchNumber && !entry.serialNumber && <span style={{ color: 'var(--color-text-tertiary)' }}>No Lot Tracking</span>}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-xs)' }}>{entry.voucherNumber}</span>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{entry.voucherType}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {ledgerEntries.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No ledger audit trials found matching active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
