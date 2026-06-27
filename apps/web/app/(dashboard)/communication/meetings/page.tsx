'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField } from '@unerp/ui';
import { Video, Plus, Search, Calendar, Play } from 'lucide-react';
import Link from 'next/link';

interface Meeting { id: string; topic: string; hostId: string; startTime: string; durationMinutes: number; active: boolean; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ topic: '', startTime: '', durationMinutes: 30 });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/communication/workspace', {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) {
          const ws = await res.json();
          setMeetings(ws?.meetings || []);
        }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.topic) return;
    setCreating(true);
    try {
      await fetch('/api/v1/communication/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ ...form, durationMinutes: Number(form.durationMinutes) }),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Meeting>[] = [
    { key: 'topic', header: 'Topic', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-info-light)', color: 'var(--color-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Video size={16} />
        </div>
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.topic}</span>
      </div>
    ) },
    { key: 'time', header: 'Scheduled Time', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{row.startTime ? new Date(row.startTime).toLocaleString() : '—'}</span> },
    { key: 'duration', header: 'Duration', render: (row) => <Badge variant="info">{row.durationMinutes} Minutes</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.active ? 'success' : 'default'}>{row.active ? 'Live' : 'Scheduled'}</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?meeting=${row.id}`}>
        <Button variant={row.active ? 'primary' : 'secondary'}>
          {row.active ? <Play size={12} style={{ marginRight: 6 }} /> : null} Join call
        </Button>
      </Link>
    ) },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Meetings Center" description="Schedule, launch, and join video meetings or audio calls"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Meetings' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Schedule Meeting</Button>} />

      <Card padding="none">
        <DataTable columns={columns} data={meetings} rowKey={r => r.id} emptyTitle="No meetings scheduled" emptyMessage="Schedule a meeting or start a live video call." emptyIcon={<Video size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Meeting" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Scheduling...' : 'Schedule'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Topic" required value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Project updates and roadmap" />
          <TextField label="Start Time" type="datetime-local" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          <TextField label="Duration (Minutes)" type="number" required value={String(form.durationMinutes)} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
        </div>
      </Modal>
    </div>
  );
}
