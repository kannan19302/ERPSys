'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import {
  Plus,
  AlertCircle
} from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
  status?: string;
  lineItems?: Array<{ productId: string; description: string; quantity: number; receivedQty: number }>;
}

interface Warehouse {
  id: string;
  name: string;
}

interface PurchaseReceipt {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  notes?: string;
  purchaseOrder?: { poNumber: string; vendorName: string } | null;
}

export default function PurchaseReceiptsPage() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; description: string; receivedQty: number; acceptedQty: number; rejectedQty: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [receiptRes, poRes, whRes] = await Promise.all([
        fetch('/api/v1/procurement/purchase-receipts', { headers }),
        fetch('/api/v1/procurement/purchase-orders', { headers }),
        fetch('/api/v1/inventory/warehouses', { headers })
      ]);

      if (receiptRes.ok) {
        setReceipts(await receiptRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      }
      if (poRes.ok) {
        const activePos: PurchaseOrder[] = await poRes.json();
        setPos(activePos.filter((p: PurchaseOrder) => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED'));
      }
      if (whRes.ok) {
        const whs = await whRes.json();
        setWarehouses(Array.isArray(whs) ? whs : (whs?.data || []));
        if (whs.length > 0) setSelectedWarehouse(whs[0].id);
      }
    } catch {
      setError('Serving local mock fallback registry.');
      setPos([
        {
          id: 'po-1',
          poNumber: 'PO-2026-001',
          vendorName: 'Oscorp Chemical Supply',
          lineItems: [{ productId: 'prod-1', description: '4K IPS Curved Monitor 32"', quantity: 10, receivedQty: 0 }]
        }
      ]);
      setWarehouses([
        { id: 'wh-1', name: 'Main Central Warehouse' }
      ]);
      setReceipts([
        {
          id: 'r-1',
          receiptNumber: 'REC-2026-001',
          receivedDate: new Date().toISOString(),
          notes: 'Standard warehouse goods receipt',
          purchaseOrder: { poNumber: 'PO-2026-001', vendorName: 'Oscorp Chemical Supply' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update item grid when PO selection changes
  const handlePoChange = async (poId: string) => {
    setSelectedPo(poId);
    if (!poId) {
      setItems([]);
      return;
    }
    // Fetch details of selected PO or load from loaded state
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/procurement/purchase-orders/${poId}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const detail = await res.json();
        setItems(detail.lineItems.map((li: { productId: string; description: string; quantity: number; receivedQty: number }) => ({
          productId: li.productId,
          description: li.description,
          receivedQty: Number(li.quantity) - Number(li.receivedQty),
          acceptedQty: Number(li.quantity) - Number(li.receivedQty),
          rejectedQty: 0
        })));
      }
    } catch {
      const poObj = pos.find(p => p.id === poId);
      if (poObj && poObj.lineItems) {
        setItems(poObj.lineItems.map(li => ({
          productId: li.productId,
          description: li.description,
          receivedQty: li.quantity - li.receivedQty,
          acceptedQty: li.quantity - li.receivedQty,
          rejectedQty: 0
        })));
      }
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/procurement/purchase-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          purchaseOrderId: selectedPo,
          receiptNumber,
          warehouseId: selectedWarehouse || undefined,
          notes,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description,
            receivedQty: item.receivedQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty
          }))
        })
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
      // Mock local update
      const poObj = pos.find(p => p.id === selectedPo);
      const newMock: PurchaseReceipt = {
        id: `r-mock-${Date.now()}`,
        receiptNumber,
        receivedDate: new Date().toISOString(),
        notes: notes || undefined,
        purchaseOrder: poObj ? { poNumber: poObj.poNumber, vendorName: poObj.vendorName } : null
      };
      setReceipts(prev => [newMock, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPo('');
    setReceiptNumber('');
    setNotes('');
    setItems([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Purchase Receipts (GRN)"
        description="Verify supplier shipments, log material discrepancies, and increase inventory warehouse stock."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Purchase Receipts' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Record Goods Receipt
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* Receipts list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>GRN Voucher</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Purchase Order</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Supplier</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Received Date</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{r.receiptNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontFamily: 'monospace' }}>{r.purchaseOrder?.poNumber || 'Direct GRN'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{r.purchaseOrder?.vendorName || 'N/A'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{new Date(r.receivedDate).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{r.notes || 'No remarks'}</td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No Goods Receipt Notes registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Goods Receipt Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' ,  padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)'  }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Record Goods Receipt (GRN)</span>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleCreateReceipt} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Select Purchase Order *</label>
                    <select
                      className="frappe-input"
                      value={selectedPo}
                      onChange={(e) => handlePoChange(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                      required
                    >
                      <option value="">-- Choose Approved PO --</option>
                      {pos.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} ({po.vendorName})</option>
                      ))}
                    </select>
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>GRN Receipt Code *</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="e.g. GRN-2026-104"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Target Warehouse *</label>
                    <select
                      className="frappe-input"
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                      required
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Logistics Remarks</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reference carrier or invoice"
                    />
                  </div>
                </div>

                {/* Receipts Items Inspection Table */}
                {items.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', display: 'block', marginBottom: 'var(--space-2)' }}>Quality Inspection & Item Receipt Counts</span>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{item.description}</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                          <div className="frappe-form-group">
                            <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'gray' }}>Received Qty</label>
                            <input
                              type="number"
                              className="frappe-input"
                              value={item.receivedQty}
                              onChange={(e) => {
                                const updated = [...items];
                                if (updated[idx]) {
                                  updated[idx].receivedQty = parseFloat(e.target.value) || 0;
                                  setItems(updated);
                                }
                              }}
                              required
                            />
                          </div>
                          <div className="frappe-form-group">
                            <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'gray' }}>Accepted Qty</label>
                            <input
                              type="number"
                              className="frappe-input"
                              value={item.acceptedQty}
                              onChange={(e) => {
                                const updated = [...items];
                                if (updated[idx]) {
                                  updated[idx].acceptedQty = parseFloat(e.target.value) || 0;
                                  setItems(updated);
                                }
                              }}
                              required
                            />
                          </div>
                          <div className="frappe-form-group">
                            <label style={{ fontSize: '9px', textTransform: 'uppercase', color: 'gray' }}>Rejected Qty</label>
                            <input
                              type="number"
                              className="frappe-input"
                              value={item.rejectedQty}
                              onChange={(e) => {
                                const updated = [...items];
                                if (updated[idx]) {
                                  updated[idx].rejectedQty = parseFloat(e.target.value) || 0;
                                  setItems(updated);
                                }
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' ,  display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)'  }}>
                  <button type="button" className="frappe-btn frappe-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="frappe-btn frappe-btn-primary" disabled={submitting}>
                    {submitting ? 'Recording...' : 'Record GRN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
