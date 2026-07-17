'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { Users, Plus, Hash, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Channel { id: string; name: string; isPrivate: boolean; description?: string; unreadCount: number; }
interface WorkspaceResponse { channels?: Channel[]; }

export default function SpacesPage() {
  const client = useApiClient();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPrivate: false });

  useEffect(() => {
    (async () => {
      try {
        const ws = await client.get<WorkspaceResponse>('/communication/workspace');
        setChannels(ws.channels || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      await client.post('/communication/channels', form);
      setCreateOpen(false);
      window.location.reload();
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const filtered = channels.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Channel>[] = [
    { key: 'name', header: 'Space / Channel', render: (row) => (
      <div className="ui-hstack-3">
        <div className={styles.s1}>
          <Hash size={16} />
        </div>
        <div>
          <span className="ui-heading-sm">#{row.name}</span>
          <div className="ui-text-xs-tertiary">{row.description || 'No description'}</div>
        </div>
      </div>
    ) },
    { key: 'type', header: 'Visibility', render: (row) => <Badge variant={row.isPrivate ? 'warning' : 'success'}>{row.isPrivate ? 'Private' : 'Public'}</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?channel=${row.id}`}>
        <Button variant="secondary">Join & Chat <ArrowRight size={12} className={styles.s2} /></Button>
      </Link>
    ) },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="communication.spaces.read">
    <div className="ui-stack-6">
      <PageHeader title="Spaces & Channels" description="Discover and join public or private discussion channels"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Spaces' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Create Channel</Button>} />

      <Card>
        <div className={styles.s3}>
          <Search size={16} className={styles.s4} />
          <input type="text" placeholder="Search spaces..." value={search} onChange={e => setSearch(e.target.value)}
            className={styles.s5} />
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={filtered} rowKey={r => r.id} emptyTitle="No spaces found" emptyMessage="Create a space or channel to start communicating." emptyIcon={<Users size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Space / Channel" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Channel Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="project-updates" />
          <TextField label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project updates and team feedback" />
          <div className={styles.s6}>
            <input type="checkbox" id="isPrivate" checked={form.isPrivate} onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
            <label htmlFor="isPrivate" className={styles.s7}>Make Private Channel</label>
          </div>
        </div>
      </Modal>
    </div>
    </RouteGuard>
  );
}
