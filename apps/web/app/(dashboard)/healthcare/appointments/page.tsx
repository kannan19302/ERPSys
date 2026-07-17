'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard } from '@unerp/ui';
import { Calendar, Plus, Clock, Users, CheckCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Appointment { id: string; patientId: string; practitionerId: string; startTime: string; endTime: string; status?: string; notes?: string; patient?: { firstName: string; lastName: string }; practitioner?: { specialty: string }; }
export default function AppointmentsPage() {
  const client = useApiClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ patientId: '', practitionerId: '', startTime: '', endTime: '', notes: '' });
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<Appointment[] | { data?: Appointment[] }>('/api/v1/ext/healthcare/appointments');
        setAppointments(Array.isArray(d) ? d : d.data || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.patientId || !form.practitionerId) return;
    setCreating(true);
    try {
      await client.post('/api/v1/ext/healthcare/appointments', form);
      setCreateOpen(false); window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const today = appointments.filter(a => a.startTime && new Date(a.startTime).toDateString() === new Date().toDateString()).length;
  const filtered = appointments.filter(a => statusFilter === 'ALL' || (a.status || 'SCHEDULED') === statusFilter);

  const columns: Column<Appointment>[] = [
    { key: 'patient', header: 'Patient', render: (row) => <span className="ui-heading-sm">{row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId.slice(0, 8)}</span> },
    { key: 'practitioner', header: 'Practitioner', render: (row) => <span className="text-sm">{row.practitioner?.specialty || row.practitionerId.slice(0, 8)}</span> },
    { key: 'time', header: 'Time', render: (row) => <div><div className="text-sm">{row.startTime ? new Date(row.startTime).toLocaleDateString() : '—'}</div><div className="ui-text-xs-tertiary">{row.startTime ? new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - {row.endTime ? new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div></div> },
    { key: 'notes', header: 'Notes', render: (row) => <span className="ui-text-sm-muted">{row.notes || '—'}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={(row.status || 'SCHEDULED') === 'COMPLETED' ? 'success' : (row.status || 'SCHEDULED') === 'CANCELLED' ? 'danger' : 'info'}>{row.status || 'SCHEDULED'}</Badge> },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="healthcare.appointments.read">
    <div className="ui-stack-6">
      <PageHeader title="Appointments" description="Schedule and manage patient appointments"
        breadcrumbs={[{ label: 'Healthcare', href: '/healthcare' }, { label: 'Appointments' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Book Appointment</Button>} />

      <div className="ui-grid-auto-sm">
        <KPICard title="Today" value={today} icon={<Calendar size={18} />} color="var(--color-primary)" />
        <KPICard title="Total" value={appointments.length} icon={<Clock size={18} />} color="var(--color-info)" />
        <KPICard title="Completed" value={appointments.filter(a => a.status === 'COMPLETED').length} icon={<CheckCircle size={18} />} color="var(--color-success)" />
      </div>

      <Card>
        <div className={styles.s1}>
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ borderColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-border)', background: statusFilter === s ? 'var(--color-primary-light)' : 'var(--color-bg)', color: statusFilter === s ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s2}>
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No appointments" emptyMessage="Book appointments to start." emptyIcon={<Calendar size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Book Appointment" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Booking...' : 'Book'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Patient ID" required value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} />
          <TextField label="Practitioner ID" required value={form.practitionerId} onChange={e => setForm({ ...form, practitionerId: e.target.value })} />
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Start Time" type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="End Time" type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <TextField label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
    </RouteGuard>
  );
}
