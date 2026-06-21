'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Package,
  Search,
  AlertCircle,
  ShieldAlert,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

interface StockLevelData {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  reorderPoint: number | null;
}

export default function StockLevelsPage() {
  const [stockLevels, setStockLevels] = useState<StockLevelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/inventory/stock-levels', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json?.data || []);
      
      interface StockPayload {
        id: string;
        product: { name: string; sku: string };
        warehouse: { name: string };
        quantity: string | number;
        reorderPoint: string | number | null;
      }
      
      const typedData = list as StockPayload[];
      setStockLevels(typedData.map((s) => ({
        id: s.id,
        productName: s.product.name,
        sku: s.product.sku,
        warehouseName: s.warehouse.name,
        quantity: Number(s.quantity),
        reorderPoint: s.reorderPoint !== null ? Number(s.reorderPoint) : null
      })));
    } catch {
      setError('Serving local mock fallback registry.');
      setStockLevels([
        {
          id: 'stock-1',
          productName: 'Refined Vibranium Alloy Ingot',
          sku: 'SKU-VIB-001',
          warehouseName: 'Schenectady Central Depot',
          quantity: 45,
          reorderPoint: 10
        },
        {
          id: 'stock-2',
          productName: 'Tactical Kevlar Micro-Weave',
          sku: 'SKU-KEV-404',
          warehouseName: 'Schenectady Central Depot',
          quantity: 8,
          reorderPoint: 15
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = stockLevels.filter(s =>
    s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.warehouseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLowStockCount = () => {
    return stockLevels.filter(s => s.reorderPoint !== null && s.quantity <= s.reorderPoint).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Warehouse Stock Levels"
        description="Monitor physical quantities on hand across all company storage depots and warehouses."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Levels' }]}
        actions={
          <Button variant="outline" onClick={() => window.location.href = '/inventory/stock-entries'} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ArrowRightLeft size={14} />
            Stock Adjustments
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Stock Levels Stats Summary */}
      <div className="frappe-grid-3">
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total SKU Stock Records</span>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
              <Layers size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {stockLevels.length}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Low Stock Alarms</span>
            <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', padding: '4px', borderRadius: '4px' }}>
              <ShieldAlert size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-danger-text)', margin: 'var(--space-2) 0 0' }}>
            {getLowStockCount()}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Units On Hand</span>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
              <Package size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {stockLevels.reduce((acc, curr) => acc + curr.quantity, 0)}
          </h4>
        </Card>
      </div>

      {/* Search Panel */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="frappe-input"
            placeholder="Search stock by SKU, product, or warehouse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 'var(--space-9)' }}
          />
        </div>
      </Card>

      {/* Stock Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <Layers size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
            <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>No Stock Records Found</h4>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No inventory entries match your filter rules.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>SKU</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse Depot</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Qty on Hand</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status Alert</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((s) => {
                const isLow = s.reorderPoint !== null && s.quantity <= s.reorderPoint;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{s.sku}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{s.productName}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{s.warehouseName}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: isLow ? 'var(--color-danger)' : 'inherit' }}>
                      {s.quantity}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      {isLow ? (
                        <Badge variant="danger">LOW STOCK (Reorder: {s.reorderPoint})</Badge>
                      ) : (
                        <Badge variant="success">IN STOCK</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
