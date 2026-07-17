'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Stethoscope, Plus, Users, Award } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Practitioner { id: string; employeeId: string; specialty: string; licenseNumber: string; status?: string; }

export default function PractitionersPage() {
  const client = useApiClient();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', specialty: '', licenseNumber: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<Practitioner[] | { data?: Practitioner[] }>('/api/v1/ext/healthcare/practitioners');
        setPractitioners(Array.isArray(data) ? data : data.data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.employeeId || !form.specialty) return;
    setCreating(true);
    try {
      await client.post('/api/v1/ext/healthcare/practitioners', form);
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const specialties = [...new Set(practitioners.map(p => p.specialty))];

  const columns: Column<Practitioner>[] = [
    { key: 'name', header: 'Practitioner', render: (row) => (
      <div className="ui-hstack-3">
        <div className={styles.s1}><Stethoscope size={18} /></div>
        <div>
          <div className="ui-heading-sm">Dr. {row.employeeId.slice(0, 8)}</div>
          <div className="ui-text-xs-tertiary">{row.licenseNumber}</div>
        </div>
      </div>
    ) },
    { key: 'specialty', header: 'Specialty', render: (row) => <Badge variant="info">{row.specialty}</Badge> },
    { key: 'license', header: 'License #', render: (row) => <code className={styles.s2}>{row.licenseNumber}</code> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader title="Practitioners" description="Doctor and nurse directory with specializations"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Practitioners' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Practitioner</Button>} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Total Practitioners" value={practitioners.length} icon={<Stethoscope size={18} />} color="var(--color-primary)" />
        <KPICard title="Specialties" value={specialties.length} icon={<Award size={18} />} color="var(--color-info)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={practitioners} rowKey={r => r.id} emptyTitle="No practitioners" emptyMessage="Add practitioners to manage clinical staff." emptyIcon={<Stethoscope size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Practitioner" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Employee ID" required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
          <TextField label="Specialty" required value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Cardiology, Pediatrics..." />
          <TextField label="License Number" required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
