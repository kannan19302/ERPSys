'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner } from '@unerp/ui';
import {
  Search,
  AlertCircle
} from 'lucide-react';

interface StockLedgerEntry {
  id: string;
  product: { name: string; sku: string };
  warehouse: { name: string };
  quantity: number;
  valuationRate: number;
  voucherType: string;
  voucherId: string;
  batchNumber?: string;
  serialNumber?: string;
  createdAt: string;
}

export default function StockLedgerPage() {
  const [ledgerEntries, setLedgerEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/v1/inventory/stock-ledger', { headers });
      if (!res.ok) throw new Error();
      (async () => { const _d = await res.json(); setLedgerEntries(Array.isArray(_d) ? _d : (_d?.data || [])); })();
    } catch {
      setError('Serving local mock fallback registry.');
      setLedgerEntries([
        {
          id: 'sl-1',
          product: { name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
          warehouse: { name: 'Schenectady Central Depot' },
          quantity: 45,
          valuationRate: 8500,
          voucherType: 'MATERIAL_RECEIPT',
          voucherId: 'ste-1',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sl-2',
          product: { name: 'Tactical Kevlar Micro-Weave', sku: 'SKU-KEV-404' },
          warehouse: { name: 'Schenectady Central Depot' },
          quantity: -2,
          valuationRate: 450,
          voucherType: 'MATERIAL_ISSUE',
          voucherId: 'ste-2',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = ledgerEntries.filter(entry =>
    entry.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.voucherType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Stock Ledger"
        description="Trace continuous inventory audit trails, stock adjustments, and goods receipts."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Ledger' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* Search Filter Panel */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="frappe-input"
            placeholder="Search ledger by SKU, product, warehouse or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 'var(--space-9)' }}
          />
        </div>
      </Card>

      {/* Stock Ledger Audit Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Date</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Item Name</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Qty Changed</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Valuation Rate</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Voucher Ref</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(entry => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{entry.product.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{entry.product.sku}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{entry.warehouse.name}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)', color: entry.quantity >= 0 ? 'var(--color-success)' : 'var(--color-danger-text)' }}>
                    {entry.quantity >= 0 ? `+${entry.quantity}` : entry.quantity}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>${Number(entry.valuationRate).toFixed(2)}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{entry.voucherType} ({entry.voucherId.slice(0, 8)})</td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No ledger entries matching your search.
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
