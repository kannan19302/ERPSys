'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column, type SortOrder,
  Modal, TextField, FormField, Select, KPICard, Tabs,
} from '@unerp/ui';
import {
  FileText, Plus, Search, DollarSign, Clock, CheckCircle, Send,
  Copy, Eye, Download, Trash2, Calendar,
} from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

interface QuotationLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  customerName: string;
  customerId?: string;
  issueDate: string;
  validUntil?: string;
  lineItems?: QuotationLineItem[];
  notes?: string;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const FALLBACK: Quotation[] = [
  { id: 'q1', quotationNumber: 'Q-2026-001', status: 'SENT', totalAmount: 45000, customerName: 'Stark Industries', issueDate: '2026-06-01', validUntil: '2026-07-01' },
  { id: 'q2', quotationNumber: 'Q-2026-002', status: 'DRAFT', totalAmount: 120000, customerName: 'Wayne Enterprises', issueDate: '2026-06-05', validUntil: '2026-07-05' },
  { id: 'q3', quotationNumber: 'Q-2026-003', status: 'ACCEPTED', totalAmount: 75000, customerName: 'Stark Industries', issueDate: '2026-06-10', validUntil: '2026-07-10' },
  { id: 'q4', quotationNumber: 'Q-2026-004', status: 'EXPIRED', totalAmount: 32000, customerName: 'Daily Planet', issueDate: '2026-05-01', validUntil: '2026-06-01' },
];

