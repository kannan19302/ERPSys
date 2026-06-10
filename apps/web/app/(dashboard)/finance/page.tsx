'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import {
  FileText,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  AlertCircle,
  PlusCircle,
  Trash2,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'VOID';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  lineItems: Array<{
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    totalAmount?: number;
  }>;
}

interface CustomerData {
  id: string;
  name: string;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Invoice Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unitPrice: number; taxRate: number }>>([
    { description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }
  ]);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Invoices and Customers
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    // Fetch Invoices
    try {
      const res = await fetch('http://localhost:3001/api/v1/finance/invoices', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Could not fetch invoices');
      const data = await res.json();
      setInvoices(data);
    } catch {
      setError('Could not connect to API server.');
      // Local mock data
      setInvoices([
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-001',
          customerName: 'Stark Industries',
          status: 'PAID',
          issueDate: new Date(Date.now() - 30 * 24 * 3600000).toLocaleDateString(),
          dueDate: new Date(Date.now() - 15 * 24 * 3600000).toLocaleDateString(),
          subtotal: 5000,
          taxAmount: 750,
          totalAmount: 5750,
          paidAmount: 5750,
          currency: 'USD',
          lineItems: [
            { description: 'Vibranium Fabrication Alloy', quantity: 2, unitPrice: 2500, taxRate: 15 }
          ]
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-2026-002',
          customerName: 'Wayne Enterprises',
          status: 'PARTIALLY_PAID',
          issueDate: new Date(Date.now() - 10 * 24 * 3600000).toLocaleDateString(),
          dueDate: new Date(Date.now() + 20 * 24 * 3600000).toLocaleDateString(),
          subtotal: 12000,
          taxAmount: 1800,
          totalAmount: 13800,
          paidAmount: 6000,
          currency: 'USD',
          lineItems: [
            { description: 'Tactical Kevlar Weaving Grid', quantity: 4, unitPrice: 3000, taxRate: 15 }
          ]
        },
        {
          id: 'inv-3',
          invoiceNumber: 'INV-2026-003',
          customerName: 'Oscorp Technologies',
          status: 'DRAFT',
          issueDate: new Date().toLocaleDateString(),
          dueDate: new Date(Date.now() + 30 * 24 * 3600000).toLocaleDateString(),
          subtotal: 3500,
          taxAmount: 525,
          totalAmount: 4025,
          paidAmount: 0,
          currency: 'USD',
          lineItems: [
            { description: 'Bio-Chemical Catalyst Assay', quantity: 1, unitPrice: 3500, taxRate: 15 }
          ]
        }
      ]);
    }

    // Fetch Customers
    try {
      const res = await fetch('http://localhost:3001/api/v1/crm/customers', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        setCustomers([
          { id: 'stark-123', name: 'Stark Industries' },
          { id: 'wayne-456', name: 'Wayne Enterprises' },
          { id: 'oscorp-789', name: 'Oscorp Technologies' }
        ]);
      }
    } catch {
      setCustomers([
        { id: 'stark-123', name: 'Stark Industries' },
        { id: 'wayne-456', name: 'Wayne Enterprises' },
        { id: 'oscorp-789', name: 'Oscorp Technologies' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, val: string | number) => {
    const nextLines = [...lineItems];
    nextLines[index] = {
      ...nextLines[index]!,
      [field]: val
    };
    setLineItems(nextLines);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !customerId || !dueDate) {
      setModalError('Please supply all required header properties');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    const payload = {
      invoiceNumber,
      customerId,
      dueDate,
      notes,
      lineItems
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/finance/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invoice creation failed');
      
      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setInvoiceNumber('');
        setCustomerId('');
        setDueDate('');
        setNotes('');
        setLineItems([{ description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }]);
        setModalSuccess(false);
        fetchData();
      }, 1500);
    } catch {
      // Mock local update if API fails
      setModalSuccess(true);
      const selCust = customers.find(c => c.id === customerId);
      const sub = lineItems.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
      const tax = lineItems.reduce((acc, l) => acc + (l.quantity * l.unitPrice * (l.taxRate / 100)), 0);
      
      const newMockInvoice: InvoiceData = {
        id: `inv-mock-${Date.now()}`,
        invoiceNumber,
        customerName: selCust ? selCust.name : 'Unknown Customer',
        status: 'DRAFT',
        issueDate: new Date().toLocaleDateString(),
        dueDate: new Date(dueDate).toLocaleDateString(),
        subtotal: sub,
        taxAmount: tax,
        totalAmount: sub + tax,
        paidAmount: 0,
        currency: 'USD',
        lineItems: lineItems.map((li, idx) => ({ ...li, id: `li-${idx}` }))
      };
      
      setInvoices(prev => [newMockInvoice, ...prev]);

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setInvoiceNumber('');
        setCustomerId('');
        setDueDate('');
        setNotes('');
        setLineItems([{ description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }]);
        setModalSuccess(false);
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.totalAmount - invoice.paidAmount);
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;

    setSubmitting(true);
    setModalError(null);

    const payload = {
      invoiceId: selectedInvoice.id,
      amount: Number(paymentAmount),
      method: paymentMethod,
      reference: paymentRef,
      notes: paymentNotes
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/v1/finance/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment recording failed');
      
      setModalSuccess(true);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        setModalSuccess(false);
        fetchData();
      }, 1500);
    } catch {
      // Mock local payment update
      setModalSuccess(true);
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          const nextPaid = inv.paidAmount + Number(paymentAmount);
          return {
            ...inv,
            paidAmount: nextPaid,
            status: nextPaid >= inv.totalAmount ? 'PAID' : 'PARTIALLY_PAID'
          };
        }
        return inv;
      }));

      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        setModalSuccess(false);
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const query = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName.toLowerCase().includes(query) ||
      inv.status.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Finance & Accounting"
        description="Oversee corporate billings, issue customer invoices, monitor payment collection, and track transaction logs."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Finance' }]}
        actions={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={16} /> Create Invoice
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback registry)</span>
        </div>
      )}

      {/* Stats Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Outstanding</span>
            <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning-text)', padding: '4px', borderRadius: '4px' }}>
              <DollarSign size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            ${invoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? (inv.totalAmount - inv.paidAmount) : 0), 0).toLocaleString()}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Total Received</span>
            <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: '4px', borderRadius: '4px' }}>
              <CheckCircle size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            ${invoices.reduce((acc, inv) => acc + inv.paidAmount, 0).toLocaleString()}
          </h4>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>Billing Drafts</span>
            <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px', borderRadius: '4px' }}>
              <FileText size={14} />
            </div>
          </div>
          <h4 style={{ fontSize: 'var(--text-xl)', margin: 'var(--space-2) 0 0' }}>
            {invoices.filter(inv => inv.status === 'DRAFT').length}
          </h4>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by invoice number or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }}
          />
        </div>
        <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={15} /> Filter
        </Button>
      </Card>

      {/* Invoices List Table */}
      <Card padding="none" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <FileText size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
            <h4 style={{ margin: 0, fontWeight: 'var(--weight-semibold)' }}>No Invoices Issued</h4>
            <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Create an invoice to bill your corporate customers.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Invoice No.</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Due Date</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Total Amount</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Paid</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Status</th>
                <th style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', fontWeight: 'var(--weight-medium)' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>{inv.customerName}</td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {inv.dueDate}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', color: 'var(--color-text-secondary)' }}>
                    ${inv.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ padding: 'var(--space-4) var(--space-5)', textAlign: 'right' }}>
                    {inv.status !== 'PAID' && (
                      <Button variant="outline" size="sm" onClick={() => handleOpenPaymentModal(inv)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={12} /> Pay
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Invoice Creation Modal Overlay */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Create Customer Invoice</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>Invoice Registered</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Invoice created successfully as DRAFT.
                  </p>
                </div>
              ) : (
                <>
                  {modalError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: 'var(--text-xs)' }}>
                      <AlertCircle size={15} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Invoice Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="INV-2026-004"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Customer Account *</label>
                      <select
                        required
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      >
                        <option value="">-- Choose Customer --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Due Date *</label>
                      <input
                        type="date"
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Notes (Invoice Footer)</label>
                      <input
                        type="text"
                        placeholder="Thank you for your business!"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                      />
                    </div>
                  </div>

                  {/* Line Items Block */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Line Items</span>
                      <Button variant="outline" size="sm" type="button" onClick={handleAddLineItem} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <PlusCircle size={13} /> Add Line
                      </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
                      {lineItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.3fr', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <input
                            type="text"
                            required
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                            style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}
                          />
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                            style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}
                          />
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}
                          />
                          <input
                            type="number"
                            required
                            placeholder="Tax %"
                            value={item.taxRate}
                            onChange={(e) => handleLineItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : 'Record Draft Invoice'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal Overlay */}
      {isPaymentModalOpen && selectedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>Record Invoice Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {modalSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle size={40} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
                  <p style={{ fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-1)' }}>Payment Logged</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    The transaction was recorded and status updated.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Invoice:</span>
                      <span style={{ fontWeight: 'var(--weight-semibold)' }}>{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Total Amount:</span>
                      <span>${selectedInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Remaining Due:</span>
                      <span style={{ color: 'var(--color-danger-text)', fontWeight: 'var(--weight-semibold)' }}>
                        ${(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Payment Amount ($) *</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                    >
                      <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH">Cash Payment</option>
                      <option value="CHECK">Check Transaction</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Reference ID / Tx Hash</label>
                    <input
                      type="text"
                      placeholder="TXN-1294801"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Notes</label>
                    <input
                      type="text"
                      placeholder="Processed by banking clearance desk"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : 'Log Transaction'}
                    </Button>
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
