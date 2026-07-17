'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Pill, Plus, Search, FileText } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface Prescription { id: string; patientId: string; practitionerId: string; details: string; status?: string; createdAt?: string; patient?: { firstName: string; lastName: string }; practitioner?: { specialty: string }; }

export default function PrescriptionsPage() {
  const client = useApiClient();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ patientId: '', practitionerId: '', details: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await client.get<Prescription[] | { data?: Prescription[] }>('/api/v1/ext/healthcare/prescriptions');
        setPrescriptions(Array.isArray(data) ? data : data.data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.patientId || !form.details) return;
    setCreating(true);
    try {
      await client.post('/api/v1/ext/healthcare/prescriptions', form);
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Prescription>[] = [
    { key: 'patient', header: 'Patient', render: (row) => <span className="ui-heading-sm">{row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(0, 8)}</span> },
    { key: 'details', header: 'Prescription', render: (row) => <span className="text-sm">{row.details.length > 60 ? row.details.slice(0, 60) + '...' : row.details}</span> },
    { key: 'prescriber', header: 'Prescriber', render: (row) => <span className="ui-text-sm-muted">{row.practitioner?.specialty || row.practitionerId.slice(0, 8)}</span> },
    { key: 'date', header: 'Date', render: (row) => <span className="ui-text-xs-tertiary">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <div className="ui-stack-6">
      <PageHeader title="Prescriptions" description="Manage patient prescriptions and medications"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Prescriptions' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Prescription</Button>} />

      <div className="ui-grid-auto">
        <KPICard title="Total Prescriptions" value={prescriptions.length} icon={<Pill size={18} />} color="var(--color-primary)" />
        <KPICard title="This Month" value={prescriptions.filter(p => p.createdAt && new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length} icon={<FileText size={18} />} color="var(--color-info)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={prescriptions} rowKey={r => r.id} emptyTitle="No prescriptions" emptyMessage="Create prescriptions for patients." emptyIcon={<Pill size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Prescription" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Patient ID" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} />
          <TextField label="Practitioner ID" required value={form.practitionerId} onChange={e => setForm({ ...form, practitionerId: e.target.value })} />
          <TextField label="Prescription Details" required value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Amoxicillin 500mg, 3x daily for 7 days..." />
        </div>
      </Modal>
    </div>
  );
}
