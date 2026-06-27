'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Calendar, Plus } from 'lucide-react';
interface PMRule { id: string; name: string; intervalDays: number; lastRun?: string; nextRun?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function PreventiveMaintenancePage() {
  const [rules, setRules] = useState<PMRule[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', intervalDays: 30 });

  useEffect(() => { (async () => { try { const res = await fetch('/api/v1/field-service/preventive-maintenances', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); setRules(Array.isArray(d) ? d : d?.data || []); } } catch {} finally { setLoading(false); } })(); }, []);
  const handleCreate = async () => { if (!form.name) return; setCreating(true); try { await fetch('/api/v1/field-service/preventive-maintenances', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify({...form, intervalDays: Number(form.intervalDays)}) }); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const columns: Column<PMRule>[] = [
    { key: 'name', header: 'Maintenance Plan', render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</span> },
    { key: 'interval', header: 'Interval', render: (row) => <Badge variant="info">Every {row.intervalDays} Days</Badge> },
    { key: 'lastRun', header: 'Last Run', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.lastRun ? new Date(row.lastRun).toLocaleDateString() : '—'}</span> },
    { key: 'nextRun', header: 'Next Scheduled', render: (row) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', fontWeight: 'var(--weight-medium)' }}>{row.nextRun ? new Date(row.nextRun).toLocaleDateString() : '—'}</span> },
  ];
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Preventive Maintenance" description="Automated scheduling, inspection intervals, and ticket dispatch rules" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Preventive' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Create Plan</Button>} />
    <KPICard title="Scheduled Rules" value={rules.length} icon={<Calendar size={18} />} color="var(--color-primary)" />
    <Card padding="none"><DataTable columns={columns} data={rules} rowKey={r => r.id} emptyTitle="No maintenance rules" emptyMessage="Create recurring maintenance schedules." emptyIcon={<Calendar size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Maintenance Plan" size="sm" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}><TextField label="Plan Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><TextField label="Interval (Days)" type="number" required value={String(form.intervalDays)} onChange={e => setForm({...form, intervalDays: Number(e.target.value)})} /></div>
    </Modal>
  </div>);
}
