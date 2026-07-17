'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, FormField, Select } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';
import { MessageSquare, Plus, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Conversation { id: string; name: string; unreadCount: number; statusText?: string; }
interface Member { id: string; name: string; presence: string; }
interface WorkspaceResponse { conversations?: Conversation[]; directory?: Member[]; }

export default function DirectMessagesPage() {
  const client = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ws = await client.get<WorkspaceResponse>('/communication/workspace');
        setConversations(ws.conversations || []);
        setMembers(ws.directory || []);
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, [client]);

  const handleCreate = async () => {
    if (!selectedMember) return;
    setCreating(true);
    try {
      const data = await client.post<{ id: string }>('/communication/conversations', { memberIds: [selectedMember] });
      setCreateOpen(false);
      window.location.href = `/connect?chat=${data.id}`;
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Conversation>[] = [
    { key: 'name', header: 'Direct Message Chat', render: (row) => (
      <div className="ui-hstack-3">
        <div className={styles.s1}>
          {row.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <span className="ui-heading-sm">{row.name}</span>
          {row.statusText && <div className="ui-text-xs-tertiary">{row.statusText}</div>}
        </div>
      </div>
    ) },
    { key: 'unreads', header: 'Status', render: (row) => row.unreadCount > 0 ? <Badge variant="danger">{row.unreadCount} Unread</Badge> : <Badge variant="success">Read</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?chat=${row.id}`}>
        <Button variant="secondary">Open Chat <ArrowRight size={12} className={styles.s2} /></Button>
      </Link>
    ) },
  ];

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  return (
    <RouteGuard permission="communication.dm.read">
    <div className="ui-stack-6">
      <PageHeader title="Direct Messages" description="Start a private chat or browse active conversations"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Direct Messages' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> New Conversation</Button>} />

      <Card padding="none">
        <DataTable columns={columns} data={conversations} rowKey={r => r.id} emptyTitle="No conversations found" emptyMessage="Create a direct conversation to start messaging." emptyIcon={<MessageSquare size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Private Chat" size="sm"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Starting...' : 'Start Chat'}</Button></>}>
        <FormField label="Select Colleague">
          <Select value={selectedMember} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMember(e.target.value)}>
            <option value="">Select a user...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.presence.toLowerCase()})</option>)}
          </Select>
        </FormField>
      </Modal>
    </div>
    </RouteGuard>
  );
}
