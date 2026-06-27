'use client';
import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField } from '@unerp/ui';
import { ClipboardCheck, Plus } from 'lucide-react';
interface Checklist { id: string; name: string; items: string[]; type?: string; }
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('token') : null; }

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]); const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false); const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', itemsRaw: '' });

  useEffect(() => { (async () => { try { const res = await fetch('/api/v1/field-service/checklists', { headers: { Authorization: `Bearer ${getToken() || ''}` } }); if (res.ok) { const d = await res.json(); setChecklists(Array.isArray(d) ? d : d?.data || []); } } catch {} finally { setLoading(false); } })(); }, []);
  const handleCreate = async () => { if (!form.name) return; setCreating(true); const items = form.itemsRaw.split('\n').filter(Boolean); try { await fetch('/api/v1/field-service/checklists', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` }, body: JSON.stringify({ name: form.name, items }) }); setCreateOpen(false); window.location.reload(); } catch {} finally { setCreating(false); } };

  const columns: Column<Checklist>[] = [
    { key: 'name', header: 'Template Name', render: (row) => <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{row.name}</span> },
    { key: 'items', header: 'Checklist Items', render: (row) => <span style={{ fontSize: 'var(--text-sm)' }}>{(row.items || []).join(', ')}</span> },
  ];
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  return (<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
    <PageHeader title="Service Checklists" description="Standardized technician checklists and template management" breadcrumbs={[{ label: 'Field Service', href: '/field-service' }, { label: 'Checklists' }]}
      actions={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} style={{ marginRight: 6 }} /> Create Template</Button>} />
    <Card padding="none"><DataTable columns={columns} data={checklists} rowKey={r => r.id} emptyTitle="No checklists" emptyMessage="Create checklist templates for field jobs." emptyIcon={<ClipboardCheck size={48} />} /></Card>
    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Checklist" size="md" footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Saving...' : 'Create'}</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}><TextField label="Checklist Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /><TextField label="Checklist Items (one per line)" required value={form.itemsRaw} onChange={e => setForm({...form, itemsRaw: e.target.value})} placeholder="Check power connection&#10;Verify pressure readings&#10;Clean filter intake" /></div>
    </Modal>
  </div>);
}
