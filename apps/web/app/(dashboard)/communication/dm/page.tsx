'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, FormField, Select } from '@unerp/ui';
import { MessageSquare, Plus, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Conversation { id: string; name: string; unreadCount: number; statusText?: string; }
interface Member { id: string; name: string; presence: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function DirectMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token || ''}` };
        const res = await fetch('/api/v1/communication/workspace', { headers });
        if (res.ok) {
          const ws = await res.json();
          setConversations(ws?.conversations || []);
          setMembers(ws?.directory || []);
        }
      } catch { /* empty */ } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    if (!selectedMember) return;
    setCreating(true);
    try {
      const res = await fetch('/api/v1/communication/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ memberIds: [selectedMember] }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreateOpen(false);
        window.location.href = `/connect?chat=${data.id}`;
      }
    } catch { /* handled */ } finally { setCreating(false); }
  };

  const columns: Column<Conversation>[] = [
    { key: 'name', header: 'Direct Message Chat', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)' }}>
          {row.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</span>
          {row.statusText && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{row.statusText}</div>}
        </div>
      </div>
    ) },
    { key: 'unreads', header: 'Status', render: (row) => row.unreadCount > 0 ? <Badge variant="danger">{row.unreadCount} Unread</Badge> : <Badge variant="success">Read</Badge> },
    { key: 'action', header: 'Action', align: 'right' as const, render: (row) => (
      <Link href={`/connect?chat=${row.id}`}>
        <Button variant="secondary">Open Chat <ArrowRight size={12} style={{ marginLeft: 6 }} /></Button>
      </Link>
    ) },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Direct Messages" description="Start a private chat or browse active conversations"
        breadcrumbs={[{ label: 'Connect', href: '/communication' }, { label: 'Direct Messages' }]}
        actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> New Conversation</Button>} />

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
  );
}
