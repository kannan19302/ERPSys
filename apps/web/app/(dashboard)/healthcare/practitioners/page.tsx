'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Stethoscope, Plus, Users, Award } from 'lucide-react';

interface Practitioner { id: string; employeeId: string; specialty: string; licenseNumber: string; status?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', specialty: '', licenseNumber: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/ext/healthcare/practitioners', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setPractitioners(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.employeeId || !form.specialty) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/healthcare/practitioners', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify(form) });
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const specialties = [...new Set(practitioners.map(p => p.specialty))];

  const columns: Column<Practitioner>[] = [
    { key: 'name', header: 'Practitioner', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Stethoscope size={18} /></div>
        <div>
          <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>Dr. {row.employeeId.slice(0, 8)}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.licenseNumber}</div>
        </div>
      </div>
    ) },
    { key: 'specialty', header: 'Specialty', render: (row) => <Badge variant="info">{row.specialty}</Badge> },
    { key: 'license', header: 'License #', render: (row) => <code style={{ fontSize: '11px' }}>{row.licenseNumber}</code> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Practitioners" description="Doctor and nurse directory with specializations"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Practitioners' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Add Practitioner</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Practitioners" value={practitioners.length} icon={<Stethoscope size={18} />} color="var(--color-primary)" />
        <KPICard title="Specialties" value={specialties.length} icon={<Award size={18} />} color="var(--color-info)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={practitioners} rowKey={r => r.id} emptyTitle="No practitioners" emptyMessage="Add practitioners to manage clinical staff." emptyIcon={<Stethoscope size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Practitioner" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Add'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Employee ID" required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
          <TextField label="Specialty" required value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Cardiology, Pediatrics..." />
          <TextField label="License Number" required value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
