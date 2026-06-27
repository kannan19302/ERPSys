'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField } from '@unerp/ui';
import { Users, Plus, Hash, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Channel { id: string; name: string; isPrivate: boolean; description?: string; unreadCount: number; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function SpacesPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPrivate: false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/communication/workspace', {
          headers: { Authorization: `Bearer ${getToken() || ''}` },
        });
        if (res.ok) {
          const ws = await res.json();
          setChannels(ws?.channels || []);
        }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      await fetch('/api/v1/communication/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify(form),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const filtered = channels.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Channel>[] = [
    { key: 'name', header: 'Space / Channel', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Hash size={16} />
        </div>
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>#{row.name}</span>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.description || 'No description'}</div>
        </div>
      </div>
    ) },
    { key: 'type', header: 'Visibility', render: (row) => <Badge variant={row.isPrivate ? 'warning' : 'success'}>{row.isPrivate ? 'Private' : 'Public'}</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?channel=${row.id}`}>
        <Button variant="secondary">Join & Chat <ArrowRight size={12} style={{ marginLeft: 6 }} /></Button>
      </Link>
    ) },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Spaces & Channels" description="Discover and join public or private discussion channels"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Spaces' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Create Channel</Button>} />

      <Card>
        <div style={{ padding: 'var(--space-3) var(--space-4)', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input type="text" placeholder="Search spaces..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', outline: 'none' }} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No spaces found" emptyMessage="Create a space or channel to start communicating." emptyIcon={<Users size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Space / Channel" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField label="Channel Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="project-updates" />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project updates and team feedback" />
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-1) 0' }}>
            <input type="checkbox" id="isPrivate" checked={form.isPrivate} onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
            <label htmlFor="isPrivate" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', cursor: 'pointer' }}>Make Private Channel</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
