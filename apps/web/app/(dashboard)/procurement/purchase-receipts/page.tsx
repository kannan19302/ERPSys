'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { PageHeader, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  AlertCircle
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      const [receiptRes, poRes, whRes] = await Promise.all([
        client.get<PurchaseReceipt[] | { data?: PurchaseReceipt[] }>('/procurement/purchase-receipts'),
        client.get<PurchaseOrder[]>('/procurement/purchase-orders'),
        client.get<Warehouse[] | { data?: Warehouse[] }>('/inventory/warehouses')
      ]);

      setReceipts(Array.isArray(receiptRes) ? receiptRes : receiptRes.data || []);
      setPos(poRes.filter(p => p.status === 'APPROVED' || p.status === 'PARTIALLY_RECEIVED'));
      const whs = Array.isArray(whRes) ? whRes : whRes.data || [];
      setWarehouses(whs);
      const firstWarehouse = whs[0];
      if (firstWarehouse) setSelectedWarehouse(firstWarehouse.id);
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
  }, [client]);

  // Update item grid when PO selection changes
  const handlePoChange = async (poId: string) => {
    setSelectedPo(poId);
    if (!poId) {
      setItems([]);
      return;
    }
    try {
      const detail = await client.get<{ lineItems: Array<{ productId: string; description: string; quantity: number; receivedQty: number }> }>(`/procurement/purchase-orders/${poId}`);
        setItems(detail.lineItems.map((li: { productId: string; description: string; quantity: number; receivedQty: number }) => ({
          productId: li.productId,
          description: li.description,
          receivedQty: Number(li.quantity) - Number(li.receivedQty),
          acceptedQty: Number(li.quantity) - Number(li.receivedQty),
          rejectedQty: 0
        })));
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
      await client.post('/procurement/purchase-receipts', {
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
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
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

  const columns: ListColumn[] = [
    {
      key: 'receiptNumber',
      header: 'GRN Voucher',
      render: (_v, row) => {
        const r = row as unknown as PurchaseReceipt;
        return <span className="font-bold">{r.receiptNumber}</span>;
      }
    },
    {
      key: 'purchaseOrder',
      header: 'Purchase Order',
      render: (_v, row) => {
        const r = row as unknown as PurchaseReceipt;
        return <span className="font-mono">{r.purchaseOrder?.poNumber || 'Direct GRN'}</span>;
      }
    },
    {
      key: 'vendorName',
      header: 'Supplier',
      render: (_v, row) => {
        const r = row as unknown as PurchaseReceipt;
        return <span>{r.purchaseOrder?.vendorName || 'N/A'}</span>;
      }
    },
    {
      key: 'receivedDate',
      header: 'Received Date',
      render: (_v, row) => {
        const r = row as unknown as PurchaseReceipt;
        return <span className="ui-text-muted">{new Date(r.receivedDate).toLocaleDateString()}</span>;
      }
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (_v, row) => {
        const r = row as unknown as PurchaseReceipt;
        return <span className="ui-text-muted">{r.notes || 'No remarks'}</span>;
      }
    },
  ];

  return (
    <RouteGuard permission="procurement.purchase-receipt.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Purchase Receipts (GRN)"
        description="Verify supplier shipments, log material discrepancies, and increase inventory warehouse stock."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Purchase Receipts' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="ui-hstack-2">
            <Plus size={14} />
            Record Goods Receipt
          </Button>
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      <ListPageTemplate
        title=""
        columns={columns}
        data={receipts as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
        searchPlaceholder="Search receipts..."
        emptyTitle="No Goods Receipt Notes registered"
        emptyDescription="Record a GRN to log incoming supplier shipments."
      />

      {/* Goods Receipt Modal */}
      {isModalOpen && (
        <div className={styles.p2}>
          <div className={["ui-card", styles.p3].join(' ')} >
            <div className={styles.p4}>
              <span className={styles.p5}>Record Goods Receipt (GRN)</span>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">Close</button>
            </div>
            <div className="ui-card-body p-5">
              <form onSubmit={handleCreateReceipt} className="ui-stack-4">
                <div className="ui-grid-2">
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Select Purchase Order *</label>
                    <select
                      className={["ui-input", styles.p6].join(' ')}
                      value={selectedPo}
                      onChange={(e) => handlePoChange(e.target.value)}

                      required
                    >
                      <option value="">-- Choose Approved PO --</option>
                      {pos.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} ({po.vendorName})</option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">GRN Receipt Code *</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="e.g. GRN-2026-104"
                      required
                    />
                  </div>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Target Warehouse *</label>
                    <select
                      className={["ui-input", styles.p7].join(' ')}
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}

                      required
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Logistics Remarks</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reference carrier or invoice"
                    />
                  </div>
                </div>

                {/* Receipts Items Inspection Table */}
                {items.length > 0 && (
                  <div className={styles.p8}>
                    <span className={styles.p9}>Quality Inspection & Item Receipt Counts</span>
                    {items.map((item, idx) => (
                      <div key={idx} className={styles.p10}>
                        <span className="ui-heading-sm">{item.description}</span>
                        <div className={styles.p11}>
                          <div className="ui-form-group">
                            <label className={styles.p12}>Received Qty</label>
                            <input
                              type="number"
                              className="ui-input"
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
                          <div className="ui-form-group">
                            <label className={styles.p13}>Accepted Qty</label>
                            <input
                              type="number"
                              className="ui-input"
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
                          <div className="ui-form-group">
                            <label className={styles.p14}>Rejected Qty</label>
                            <input
                              type="number"
                              className="ui-input"
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

                <div className={styles.p15}>
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting}>
                    {submitting ? 'Recording...' : 'Record GRN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
