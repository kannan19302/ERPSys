'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Spinner, Button, DataTable, Modal, type Column, ProtectedComponent, useToast } from '@unerp/ui';
import { Search, Plus, Mail, Phone, Building, Users, CheckCircle } from 'lucide-react';
import { DuplicatesFinder } from '../_components/DuplicatesFinder';
import { useContacts, useCustomers } from '../../../../src/lib/hooks/useModuleData';
import { apiPost } from '../../../../src/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  title: string | null;
  isPrimary: boolean;
  customer?: { id: string; name: string } | null;
}

export default function ContactsPage() {
  const { success, error } = useToast();
  const { data: customers = [] } = useCustomers();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', customerId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchContactsData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        customerId,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/v1/crm/contacts?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (res.ok) {
        const d = await res.json();
        if (d && typeof d === 'object' && 'data' in d) {
          setContacts(d.data || []);
          setTotalCount(d.totalCount || 0);
          setTotalPages(d.totalPages || 0);
        } else {
          const list = Array.isArray(d) ? d : [];
          setContacts(list);
          setTotalCount(list.length);
          setTotalPages(Math.ceil(list.length / limit));
        }
      }
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, [page, debouncedSearch, customerId, sortBy, sortOrder]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        title: form.title.trim() || undefined,
        customerId: form.customerId || undefined,
      };
      await apiPost('/crm/contacts', payload);
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', customerId: '' });
      success('Contact created successfully.');
      fetchContactsData();
    } catch (err: any) {
      error(err.message || 'Failed to create contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <span style={{ fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Users size={14} />
          {c.firstName} {c.lastName}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (c) => (
        c.customer ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building size={12} style={{ marginRight: '4px' }} />
            {c.customer.name}
          </span>
        ) : '-'
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (c) => (
        c.email ? (
          <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
            <Mail size={12} style={{ marginRight: '4px' }} />
            {c.email}
          </a>
        ) : '-'
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => (
        c.phone || c.mobile ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} />
            {c.phone || c.mobile}
          </span>
        ) : '-'
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (c) => c.title || '-',
    },
    {
      key: 'isPrimary',
      header: 'Primary',
      align: 'center',
      render: (c) => (
        c.isPrimary ? <CheckCircle size={14} style={{ color: 'var(--color-success)' }} /> : '-'
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Contacts"
        description="Manage contact persons linked to your customer accounts"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Contacts' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <ProtectedComponent permission="crm.duplicates.scan">
              <Button variant="outline" size="sm" onClick={() => setShowDuplicates(true)}><Users size={14} /> Find Duplicates</Button>
            </ProtectedComponent>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Contact</Button>
          </div>
        }
      />
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="frappe-input"
            style={{ width: '100%', paddingLeft: 'var(--space-9)' }}
          />
        </div>
        <select value={customerId} onChange={e => { setCustomerId(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="">All Customers</option>
          {(customers as Array<{ id: string; name: string }>).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={`${sortBy}:${sortOrder}`} onChange={e => {
          const parts = e.target.value.split(':');
          if (parts[0] && parts[1]) {
            setSortBy(parts[0]);
            setSortOrder(parts[1] as 'asc' | 'desc');
          }
        }}
          style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }}>
          <option value="firstName:asc">First Name (A-Z)</option>
          <option value="lastName:asc">Last Name (A-Z)</option>
          <option value="createdAt:desc">Newest First</option>
        </select>
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={contacts}
          emptyTitle="No contacts found"
          emptyMessage="Create a contact to get started."
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

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Contact"
        size="md"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="frappe-grid-2">
            <div className="frappe-form-group">
              <label className="frappe-label">First Name *</label>
              <input
                type="text"
                placeholder="First Name"
                required
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="frappe-input"
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Last Name *</label>
              <input
                type="text"
                placeholder="Last Name"
                required
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="frappe-input"
              />
            </div>
          </div>
          
          <div className="frappe-form-group">
            <label className="frappe-label">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="frappe-input"
            />
          </div>

          <div className="frappe-grid-2">
            <div className="frappe-form-group">
              <label className="frappe-label">Phone</label>
              <input
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="frappe-input"
              />
            </div>
            <div className="frappe-form-group">
              <label className="frappe-label">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="frappe-input"
              />
            </div>
          </div>

          <div className="frappe-form-group">
            <label className="frappe-label">Customer</label>
            <select
              value={form.customerId}
              onChange={e => setForm({ ...form, customerId: e.target.value })}
              className="frappe-input"
            >
              <option value="">Select Customer</option>
              {(customers as Array<{ id: string; name: string }>).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      {showDuplicates && (
        <DuplicatesFinder entity="contacts" onClose={() => setShowDuplicates(false)} onMerged={() => fetchContactsData()} />
      )}
    </div>
  );
}