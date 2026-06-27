'use client';

import React, { useState, useMemo } from 'react';
import {
  PageHeader, StatusBadge, Button, Spinner, DashboardKPICard, DashboardChart,
  ViewSwitcher, type ViewMode, DataTable, type Column, Card, Modal, TextField,
  FormField, Select, Badge, Tabs,
} from '@unerp/ui';
import { useInvoices, useCustomers } from '../../../src/lib/hooks/useModuleData';
import { apiPost } from '../../../src/lib/api';
import {
  FileText, Search, DollarSign, Calendar, AlertCircle, Trash2,
  CheckCircle, CreditCard, Plus, ArrowRight,
  BookOpen, Receipt, Building2, PiggyBank, Calculator, BarChart3,
  Landmark, FileCheck, TrendingUp, Clock,
} from 'lucide-react';
import Link from 'next/link';

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

const fmtCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinancePage() {
  const { data: invoices = [], isLoading: loadingInvoices, error: invoiceError, refetch: refetchInvoices } = useInvoices();
  const { data: customers = [] } = useCustomers();
  const loading = loadingInvoices;
  const error = invoiceError ? 'Could not connect to API server.' : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ViewMode>('chart');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Invoice Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([{ description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }]);

  // Payment Modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const safeInvoices = Array.isArray(invoices) ? invoices as InvoiceData[] : [];
  const totalOutstanding = safeInvoices.reduce((acc, inv) => acc + (inv.status !== 'PAID' ? (inv.totalAmount - inv.paidAmount) : 0), 0);
  const totalReceived = safeInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const draftCount = safeInvoices.filter(inv => inv.status === 'DRAFT').length;
  const overdueCount = safeInvoices.filter(inv => inv.status === 'OVERDUE').length;

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    safeInvoices.forEach(inv => { counts[inv.status] = (counts[inv.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [safeInvoices]);

  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, number> = {};
    safeInvoices.forEach(inv => {
      const month = inv.issueDate ? inv.issueDate.substring(0, 7) : 'Unknown';
      months[month] = (months[month] || 0) + inv.totalAmount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  }, [safeInvoices]);

  const paymentCollectionData = useMemo(() => {
    const months: Record<string, { paid: number; outstanding: number }> = {};
    safeInvoices.forEach(inv => {
      const month = inv.issueDate ? inv.issueDate.substring(0, 7) : 'Unknown';
      if (!months[month]) months[month] = { paid: 0, outstanding: 0 };
      months[month]!.paid += inv.paidAmount;
      months[month]!.outstanding += (inv.totalAmount - inv.paidAmount);
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([name, vals]) => ({ name, paid: Math.round(vals.paid), outstanding: Math.round(vals.outstanding) }));
  }, [safeInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !customerId || !dueDate) { setModalError('All header fields are required'); return; }
    setSubmitting(true);
    setModalError(null);
    try {
      await apiPost('/finance/invoices', { invoiceNumber, customerId, dueDate, notes, lineItems });
      setCreateOpen(false);
      setInvoiceNumber(''); setCustomerId(''); setDueDate(''); setNotes('');
      setLineItems([{ description: 'Consulting Services', quantity: 1, unitPrice: 1000, taxRate: 15 }]);
      refetchInvoices();
    } catch { setModalError('Failed to create invoice. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;
    setSubmitting(true);
    setModalError(null);
    try {
      await apiPost('/finance/payments', {
        invoiceId: selectedInvoice.id, amount: Number(paymentAmount),
        method: paymentMethod, reference: paymentRef, notes: paymentNotes,
      });
      setPaymentOpen(false);
      setSelectedInvoice(null);
      refetchInvoices();
    } catch { setModalError('Failed to record payment.'); }
    finally { setSubmitting(false); }
  };

  const filteredInvoices = safeInvoices.filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || inv.invoiceNumber.toLowerCase().includes(query) || inv.customerName.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const invoiceColumns: Column<InvoiceData>[] = [
    {
      key: 'invoiceNumber', header: 'Invoice',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.invoiceNumber}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.customerName}</div>
        </div>
      ),
    },
    {
      key: 'dueDate', header: 'Due Date',
      render: (row) => (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} /> {row.dueDate}
        </span>
      ),
    },
    {
      key: 'totalAmount', header: 'Total', align: 'right' as const,
      render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'paidAmount', header: 'Paid', align: 'right' as const,
      render: (row) => <span style={{ color: 'var(--color-text-secondary)' }}>{fmtCurrency(row.paidAmount)}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions', header: '', align: 'right' as const, width: '100px',
      render: (row) => row.status !== 'PAID' && row.status !== 'VOID' ? (
        <Button variant="outline" onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setSelectedInvoice(row);
          setPaymentAmount(row.totalAmount - row.paidAmount);
          setPaymentRef(''); setPaymentNotes('');
          setPaymentOpen(true);
        }}>
          <CreditCard size={12} style={{ marginRight: 4 }} /> Pay
        </Button>
      ) : null,
    },
  ];

  const advancedLinks = [
    { title: 'Chart of Accounts', href: '/finance/advanced/chart-of-accounts', icon: BookOpen, desc: 'Account hierarchy & balances' },
    { title: 'Journal Entries', href: '/finance/advanced/journal-entries', icon: Receipt, desc: 'General ledger entries' },
    { title: 'Bank Accounts', href: '/finance/advanced/bank-accounts', icon: Landmark, desc: 'Bank reconciliation' },
    { title: 'Budgeting', href: '/finance/advanced/budgeting', icon: PiggyBank, desc: 'Budget vs actuals' },
    { title: 'Fixed Assets', href: '/finance/advanced/fixed-assets', icon: Building2, desc: 'Asset depreciation' },
    { title: 'Tax Engine', href: '/finance/advanced/tax-engine', icon: Calculator, desc: 'Tax rules & rates' },
    { title: 'Treasury', href: '/finance/advanced/treasury', icon: TrendingUp, desc: 'Cash & investments' },
    { title: 'Financial Reports', href: '/finance/advanced/reports', icon: BarChart3, desc: 'P&L, balance sheet' },
    { title: 'Financial Periods', href: '/finance/advanced/financial-periods', icon: Clock, desc: 'Period open/close' },
    { title: 'AP Automation', href: '/finance/advanced/ap-automation', icon: FileCheck, desc: 'Payables workflow' },
    { title: 'AR Automation', href: '/finance/advanced/ar-automation', icon: FileText, desc: 'Receivables workflow' },
    { title: 'Currency Revaluation', href: '/finance/advanced/currency-revaluation', icon: DollarSign, desc: 'FX gain/loss' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Finance & Accounting"
        description="Manage invoices, payments, and financial operations"
        breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Finance' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ViewSwitcher activeView={activeView} onViewChange={setActiveView} availableViews={['list', 'chart']} />
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} style={{ marginRight: 6 }} /> Create Invoice
            </Button>
          </div>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <DashboardKPICard title="Total Outstanding" value={fmtCurrency(totalOutstanding)} icon={<DollarSign size={18} />} color="#f59e0b" loading={loading}
          drillDown={{ modalTitle: 'Outstanding Invoices', columns: [
            { key: 'invoiceNumber', label: 'Invoice' }, { key: 'customerName', label: 'Customer' },
            { key: 'totalAmount', label: 'Total', render: (v) => fmtCurrency(Number(v)) }, { key: 'status', label: 'Status' },
          ], rows: safeInvoices.filter(i => i.status !== 'PAID').map(i => ({ ...i })) }}
        />
        <DashboardKPICard title="Total Received" value={fmtCurrency(totalReceived)} icon={<CheckCircle size={18} />} color="#22c55e" loading={loading}
          drillDown={{ modalTitle: 'Payments Received', columns: [
            { key: 'invoiceNumber', label: 'Invoice' }, { key: 'customerName', label: 'Customer' },
            { key: 'paidAmount', label: 'Paid', render: (v) => fmtCurrency(Number(v)) }, { key: 'status', label: 'Status' },
          ], rows: safeInvoices.filter(i => i.paidAmount > 0).map(i => ({ ...i })) }}
        />
        <DashboardKPICard title="Drafts" value={String(draftCount)} icon={<FileText size={18} />} color="#4f46e5" loading={loading}
          drillDown={{ modalTitle: 'Draft Invoices', columns: [
            { key: 'invoiceNumber', label: 'Invoice' }, { key: 'customerName', label: 'Customer' },
            { key: 'totalAmount', label: 'Total', render: (v) => fmtCurrency(Number(v)) },
          ], rows: safeInvoices.filter(i => i.status === 'DRAFT').map(i => ({ ...i })) }}
        />
        <DashboardKPICard title="Overdue" value={String(overdueCount)} icon={<AlertCircle size={18} />} color="#ef4444" loading={loading}
          drillDown={{ modalTitle: 'Overdue Invoices', columns: [
            { key: 'invoiceNumber', label: 'Invoice' }, { key: 'customerName', label: 'Customer' },
            { key: 'dueDate', label: 'Due Date' }, { key: 'totalAmount', label: 'Total', render: (v) => fmtCurrency(Number(v)) },
          ], rows: safeInvoices.filter(i => i.status === 'OVERDUE').map(i => ({ ...i })) }}
        />
      </div>

      {/* Chart View */}
      {activeView === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-4)' }}>
          <DashboardChart title="Revenue by Period" subtitle="Invoice totals by month" data={monthlyRevenueData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'revenue', name: 'Revenue' }] }}
            defaultChartType="bar" allowedChartTypes={['bar', 'line', 'area']} height={280} loading={loading} />
          <DashboardChart title="Invoice Status" subtitle="Status breakdown" data={statusChartData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'value', name: 'Count' }], valueKey: 'value', nameKey: 'name' }}
            defaultChartType="donut" allowedChartTypes={['pie', 'donut', 'bar']} height={280} loading={loading} />
          <DashboardChart title="Payment Collection" subtitle="Paid vs outstanding by month" data={paymentCollectionData}
            config={{ xAxisKey: 'name', series: [
              { dataKey: 'paid', name: 'Paid', color: '#22c55e' },
              { dataKey: 'outstanding', name: 'Outstanding', color: '#f59e0b' },
            ] }}
            defaultChartType="area" allowedChartTypes={['area', 'stacked-bar', 'line', 'composed']} height={280} loading={loading} />
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <>
          <Card>
            <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input type="text" placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
                    border: '1px solid', borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)',
                    background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  }}>
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="none">
            <DataTable columns={invoiceColumns} data={filteredInvoices} loading={loading} rowKey={(row) => row.id}
              emptyTitle="No invoices found" emptyMessage="Create your first invoice to start billing customers." emptyIcon={<FileText size={48} />} />
          </Card>
        </>
      )}

      {/* Advanced Finance Links */}
      <div>
        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Advanced Finance</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          {advancedLinks.map((link) => (
            <Link href={link.href} key={link.title} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)', cursor: 'pointer', transition: 'all var(--duration-fast) var(--ease-default)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <link.icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{link.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{link.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setModalError(null); }}
        title="Create Customer Invoice" description="Issue a new invoice with line items"
        size="lg" footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateInvoice as any} disabled={submitting}>
              {submitting ? <><Spinner size="sm" /> Creating...</> : 'Create Draft Invoice'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {modalError && (
            <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{modalError}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Invoice Number" required placeholder="INV-2026-004" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            <FormField label="Customer" required>
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select customer...</option>
                {(customers as CustomerData[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Due Date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <TextField label="Notes" placeholder="Thank you for your business!" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {/* Line Items */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>LINE ITEMS</span>
              <Button variant="outline" type="button" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }])}>
                <Plus size={12} style={{ marginRight: 4 }} /> Add Line
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 32px', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-semibold)' }}>
                <span>Description</span><span>Qty</span><span>Unit Price</span><span>Tax %</span><span />
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 32px', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input type="text" required placeholder="Description" value={item.description} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, description: e.target.value }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, quantity: parseInt(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" required min="0.01" step="0.01" placeholder="Price" value={item.unitPrice} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" required placeholder="Tax %" value={item.taxRate} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, taxRate: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <button type="button" onClick={() => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== idx)); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal open={paymentOpen} onClose={() => { setPaymentOpen(false); setModalError(null); }}
        title="Record Payment" description={selectedInvoice ? `Payment for ${selectedInvoice.invoiceNumber}` : ''}
        size="sm" footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentOpen(false)} disabled={submitting}>Cancel</Button>
            <Button variant="primary" onClick={handleRecordPayment as any} disabled={submitting}>
              {submitting ? <><Spinner size="sm" /> Processing...</> : 'Record Payment'}
            </Button>
          </>
        }
      >
        {selectedInvoice && (
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {modalError && (
              <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{modalError}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Amount</span>
                <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Already Paid</span>
                <span>{fmtCurrency(selectedInvoice.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Remaining</span>
                <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)' }}>{fmtCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
              </div>
            </div>
            <TextField label="Payment Amount ($)" type="number" required min={0.01} step={0.01} value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} />
            <FormField label="Payment Method">
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHECK">Check</option>
              </Select>
            </FormField>
            <TextField label="Reference ID" placeholder="TXN-1294801" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
            <TextField label="Notes" placeholder="Payment notes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
          </form>
        )}
      </Modal>
    </div>
  );
}
