'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface RFQItem {
  id: string;
  description: string;
  quantity: number;
  product?: { name: string; sku: string };
}

interface RFQ {
  id: string;
  rfqNumber: string;
  status: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
  itemsCount: number;
  quotesCount: number;
  lineItems?: RFQItem[];
}

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Array<{ productId: string; description: string; quantity: number }>>([
    { productId: '', description: '', quantity: 1 }
  ]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const [rfqRes, prodRes] = await Promise.all([
        fetch('/api/v1/procurement/rfqs', { headers }),
        fetch('/api/v1/inventory/products', { headers })
      ]);

      if (rfqRes.ok) setRfqs(await rfqRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (prodRes.ok) setProducts(await prodRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
    } catch {
      setError('Serving local mock fallback registry.');
      setRfqs([
        {
          id: 'rfq-1',
          rfqNumber: 'RFQ-2026-001',
          status: 'SENT',
          expectedDate: new Date().toISOString(),
          notes: 'Quotation request for office monitor upgrade',
          createdAt: new Date().toISOString(),
          itemsCount: 1,
          quotesCount: 2
        }
      ]);
      setProducts([
        { id: 'prod-1', name: 'UltraBook Laptop Pro', sku: 'SKU-LAP-001' },
        { id: 'prod-2', name: '4K IPS Curved Monitor 32"', sku: 'SKU-MON-002' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/procurement/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          rfqNumber,
          expectedDate: expectedDate || undefined,
          notes,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description || products.find(p => p.id === item.productId)?.name || 'Custom item',
            quantity: item.quantity
          }))
        })
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
      // Mock local update
      const newMock: RFQ = {
        id: `rfq-mock-${Date.now()}`,
        rfqNumber,
        status: 'DRAFT',
        expectedDate: expectedDate || null,
        notes: notes || null,
        createdAt: new Date().toISOString(),
        itemsCount: items.length,
        quotesCount: 0
      };
      setRfqs(prev => [newMock, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRfqNumber('');
    setExpectedDate('');
    setNotes('');
    setItems([{ productId: '', description: '', quantity: 1 }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Requests for Quotation (RFQ)"
        description="Solicit bids and negotiate commercial pricing terms from invited suppliers."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'RFQs' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Publish RFQ
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* RFQ Registry Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>RFQ ID</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Notes</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Target Date</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Items</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Bids Evaluated</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-bold)' }}>{rfq.rfqNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{rfq.notes || 'No notes'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>{rfq.expectedDate ? new Date(rfq.expectedDate).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{rfq.itemsCount} line items</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)' }}>
                    <Badge variant={rfq.quotesCount > 0 ? 'info' : 'default'}>{rfq.quotesCount} bids</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <Badge variant={rfq.status === 'SENT' ? 'success' : 'default'}>{rfq.status}</Badge>
                  </td>
                </tr>
              ))}
              {rfqs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No Sourcing RFQs registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Publish RFQ Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' ,  padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)'  }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>Publish Request for Quotation (RFQ)</span>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleCreateRFQ} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>RFQ Sourcing Number *</label>
                    <input
                      type="text"
                      className="frappe-input"
                      value={rfqNumber}
                      onChange={(e) => setRfqNumber(e.target.value)}
                      placeholder="e.g. RFQ-2026-001"
                      required
                    />
                  </div>
                  <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Expected Deadline</label>
                    <input
                      type="date"
                      className="frappe-input"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Internal Sourcing Notes</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference office upgrade or inventory shortage"
                  />
                </div>

                {/* Sourcing Items Grid */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>Sourcing Line Items</span>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { productId: '', description: '', quantity: 1 }])}
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
                        style={{ flex: 2, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                      >
                        <option value="">-- Catalog Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="frappe-input"
                        placeholder="Custom spec..."
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].description = e.target.value;
                            setItems(updated);
                          }
                        }}
                        style={{ flex: 2 }}
                      />
                      <input
                        type="number"
                        className="frappe-input"
                        style={{ width: '80px' }}
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
                    {submitting ? 'Publishing...' : 'Publish Sourcing Sprint'}
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
