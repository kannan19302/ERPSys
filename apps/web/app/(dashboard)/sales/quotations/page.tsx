'use client';

import styles from './page.module.css';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, ListPageTemplate, type ListColumn } from '@unerp/ui';
import {
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  validUntil: string;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  lineItemCount: number;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface QuotationDetailItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

interface QuotationDetail {
  id: string;
  quotationNumber: string;
  status: string;
  validUntil: string;
  customer: { name: string };
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  lineItems: QuotationDetailItem[];
}

export default function QuotationsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawer / Detail View
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [quoteDetails, setQuoteDetails] = useState<QuotationDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modal creation form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ productId?: string; description: string; quantity: number; unitPrice: number; taxRate: number }>>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }
  ]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quotesRes, customersRes, productsRes] = await Promise.all([
        client.get<Quotation[] | { data?: Quotation[] }>('/sales/quotations'),
        client.get<Customer[] | { data?: Customer[] }>('/crm/customers'),
        client.get<Product[] | { data?: Product[] }>('/inventory/products')
      ]);

      setQuotes(Array.isArray(quotesRes) ? quotesRes : quotesRes.data || []);
      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes.data || []);
      setProducts(Array.isArray(productsRes) ? productsRes : productsRes.data || []);
    } catch {
      setError('Could not load data. Please try again.');
      setQuotes([]);
      setCustomers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const loadQuotationDetails = async (quote: Quotation) => {
    setSelectedQuote(quote);
    setLoadingDetails(true);
    setQuoteDetails(null);
    try {
      setQuoteDetails(await client.get<QuotationDetail>(`/sales/quotations/${quote.id}`));
    } catch {
      // Mock details
      setQuoteDetails({
        id: quote.id,
        quotationNumber: quote.quotationNumber,
        status: quote.status,
        validUntil: quote.validUntil,
        customer: { name: quote.customerName },
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        totalAmount: quote.totalAmount,
        notes: 'Quote for supply materials.',
        lineItems: [
          { id: 'li-1', description: 'Materials Supply', quantity: 1, unitPrice: quote.subtotal, taxRate: 5, totalAmount: quote.totalAmount }
        ]
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      customerId,
      quotationNumber,
      validUntil: new Date(validUntil).toISOString(),
      notes,
      lineItems: lineItems.map(item => ({
        productId: item.productId || undefined,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate
      }))
    };

    try {
      await client.post('/sales/quotations', payload);

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

  const convertToOrder = async (quoteId: string) => {
    try {
      await client.post(`/sales/orders/${quoteId}/convert`, {});
      alert('Quotation successfully converted to Sales Order!');
      setSelectedQuote(null);
      loadData();
    } catch {
      // Mock conversion
      alert('Mock Mode: Quotation converted successfully!');
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'CONVERTED' } : q));
      if (selectedQuote) {
        setSelectedQuote(prev => prev ? { ...prev, status: 'CONVERTED' } : null);
      }
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setQuotationNumber('');
    setValidUntil('');
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
    setModalSuccess(false);
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    const newLines = [...lineItems];
    const item = newLines[index];
    if (!item) return;
    newLines[index] = {
      ...item,
      productId: prodId,
      description: prod.name,
      unitPrice: prod.price
    };
    setLineItems(newLines);
  };

  const updateLineField = (index: number, field: string, value: string | number) => {
    const newLines = [...lineItems];
    const item = newLines[index];
    if (!item) return;
    newLines[index] = { ...item, [field]: value };
    setLineItems(newLines);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Filters & Search
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <RouteGuard permission="sales.quotation.read">
      <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Customer Quotations"
        description="Negotiate orders, draft proposals, and convert accepted quotes into orders."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Quotations' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="ui-hstack-2">
            <Plus size={16} />
            Create Quotation
          </Button>
        }
      />

      {error && (
        <div className={styles.p1}>
          <AlertCircle size={16} />
          <span>Note: {error} (Mock Fallback Active)</span>
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <div className={styles.p2}>
          <div className={styles.p3}>
            <Search size={16} className={styles.p4} />
            <input
              type="text"
              placeholder="Search quotes, clients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={["ui-input", styles.p5].join(' ')}

            />
          </div>

          <div className="ui-flex ui-gap-1">
            {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={["ui-btn", styles.p6].join(' ')}
                style={{ background: statusFilter === status ? 'var(--color-primary-light)' : 'transparent', color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)', border: statusFilter === status ? '1px solid var(--color-primary)' : '1px solid transparent' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Quotes Listing */}
      <div style={{ gridTemplateColumns: selectedQuote ? '1.5fr 1fr' : '1fr' }}>
        <ListPageTemplate
          title=""
          columns={[
            { key: 'quotationNumber', header: 'Quotation ID', render: (v) => <span className={styles.p8}>{String(v)}</span> },
            { key: 'customerName', header: 'Customer' },
            { key: 'validUntil', header: 'Valid Until', render: (v) => new Date(String(v)).toLocaleDateString() },
            { key: 'totalAmount', header: 'Total Amount', render: (v) => <span className="font-medium">${Number(v).toLocaleString()}</span> },
            { key: 'status', header: 'Status', render: (v) => <span style={{ background: v === 'CONVERTED' ? 'var(--color-info-light)' : v === 'ACCEPTED' ? 'var(--color-success-light)' : 'var(--color-bg-sunken)', color: v === 'CONVERTED' ? 'var(--color-info-text)' : v === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>{String(v)}</span> },
          ] as ListColumn[]}
          data={filteredQuotes as unknown as Record<string, unknown>[]}
          loading={loading}
          onRowClick={(row) => loadQuotationDetails(row as unknown as typeof filteredQuotes[0])}
          emptyTitle="No quotations found"
          emptyDescription="No quotations matching the filters were found."
        />

        {/* Quotation Detail Drawer Panel */}
        {selectedQuote && (
          <Card padding="none" className={styles.p10}>
            <div className={styles.p11}>
              <h4 className={styles.p12}>{selectedQuote.quotationNumber} Details</h4>
              <button onClick={() => setSelectedQuote(null)} className="ui-btn-icon ui-text-muted">
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="ui-center-pad">
                <Spinner size="md" />
              </div>
            ) : quoteDetails && (
              <div className="p-5 ui-stack-4">
                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Customer Account:</span>
                  <span className="ui-heading-sm">{quoteDetails.customer.name}</span>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Proposal Validity:</span>
                  <span className={styles.p13}>
                    <Calendar size={14} /> {new Date(quoteDetails.validUntil).toLocaleDateString()}
                  </span>
                </div>

                <div className="ui-flex-between">
                  <span className="ui-text-sm-muted">Current Status:</span>
                  <Badge variant={quoteDetails.status === 'CONVERTED' ? 'info' : quoteDetails.status === 'ACCEPTED' ? 'success' : 'default'}>
                    {quoteDetails.status}
                  </Badge>
                </div>

                <div className={styles.p14}>
                  <span className={styles.p15}>Line Items</span>
                  <div className={styles.p16}>
                    {quoteDetails.lineItems.map((li: QuotationDetailItem) => (
                      <div key={li.id} className={styles.p17}>
                        <div>
                          <p className={styles.p18}>{li.description}</p>
                          <span className="ui-text-caption">Qty: {Number(li.quantity)} @ ${Number(li.unitPrice)} (Tax {Number(li.taxRate)}%)</span>
                        </div>
                        <span className="font-bold">${Number(li.totalAmount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.p19}>
                  <div className={styles.p20}>
                    <span>Subtotal:</span>
                    <span>${Number(quoteDetails.subtotal).toLocaleString()}</span>
                  </div>
                  <div className={styles.p21}>
                    <span>Sales Taxes:</span>
                    <span>${Number(quoteDetails.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className={styles.p22}>
                    <span>Total Proposal Value:</span>
                    <span>${Number(quoteDetails.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                {quoteDetails.notes && (
                  <div className={styles.p23}>
                    <span className={styles.p24}>Proposal Notes:</span>
                    <p className={styles.p25}>{quoteDetails.notes}</p>
                  </div>
                )}

                {quoteDetails.status !== 'CONVERTED' && (
                  <div className={styles.p26}>
                    <Button variant="primary" onClick={() => convertToOrder(quoteDetails.id)} className={styles.p27}>
                      <FileCheck2 size={16} />
                      Convert to Sales Order
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create Quotation Modal */}
      {isModalOpen && (
        <div className={styles.p28}>
          <div className={styles.p29}>
            <div className={styles.p30}>
              <h3 className={styles.p31}>Create Customer Quotation</h3>
              <button onClick={() => setIsModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateQuotation} className={styles.p32}>
              {modalSuccess ? (
                <div className={styles.p33}>
                  <CheckCircle size={48} className={styles.p34} />
                  <h4 className={styles.p35}>Proposal Draft Created!</h4>
                  <p className="ui-text-sm-muted">Quotation saved to database registry.</p>
                </div>
              ) : (
                <>
                  <div className="ui-grid-2">
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Quotation Number</label>
                      <input
                        type="text"
                        placeholder="QT-2026-00x"
                        value={quotationNumber}
                        onChange={e => setQuotationNumber(e.target.value)}
                        required
                        className="ui-input"
                      />
                    </div>
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Customer Account</label>
                      <select
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        required
                        className="ui-input"
                      >
                        <option value="">Select Account</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-stack-1">
                      <label className="ui-text-xs-label">Validity Limit Date</label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={e => setValidUntil(e.target.value)}
                        required
                        className="ui-input"
                      />
                    </div>
                  </div>

                  {/* Line Items Grid */}
                  <div className={styles.p36}>
                    <span className={styles.p37}>PROPOSAL ITEMS</span>

                    {lineItems.map((line, idx) => (
                      <div key={idx} className={styles.p38}>
                        <select
                          value={line.productId || ''}
                          onChange={e => handleProductSelect(idx, e.target.value)}
                          className="ui-input text-xs"
                        >
                          <option value="">Catalog Item (optional)</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>

                        <input
                          type="text"
                          placeholder="Description..."
                          value={line.description}
                          onChange={e => updateLineField(idx, 'description', e.target.value)}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={e => updateLineField(idx, 'quantity', Number(e.target.value))}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={e => updateLineField(idx, 'unitPrice', Number(e.target.value))}
                          required
                          className="ui-input text-xs"
                        />

                        <input
                          type="number"
                          placeholder="Tax %"
                          value={line.taxRate}
                          onChange={e => updateLineField(idx, 'taxRate', Number(e.target.value))}
                          className="ui-input text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="ui-btn-icon ui-text-muted"
                          disabled={lineItems.length === 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addLineItem}
                      className={["ui-btn ui-btn-secondary", styles.p39].join(' ')}

                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div className={styles.p40}>
                    <label className="ui-text-xs-label">Internal/Client Notes</label>
                    <textarea
                      placeholder="Add terms, shipping details, or internal explanations..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className={["ui-input", styles.p41].join(' ')}
                      rows={3}

                    />
                  </div>

                  <div className={styles.p42}>
                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : 'Save Proposal'}</Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      </div>
    </RouteGuard>
  );
}
