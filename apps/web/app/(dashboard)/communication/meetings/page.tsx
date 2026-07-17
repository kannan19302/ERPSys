'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Video, Plus, Search, Calendar, Play } from 'lucide-react';
import Link from 'next/link';

interface Meeting { id: string; topic: string; hostId: string; startTime: string; durationMinutes: number; active: boolean; }
interface WorkspaceResponse { meetings?: Meeting[]; }

export default function MeetingsPage() {
  const client = useApiClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ topic: '', startTime: '', durationMinutes: 30 });

  useEffect(() => {
    (async () => {
      try {
        const ws = await client.get<WorkspaceResponse>('/communication/workspace');
        setMeetings(ws.meetings || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.topic) return;
    setCreating(true);
    try {
      await client.post('/communication/meetings', { ...form, durationMinutes: Number(form.durationMinutes) });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Meeting>[] = [
    { key: 'topic', header: 'Topic', render: (row) => (
      <div className="ui-hstack-3">
        <div className={styles.s1}>
          <Video size={16} />
        </div>
        <span className="ui-heading-sm">{row.topic}</span>
      </div>
    ) },
    { key: 'time', header: 'Scheduled Time', render: (row) => <span className="text-sm">{row.startTime ? new Date(row.startTime).toLocaleString() : '—'}</span> },
    { key: 'duration', header: 'Duration', render: (row) => <Badge variant="info">{row.durationMinutes} Minutes</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.active ? 'success' : 'default'}>{row.active ? 'Live' : 'Scheduled'}</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?meeting=${row.id}`}>
        <Button variant={row.active ? 'primary' : 'secondary'}>
          {row.active ? <Play size={12} className="mr-2" /> : null} Join call
        </Button>
      </Link>
    ) },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="communication.meetings.read">
    <div className="ui-stack-6">
      <PageHeader title="Meetings Center" description="Schedule, launch, and join video meetings or audio calls"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Meetings' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Schedule Meeting</Button>} />

      <Card padding="none">
        <DataTable columns={columns} data={meetings} rowKey={r => r.id} emptyTitle="No meetings scheduled" emptyMessage="Schedule a meeting or start a live video call." emptyIcon={<Video size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Meeting" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Scheduling...' : 'Schedule'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Topic" required value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Project updates and roadmap" />
          <TextField label="Start Time" type="datetime-local" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <TextField label="Duration (Minutes)" type="number" required value={String(form.durationMinutes)} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
        </div>
      </Modal>
    </div>
    </RouteGuard>
  );
}
