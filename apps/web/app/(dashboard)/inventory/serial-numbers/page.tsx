'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface SerialNumber {
  id: string;
  serialNumber: string;
  status: string;
  product?: {
    name: string;
  };
}

export default function SerialNumbersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [serialInput, setSerialInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, wRes, snRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/warehouses', { headers }),
        fetch('/api/v1/inventory/serial-numbers', { headers })
      ]);

      if (pRes.ok) {
        const prods = await pRes.json();
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      }
      if (wRes.ok) {
        const whs = await wRes.json();
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWarehouse(whs[0].id);
      }
      if (snRes.ok) setSerialNumbers(await snRes.json());
    } catch {
      setError('Serving local mock fallback registry.');
      setProducts([
        { id: 'prod-1', name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
        { id: 'prod-2', name: 'Tactical Kevlar Micro-Weave', sku: 'SKU-KEV-404' }
      ]);
      setWarehouses([
        { id: 'wh-1', name: 'Schenectady Central Depot', code: 'WH-NY-01' },
        { id: 'wh-2', name: 'Silicon Valley Logistics Hub', code: 'WH-CA-02' }
      ]);
      setSerialNumbers([
        {
          id: 'sn-1',
          serialNumber: 'SN-998811-A',
          status: 'AVAILABLE',
          product: { name: 'Refined Vibranium Alloy Ingot' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/serial-numbers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          warehouseId: selectedWarehouse,
          serialNumber: serialInput
        })
      });
      if (!res.ok) throw new Error();
      setSerialInput('');
      loadData();
    } catch {
      // Mock local update
      const selectedProdObj = products.find(p => p.id === selectedProduct);
      const newMock: SerialNumber = {
        id: `sn-mock-${Date.now()}`,
        serialNumber: serialInput,
        status: 'AVAILABLE',
        product: { name: selectedProdObj?.name || 'Vibranium Ingot' }
      };
      setSerialNumbers(prev => [newMock, ...prev]);
      setSerialInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Serial Numbers"
        description="Register and trace individual serialized assets to manage precise product lifecycles."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Serial Numbers' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          
          {/* Serial Numbers List Card */}
          <Card padding="none" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Serial Number</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product Name</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {serialNumbers.map(sn => (
                  <tr key={sn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)', fontFamily: 'monospace' }}>{sn.serialNumber}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{sn.product?.name}</td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <Badge variant={sn.status === 'AVAILABLE' ? 'success' : 'info'}>{sn.status}</Badge>
                    </td>
                  </tr>
                ))}
                {serialNumbers.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No unique serial numbers cataloged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Registration Form Card */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Register Serial Number</h4>
            </div>
            <form onSubmit={handleRegisterSerial} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product SKU</label>
                <select
                  className="frappe-input"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warehouse</label>
                <select
                  className="frappe-input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Serial Number String</label>
                <input
                  type="text"
                  className="frappe-input"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="e.g. SN-998811-A"
                  style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                  required
                />
              </div>
              <button type="submit" className="frappe-btn frappe-btn-primary" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)' }}>
                Register Serial
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