export default function CrmQuotationsPage() {
  const [allQuotations, setAllQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);

  // Create form
  const [form, setForm] = useState({ quotationNumber: '', customerName: '', validUntil: '', notes: '' });
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    { description: 'Professional Services', quantity: 1, unitPrice: 5000, taxRate: 0 },
  ]);
  const [creating, setCreating] = useState(false);
  const client = useApiClient();

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // NOTE: GET /sales/quotations accepts no query params at all (no search/page/limit/sort
  // support server-side) — see apps/api/src/modules/sales/sales.controller.ts. We fetch the
  // full list once and filter/sort/paginate client-side below.
  // Backend follow-up: add page/limit/sortBy/sortOrder/search/status support to getQuotations.
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const d = await client.get<any>('/sales/quotations');
      const list: Quotation[] = Array.isArray(d) ? d : (d?.data || []);
      setAllQuotations(list);
    } catch {
      setAllQuotations(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Client-side filter + sort + pagination (backend does not support these params yet)
  const filteredQuotations = allQuotations.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return q.quotationNumber.toLowerCase().includes(query) || q.customerName.toLowerCase().includes(query);
  });
  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'totalAmount') cmp = Number(a.totalAmount) - Number(b.totalAmount);
    else if (sortBy === 'quotationNumber') cmp = a.quotationNumber.localeCompare(b.quotationNumber);
    else if (sortBy === 'issueDate' || sortBy === 'createdAt') cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
    return sortOrder === 'desc' ? -cmp : cmp;
  });
  const totalCount = sortedQuotations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const data = sortedQuotations.slice((page - 1) * limit, page * limit);

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const convertToOrder = async (id: string) => {
    try {
      await client.post(`/sales/orders/${id}/convert`, {});
      setDetailOpen(false);
      setSelected(null);
      fetchQuotations();
    } catch {
      alert('Failed to convert quotation');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const total = lineItems.reduce((a, li) => a + li.quantity * li.unitPrice * (1 + li.taxRate / 100), 0);
      const newQ: Quotation = {
        id: `q-${Date.now()}`, quotationNumber: form.quotationNumber || `Q-${Date.now()}`,
        status: 'DRAFT', totalAmount: total, customerName: form.customerName,
        issueDate: new Date().toISOString().split('T')[0]!, validUntil: form.validUntil,
        lineItems, notes: form.notes,
      };
      setAllQuotations((prev) => [newQ, ...prev]);
      setCreateOpen(false);
      setForm({ quotationNumber: '', customerName: '', validUntil: '', notes: '' });
      setLineItems([{ description: 'Professional Services', quantity: 1, unitPrice: 5000, taxRate: 0 }]);
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const totalValue = sortedQuotations.reduce((a, q) => a + Number(q.totalAmount), 0);
  const draftCount = sortedQuotations.filter(q => q.status === 'DRAFT').length;
  const sentCount = sortedQuotations.filter(q => q.status === 'SENT').length;
  const acceptedValue = sortedQuotations.filter(q => q.status === 'ACCEPTED').reduce((a, q) => a + Number(q.totalAmount), 0);

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation', header: 'Quotation',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.style0}>
            <FileText size={16} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.quotationNumber}</div>
            <div className="ui-text-xs-tertiary">{row.customerName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount', header: 'Amount', align: 'right' as const, sortable: true,
      render: (row) => <span className="font-semibold">{fmtCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'issueDate', header: 'Issued', sortable: true,
      render: (row) => <span className="ui-text-xs-muted">{new Date(row.issueDate).toLocaleDateString()}</span>,
    },
    {
      key: 'validUntil', header: 'Valid Until', sortable: true,
      render: (row) => <span className="ui-text-xs-muted">{row.validUntil ? new Date(row.validUntil).toLocaleDateString() : '—'}</span>,
    },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '120px',
      render: (row) => (
        <div className={styles.style1}>
          <button title="View" onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true); }} className={styles.style2}><Eye size={14} /></button>
          <button title="Duplicate" onClick={(e) => { e.stopPropagation(); }} className={styles.style3}><Copy size={14} /></button>
          {row.status === 'DRAFT' && (
            <button title="Send" onClick={(e) => { e.stopPropagation(); }} className={styles.style4}><Send size={14} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Quotations"
          description="Create, send, and track customer quotes and proposals"
          breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Quotations' }]}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="outline" onClick={() => {}}><Download size={14} className="mr-2" /> Export</Button>
              <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Quotation</Button>
            </div>
          }
        />

        <div className="ui-grid-auto">
          <KPICard title="Total Pipeline" value={fmtCurrency(totalValue)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
          <KPICard title="Drafts" value={draftCount} icon={<FileText size={18} />} color="var(--color-warning)" />
          <KPICard title="Sent" value={sentCount} icon={<Send size={18} />} color="var(--color-info)" />
          <KPICard title="Won Value" value={fmtCurrency(acceptedValue)} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        </div>

        {/* Search + Filters */}
        <Card>
          <div className={styles.style5}>
            <div className={styles.style6}>
              <Search size={16} className={styles.style7} />
              <input type="text" placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)}
                className={styles.style8} />
            </div>
            <select value={`${sortBy}:${sortOrder}`} onChange={e => {
              const parts = e.target.value.split(':');
              if (parts[0] && parts[1]) {
                setSortBy(parts[0]);
                setSortOrder(parts[1] as 'asc' | 'desc');
              }
            }}
              className={styles.style9}>
              <option value="createdAt:desc">Newest First</option>
              <option value="totalAmount:desc">Amount (Highest)</option>
              <option value="quotationNumber:asc">Quote No. (A-Z)</option>
            </select>
            <div className="ui-flex ui-gap-2">
              {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED'].map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{ borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)', background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s1}>
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="none">
          <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.id}
            onRowClick={(r) => { setSelected(r); setDetailOpen(true); }}
            sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange}
            emptyTitle="No quotations" emptyMessage="Create your first quotation to start quoting customers." emptyIcon={<FileText size={48} />} />
          
          {totalPages > 1 && (
            <div className={styles.style10}>
              <span className="ui-text-xs-muted">
                Showing Page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="ui-flex ui-gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create Modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Quotation"
          description="Build a new quote with line items" size="lg"
          footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Draft'}</Button></>}
        >
          <form onSubmit={handleCreate} className="ui-stack-4">
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Quotation Number" placeholder="Q-2026-005" value={form.quotationNumber} onChange={(e) => setForm({ ...form, quotationNumber: e.target.value })} />
              <TextField label="Customer" placeholder="Customer name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="ui-grid-2 ui-gap-3">
              <TextField label="Valid Until" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              <TextField label="Notes" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className={styles.style11}>
              <div className="ui-flex-between mb-2">
                <span className={styles.style12}>LINE ITEMS</span>
                <Button variant="outline" type="button" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }])}>
                  <Plus size={12} className="mr-1" /> Add Line
                </Button>
              </div>
              <div className="ui-stack-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className={styles.style13}>
                    <input type="text" required placeholder="Description" value={item.description} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, description: e.target.value }; setLineItems(n); }}
                      className={styles.style14} />
                    <input type="number" required min="1" value={item.quantity} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, quantity: parseInt(e.target.value) || 0 }; setLineItems(n); }}
                      className={styles.style15} />
                    <input type="number" required min="0" step="0.01" value={item.unitPrice} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                      className={styles.style16} />
                    <input type="number" min="0" value={item.taxRate} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, taxRate: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                      className={styles.style17} />
                    <button type="button" onClick={() => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== idx)); }}
                      className={styles.style18}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className={styles.style19}>
                Total: {fmtCurrency(lineItems.reduce((a, li) => a + li.quantity * li.unitPrice * (1 + li.taxRate / 100), 0))}
              </div>
            </div>
          </form>
        </Modal>

        {/* Detail View Modal */}
        <Modal open={detailOpen} onClose={() => { setDetailOpen(false); setSelected(null); }} title={selected?.quotationNumber || 'Quotation'} size="md"
          footer={
            selected ? <>
              {selected.status === 'ACCEPTED' && <Button variant="primary" onClick={() => convertToOrder(selected.id)}>Convert to Sales Order</Button>}
              {selected.status === 'DRAFT' && <Button variant="primary" onClick={() => {}}><Send size={14} className="mr-2" /> Send to Customer</Button>}
              <Button variant="secondary" onClick={() => { setDetailOpen(false); setSelected(null); }}>Close</Button>
            </> : undefined
          }
        >
          {selected && (
            <div className="ui-stack-4">
              <div className="ui-grid-2">
                <div><div className="ui-text-xs-tertiary">Customer</div><div className="font-semibold">{selected.customerName}</div></div>
                <div><div className="ui-text-xs-tertiary">Status</div><StatusBadge status={selected.status} /></div>
                <div><div className="ui-text-xs-tertiary">Issue Date</div><div>{new Date(selected.issueDate).toLocaleDateString()}</div></div>
                <div><div className="ui-text-xs-tertiary">Valid Until</div><div>{selected.validUntil ? new Date(selected.validUntil).toLocaleDateString() : '—'}</div></div>
              </div>
              <div className={styles.style20}>
                <div className={styles.style21}>{fmtCurrency(selected.totalAmount)}</div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
