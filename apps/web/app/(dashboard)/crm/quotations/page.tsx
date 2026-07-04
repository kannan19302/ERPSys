'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, StatusBadge, DataTable, type Column, type SortOrder,
  Modal, TextField, FormField, Select, KPICard, Tabs,
} from '@unerp/ui';
import {
  FileText, Plus, Search, DollarSign, Clock, CheckCircle, Send,
  Copy, Eye, Download, Trash2, Calendar,
} from 'lucide-react';

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

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/sales/quotations`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (res.ok) {
        const d = await res.json();
        const list: Quotation[] = Array.isArray(d) ? d : (d?.data || []);
        setAllQuotations(list);
      } else {
        setAllQuotations(FALLBACK);
      }
    } catch {
      setAllQuotations(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

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
    const token = getToken();
    try {
      const res = await fetch(`/api/v1/sales/orders/${id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        setDetailOpen(false);
        setSelected(null);
        fetchQuotations();
      } else {
        alert('Failed to convert quotation');
      }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.quotationNumber}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.customerName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount', header: 'Amount', align: 'right' as const, sortable: true,
      render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'issueDate', header: 'Issued', sortable: true,
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(row.issueDate).toLocaleDateString()}</span>,
    },
    {
      key: 'validUntil', header: 'Valid Until', sortable: true,
      render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{row.validUntil ? new Date(row.validUntil).toLocaleDateString() : '—'}</span>,
    },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions', header: '', align: 'right' as const, width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
          <button title="View" onClick={(e) => { e.stopPropagation(); setSelected(row); setDetailOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Eye size={14} /></button>
          <button title="Duplicate" onClick={(e) => { e.stopPropagation(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}><Copy size={14} /></button>
          {row.status === 'DRAFT' && (
            <button title="Send" onClick={(e) => { e.stopPropagation(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 4 }}><Send size={14} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Quotations"
        description="Create, send, and track customer quotes and proposals"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Quotations' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={() => {}}><Download size={14} style={{ marginRight: 6 }} /> Export</Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Quotation</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Pipeline" value={fmtCurrency(totalValue)} icon={<DollarSign size={18} />} color="var(--color-primary)" />
        <KPICard title="Drafts" value={draftCount} icon={<FileText size={18} />} color="var(--color-warning)" />
        <KPICard title="Sent" value={sentCount} icon={<Send size={18} />} color="var(--color-info)" />
        <KPICard title="Won Value" value={fmtCurrency(acceptedValue)} icon={<CheckCircle size={18} />} color="var(--color-success)" />
      </div>

      {/* Search + Filters */}
      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => {
            const parts = e.target.value.split(':');
            if (parts[0] && parts[1]) {
              setSortBy(parts[0]);
              setSortOrder(parts[1] as 'asc' | 'desc');
            }
          }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="createdAt:desc">Newest First</option>
            <option value="totalAmount:desc">Amount (Highest)</option>
            <option value="quotationNumber:asc">Quote No. (A-Z)</option>
          </select>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
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
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.id}
          onRowClick={(r) => { setSelected(r); setDetailOpen(true); }}
          sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange}
          emptyTitle="No quotations" emptyMessage="Create your first quotation to start quoting customers." emptyIcon={<FileText size={48} />} />
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Showing Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Quotation Number" placeholder="Q-2026-005" value={form.quotationNumber} onChange={(e) => setForm({ ...form, quotationNumber: e.target.value })} />
            <TextField label="Customer" placeholder="Customer name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Valid Until" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            <TextField label="Notes" placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)' }}>LINE ITEMS</span>
              <Button variant="outline" type="button" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0 }])}>
                <Plus size={12} style={{ marginRight: 4 }} /> Add Line
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {lineItems.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr 32px', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input type="text" required placeholder="Description" value={item.description} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, description: e.target.value }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" required min="1" value={item.quantity} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, quantity: parseInt(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" required min="0" step="0.01" value={item.unitPrice} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, unitPrice: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <input type="number" min="0" value={item.taxRate} onChange={(e) => { const n = [...lineItems]; n[idx] = { ...n[idx]!, taxRate: parseFloat(e.target.value) || 0 }; setLineItems(n); }}
                    style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', background: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }} />
                  <button type="button" onClick={() => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== idx)); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--space-3)', textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>
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
            {selected.status === 'DRAFT' && <Button variant="primary" onClick={() => {}}><Send size={14} style={{ marginRight: 6 }} /> Send to Customer</Button>}
            <Button variant="secondary" onClick={() => { setDetailOpen(false); setSelected(null); }}>Close</Button>
          </> : undefined
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Customer</div><div style={{ fontWeight: 'var(--weight-semibold)' }}>{selected.customerName}</div></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Status</div><StatusBadge status={selected.status} /></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Issue Date</div><div>{new Date(selected.issueDate).toLocaleDateString()}</div></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Valid Until</div><div>{selected.validUntil ? new Date(selected.validUntil).toLocaleDateString() : '—'}</div></div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', textAlign: 'right' }}>{fmtCurrency(selected.totalAmount)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
