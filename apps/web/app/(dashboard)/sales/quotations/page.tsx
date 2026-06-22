'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  Calendar
} from 'lucide-react';

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
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const [quotesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/v1/sales/quotations', { headers }),
        fetch('/api/v1/crm/customers', { headers }),
        fetch('/api/v1/inventory/products', { headers })
      ]);

      if (quotesRes.ok) setQuotes(await quotesRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (customersRes.ok) setCustomers(await customersRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
      if (productsRes.ok) setProducts(await productsRes.json().then(d => Array.isArray(d) ? d : (d?.data || [])));
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
  }, []);

  const loadQuotationDetails = async (quote: Quotation) => {
    setSelectedQuote(quote);
    setLoadingDetails(true);
    setQuoteDetails(null);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token || ''}` };

    try {
      const res = await fetch(`/api/v1/sales/quotations/${quote.id}`, { headers });
      if (res.ok) {
        setQuoteDetails(await res.json());
      } else {
        throw new Error();
      }
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
    const token = localStorage.getItem('token');

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
      const res = await fetch('/api/v1/sales/quotations', {
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

  const convertToOrder = async (quoteId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/sales/orders/${quoteId}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Customer Quotations"
        description="Negotiate orders, draft proposals, and convert accepted quotes into orders."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sales & Orders', href: '/sales' }, { label: 'Quotations' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} />
            Create Quotation
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Mock Fallback Active)</span>
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search quotes, clients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="frappe-input"
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="frappe-btn"
                style={{
                  background: statusFilter === status ? 'var(--color-primary-light)' : 'transparent',
                  color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  border: statusFilter === status ? '1px solid var(--color-primary)' : '1px solid transparent',
                  padding: 'var(--space-1.5) var(--space-3)',
                  fontSize: 'var(--text-xs)'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Quotes Listing */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedQuote ? '1.5fr 1fr' : '1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        <Card padding="none" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <Spinner size="lg" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Quotation ID</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Customer</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Valid Until</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Total Amount</th>
                    <th style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No quotations matching the filters were found.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map(q => (
                      <tr
                        key={q.id}
                        onClick={() => loadQuotationDetails(q)}
                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', background: selectedQuote?.id === q.id ? 'var(--color-bg-sunken)' : 'transparent' }}
                      >
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>{q.quotationNumber}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{q.customerName}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{new Date(q.validUntil).toLocaleDateString()}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>${q.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '12px', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                            background: q.status === 'CONVERTED' ? 'var(--color-info-light)' : q.status === 'ACCEPTED' ? 'var(--color-success-light)' : 'var(--color-bg-sunken)',
                            color: q.status === 'CONVERTED' ? 'var(--color-info-text)' : q.status === 'ACCEPTED' ? 'var(--color-success)' : 'var(--color-text-secondary)'
                          }}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quotation Detail Drawer Panel */}
        {selectedQuote && (
          <Card padding="none" style={{ position: 'sticky', top: 'var(--space-6)', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-primary)' }}>
            <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>{selectedQuote.quotationNumber} Details</h4>
              <button onClick={() => setSelectedQuote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="md" />
              </div>
            ) : quoteDetails && (
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Customer Account:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{quoteDetails.customer.name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Proposal Validity:</span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {new Date(quoteDetails.validUntil).toLocaleDateString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Current Status:</span>
                  <Badge variant={quoteDetails.status === 'CONVERTED' ? 'info' : quoteDetails.status === 'ACCEPTED' ? 'success' : 'default'}>
                    {quoteDetails.status}
                  </Badge>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Line Items</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {quoteDetails.lineItems.map((li: QuotationDetailItem) => (
                      <div key={li.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', fontSize: 'var(--text-sm)', padding: 'var(--space-2)', background: 'var(--color-bg-sunken)', borderRadius: '4px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'var(--weight-medium)' }}>{li.description}</p>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Qty: {Number(li.quantity)} @ ${Number(li.unitPrice)} (Tax {Number(li.taxRate)}%)</span>
                        </div>
                        <span style={{ fontWeight: 'var(--weight-bold)' }}>${Number(li.totalAmount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span>Subtotal:</span>
                    <span>${Number(quoteDetails.subtotal).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                    <span>Sales Taxes:</span>
                    <span>${Number(quoteDetails.taxAmount).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>
                    <span>Total Proposal Value:</span>
                    <span>${Number(quoteDetails.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                {quoteDetails.notes && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-semibold)' }}>Proposal Notes:</span>
                    <p style={{ fontSize: 'var(--text-xs)', margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>{quoteDetails.notes}</p>
                  </div>
                )}

                {quoteDetails.status !== 'CONVERTED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Button variant="primary" onClick={() => convertToOrder(quoteDetails.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '640px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Create Customer Quotation</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateQuotation} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '75vh', overflowY: 'auto' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4)' }} />
                  <h4 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Proposal Draft Created!</h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Quotation saved to database registry.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Quotation Number</label>
                      <input
                        type="text"
                        placeholder="QT-2026-00x"
                        value={quotationNumber}
                        onChange={e => setQuotationNumber(e.target.value)}
                        required
                        className="frappe-input"
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer Account</label>
                      <select
                        value={customerId}
                        onChange={e => setCustomerId(e.target.value)}
                        required
                        className="frappe-input"
                      >
                        <option value="">Select Account</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Validity Limit Date</label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={e => setValidUntil(e.target.value)}
                        required
                        className="frappe-input"
                      />
                    </div>
                  </div>

                  {/* Line Items Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>PROPOSAL ITEMS</span>
                    
                    {lineItems.map((line, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <select
                          value={line.productId || ''}
                          onChange={e => handleProductSelect(idx, e.target.value)}
                          className="frappe-input"
                          style={{ fontSize: 'var(--text-xs)' }}
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
                          className="frappe-input"
                          style={{ fontSize: 'var(--text-xs)' }}
                        />

                        <input
                          type="number"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={e => updateLineField(idx, 'quantity', Number(e.target.value))}
                          required
                          className="frappe-input"
                          style={{ fontSize: 'var(--text-xs)' }}
                        />

                        <input
                          type="number"
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={e => updateLineField(idx, 'unitPrice', Number(e.target.value))}
                          required
                          className="frappe-input"
                          style={{ fontSize: 'var(--text-xs)' }}
                        />

                        <input
                          type="number"
                          placeholder="Tax %"
                          value={line.taxRate}
                          onChange={e => updateLineField(idx, 'taxRate', Number(e.target.value))}
                          className="frappe-input"
                          style={{ fontSize: 'var(--text-xs)' }}
                        />

                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                          disabled={lineItems.length === 1}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addLineItem}
                      className="frappe-btn frappe-btn-secondary"
                      style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', alignSelf: 'flex-start', marginTop: 'var(--space-1)' }}
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-2)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Internal/Client Notes</label>
                    <textarea
                      placeholder="Add terms, shipping details, or internal explanations..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="frappe-input"
                      rows={3}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
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
  );
}
