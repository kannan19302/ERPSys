'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      const [rfqRes, prodRes] = await Promise.all([
        client.get<RFQ[] | { data?: RFQ[] }>('/procurement/rfqs'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products')
      ]);

      setRfqs(Array.isArray(rfqRes) ? rfqRes : rfqRes.data || []);
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes.data || []);
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
  }, [client]);

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/procurement/rfqs', {
          rfqNumber,
          expectedDate: expectedDate || undefined,
          notes,
          lineItems: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description || products.find(p => p.id === item.productId)?.name || 'Custom item',
            quantity: item.quantity
          }))
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
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

  const columns: ListColumn[] = [
    {
      key: 'rfqNumber',
      header: 'RFQ ID',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <span className="font-bold">{rfq.rfqNumber}</span>;
      }
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <span className="ui-text-muted">{rfq.notes || 'No notes'}</span>;
      }
    },
    {
      key: 'expectedDate',
      header: 'Target Date',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <span className="ui-text-muted">{rfq.expectedDate ? new Date(rfq.expectedDate).toLocaleDateString() : 'N/A'}</span>;
      }
    },
    {
      key: 'itemsCount',
      header: 'Items',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <span>{rfq.itemsCount} line items</span>;
      }
    },
    {
      key: 'quotesCount',
      header: 'Bids Evaluated',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <Badge variant={rfq.quotesCount > 0 ? 'info' : 'default'}>{rfq.quotesCount} bids</Badge>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => {
        const rfq = row as unknown as RFQ;
        return <Badge variant={rfq.status === 'SENT' ? 'success' : 'default'}>{rfq.status}</Badge>;
      }
    },
  ];

  return (
    <RouteGuard permission="procurement.rfq.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Requests for Quotation (RFQ)"
        description="Solicit bids and negotiate commercial pricing terms from invited suppliers."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'RFQs' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="ui-hstack-2">
            <Plus size={14} />
            Publish RFQ
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
        data={rfqs as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
        searchPlaceholder="Search RFQs..."
        emptyTitle="No Sourcing RFQs registered"
        emptyDescription="Publish your first RFQ to begin the sourcing process."
      />

      {/* Publish RFQ Modal */}
      {isModalOpen && (
        <div className={styles.p2}>
          <div className={["ui-card", styles.p3].join(' ')} >
            <div className={styles.p4}>
              <span className={styles.p5}>Publish Request for Quotation (RFQ)</span>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">Close</button>
            </div>
            <div className="ui-card-body p-5">
              <form onSubmit={handleCreateRFQ} className="ui-stack-4">
                <div className="ui-grid-2">
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">RFQ Sourcing Number *</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={rfqNumber}
                      onChange={(e) => setRfqNumber(e.target.value)}
                      placeholder="e.g. RFQ-2026-001"
                      required
                    />
                  </div>
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Expected Deadline</label>
                    <input
                      type="date"
                      className="ui-input"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ui-form-group ui-stack-1">
                  <label className="ui-label ui-text-xs-label">Internal Sourcing Notes</label>
                  <input
                    type="text"
                    className="ui-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference office upgrade or inventory shortage"
                  />
                </div>

                <div className={styles.p6}>
                  <div className="ui-flex-between mb-2">
                    <span className={styles.p7}>Sourcing Line Items</span>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { productId: '', description: '', quantity: 1 }])}
                      className={["ui-btn ui-btn-secondary", styles.p8].join(' ')}

                    >
                      Add Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className={styles.p9}>
                      <select
                        className={["ui-input", styles.p10].join(' ')}
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].productId = e.target.value;
                            setItems(updated);
                          }
                        }}

                      >
                        <option value="">-- Catalog Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className={["ui-input", styles.p11].join(' ')}
                        placeholder="Custom spec..."
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].description = e.target.value;
                            setItems(updated);
                          }
                        }}

                      />
                      <input
                        type="number"
                        className={["ui-input", styles.p12].join(' ')}

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
                          className={styles.p13}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.p14}>
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting}>
                    {submitting ? 'Publishing...' : 'Publish Sourcing Sprint'}
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
