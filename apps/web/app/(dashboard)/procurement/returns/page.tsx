'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Search,
  X,
  History,
  FileText,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  status: string;
  returnDate: string;
  totalAmount: number;
  vendorName: string;
  poNumber: string;
  lineItemCount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
}

interface PurchaseOrderItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  lineItems: PurchaseOrderItem[];
}

export default function PurchaseReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected details drawer
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [returnNumber, setReturnNumber] = useState('');
  const [reason, setReason] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [returnsRes, ordersRes] = await Promise.all([
        fetch('/api/v1/procurement/returns', { headers }),
        fetch('/api/v1/procurement/purchase-orders', { headers })
      ]);

      if (returnsRes.ok) setReturns(await returnsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (ordersRes.ok) setOrders(await ordersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      setError('Could not load data. Please try again.');
      // Mock data
      setReturns([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderChange = async (orderId: string) => {
    setPurchaseOrderId(orderId);
    if (!orderId) {
      setLineItems([]);
      return;
    }

    setLoadingOrderItems(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const res = await fetch(`/api/v1/procurement/purchase-orders/${orderId}`, { headers });
      if (res.ok) {
        const data: PurchaseOrderDetail = await res.json();
        setLineItems(
          data.lineItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
          }))
        );
      } else {
        throw new Error();
      }
    } catch {
      // Mock fallback line items
      setLineItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');

    const payload = {
      purchaseOrderId,
      returnNumber,
      reason: reason || undefined,
      lineItems: lineItems.filter(item => item.quantity > 0)
    };

    try {
      const res = await fetch('/api/v1/procurement/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        loadData();
      }, 1500);
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPurchaseOrderId('');
    setReturnNumber('');
    setReason('');
    setLineItems([]);
    setModalSuccess(false);
  };

  const filteredReturns = returns.filter(r => {
    return r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getReturnTotal = returns.reduce((acc, r) => acc + r.totalAmount, 0);
  const getReturnCount = returns.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Supplier Returns"
        description="Log returned procurement goods, generate debit notes against vendor accounts, and reduce stock logs."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Returns' }]}
        actions={
          <Button onClick={() => {
            setIsModalOpen(true);
            setReturnNumber(`PR-${Math.floor(1000 + Math.random() * 9000)}`);
          }} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} />
            <span>Log Supplier Return</span>
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', color: 'var(--color-warning-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-lg)' }}>
            <RotateCcw size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>Total Supplier Returns</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>${getReturnTotal.toLocaleString()}</div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: 'var(--radius-lg)' }}>
            <History size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>Return Invoices Count</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>{getReturnCount} Cases</div>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', background: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: 'var(--radius-lg)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)', textTransform: 'uppercase' }}>Debit Notes Issued</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', marginTop: 'var(--space-1)' }}>{getReturnCount} Active</div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search return slips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="frappe-input"
              style={{ paddingLeft: '36px', width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : filteredReturns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <RotateCcw size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>No Returns Logged</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Log returns to update warehouse stock and release Debit Notes.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Return ID</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Vendor Name</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Purchase Order</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Date Logged</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Items</th>
                  <th style={{ textAlign: 'right', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Total Debit</th>
                  <th style={{ textAlign: 'center', padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedReturn(r)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>{r.returnNumber}</td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)' }}>{r.vendorName}</td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)' }}>
                      <Badge variant="default">{r.poNumber}</Badge>
                    </td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)', color: 'var(--color-text-secondary)' }}>{new Date(r.returnDate).toLocaleDateString()}</td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>{r.lineItemCount} Types</td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)', textAlign: 'right', fontWeight: 'var(--weight-bold)' }}>${r.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-3.5) var(--space-4)', textAlign: 'center' }}>
                      <Badge variant="success">Completed</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Selected Return Details Drawer */}
      {selectedReturn && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh', background: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-xl)', borderLeft: '1px solid var(--color-border)', padding: 'var(--space-6)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', transition: 'transform 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Return Summary</h3>
            <button onClick={() => setSelectedReturn(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              <X size={20} />
            </button>
          </div>

          <div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)' }}>{selectedReturn.returnNumber}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Supplier: {selectedReturn.vendorName}</div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Original PO Reference:</span>
              <span style={{ fontWeight: 'var(--weight-semibold)' }}>{selectedReturn.poNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Debit Note Issued:</span>
              <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-success)' }}>Active (DN-PR)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Return Date:</span>
              <span>{new Date(selectedReturn.returnDate).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Stock Status:</span>
              <span style={{ color: 'var(--color-danger-text)', fontWeight: 'var(--weight-bold)' }}>Deducted</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Total Debit Amount:</span>
              <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)' }}>${selectedReturn.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Log Return Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-overlay)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '600px', maxHeight: '90vh', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Log Supplier Return & Issue Debit Note</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {modalSuccess ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <RotateCcw size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4) auto' }} />
                <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>Return Slips Created Successfully</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>The inventory items have been deducted, and a Debit Note was generated.</div>
              </div>
            ) : (
              <form onSubmit={handleCreateReturn} style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' }}>Return Reference No.</label>
                    <input
                      type="text"
                      required
                      value={returnNumber}
                      onChange={(e) => setReturnNumber(e.target.value)}
                      className="frappe-input"
                      style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}
                    />
                  </div>

                  <div className="frappe-form-group">
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' }}>Select Purchase Order</label>
                    <select
                      required
                      value={purchaseOrderId}
                      onChange={(e) => handleOrderChange(e.target.value)}
                      className="frappe-input"
                      style={{ width: '100%', height: '38px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 var(--space-3)' }}
                    >
                      <option value="">-- Choose Purchase Order --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>{o.poNumber} ({o.vendorName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="frappe-form-group">
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-1.5)' }}>Return Reason</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Broken packaging, defective materials, incorrect specification..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="frappe-input"
                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-2)' }}>Line Items to Return</label>
                  {loadingOrderItems ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
                      <Spinner size="md" />
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      Please select a Purchase Order to populate return items.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bg-sunken)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: 'var(--space-2)' }}>Description</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)', width: '90px' }}>Qty</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)', width: '100px' }}>Unit Price</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)', width: '80px' }}>Tax (%)</th>
                            <th style={{ textAlign: 'right', padding: 'var(--space-2)', width: '110px' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, index) => {
                            const total = item.quantity * item.unitPrice * (1 + item.taxRate / 100);
                            return (
                              <tr key={index} style={{ borderBottom: index < lineItems.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                <td style={{ padding: 'var(--space-2)' }}>{item.description}</td>
                                <td style={{ padding: 'var(--space-2)' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...lineItems];
                                      updated[index]!.quantity = Number(e.target.value);
                                      setLineItems(updated);
                                    }}
                                    style={{ width: '100%', padding: '2px 4px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', textAlign: 'right' }}
                                  />
                                </td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>${item.unitPrice.toLocaleString()}</td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>{item.taxRate}%</td>
                                <td style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={submitting || lineItems.length === 0}>
                    {submitting ? 'Registering Return...' : 'Complete Return'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
