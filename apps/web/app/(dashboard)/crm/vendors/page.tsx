'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Card, Button, Spinner, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, Badge, useToast,
} from '@unerp/ui';
import {
  Building, Plus, Search, Mail, Phone, DollarSign, Users,
  Download, Trash2, Edit, AlertCircle, ShieldAlert, CheckCircle,
  MapPin, HelpCircle, FileText
} from 'lucide-react';
import { apiPost, apiPut, apiDelete, ApiRequestError } from '../../../../src/lib/api';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  type: string;
  paymentTerms: number;
  status: string;
  notes: string | null;
  address: Address | null;
  createdAt: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function VendorsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  
  // Data list states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Selection & Bulk actions states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('ACTIVE');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    type: 'COMPANY',
    paymentTerms: '30',
    notes: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Edit Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    type: 'COMPANY',
    paymentTerms: '30',
    notes: '',
    status: 'ACTIVE',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        status,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/v1/crm/vendors?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        const d = await res.json();
        if (d && typeof d === 'object' && 'data' in d) {
          // Client filter by vendor type since backend pagination filters mainly by status & search
          const list: Vendor[] = d.data || [];
          const filtered = type ? list.filter(v => v.type === type) : list;
          setVendors(filtered);
          setTotalCount(d.totalCount || 0);
          setTotalPages(d.totalPages || 0);
        } else {
          const list = Array.isArray(d) ? d : [];
          const filtered = type ? list.filter(v => v.type === type) : list;
          setVendors(filtered);
          setTotalCount(filtered.length);
          setTotalPages(Math.ceil(filtered.length / limit));
        }
      }
    } catch (err: any) {
      error('Failed to load vendors list.');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, status, type, sortBy, sortOrder, error]);

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, status, type, sortBy, sortOrder]);

  // Bulk operation handlers
  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(vendors.map(v => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await apiPost('/crm/vendors/bulk-status', { ids: selectedIds, status: bulkStatus });
      success(`Successfully updated status for ${selectedIds.length} vendors.`);
      setSelectedIds([]);
      setBulkStatusOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred during bulk operation.';
      error(message);
    } finally {
      setBulkUpdating(false);
    }
  };

  // CSV Export handler
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        status,
      });
      const res = await fetch(`/api/v1/crm/vendors-export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        const csvRows = [];
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Tax ID', 'Type', 'Status', 'Payment Terms', 'Notes', 'Created At'];
        csvRows.push(headers.join(','));

        data.forEach((v: any) => {
          const values = [
            v.id,
            `"${v.name.replace(/"/g, '""')}"`,
            v.email || '',
            v.phone || '',
            v.taxId || '',
            v.type || '',
            v.status || '',
            v.paymentTerms || 30,
            `"${(v.notes || '').replace(/"/g, '""')}"`,
            v.createdAt
          ];
          csvRows.push(values.join(','));
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('Vendors CSV exported successfully.');
      } else {
        error('Failed to export vendor data.');
      }
    } catch {
      error('An error occurred during vendor data export.');
    }
  };

  // Create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      error('Company Name is required.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        type: form.type,
        paymentTerms: Number(form.paymentTerms),
        notes: form.notes.trim() || undefined,
        address: (form.street || form.city || form.state || form.postalCode || form.country) ? {
          street: form.street.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.trim() || undefined,
        } : undefined,
      };

      await apiPost('/crm/vendors', payload);
      setCreateOpen(false);
      setForm({
        name: '', email: '', phone: '', taxId: '', type: 'COMPANY',
        paymentTerms: '30', notes: '', street: '', city: '', state: '',
        postalCode: '', country: '',
      });
      success('Vendor created successfully.');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred while creating vendor.';
      error(message);
    } finally {
      setCreating(false);
    }
  };

  // Edit Modal triggers
  const triggerEdit = (e: React.MouseEvent, v: Vendor) => {
    e.stopPropagation();
    setEditingVendorId(v.id);
    setEditForm({
      name: v.name,
      email: v.email || '',
      phone: v.phone || '',
      taxId: v.taxId || '',
      type: v.type,
      paymentTerms: String(v.paymentTerms),
      notes: v.notes || '',
      status: v.status,
      street: v.address?.street || '',
      city: v.address?.city || '',
      state: v.address?.state || '',
      postalCode: v.address?.postalCode || '',
      country: v.address?.country || '',
    });
    setEditOpen(true);
  };

  // Update handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendorId) return;
    setEditing(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        taxId: editForm.taxId.trim() || undefined,
        type: editForm.type,
        paymentTerms: Number(editForm.paymentTerms),
        notes: editForm.notes.trim() || undefined,
        status: editForm.status,
        address: (editForm.street || editForm.city || editForm.state || editForm.postalCode || editForm.country) ? {
          street: editForm.street.trim() || undefined,
          city: editForm.city.trim() || undefined,
          state: editForm.state.trim() || undefined,
          postalCode: editForm.postalCode.trim() || undefined,
          country: editForm.country.trim() || undefined,
        } : null,
      };

      await apiPut(`/crm/vendors/${editingVendorId}`, payload);
      setEditOpen(false);
      success('Vendor details updated.');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred during vendor update.';
      error(message);
    } finally {
      setEditing(false);
    }
  };

  // Delete handlers
  const triggerDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await apiDelete(`/crm/vendors/${deletingId}`);
      setDeleteOpen(false);
      setDeletingId(null);
      success('Vendor deleted.');
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiRequestError ? err.message : 'An error occurred during deletion.';
      error(message);
    } finally {
      setDeleting(false);
    }
  };

  // Status cell variant mapper
  const getStatusVariant = (v: string) => {
    switch (v) {
      case 'PREFERRED': return 'success';
      case 'ACTIVE': return 'info';
      case 'ON_HOLD': return 'warning';
      case 'BLOCKED': return 'danger';
      default: return 'secondary';
    }
  };

  // Column headers definition
  const columns: Column<Vendor>[] = [
    {
      key: 'select',
      header: (
        <input 
          type="checkbox" 
          checked={selectedIds.length === vendors.length && vendors.length > 0} 
          onChange={handleToggleSelectAll} 
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
      ),
      width: '40px',
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(row.id)} 
          onChange={(e) => handleToggleSelectOne(e, row.id)} 
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
      ),
    },
    {
      key: 'name', header: 'Vendor / Company',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', display: 'flex', gap: '8px' }}>
              <span>{row.type}</span>
              {row.email && <span>• {row.email}</span>}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.phone || '—'}</span> },
    { key: 'taxId', header: 'Tax ID', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{row.taxId || '—'}</span> },
    { key: 'paymentTerms', header: 'Terms', render: (row) => <Badge variant="info">Net {row.paymentTerms}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={(e) => triggerEdit(e, row)}><Edit size={12} /></Button>
          <Button size="sm" variant="outline" onClick={(e) => triggerDelete(e, row.id)}><Trash2 size={12} /></Button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader 
        title="Vendors & Suppliers" 
        description="Comprehensive directory for vendor onboarding, bulk lifecycle controls, and performance insights."
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Vendors' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" onClick={handleExport}><Download size={14} style={{ marginRight: 6 }} /> Export</Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Onboard Vendor</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Suppliers" value={totalCount} icon={<Building size={18} />} color="var(--color-primary)" />
        <KPICard title="Preferred Tier" value={vendors.filter(v => v.status === 'PREFERRED').length} icon={<CheckCircle size={18} />} color="var(--color-success)" />
        <KPICard title="On Credit Hold" value={vendors.filter(v => v.status === 'ON_HOLD').length} icon={<AlertCircle size={18} />} color="var(--color-warning)" />
        <KPICard title="Blocked/Inactive" value={vendors.filter(v => ['BLOCKED', 'INACTIVE'].includes(v.status)).length} icon={<ShieldAlert size={18} />} color="var(--color-danger)" />
      </div>

      {selectedIds.length > 0 && (
        <Card style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary)' }}>
              {selectedIds.length} suppliers selected
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant="primary" onClick={() => setBulkStatusOpen(true)}>Bulk Status Change</Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search vendors by name, email..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="">All Statuses</option>
            <option value="PREFERRED">Preferred</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="BLOCKED">Blocked</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="">All Types</option>
            <option value="COMPANY">Company</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="GOVERNMENT">Government</option>
            <option value="NON_PROFIT">Non-Profit</option>
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => {
            const parts = e.target.value.split(':');
            if (parts[0] && parts[1]) {
              setSortBy(parts[0]);
              setSortOrder(parts[1] as 'asc' | 'desc');
            }
          }}
            style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
            <option value="name:asc">Name (A-Z)</option>
            <option value="name:desc">Name (Z-A)</option>
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
          </select>
        </div>
      </Card>

      <Card padding="none">
        <DataTable 
          columns={columns} 
          data={vendors} 
          loading={loading} 
          rowKey={(r) => r.id}
          onRowClick={(row) => router.push(`/crm/vendors/${row.id}`)}
          emptyTitle="No Suppliers Onboarded" 
          emptyMessage="Add your first supplier partner to start managing purchase contracts and debit audits." 
          emptyIcon={<Building size={48} />} 
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

      {/* Onboard Vendor Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Onboard Supplier/Vendor" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Complete Onboarding'}</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Company/Supplier Name" required placeholder="Acme Logistics Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <FormField label="Vendor Classification">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="COMPANY">Company</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="GOVERNMENT">Government Agency</option>
                <option value="NON_PROFIT">Non-Profit Organization</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Contact Email" type="email" placeholder="billing@acme.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Contact Phone" placeholder="+1-800-555-0199" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Tax ID / Registration" placeholder="US-9988771" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          </div>

          <FormField label="Payment Due Terms">
            <Select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
              <option value="15">Net 15 (Pay within 15 days)</option>
              <option value="30">Net 30 (Pay within 30 days)</option>
              <option value="45">Net 45 (Pay within 45 days)</option>
              <option value="60">Net 60 (Pay within 60 days)</option>
              <option value="90">Net 90 (Pay within 90 days)</option>
            </Select>
          </FormField>

          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', padding: '0 8px' }}>Supplier Address Details</legend>
            <TextField label="Street Address" placeholder="Suite 400, 100 Supplier Lane" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 'var(--space-2)' }}>
              <TextField label="City" placeholder="San Jose" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State/Region" placeholder="CA" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <TextField label="Postal Code" placeholder="95131" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              <TextField label="Country" placeholder="United States" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </fieldset>

          <TextField label="Private Supplier Memo / Evaluation Notes" placeholder="Special pricing agreements, shipping constraints..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Supplier Profile" size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate as any} disabled={editing}>{editing ? 'Updating...' : 'Save Updates'}</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Supplier Name" required placeholder="Acme Logistics Inc." value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <FormField label="Classification">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="COMPANY">Company</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="GOVERNMENT">Government Agency</option>
                <option value="NON_PROFIT">Non-Profit Organization</option>
              </Select>
            </FormField>
            <FormField label="Supplier Status">
              <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="PREFERRED">Preferred Tier</option>
                <option value="ACTIVE">Active Partner</option>
                <option value="ON_HOLD">Payment Credit Hold</option>
                <option value="BLOCKED">Blocked Account</option>
                <option value="INACTIVE">Inactive Supplier</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Contact Email" type="email" placeholder="billing@acme.com" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField label="Contact Phone" placeholder="+1-800-555-0199" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField label="Tax ID / Registration" placeholder="US-9988771" value={editForm.taxId} onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })} />
          </div>

          <FormField label="Payment Due Terms">
            <Select value={editForm.paymentTerms} onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}>
              <option value="15">Net 15 (Pay within 15 days)</option>
              <option value="30">Net 30 (Pay within 30 days)</option>
              <option value="45">Net 45 (Pay within 45 days)</option>
              <option value="60">Net 60 (Pay within 60 days)</option>
              <option value="90">Net 90 (Pay within 90 days)</option>
            </Select>
          </FormField>

          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', padding: '0 8px' }}>Supplier Address Details</legend>
            <TextField label="Street Address" placeholder="Suite 400, 100 Supplier Lane" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 'var(--space-2)' }}>
              <TextField label="City" placeholder="San Jose" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
              <TextField label="State/Region" placeholder="CA" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              <TextField label="Postal Code" placeholder="95131" value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
              <TextField label="Country" placeholder="United States" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
            </div>
          </fieldset>

          <TextField label="Private Supplier Memo / Evaluation Notes" placeholder="Special pricing agreements, shipping constraints..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
        </form>
      </Modal>

      {/* Bulk Status Update Modal */}
      <Modal open={bulkStatusOpen} onClose={() => setBulkStatusOpen(false)} title="Change Suppliers Lifecycle Status" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkStatusOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleBulkStatusChange} disabled={bulkUpdating}>{bulkUpdating ? 'Updating...' : 'Apply Status change'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-2)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Select the new status to apply to all <strong>{selectedIds.length}</strong> selected vendors:
          </p>
          <FormField label="Target Status">
            <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
              <option value="PREFERRED">Preferred Supplier</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">Credit/Payment Hold</option>
              <option value="BLOCKED">Blocked</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Remove Supplier Partner" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Removing...' : 'Confirm Remove'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
          <AlertCircle size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Are you absolutely sure?</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
              This will mark the supplier as inactive. Purchase history, ledger logs, and active agreements will be kept but hidden from active listings.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
