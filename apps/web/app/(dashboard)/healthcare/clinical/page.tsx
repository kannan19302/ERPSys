'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { ClipboardList, Plus, FileText, Stethoscope } from 'lucide-react';

interface Encounter { id: string; patientId: string; practitionerId: string; diagnosis: string; treatmentCode: string; billingAmount: number; createdAt?: string; patient?: { firstName: string; lastName: string }; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }
const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ClinicalNotesPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ patientId: '', practitionerId: '', diagnosis: '', treatmentCode: '', billingAmount: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/ext/healthcare/encounters', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setEncounters(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.patientId || !form.diagnosis) return;
    setCreating(true);
    try {
      await fetch('/api/v1/ext/healthcare/encounters', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify({ ...form, billingAmount: Number(form.billingAmount) }) });
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const totalBilling = encounters.reduce((a, e) => a + Number(e.billingAmount || 0), 0);

  const columns: Column<Encounter>[] = [
    { key: 'patient', header: 'Patient', render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(0, 8)}</span> },
    { key: 'diagnosis', header: 'Diagnosis', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.diagnosis}</span> },
    { key: 'code', header: 'Treatment Code', render: (row) => <code style={{ fontSize: '11px', background: 'var(--color-bg-sunken)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>{row.treatmentCode}</code> },
    { key: 'billing', header: 'Billing', align: 'right' as const, render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(row.billingAmount)}</span> },
    { key: 'date', header: 'Date', render: (row) => <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</span> },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Clinical Notes" description="Medical encounters, SOAP notes, and diagnosis codes"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Clinical Notes' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Encounter</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Total Encounters" value={encounters.length} icon={<ClipboardList size={18} />} color="var(--color-primary)" />
        <KPICard title="Total Billing" value={fmtCurrency(totalBilling)} icon={<Stethoscope size={18} />} color="var(--color-success)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={encounters} rowKey={r => r.id} emptyTitle="No clinical notes" emptyMessage="Document medical encounters here." emptyIcon={<ClipboardList size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Medical Encounter" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Patient ID" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} />
            <TextField label="Practitioner ID" required value={form.practitionerId} onChange={e => setForm({ ...form, practitionerId: e.target.value })} />
          </div>
          <TextField label="Diagnosis" required value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <TextField label="Treatment Code" value={form.treatmentCode} onChange={e => setForm({ ...form, treatmentCode: e.target.value })} placeholder="ICD-10 code" />
            <TextField label="Billing Amount ($)" type="number" value={String(form.billingAmount)} onChange={e => setForm({ ...form, billingAmount: Number(e.target.value) })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
