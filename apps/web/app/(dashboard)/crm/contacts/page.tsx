'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Spinner, Button, DataTable, Modal, type Column } from '@unerp/ui';
import { Search, Plus, Mail, Phone, Building, Users, CheckCircle } from 'lucide-react';
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
  const { data: contacts = [], isLoading: loadingContacts, refetch: refetchContacts } = useContacts();
  const { data: customers = [] } = useCustomers();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', customerId: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/crm/contacts', form);
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', mobile: '', title: '', customerId: '' });
      refetchContacts();
    } catch (err) {
      console.error('Failed to create contact:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (contacts as Contact[]).filter(c =>
    `${c.firstName} ${c.lastName} ${c.email || ''}`.toLowerCase().includes(search.toLowerCase())
  );

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

  if (loadingContacts) {
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
        actions={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Contact</Button>}
      />
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
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
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{filtered.length} contacts</span>
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={filtered}
          emptyTitle="No contacts found"
          emptyMessage="Create a contact to get started."
        />
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
    </div>
  );
}