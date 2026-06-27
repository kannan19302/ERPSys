'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader, StatusBadge, Button, Spinner, DashboardKPICard, DashboardChart, ViewSwitcher, type ViewMode } from '@unerp/ui';
import { useInvoices, useCustomers } from '../../../src/lib/hooks/useModuleData';
import { apiPost } from '../../../src/lib/api';
import {
  FileText,
  Search,
  DollarSign,
  Calendar,
  AlertCircle,
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
  const { data: invoices = [], isLoading: loadingInvoices, error: invoiceError, refetch: refetchInvoices } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const loading = loadingInvoices;
  const error = invoiceError ? 'Could not connect to API server.' : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');

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

  const fetchData = () => refetchInvoices();

  // ── Computed stats ──
  const safeInvoices = Array.isArray(invoices) ? invoices as InvoiceData[] : [];

  const totalOutstanding = safeInvoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? (inv.totalAmount - inv.paidAmount) : 0), 0);
  const totalReceived = safeInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const draftCount = safeInvoices.filter(inv => inv.status === 'DRAFT').length;
  const overdueCount = safeInvoices.filter(inv => inv.status === 'OVERDUE').length;

  // ── Chart data computed from real invoices ──
  const statusChartData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    safeInvoices.forEach(inv => {
      statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [safeInvoices]);

  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, number> = {};
    safeInvoices.forEach(inv => {
      const month = inv.issueDate ? inv.issueDate.substring(0, 7) : 'Unknown';
      months[month] = (months[month] || 0) + inv.totalAmount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  }, [safeInvoices]);

  const paymentCollectionData = useMemo(() => {
    const months: Record<string, { paid: number; outstanding: number }> = {};
    safeInvoices.forEach(inv => {
      const month = inv.issueDate ? inv.issueDate.substring(0, 7) : 'Unknown';
      if (!months[month]) months[month] = { paid: 0, outstanding: 0 };
      months[month].paid += inv.paidAmount;
      months[month].outstanding += (inv.totalAmount - inv.paidAmount);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, vals]) => ({ name, paid: Math.round(vals.paid), outstanding: Math.round(vals.outstanding) }));
  }, [safeInvoices]);

  // ── Handlers ──
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, val: string | number) => {
    const nextLines = [...lineItems];
    nextLines[index] = { ...nextLines[index]!, [field]: val };
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

    try {
      await apiPost('/finance/invoices', { invoiceNumber, customerId, dueDate, notes, lineItems });
      setModalSuccess(true);
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setInvoiceNumber(''); setCustomerId(''); setDueDate(''); setNotes('');
        setLineItems([{ description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }]);
        setModalSuccess(false);
        fetchData();
      }, 1500);
    } catch {
      setModalError('Action could not be completed. Please try again.');
      setSubmitting(false);
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

    try {
      await apiPost('/finance/payments', {
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentRef,
        notes: paymentNotes
      });
      setModalSuccess(true);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        setModalSuccess(false);
        fetchData();
      }, 1500);
    } catch {
      setModalError('Action could not be completed. Please try again.');
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInvoices = safeInvoices.filter(inv => {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Create Invoice
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* KPI Cards with drill-down */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard
          title="Total Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          icon={<DollarSign size={18} />}
          color="#f59e0b"
          loading={loading}
          drillDown={{
            modalTitle: 'Outstanding Invoices',
            columns: [
              { key: 'invoiceNumber', label: 'Invoice No.' },
              { key: 'customerName', label: 'Customer' },
              { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'paidAmount', label: 'Paid', render: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'status', label: 'Status' },
            ],
            rows: safeInvoices.filter(i => i.status !== 'PAID').map(i => ({ ...i })),
          }}
        />
        <DashboardKPICard
          title="Total Received"
          value={`$${totalReceived.toLocaleString()}`}
          icon={<CheckCircle size={18} />}
          color="#22c55e"
          loading={loading}
          drillDown={{
            modalTitle: 'Paid Invoices',
            columns: [
              { key: 'invoiceNumber', label: 'Invoice No.' },
              { key: 'customerName', label: 'Customer' },
              { key: 'paidAmount', label: 'Amount Paid', render: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'status', label: 'Status' },
            ],
            rows: safeInvoices.filter(i => i.paidAmount > 0).map(i => ({ ...i })),
          }}
        />
        <DashboardKPICard
          title="Billing Drafts"
          value={String(draftCount)}
          icon={<FileText size={18} />}
          color="#4f46e5"
          loading={loading}
          drillDown={{
            modalTitle: 'Draft Invoices',
            columns: [
              { key: 'invoiceNumber', label: 'Invoice No.' },
              { key: 'customerName', label: 'Customer' },
              { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
            ],
            rows: safeInvoices.filter(i => i.status === 'DRAFT').map(i => ({ ...i })),
          }}
        />
        <DashboardKPICard
          title="Overdue"
          value={String(overdueCount)}
          icon={<AlertCircle size={18} />}
          color="#ef4444"
          loading={loading}
          drillDown={{
            modalTitle: 'Overdue Invoices',
            columns: [
              { key: 'invoiceNumber', label: 'Invoice No.' },
              { key: 'customerName', label: 'Customer' },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'totalAmount', label: 'Total', render: (v) => `$${Number(v).toLocaleString()}` },
            ],
            rows: safeInvoices.filter(i => i.status === 'OVERDUE').map(i => ({ ...i })),
          }}
        />
      </div>

      {/* Charts Section — only in Chart view */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart
            title="Revenue by Period"
            subtitle="Invoice totals grouped by issue month"
            data={monthlyRevenueData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'revenue', name: 'Revenue' }] }}
            defaultChartType="bar"
            allowedChartTypes={['bar', 'line', 'area']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Invoice Status Distribution"
            subtitle="Breakdown of all invoice statuses"
            data={statusChartData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut"
            allowedChartTypes={['pie', 'donut', 'bar']}
            height={280}
            loading={loading}
          />
          <DashboardChart
            title="Payment Collection Trend"
            subtitle="Paid vs outstanding amounts by month"
            data={paymentCollectionData}
            config={{
              xAxisKey: 'name',
              series: [
                { dataKey: 'paid', name: 'Paid', color: '#22c55e' },
                { dataKey: 'outstanding', name: 'Outstanding', color: '#f59e0b' },
              ]
            }}
            defaultChartType="area"
            allowedChartTypes={['area', 'stacked-bar', 'line', 'composed']}
            height={280}
            loading={loading}
          />
        </div>
      )}

      {/* List View — Search + Table */}
      {activeView === 'list' && (
        <>
          {/* Search Panel */}
          <div className="frappe-card" style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                className="frappe-input"
                placeholder="Search by invoice number or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 'var(--space-9)' }}
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="frappe-card" style={{ padding: 0, overflowX: 'auto' }}>
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
          </div>
        </>
      )}

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
                    <div className="frappe-form-group">
                      <label className="frappe-label">Invoice Number *</label>
                      <input type="text" required className="frappe-input" placeholder="INV-2026-004" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Customer Account *</label>
                      <select required className="frappe-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                        <option value="">-- Choose Customer --</option>
                        {(customers as CustomerData[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Due Date *</label>
                      <input type="date" required className="frappe-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div className="frappe-form-group">
                      <label className="frappe-label">Notes (Invoice Footer)</label>
                      <input type="text" className="frappe-input" placeholder="Thank you for your business!" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  {/* Line Items Block */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>Line Items</span>
                      <Button variant="outline" size="sm" type="button" onClick={handleAddLineItem} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Add Line
                      </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
                      {lineItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.3fr', gap: 'var(--space-2)', alignItems: 'center' }}>
                          <input type="text" required className="frappe-input" placeholder="Description" value={item.description} onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)} />
                          <input type="number" required min="1" className="frappe-input" placeholder="Qty" value={item.quantity} onChange={(e) => handleLineItemChange(idx, 'quantity', parseInt(e.target.value) || 0)} />
                          <input type="number" required min="0.01" step="0.01" className="frappe-input" placeholder="Price" value={item.unitPrice} onChange={(e) => handleLineItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                          <input type="number" required className="frappe-input" placeholder="Tax %" value={item.taxRate} onChange={(e) => handleLineItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)} />
                          <button type="button" onClick={() => handleRemoveLineItem(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
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
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>The transaction was recorded and status updated.</p>
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

                  <div className="frappe-form-group">
                    <label className="frappe-label">Payment Amount ($) *</label>
                    <input type="number" required min="0.01" step="0.01" className="frappe-input" max={selectedInvoice.totalAmount - selectedInvoice.paidAmount} value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Payment Method</label>
                    <select className="frappe-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH">Cash Payment</option>
                      <option value="CHECK">Check Transaction</option>
                    </select>
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Reference ID / Tx Hash</label>
                    <input type="text" className="frappe-input" placeholder="TXN-1294801" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
                  </div>

                  <div className="frappe-form-group">
                    <label className="frappe-label">Notes</label>
                    <input type="text" className="frappe-input" placeholder="Processed by banking clearance desk" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <Button variant="outline" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
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
