'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { Users, Plus, Search, Heart } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  allergies?: string;
  createdAt?: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export default function PatientRegistryPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', email: '', phone: '' });

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/v1/healthcare/patients', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
      if (res.ok) { const d = await res.json(); setPatients(Array.isArray(d) ? d : d?.data || []); }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setCreating(true);
    try {
      await fetch('/api/v1/healthcare/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      setForm({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', email: '', phone: '' });
      fetchPatients();
    } catch { /* handled */ }
    finally { setCreating(false); }
  };

  const filtered = patients.filter(p =>
    !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) || (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Patient>[] = [
    {
      key: 'patient', header: 'Patient',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <Link href={`/healthcare/patients/${row.id}`} style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>
              {row.firstName} {row.lastName}
            </Link>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: 'Gender', render: (row) => <Badge variant={row.gender === 'MALE' ? 'info' : 'warning'}>{row.gender}</Badge> },
    { key: 'dob', header: 'Date of Birth', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '—'}</span> },
    { key: 'phone', header: 'Phone', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.phone || '—'}</span> },
    { key: 'allergies', header: 'Allergies', render: (row) => row.allergies ? <Badge variant="danger">{row.allergies}</Badge> : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>None</span> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Patient Registry" description="Manage patient records, demographics, and medical information"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Patients' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Patient</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Patients" value={patients.length} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="New This Month" value={patients.filter(p => p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<Heart size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No patients" emptyMessage="Add patients to start managing medical records." emptyIcon={<Users size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Patient" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Patient'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <FormField label="Gender">
              <Select value={form.gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, gender: e.target.value })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
