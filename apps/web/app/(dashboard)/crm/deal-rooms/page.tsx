'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { DoorOpen, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

interface DealRoomRow {
  id: string;
  name: string;
  status: string;
  opportunity: { name: string; stage: string; amount: string | number | null };
  _count: { milestones: number; stakeholders: number; documents: number };
}

export default function DealRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<DealRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ opportunityId: '', name: '' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<DealRoomRow[]>('/crm/deal-rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Could not load deal rooms', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const createRoom = async () => {
    setBusy(true);
    try {
      await apiPost('/crm/deal-rooms', form);
      toast.success('Deal room created');
      setModalOpen(false);
      setForm({ opportunityId: '', name: '' });
      await load();
    } catch (err) {
      toast.error('Could not create deal room', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<DealRoomRow>[] = [
    { key: 'name', header: 'Deal Room', render: (r) => <strong>{r.name}</strong> },
    { key: 'opportunity', header: 'Opportunity', render: (r) => r.opportunity?.name ?? '—' },
    { key: 'stage', header: 'Stage', render: (r) => r.opportunity?.stage ?? '—' },
    { key: 'milestones', header: 'Milestones', align: 'right', render: (r) => r._count.milestones },
    { key: 'stakeholders', header: 'Stakeholders', align: 'right', render: (r) => r._count.stakeholders },
    { key: 'documents', header: 'Documents', align: 'right', render: (r) => r._count.documents },
    { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'default'}>{r.status}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Deal Rooms & Mutual Action Plans"
        description="Shared buyer-seller collaborative workspaces per opportunity — milestones, stakeholder maps, and shared documents (DealHub/Recapped-style)."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Deal Rooms' }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
          <ProtectedComponent permission="crm.dealroom.create">
            <Button variant="primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={16} /> New Deal Room
            </Button>
          </ProtectedComponent>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
            <DoorOpen size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
            <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Deal Rooms Yet</div>
            <div style={{ fontSize: 'var(--text-sm)' }}>Create one to build a mutual action plan with a buyer.</div>
          </div>
        ) : (
          <DataTable<DealRoomRow>
            columns={columns}
            data={rooms}
            rowKey={(r) => r.id}
            onRowClick={(r) => router.push(`/crm/deal-rooms/${r.id}`)}
          />
        )}
      </Card>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <Card>
            <div style={{ padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>New Deal Room</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input placeholder="Opportunity ID" value={form.opportunityId} onChange={(e) => setForm({ ...form, opportunityId: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <input placeholder="Deal room name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <Button variant="primary" onClick={createRoom} disabled={busy || !form.opportunityId || !form.name}>Create Deal Room</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
