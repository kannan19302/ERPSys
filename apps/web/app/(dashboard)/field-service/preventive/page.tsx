'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard } from '@unerp/ui';
import { Calendar, Plus } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
interface PMRule { id: string; name: string; intervalDays: number; lastRun?: string; nextRun?: string; }

export default function PreventiveMaintenancePage() {
  const client = useApiClient();
  const [rules, setRules] = useState<PMRule[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', intervalDays: 30 });

  useEffect(() => { (async () => { try { const d = await client.get<PMRule[] | { data?: PMRule[] }>('/ext/field-service/preventive-maintenances'); setRules(Array.isArray(d) ? d : d.data || []); } catch {} finally { setLoading(false); } })(); }, [client]);
  const handleCreate = async () => { if (!form.name) return; setCreating(true); try { await client.post('/ext/field-service/preventive-maintenances', {...form, intervalDays: Number(form.intervalDays)}); setCreateOpen(false); const d = await client.get<PMRule[] | { data?: PMRule[] }>('/ext/field-service/preventive-maintenances'); setRules(Array.isArray(d) ? d : d.data || []); } catch {} finally { setCreating(false); } };

  const columns: Column<PMRule>[] = [
    { key: 'name', header: 'Maintenance Plan', render: (row) => <span className="ui-heading-sm">{row.name}</span> },
    { key: 'interval', header: 'Interval', render: (row) => <Badge variant="info">Every {row.intervalDays} Days</Badge> },
    { key: 'lastRun', header: 'Last Run', render: (row) => <span className="text-sm">{row.lastRun ? new Date(row.lastRun).toLocaleDateString() : '—'}</span> },
    { key: 'nextRun', header: 'Next Scheduled', render: (row) => <span className={styles.s1}>{row.nextRun ? new Date(row.nextRun).toLocaleDateString() : '—'}</span> },
  ];
  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (<RouteGuard permission="field-service.preventive.read"><div className="ui-stack-6">
    <PageHeader title="Preventive Maintenance" description="Automated scheduling, inspection intervals, and ticket dispatch rules" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Preventive' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Create Plan</Button>} />
    <KPICard title="Scheduled Rules" value={rules.length} icon={<Calendar size={18} />} color="var(--color-primary)" />
    <Card padding="none"><DataTable columns={columns} data={rules} rowKey={r => r.id} emptyTitle="No maintenance rules" emptyMessage="Create recurring maintenance schedules." emptyIcon={<Calendar size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Maintenance Plan" size="sm" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div className="ui-stack-4"><TextField label="Plan Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><TextField label="Interval (Days)" type="number" required value={String(form.intervalDays)} onChange={e => setForm({...form, intervalDays: Number(e.target.value)})} /></div>
    </Modal>
  </div></RouteGuard>);
}
