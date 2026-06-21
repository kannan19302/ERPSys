'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Badge } from '@unerp/ui';
import {
  AlertCircle,
  Plus,
  Layers,
  ShieldAlert,
  Archive
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Batch {
  id: string;
  batchNo: string;
  lotNo?: string;
  quantity: string | number;
  usedQty: string | number;
  expiryDate?: string;
  status: 'ACTIVE' | 'PARTIALLY_USED' | 'EXHAUSTED' | 'EXPIRED' | 'QUARANTINE';
  product?: {
    name: string;
    sku: string;
  };
}

export default function BatchesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [lotCode, setLotCode] = useState('');
  const [batchQty, setBatchQty] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplierBatch, setSupplierBatch] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pRes, bRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/batches', { headers })
      ]);

      if (pRes.ok) {
        const prods = await pRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setProducts(prods);
        if (prods.length > 0) setSelectedProduct(prods[0].id);
      }
      if (bRes.ok) {
        const bl = await bRes.json().then(d => Array.isArray(d) ? d : (d?.data || []));
        setBatches(bl);
      }
    } catch {
      setError('Serving local mock fallback registry.');
      setProducts([
        { id: 'prod-1', name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' },
        { id: 'prod-2', name: 'Tactical Kevlar Micro-Weave', sku: 'SKU-KEV-404' }
      ]);
      setBatches([
        {
          id: 'b-1',
          batchNo: 'LOT-2026-B',
          lotNo: 'L-99',
          quantity: 50,
          usedQty: 10,
          status: 'ACTIVE',
          expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
          product: { name: 'Refined Vibranium Alloy Ingot', sku: 'SKU-VIB-001' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/inventory/batches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          batchNo: batchCode,
          lotNo: lotCode || undefined,
          quantity: Number(batchQty),
          expiryDate: expiryDate || undefined,
          supplierBatchNo: supplierBatch || undefined,
          notes: notes || undefined
        })
      });
      if (!res.ok) throw new Error();
      setBatchCode('');
      setLotCode('');
      setBatchQty('');
      setExpiryDate('');
      setSupplierBatch('');
      setNotes('');
      loadData();
    } catch {
      // Mock local update
      const selectedProdObj = products.find(p => p.id === selectedProduct);
      const newMock: Batch = {
        id: `batch-mock-${Date.now()}`,
        batchNo: batchCode,
        lotNo: lotCode,
        quantity: Number(batchQty),
        usedQty: 0,
        status: 'ACTIVE',
        expiryDate: expiryDate || undefined,
        product: {
          name: selectedProdObj?.name || 'Vibranium Ingot',
          sku: selectedProdObj?.sku || 'SKU-VIB-001'
        }
      };
      setBatches(prev => [newMock, ...prev]);
      setBatchCode('');
      setLotCode('');
      setBatchQty('');
      setExpiryDate('');
      setSupplierBatch('');
      setNotes('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Batches & Lot Control"
        description="Monitor product batch lots, production numbers, and chemical shelf-life parameters."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Batches' }]}
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
          
          {/* Batches List Card */}
          <Card padding="none" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Batch Code</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Product</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Available / Total</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Expiry Date</th>
                  <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const qty = Number(b.quantity);
                  const used = Number(b.usedQty || 0);
                  const balance = qty - used;
                  const isExpired = b.expiryDate ? new Date(b.expiryDate) < new Date() : false;

                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)', fontFamily: 'monospace' }}>
                        {b.batchNo} {b.lotNo && <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>({b.lotNo})</span>}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{b.product?.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{b.product?.sku}</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        {balance} / {qty}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                        {b.expiryDate ? (
                          <span className={isExpired ? 'text-danger font-semibold' : ''}>
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                        ) : 'No Expiry'}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                        <Badge variant={isExpired ? 'danger' : b.status === 'ACTIVE' ? 'success' : 'info'}>
                          {isExpired ? 'EXPIRED' : b.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                      No product batch lots configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Form Card */}
          <Card>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>Log Production Batch</h4>
            </div>
            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Batch Code *</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="LOT-2026-B"
                    required
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Lot ID</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={lotCode}
                    onChange={(e) => setLotCode(e.target.value)}
                    placeholder="L-99"
                  />
                </div>
              </div>
              <div className="frappe-grid-2">
                <div className="frappe-form-group">
                  <label className="frappe-label">Batch Qty *</label>
                  <input
                    type="number"
                    className="frappe-input"
                    value={batchQty}
                    onChange={(e) => setBatchQty(e.target.value)}
                    placeholder="50"
                    required
                  />
                </div>
                <div className="frappe-form-group">
                  <label className="frappe-label">Expiry Date</label>
                  <input
                    type="date"
                    className="frappe-input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Supplier Batch Code</label>
                <input
                  type="text"
                  className="frappe-input"
                  value={supplierBatch}
                  onChange={(e) => setSupplierBatch(e.target.value)}
                  placeholder="SUP-LOT-XYZ"
                />
              </div>
              <div className="frappe-form-group">
                <label className="frappe-label">Notes</label>
                <textarea
                  className="frappe-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Batch parameters or lab readings..."
                  style={{ minHeight: '60px' }}
                />
              </div>
              <button type="submit" className="frappe-btn frappe-btn-primary">
                Register Batch Lot
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
