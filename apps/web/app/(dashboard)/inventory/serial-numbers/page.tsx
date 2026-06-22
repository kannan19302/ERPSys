'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  AlertCircle,
  QrCode,
  Calendar,
  Layers,
  MapPin,
  ClipboardList
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
  serialNo: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'IN_REPAIR' | 'SCRAPPED' | 'RETURNED';
  warrantyExpiry?: string;
  product?: {
    name: string;
    sku: string;
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
  const [warrantyDate, setWarrantyDate] = useState('');
  const [notes, setNotes] = useState('');

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
        const prods = await pRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      }
      if (wRes.ok) {
        const whs = await wRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setWarehouses(whs);
        if (whs.length > 0) setSelectedWarehouse(whs[0].id);
      }
      if (snRes.ok) {
        const snList = await snRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setSerialNumbers(snList);
      }
    } catch {
      setError('Could not load data. Please try again.');
      setProducts([]);
      setWarehouses([]);
      setSerialNumbers([]);
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
          warehouseId: selectedWarehouse || undefined,
          serialNo: serialInput,
          warrantyExpiry: warrantyDate || undefined,
          notes: notes || undefined
        })
      });
      if (!res.ok) throw new Error();
      setSerialInput('');
      setWarrantyDate('');
      setNotes('');
      loadData();
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError('Action could not be completed. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Serialized Asset Registry"
        description="Register and trace individual serialized assets to manage precise product lifecycles."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Serial Numbers' }]}
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
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
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Warranty Expiration</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {serialNumbers.map(sn => (
                  <tr key={sn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)', fontFamily: 'monospace' }}>
                      {sn.serialNo}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)' }}>{sn.product?.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{sn.product?.sku}</span>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                      {sn.warrantyExpiry ? new Date(sn.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <Badge variant={sn.status === 'AVAILABLE' ? 'success' : sn.status === 'SOLD' ? 'info' : 'warning'}>
                        {sn.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {serialNumbers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
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
              <div className="frappe-form-group">
                <label className="frappe-label">Product SKU *</label>
                <select
                  className="frappe-input"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Warehouse Depot</label>
                <select
                  className="frappe-input"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Serial Number String *</label>
                <input
                  type="text"
                  className="frappe-input"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  placeholder="e.g. SN-998811-A"
                  required
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Warranty Expiry Date</label>
                <input
                  type="date"
                  className="frappe-input"
                  value={warrantyDate}
                  onChange={(e) => setWarrantyDate(e.target.value)}
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Notes</label>
                <textarea
                  className="frappe-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Asset specifications or repair details..."
                  style={{ minHeight: '60px' }}
                />
              </div>
              <button type="submit" className="frappe-btn frappe-btn-primary">
                Register Serial Number
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
