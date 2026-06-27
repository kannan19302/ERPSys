'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Pill, Plus, Search, FileText } from 'lucide-react';

interface Prescription { id: string; patientId: string; practitionerId: string; details: string; status?: string; createdAt?: string; patient?: { firstName: string; lastName: string }; practitioner?: { specialty: string }; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ patientId: '', practitionerId: '', details: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/healthcare/prescriptions', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setPrescriptions(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.patientId || !form.details) return;
    setCreating(true);
    try {
      await fetch('/api/v1/healthcare/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify(form) });
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Prescription>[] = [
    { key: 'patient', header: 'Patient', render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(0, 8)}</span> },
    { key: 'details', header: 'Prescription', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.details.length > 60 ? row.details.slice(0, 60) + '...' : row.details}</span> },
    { key: 'prescriber', header: 'Prescriber', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{row.practitioner?.specialty || row.practitionerId.slice(0, 8)}</span> },
    { key: 'date', header: 'Date', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Prescriptions" description="Manage patient prescriptions and medications"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Prescriptions' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Prescription</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Prescriptions" value={prescriptions.length} icon={<Pill size={18} />} color="var(--color-primary)" />
        <KPICard title="This Month" value={prescriptions.filter(p => p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<FileText size={18} />} color="var(--color-info)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={prescriptions} rowKey={r => r.id} emptyTitle="No prescriptions" emptyMessage="Create prescriptions for patients." emptyIcon={<Pill size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Prescription" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Patient ID" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} />
          <TextField label="Practitioner ID" required value={form.practitionerId} onChange={e => setForm({ ...form, practitionerId: e.target.value })} />
          <TextField label="Prescription Details" required value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Amoxicillin 500mg, 3x daily for 7 days..." />
        </div>
      </Modal>
    </div>
  );
}
