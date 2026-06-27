'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, StatusBadge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard, Badge,
} from '@unerp/ui';
import { Building, Plus, Search, Mail, Phone, DollarSign, Users } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxId: string | null;
  paymentTerms: number;
  status: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', paymentTerms: '30' });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/crm/vendors', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      if (res.ok) { const d = await res.json(); setVendors(Array.isArray(d) ? d : d?.data || []); }
    } catch { setVendors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setCreating(true);
    try {
      await fetch('/api/v1/crm/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, paymentTerms: Number(form.paymentTerms) }),
      });
      setCreateOpen(false);
      setForm({ name: '', email: '', phone: '', paymentTerms: '30' });
      fetchData();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = vendors.filter(v => v.status === 'ACTIVE').length;

  const columns: Column<Vendor>[] = [
    {
      key: 'name', header: 'Vendor',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</div>
            {row.email && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.email}</div>}
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.phone || '—'}</span> },
    { key: 'taxId', header: 'Tax ID', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{row.taxId || '—'}</span> },
    { key: 'paymentTerms', header: 'Terms', render: (row) => <Badge variant="info">Net {row.paymentTerms}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Vendors" description="Manage supplier and vendor accounts"
        breadcrumbs={[{ label: 'CRM', href: '/crm' }, { label: 'Vendors' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Vendor</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Vendors" value={vendors.length} icon={<Building size={18} />} color="var(--color-primary)" />
        <KPICard title="Active" value={activeCount} icon={<Users size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} loading={loading} rowKey={(r) => r.id}
          emptyTitle="No vendors" emptyMessage="Add your first vendor to manage supplier relationships." emptyIcon={<Building size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Vendor" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate as any} disabled={creating}>{creating ? 'Creating...' : 'Create Vendor'}</Button></>}
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Company Name" required placeholder="Acme Supplies Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Email" type="email" placeholder="contact@vendor.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" placeholder="+1-555-0100" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <FormField label="Payment Terms">
            <Select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
              <option value="15">Net 15</option><option value="30">Net 30</option><option value="45">Net 45</option><option value="60">Net 60</option><option value="90">Net 90</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
