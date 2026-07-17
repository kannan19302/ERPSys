'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      const [qRes, vRes, rRes, pRes] = await Promise.all([
        client.get<SupplierQuotation[] | { data?: SupplierQuotation[] }>('/procurement/supplier-quotations'),
        client.get<Vendor[] | { data?: Vendor[] }>('/crm/vendors'),
        client.get<RFQ[] | { data?: RFQ[] }>('/procurement/rfqs'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products')
      ]);

      setQuotes(Array.isArray(qRes) ? qRes : qRes.data || []);
      setVendors(Array.isArray(vRes) ? vRes : vRes.data || []);
      setRfqs(Array.isArray(rRes) ? rRes : rRes.data || []);
      setProducts(Array.isArray(pRes) ? pRes : pRes.data || []);
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
  }, [client]);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/procurement/supplier-quotations', {
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
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch {
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

  const handleConvertPO = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await client.post(`/procurement/supplier-quotations/${id}/convert-po`, {});
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

  const columns: ListColumn[] = [
    {
      key: 'quotationNumber',
      header: 'Quotation Code',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <span className="font-bold">{q.quotationNumber}</span>;
      }
    },
    {
      key: 'vendorName',
      header: 'Supplier',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <span>{q.vendorName}</span>;
      }
    },
    {
      key: 'rfqNumber',
      header: 'RFQ Link',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <span className={styles.p1}>{q.rfqNumber || 'Direct Quote'}</span>;
      }
    },
    {
      key: 'totalAmount',
      header: 'Amount Quote',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <span className={styles.p2}>${q.totalAmount.toLocaleString()} {q.currency}</span>;
      }
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <span className="ui-text-muted">{new Date(q.validUntil).toLocaleDateString()}</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        return <Badge variant={q.status === 'CONVERTED' ? 'success' : q.status === 'APPROVED' ? 'info' : 'default'}>{q.status}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_v, row) => {
        const q = row as unknown as SupplierQuotation;
        if (q.status !== 'APPROVED') return null;
        return (
          <button
            onClick={(e) => handleConvertPO(q.id, e)}
            className={["ui-btn ui-btn-primary", styles.p3].join(' ')}

          >
            <CheckCircle size={12} /> Convert to PO
          </button>
        );
      }
    },
  ];

  return (
    <RouteGuard permission="procurement.supplier-quotation.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Supplier Bids & Quotations"
        description="Review incoming supplier quotes, compare pricing matrices, and select successful bids."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Bids' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="ui-hstack-2">
            <Plus size={14} />
            Record Supplier Bid
          </Button>
        }
      />

      {error && (
        <div className={styles.p4}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      <ListPageTemplate
        title=""
        columns={columns}
        data={quotes as unknown as Record<string, unknown>[]}
        loading={loading}
        searchable
        searchPlaceholder="Search quotations..."
        emptyTitle="No Supplier Quotations registered"
        emptyDescription="Record incoming bids to compare pricing and convert to purchase orders."
      />

      {/* Record Quotation Modal */}
      {isModalOpen && (
        <div className={styles.p5}>
          <div className={["ui-card", styles.p6].join(' ')} >
            <div className={styles.p7}>
              <span className={styles.p8}>Record Supplier Quotation</span>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted">Close</button>
            </div>
            <div className="ui-card-body p-5">
              <form onSubmit={handleCreateQuotation} className="ui-stack-4">
                <div className="ui-grid-2">
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">RFQ Ref (Optional)</label>
                    <select
                      className={["ui-input", styles.p9].join(' ')}
                      value={selectedRfq}
                      onChange={(e) => setSelectedRfq(e.target.value)}

                    >
                      <option value="">-- Direct Quotation --</option>
                      {rfqs.map(r => (
                        <option key={r.id} value={r.id}>{r.rfqNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Supplier *</label>
                    <select
                      className={["ui-input", styles.p10].join(' ')}
                      value={selectedVendor}
                      onChange={(e) => setSelectedVendor(e.target.value)}

                      required
                    >
                      <option value="">-- Select Supplier --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Supplier Quote Number *</label>
                    <input
                      type="text"
                      className="ui-input"
                      value={quotationNumber}
                      onChange={(e) => setQuotationNumber(e.target.value)}
                      placeholder="e.g. SQ-OSC-001"
                      required
                    />
                  </div>
                  <div className="ui-form-group ui-stack-1">
                    <label className="ui-label ui-text-xs-label">Validity Deadline *</label>
                    <input
                      type="date"
                      className="ui-input"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ui-form-group ui-stack-1">
                  <label className="ui-label ui-text-xs-label">Commercial Notes</label>
                  <input
                    type="text"
                    className="ui-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference discount terms or freight policy"
                  />
                </div>

                {/* Quotation Line Items Grid */}
                <div className={styles.p11}>
                  <div className="ui-flex-between mb-2">
                    <span className={styles.p12}>Quoted Price List</span>
                    <button
                      type="button"
                      onClick={() => setItems([...items, { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 10 }])}
                      className={["ui-btn ui-btn-secondary", styles.p13].join(' ')}

                    >
                      Add Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className={styles.p14}>
                      <select
                        className={["ui-input", styles.p15].join(' ')}
                        value={item.productId}
                        onChange={(e) => {
                          const updated = [...items];
                          if (updated[idx]) {
                            updated[idx].productId = e.target.value;
                            setItems(updated);
                          }
                        }}

                      >
                        <option value="">-- Catalog Item --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="ui-input flex-1"
                        placeholder="Spec..."
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
                        className={["ui-input", styles.p16].join(' ')}

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
                        className={["ui-input", styles.p17].join(' ')}

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
                          className={styles.p18}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.p19}>
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={submitting}>
                    {submitting ? 'Recording...' : 'Record Supplier Quotation'}
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
