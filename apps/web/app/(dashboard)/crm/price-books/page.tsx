'use client';

import { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, useToast, DataTable, type Column, type SortOrder } from '@unerp/ui';
import { BookOpen, Plus, X, DollarSign, CheckCircle, Search, Trash2 } from 'lucide-react';
import { apiDelete, ApiRequestError } from '../../../../src/lib/api';

interface PriceBook {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
  _count: { entries: number };
}

export default function PriceBooksPage() {
  const { success, error } = useToast();
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', currency: 'USD', isDefault: false, validFrom: '', validTo: '' });

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPriceBooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        sortBy,
        sortOrder,
      });
      if (isActive) queryParams.append('isActive', isActive);

      const res = await fetch(`/api/v1/crm/price-books?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const d = await res.json();
        if (d && typeof d === 'object' && 'data' in d) {
          setPriceBooks(d.data || []);
          setTotalCount(d.totalCount || 0);
          setTotalPages(d.totalPages || 0);
        } else {
          const list = Array.isArray(d) ? d : [];
          setPriceBooks(list);
          setTotalCount(list.length);
          setTotalPages(Math.ceil(list.length / limit));
        }
      } else {
        setPriceBooks([
          { id: '1', name: 'Standard Price List', description: 'Default pricing', currency: 'USD', isDefault: true, isActive: true, validFrom: null, validTo: null, _count: { entries: 12 } },
          { id: '2', name: 'Enterprise Discount', description: 'Enterprise tier pricing', currency: 'USD', isDefault: false, isActive: true, validFrom: null, validTo: null, _count: { entries: 8 } },
        ]);
        setTotalCount(2);
        setTotalPages(1);
      }
    } catch {
      setPriceBooks([
        { id: '1', name: 'Standard Price List', description: 'Default pricing', currency: 'USD', isDefault: true, isActive: true, validFrom: null, validTo: null, _count: { entries: 12 } },
      ]);
      setTotalCount(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceBooks();
  }, [page, debouncedSearch, isActive, sortBy, sortOrder]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const payload = {
        ...formData,
        description: formData.description.trim() || undefined,
        validFrom: formData.validFrom || undefined,
        validTo: formData.validTo || undefined,
      };
      const res = await fetch('/api/v1/crm/price-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormData({ name: '', description: '', currency: 'USD', isDefault: false, validFrom: '', validTo: '' });
        success('Price book created successfully.');
        fetchPriceBooks();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.message || 'Failed to create price book.';
        error(errMsg);
      }
    } catch (err: any) {
      error(err.message || 'An error occurred while creating price book.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSortChange = (key: string, order: SortOrder) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleDelete = async (pb: PriceBook) => {
    if (!window.confirm(`Delete price book "${pb.name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/crm/price-books/${pb.id}`);
      success('Price book deleted.');
      fetchPriceBooks();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'Failed to delete price book.';
      error(message);
    }
  };

  const columns: Column<PriceBook>[] = [
    {
      key: 'name', header: 'Name', sortable: true,
      render: (pb) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 'var(--weight-semibold)' }}>{pb.name}</span>
          {pb.isDefault && <Badge variant="success">Default</Badge>}
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (pb) => pb.description || '-' },
    { key: 'currency', header: 'Currency', render: (pb) => <span><DollarSign size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {pb.currency}</span> },
    { key: 'entries', header: 'Products', align: 'center', render: (pb) => pb._count?.entries || 0 },
    { key: 'isActive', header: 'Status', align: 'center', sortable: true, render: (pb) => <Badge variant={pb.isActive ? 'success' : 'default'}>{pb.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions', header: 'Actions', align: 'center', width: '90px',
      render: (pb) => (
        <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'center' }}>
          <button title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(pb); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-danger, #dc2626)', padding: 'var(--space-1)' }}><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  if (loading && priceBooks.length === 0) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader
        title="Price Books"
        description="Manage pricing lists for products and services"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Price Books' }]}
        actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Price Book</Button>}
      />

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text" placeholder="Search price books..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          />
        </div>
        <select value={isActive} onChange={e => { setIsActive(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select value={`${sortBy}:${sortOrder}`} onChange={e => {
          const parts = e.target.value.split(':');
          if (parts[0] && parts[1]) {
            setSortBy(parts[0]);
            setSortOrder(parts[1] as 'asc' | 'desc');
          }
        }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="createdAt:desc">Newest First</option>
          <option value="name:asc">Name (A-Z)</option>
        </select>
      </div>

      <Card padding="none">
        <DataTable<PriceBook>
          columns={columns}
          data={priceBooks}
          loading={loading}
          rowKey={(pb) => pb.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          emptyTitle="No price books yet"
          emptyMessage="Create one to manage product pricing."
          emptyIcon={<BookOpen size={48} />}
        />
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

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>New Price Book</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', marginBottom: 4 }}>Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                    <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="INR">INR</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingTop: 24 }}>
                  <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} id="isDefault" />
                  <label htmlFor="isDefault" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Set as default</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
