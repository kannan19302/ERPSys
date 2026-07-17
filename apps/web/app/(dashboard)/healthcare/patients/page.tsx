'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, Badge, DataTable, type Column,
  Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { Users, Plus, Search, Heart } from 'lucide-react';
import Link from 'next/link';
import { useApiClient } from '@unerp/framework';

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

export default function PatientRegistryPage() {
  const client = useApiClient();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE', email: '', phone: '' });

  const fetchPatients = async () => {
    try {
      const d = await client.get<Patient[] | { data?: Patient[] }>('/api/v1/ext/healthcare/patients');
      setPatients(Array.isArray(d) ? d : d.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setCreating(true);
    try {
      await client.post('/api/v1/ext/healthcare/patients', form);
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
        <div className="ui-hstack-3">
          <div className={styles.s1}>
            {row.firstName[0]}{row.lastName[0]}
          </div>
          <div>
            <Link href={`/healthcare/patients/${row.id}`} className={styles.s2}>
              {row.firstName} {row.lastName}
            </Link>
            <div className="ui-text-xs-tertiary">{row.email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    { key: 'gender', header: 'Gender', render: (row) => <Badge variant={row.gender === 'MALE' ? 'info' : 'warning'}>{row.gender}</Badge> },
    { key: 'dob', header: 'Date of Birth', render: (row) => <span className="text-sm">{row.dateOfBirth ? new Date(row.dateOfBirth).toLocaleDateString() : '—'}</span> },
    { key: 'phone', header: 'Phone', render: (row) => <span className="ui-text-sm-muted">{row.phone || '—'}</span> },
    { key: 'allergies', header: 'Allergies', render: (row) => row.allergies ? <Badge variant="danger">{row.allergies}</Badge> : <span className="ui-text-xs-tertiary">None</span> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader title="Patient Registry" description="Manage patient records, demographics, and medical information"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Patients' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Patient</Button>}
      />

      <div className="ui-grid-auto">
        <KPICard title="Total Patients" value={patients.length} icon={<Users size={18} />} color="var(--color-primary)" />
        <KPICard title="New This Month" value={patients.filter(p => p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<Heart size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.s3}>
          <Search size={16} className={styles.s4} />
          <input type="text" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.s5} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id}
          emptyTitle="No patients" emptyMessage="Add patients to start managing medical records." emptyIcon={<Users size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Patient" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add Patient'}</Button></>}>
        <div className="ui-stack-4">
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="First Name" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <TextField label="Last Name" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            <FormField label="Gender">
              <Select value={form.gender} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, gender: e.target.value })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </FormField>
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
