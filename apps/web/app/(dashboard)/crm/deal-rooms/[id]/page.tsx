'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Button, Spinner, Badge, useToast, ProtectedComponent } from '@unerp/ui';
import { CheckCircle2, Circle, Plus, X, Users, FileText } from 'lucide-react';
import { apiGet, apiPost } from '../../../../../src/lib/api';
import { ApiRequestError } from '../../../../../src/lib/api';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  ownerType: string;
  status: string;
  dueDate: string | null;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  side: string;
  sentiment: string | null;
}

interface DocumentRow {
  id: string;
  title: string;
  url: string;
  category: string;
  viewedByBuyerAt: string | null;
}

interface DealRoomDetail {
  id: string;
  name: string;
  status: string;
  buyerAccessToken: string;
  opportunity: { name: string; stage: string; amount: string | number | null; expectedCloseDate: string | null };
  milestones: Milestone[];
  stakeholders: Stakeholder[];
  documents: DocumentRow[];
}

export default function DealRoomDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [room, setRoom] = useState<DealRoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', ownerType: 'SELLER' as 'SELLER' | 'BUYER' | 'MUTUAL' });
  const [stakeholderModalOpen, setStakeholderModalOpen] = useState(false);
  const [stakeholderForm, setStakeholderForm] = useState({ name: '', role: 'ECONOMIC_BUYER', side: 'BUYER' as 'BUYER' | 'SELLER' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<DealRoomDetail>(`/crm/deal-rooms/${id}`);
      setRoom(data);
    } catch (err) {
      toast.error('Could not load deal room', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const addMilestone = async () => {
    setBusy(true);
    try {
      await apiPost(`/crm/deal-rooms/${id}/milestones`, milestoneForm);
      toast.success('Milestone added');
      setMilestoneModalOpen(false);
      setMilestoneForm({ title: '', ownerType: 'SELLER' });
      await load();
    } catch (err) {
      toast.error('Could not add milestone', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const addStakeholder = async () => {
    setBusy(true);
    try {
      await apiPost(`/crm/deal-rooms/${id}/stakeholders`, stakeholderForm);
      toast.success('Stakeholder added');
      setStakeholderModalOpen(false);
      setStakeholderForm({ name: '', role: 'ECONOMIC_BUYER', side: 'BUYER' });
      await load();
    } catch (err) {
      toast.error('Could not add stakeholder', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;
  if (!room) return <div style={{ padding: 'var(--space-8)' }}>Deal room not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title={room.name}
        description={`Opportunity: ${room.opportunity.name} · Stage: ${room.opportunity.stage}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Deal Rooms', href: '/crm/deal-rooms' }, { label: room.name }]}
      />

      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Mutual Action Plan</h3>
          <ProtectedComponent permission="crm.dealroom.update">
            <Button variant="secondary" onClick={() => setMilestoneModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={16} /> Add Milestone
            </Button>
          </ProtectedComponent>
        </div>
        <div style={{ padding: '0 var(--space-4) var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {room.milestones.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-4) 0' }}>No milestones yet.</div>
          ) : room.milestones.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              {m.status === 'DONE' ? <CheckCircle2 size={18} color="var(--color-success)" /> : <Circle size={18} color="var(--color-text-secondary)" />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'var(--weight-semibold)' }}>{m.title}</div>
                {m.dueDate && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Due {new Date(m.dueDate).toLocaleDateString()}</div>}
              </div>
              <Badge variant={m.ownerType === 'BUYER' ? 'info' : m.ownerType === 'MUTUAL' ? 'warning' : 'default'}>{m.ownerType}</Badge>
              <Badge variant={m.status === 'DONE' ? 'success' : m.status === 'BLOCKED' ? 'danger' : 'default'}>{m.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Users size={18} /> Stakeholder Map</h3>
          <ProtectedComponent permission="crm.dealroom.update">
            <Button variant="secondary" onClick={() => setStakeholderModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Plus size={16} /> Add Stakeholder
            </Button>
          </ProtectedComponent>
        </div>
        <div style={{ padding: '0 var(--space-4) var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {room.stakeholders.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-4) 0' }}>No stakeholders mapped yet.</div>
          ) : room.stakeholders.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1 }}>{s.name}</div>
              <Badge variant="default">{s.role.replace(/_/g, ' ')}</Badge>
              <Badge variant={s.side === 'BUYER' ? 'info' : 'default'}>{s.side}</Badge>
              {s.sentiment && <Badge variant={s.sentiment === 'SUPPORTIVE' ? 'success' : s.sentiment === 'RESISTANT' ? 'danger' : 'default'}>{s.sentiment}</Badge>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><FileText size={18} /> Shared Documents</h3>
        </div>
        <div style={{ padding: '0 var(--space-4) var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {room.documents.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-4) 0' }}>No documents shared yet.</div>
          ) : room.documents.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <a href={d.url} target="_blank" rel="noreferrer" style={{ flex: 1, color: 'var(--color-primary)' }}>{d.title}</a>
              <Badge variant="default">{d.category}</Badge>
              {d.viewedByBuyerAt && <Badge variant="success">Viewed by buyer</Badge>}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Buyer share link: <code>{`/public/deal-rooms/${room.buyerAccessToken}`}</code>
        </div>
      </Card>

      {milestoneModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <Card>
            <div style={{ padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Add Milestone</h3>
                <button onClick={() => setMilestoneModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input placeholder="Milestone title" value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <select value={milestoneForm.ownerType} onChange={(e) => setMilestoneForm({ ...milestoneForm, ownerType: e.target.value as 'SELLER' | 'BUYER' | 'MUTUAL' })} style={{ padding: 'var(--space-2)' }}>
                <option value="SELLER">Seller-owned</option>
                <option value="BUYER">Buyer-owned</option>
                <option value="MUTUAL">Mutual</option>
              </select>
              <Button variant="primary" onClick={addMilestone} disabled={busy || !milestoneForm.title}>Add Milestone</Button>
            </div>
          </Card>
        </div>
      )}

      {stakeholderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <Card>
            <div style={{ padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Add Stakeholder</h3>
                <button onClick={() => setStakeholderModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input placeholder="Name" value={stakeholderForm.name} onChange={(e) => setStakeholderForm({ ...stakeholderForm, name: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <select value={stakeholderForm.role} onChange={(e) => setStakeholderForm({ ...stakeholderForm, role: e.target.value })} style={{ padding: 'var(--space-2)' }}>
                <option value="ECONOMIC_BUYER">Economic Buyer</option>
                <option value="CHAMPION">Champion</option>
                <option value="INFLUENCER">Influencer</option>
                <option value="BLOCKER">Blocker</option>
                <option value="LEGAL">Legal</option>
                <option value="TECHNICAL">Technical</option>
              </select>
              <select value={stakeholderForm.side} onChange={(e) => setStakeholderForm({ ...stakeholderForm, side: e.target.value as 'BUYER' | 'SELLER' })} style={{ padding: 'var(--space-2)' }}>
                <option value="BUYER">Buyer side</option>
                <option value="SELLER">Seller side</option>
              </select>
              <Button variant="primary" onClick={addStakeholder} disabled={busy || !stakeholderForm.name}>Add Stakeholder</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
