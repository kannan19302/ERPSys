'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
}

interface RFQ {
  id: string;
  rfqNumber: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface SupplierQuotation {
  id: string;
  quotationNumber: string;
  status: string;
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  vendorName: string;
  rfqNumber?: string;
  notes?: string;
}

export default function SupplierQuotationsPage() {
  const [quotes, setQuotes] = useState<SupplierQuotation[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 10 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [qRes, vRes, rRes, pRes] = await Promise.all([
        fetch('/api/v1/procurement/supplier-quotations', { headers }),
        fetch('/api/v1/crm/vendors', { headers }),
        fetch('/api/v1/procurement/rfqs', { headers }),
        fetch('/api/v1/inventory/products', { headers })
      ]);

      if (qRes.ok) setQuotes(await qRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (vRes.ok) setVendors(await vRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (rRes.ok) setRfqs(await rRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (pRes.ok) setProducts(await pRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      setError('Serving local mock fallback registry.');
      setQuotes([
        {
          id: 'sq-1',
          quotationNumber: 'SQ-OSC-001',
          status: 'APPROVED',
          validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          subtotal: 1900,
          taxAmount: 190,
          totalAmount: 2090,
          currency: 'USD',
          vendorName: 'Oscorp Chemical Supply',
          rfqNumber: 'RFQ-2026-001',
          notes: 'Special offer with bulk discount'
        }
      ]);
      setVendors([
        { id: 'v-1', name: 'Oscorp Chemical Supply' },
        { id: 'v-2', name: 'LexCorp Heavy Industries' }
      ]);
      setRfqs([
        { id: 'rfq-1', rfqNumber: 'RFQ-2026-001' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/procurement/supplier-quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          rfqId: selectedRfq || undefined,
          vendorId: selectedVendor,
          quotationNumber,
          validUntil,
          notes,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description || products.find(p => p.id === item.productId)?.name || 'Custom quote line',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate
          }))
        })
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
      // Mock local update
      const sub = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
      const newMock: SupplierQuotation = {
        id: `sq-mock-${Date.now()}`,
        quotationNumber,
        status: 'DRAFT',
        validUntil,
        subtotal: sub,
        taxAmount: tax,
        totalAmount: sub + tax,
        currency: 'USD',
        vendorName: vendors.find(v => v.id === selectedVendor)?.name || 'Unknown supplier',
        rfqNumber: rfqs.find(r => r.id === selectedRfq)?.rfqNumber,
        notes: notes || undefined
      };
      setQuotes(prev => [newMock, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertPO = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/procurement/supplier-quotations/${id}/convert-po`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
      loadData();
    } catch {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: 'CONVERTED' } : q));
    }
  };

  const resetForm = () => {
    setSelectedRfq('');
    setSelectedVendor('');
    setQuotationNumber('');
    setValidUntil('');
    setNotes('');
    setItems([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 10 }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Supplier Bids & Quotations"
        description="Review incoming supplier quotes, compare pricing matrices, and select successful bids."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Bids' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Record Supplier Bid
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* Bid Registry Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Quotation Code</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Supplier</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>RFQ Link</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Amount Quote</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Valid Until</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Status</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{q.quotationNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{q.vendorName}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{q.rfqNumber || 'Direct Quote'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>${q.totalAmount.toLocaleString()} {q.currency}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{new Date(q.validUntil).toLocaleDateString()}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={q.status === 'CONVERTED' ? 'success' : q.status === 'APPROVED' ? 'info' : 'default'}>{q.status}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    {q.status === 'APPROVED' && (
                      <button
                        onClick={() => handleConvertPO(q.id)}
                        className="frappe-btn frappe-btn-primary"
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle size={12} /> Convert to PO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No Supplier Quotations registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Record Quotation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' ,  padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)'  }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Record Supplier Quotation</span>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>RFQ Ref (Optional)</label>
                    <select
                      className="frappe-input"
                      value={selectedRfq}
                      onChange={(e) => setSelectedRfq(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                    >
                      <option value="">-- Direct Quotation --</option>
                      {rfqs.map(r => (
                        <option key={r.id} value={r.id}>{r.rfqNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Supplier *</label>
                    <select
                      className="frappe-input"
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                      required
                    >
                      <option value="">-- Select Supplier --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Supplier Quote Number *</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={quotationNumber}
                      onChange={(e) => setQuotationNumber(e.target.value)}
                      placeholder="e.g. SQ-OSC-001"
                      required
                    />
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Validity Deadline *</label>
                    <input
                      type="date"
                      className="frappe-input"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Commercial Notes</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference discount terms or freight policy"
                  />
                </div>

                {/* Quotation Line Items Grid */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>Quoted Price List</span>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 10 }])}
                      className="frappe-btn frappe-btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Add Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <select
                        className="frappe-input"
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].productId = e.target.value;
                            setItems(updated);
                          }
                        }}
                        style={{ width: '180px', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                      >
                        <option value="">-- Catalog Item --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="frappe-input"
                        placeholder="Spec..."
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].description = e.target.value;
                            setItems(updated);
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        className="frappe-input"
                        style={{ width: '60px' }}
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].quantity = parseFloat(e.target.value) || 1;
                            setItems(updated);
                          }
                        }}
                        placeholder="Qty"
                        required
                      />
                      <input
                        type="number"
                        className="frappe-input"
                        style={{ width: '90px' }}
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }
                        }}
                        placeholder="Price"
                        required
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                          style={{ border: 'none', background: 'none', color: 'var(--color-danger-text)', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' ,  display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)'  }}>
                  <button type="button" className="frappe-btn frappe-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="frappe-btn frappe-btn-primary" disabled={submitting}>
                    {submitting ? 'Recording...' : 'Record Supplier Quotation'}
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
