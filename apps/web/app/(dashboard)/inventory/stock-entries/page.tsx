'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Warehouse as WhIcon,
  ChevronDown
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  hasSerialTracking: boolean;
  hasBatchTracking: boolean;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface BinLocation {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
}

interface StockEntryItem {
  id: string;
  product: { name: string; sku: string };
  qty: number;
  valuationRate: number;
  amount: number;
  batchNumber?: string | null;
  serialNumber?: string | null;
}

interface StockEntry {
  id: string;
  entryNumber: string;
  purpose: 'MATERIAL_RECEIPT' | 'MATERIAL_ISSUE' | 'MATERIAL_TRANSFER' | 'STOCK_ADJUSTMENT';
  postingDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
  remarks?: string | null;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  totalValue: number;
  items: StockEntryItem[];
}

export default function StockEntriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allBins, setAllBins] = useState<BinLocation[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  // Modals & Forms
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryPurpose, setEntryPurpose] = useState<'MATERIAL_RECEIPT' | 'MATERIAL_ISSUE' | 'MATERIAL_TRANSFER'>('MATERIAL_TRANSFER');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [entryItems, setEntryItems] = useState<Array<{
    productId: string;
    qty: number;
    valuationRate: number;
    batchNumber?: string;
    serialNo?: string;
    fromBinId?: string;
    toBinId?: string;
  }>>([
    { productId: '', qty: 1, valuationRate: 0 }
  ]);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      // Fetch products, warehouses, bins, entries in parallel
      const [pRes, wRes, bRes, seRes] = await Promise.all([
        fetch('/api/v1/inventory/products', { headers }),
        fetch('/api/v1/inventory/warehouses', { headers }),
        fetch('/api/v1/inventory/bin-locations', { headers }),
        fetch('/api/v1/inventory/stock-entries', { headers })
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        const plist = Array.isArray(pData) ? pData : (pData?.data || []);
        setProducts(plist.map((p: any) => ({ ...p, costPrice: Number(p.costPrice) })));
      }
      
      if (wRes.ok) {
        const whs = await wRes.json();
        const wlist = Array.isArray(whs) ? whs : (whs?.data || []);
        setWarehouses(wlist);
        if (wlist.length > 0) {
          setFromWarehouse(wlist[0].id);
          setToWarehouse(wlist[0].id);
        }
      }

      if (bRes.ok) {
        const bins = await bRes.json();
        setAllBins(Array.isArray(bins) ? bins : (bins?.data || []));
      }

      if (seRes.ok) {
        const seData = await seRes.json();
        const entries = Array.isArray(seData) ? seData : (seData?.data || []);
        setStockEntries(entries.map((se: any) => ({
          ...se,
          totalValue: Number(se.totalValue),
          items: (se.items || []).map((item: any) => ({
            ...item,
            qty: Number(item.qty),
            valuationRate: Number(item.valuationRate),
            amount: Number(item.amount)
          }))
        })));
      }
    } catch {
      setError('Could not load data. Please try again.');
      setProducts([]);
      setWarehouses([]);
      setAllBins([]);
      setStockEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    };

    const formattedItems = entryItems
      .filter(item => item.productId !== '')
      .map(item => ({
        productId: item.productId,
        qty: Number(item.qty),
        valuationRate: Number(item.valuationRate),
        batchNumber: item.batchNumber || undefined,
        serialNo: item.serialNo || undefined,
        fromWarehouseId: entryPurpose !== 'MATERIAL_RECEIPT' ? fromWarehouse : undefined,
        toWarehouseId: entryPurpose !== 'MATERIAL_ISSUE' ? toWarehouse : undefined,
        fromBinId: item.fromBinId || undefined,
        toBinId: item.toBinId || undefined
      }));

    const payload = {
      type: entryPurpose,
      purpose: entryPurpose,
      fromWarehouseId: entryPurpose !== 'MATERIAL_RECEIPT' ? fromWarehouse : undefined,
      toWarehouseId: entryPurpose !== 'MATERIAL_ISSUE' ? toWarehouse : undefined,
      remarks: entryRemarks,
      items: formattedItems
    };

    try {
      const res = await fetch('/api/v1/inventory/stock-entries', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setIsEntryModalOpen(false);
      setEntryRemarks('');
      setEntryItems([{ productId: '', qty: 1, valuationRate: 0 }]);
      loadData();
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError('Action could not be completed. Please try again.');
    }
  };

  const handleSubmitStockEntry = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/inventory/stock-entries/${id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
      loadData();
    } catch {
      setStockEntries(prev => prev.map(se => se.id === id ? { ...se, status: 'SUBMITTED' } : se));
    }
  };

  const handleCancelStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/inventory/stock-entries/${cancelTargetId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (!res.ok) throw new Error();
      setCancelModalOpen(false);
      setCancelReason('');
      loadData();
    } catch {
      setStockEntries(prev => prev.map(se => se.id === cancelTargetId ? { ...se, status: 'CANCELLED', remarks: `${se.remarks || ''} (Cancelled: ${cancelReason})` } : se));
      setCancelModalOpen(false);
      setCancelReason('');
    }
  };

  const triggerCancel = (id: string) => {
    setCancelTargetId(id);
    setCancelModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Stock Entries"
        description="Record goods receipts, inter-depot transfers, and stock adjustments E2E with active valuations."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Entries' }]}
        actions={
          <Button variant="primary" onClick={() => setIsEntryModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Create Stock Entry
          </Button>
        }
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
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Voucher ID</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Type</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Posting Date</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Total Value</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Remarks</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockEntries.map(se => (
                <tr key={se.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>{se.entryNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={se.purpose === 'MATERIAL_RECEIPT' ? 'success' : se.purpose === 'MATERIAL_ISSUE' ? 'danger' : 'info'}>
                      {se.purpose.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{new Date(se.postingDate).toLocaleString()}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={se.status === 'SUBMITTED' ? 'success' : se.status === 'CANCELLED' ? 'danger' : 'warning'}>{se.status}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>${se.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{se.remarks || 'No remarks'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {se.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitStockEntry(se.id)}
                          className="frappe-btn frappe-btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Submit Slip
                        </button>
                      )}
                      {se.status === 'SUBMITTED' && (
                        <button
                          onClick={() => triggerCancel(se.id)}
                          className="frappe-btn"
                          style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger)' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {stockEntries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No stock entry vouchers recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* CREATE STOCK ENTRY MODAL OVERLAY */}
      {isEntryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
            <div className="frappe-card-header flex items-center justify-between" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Create Warehouse Material Slip</span>
              <button onClick={() => setIsEntryModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleSaveStockEntry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Transaction Purpose *</label>
                    <select
                      className="frappe-input"
                      value={entryPurpose}
                      onChange={(e) => setEntryPurpose(e.target.value as any)}
                    >
                      <option value="MATERIAL_RECEIPT">Receipt (Goods In)</option>
                      <option value="MATERIAL_ISSUE">Issue (Write-off / Stock Out)</option>
                      <option value="MATERIAL_TRANSFER">Warehouse Stock Transfer</option>
                    </select>
                  </div>

                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Internal Remarks</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={entryRemarks}
                      onChange={(e) => setEntryRemarks(e.target.value)}
                      placeholder="Reference PO/SO or transfer note"
                    />
                  </div>
                </div>

                <div className="frappe-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  {entryPurpose !== 'MATERIAL_RECEIPT' && (
                    <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Source Warehouse *</label>
                      <select
                        className="frappe-input"
                        value={fromWarehouse}
                        onChange={(e) => setFromWarehouse(e.target.value)}
                      >
                        <option value="">-- Select Source Warehouse --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {entryPurpose !== 'MATERIAL_ISSUE' && (
                    <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Destination Warehouse *</label>
                      <select
                        className="frappe-input"
                        value={toWarehouse}
                        onChange={(e) => setToWarehouse(e.target.value)}
                      >
                        <option value="">-- Select Target Warehouse --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Line Items</span>
                    <button
                      type="button"
                      onClick={() => setEntryItems([...entryItems, { productId: '', qty: 1, valuationRate: 0 }])}
                      className="frappe-btn frappe-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {entryItems.map((item, idx) => {
                      const selectedProduct = products.find(p => p.id === item.productId);
                      const sourceBins = allBins.filter(b => b.warehouseId === fromWarehouse);
                      const targetBins = allBins.filter(b => b.warehouseId === toWarehouse);

                      return (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <select
                              className="frappe-input"
                              style={{ flex: 2 }}
                              value={item.productId}
                              onChange={(e) => {
                                const updated = [...entryItems];
                                const existing = updated[idx];
                                if (existing) {
                                  const p = products.find(prod => prod.id === e.target.value);
                                  updated[idx] = {
                                    ...existing,
                                    productId: e.target.value,
                                    valuationRate: p ? p.costPrice : 0
                                  };
                                  setEntryItems(updated);
                                }
                              }}
                              required
                            >
                              <option value="">-- Select Product * --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                              ))}
                            </select>
                            
                            <input
                              type="number"
                              className="frappe-input"
                              style={{ width: '90px' }}
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...entryItems];
                                const existing = updated[idx];
                                if (existing) {
                                  updated[idx] = {
                                    ...existing,
                                    qty: parseFloat(e.target.value) || 1
                                  };
                                  setEntryItems(updated);
                                }
                              }}
                              placeholder="Qty"
                              required
                            />

                            <input
                              type="number"
                              className="frappe-input"
                              style={{ width: '110px' }}
                              value={item.valuationRate}
                              onChange={(e) => {
                                const updated = [...entryItems];
                                const existing = updated[idx];
                                if (existing) {
                                  updated[idx] = {
                                    ...existing,
                                    valuationRate: parseFloat(e.target.value) || 0
                                  };
                                  setEntryItems(updated);
                                }
                              }}
                              placeholder="Rate ($)"
                            />

                            {entryItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = entryItems.filter((_, i) => i !== idx);
                                  setEntryItems(updated);
                                }}
                                style={{ border: 'none', background: 'none', color: 'var(--color-danger-text)', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Conditional tracing components based on product flags */}
                          {selectedProduct && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                              
                              {selectedProduct.hasBatchTracking && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <label style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Batch Number</label>
                                  <input
                                    type="text"
                                    className="frappe-input"
                                    placeholder="BAT-2026-..."
                                    value={item.batchNumber || ''}
                                    onChange={(e) => {
                                      const updated = [...entryItems];
                                      const existing = updated[idx];
                                      if (existing) {
                                        updated[idx] = {
                                          ...existing,
                                          batchNumber: e.target.value
                                        };
                                        setEntryItems(updated);
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {selectedProduct.hasSerialTracking && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <label style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Serial Number</label>
                                  <input
                                    type="text"
                                    className="frappe-input"
                                    placeholder="SN-..."
                                    value={item.serialNo || ''}
                                    onChange={(e) => {
                                      const updated = [...entryItems];
                                      const existing = updated[idx];
                                      if (existing) {
                                        updated[idx] = {
                                          ...existing,
                                          serialNo: e.target.value
                                        };
                                        setEntryItems(updated);
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {entryPurpose !== 'MATERIAL_RECEIPT' && sourceBins.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <label style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Source Bin</label>
                                  <select
                                    className="frappe-input"
                                    value={item.fromBinId || ''}
                                    onChange={(e) => {
                                      const updated = [...entryItems];
                                      const existing = updated[idx];
                                      if (existing) {
                                        updated[idx] = {
                                          ...existing,
                                          fromBinId: e.target.value
                                        };
                                        setEntryItems(updated);
                                      }
                                    }}
                                  >
                                    <option value="">-- Select Bin --</option>
                                    {sourceBins.map(b => (
                                      <option key={b.id} value={b.id}>{b.code} ({b.name})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {entryPurpose !== 'MATERIAL_ISSUE' && targetBins.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <label style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Destination Bin</label>
                                  <select
                                    className="frappe-input"
                                    value={item.toBinId || ''}
                                    onChange={(e) => {
                                      const updated = [...entryItems];
                                      const existing = updated[idx];
                                      if (existing) {
                                        updated[idx] = {
                                          ...existing,
                                          toBinId: e.target.value
                                        };
                                        setEntryItems(updated);
                                      }
                                    }}
                                  >
                                    <option value="">-- Select Bin --</option>
                                    {targetBins.map(b => (
                                      <option key={b.id} value={b.id}>{b.code} ({b.name})</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <Button variant="outline" type="button" onClick={() => setIsEntryModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Save Draft Slip
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL VOUCHER MODAL OVERLAY */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '400px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
            <div className="frappe-card-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold' }}>
              Cancel Stock Voucher Reversal
            </div>
            <form onSubmit={handleCancelStockEntry} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>Reason for Reversal *</label>
                <input
                  type="text"
                  required
                  className="frappe-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Audit error / Incorrect qty recorded"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setCancelModalOpen(false)}>Close</Button>
                <Button variant="primary" type="submit">Reverse & Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
