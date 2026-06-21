'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import { BookOpen, Plus, X, Layers, Swords, ChevronRight, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  description: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  isActive: boolean;
  stages: Array<{ id: string }>;
  battlecards: Array<{ id: string }>;
  createdAt: string;
}

const MOCK_PLAYBOOKS: Playbook[] = [
  { id: '1', name: 'Enterprise Sales', description: 'Playbook for large enterprise deals with long sales cycles', pipelineId: 'p1', pipelineName: 'Enterprise Pipeline', isActive: true, stages: [{ id: 's1' }, { id: 's2' }, { id: 's3' }], battlecards: [{ id: 'b1' }, { id: 'b2' }], createdAt: '2026-06-01' },
  { id: '2', name: 'SMB Quick Close', description: 'Fast-track playbook for small and mid-size businesses', pipelineId: 'p2', pipelineName: 'SMB Pipeline', isActive: true, stages: [{ id: 's4' }, { id: 's5' }], battlecards: [{ id: 'b3' }], createdAt: '2026-06-10' },
  { id: '3', name: 'Partner Channel', description: 'Reseller and partner-driven sales motion', pipelineId: null, pipelineName: null, isActive: false, stages: [{ id: 's6' }], battlecards: [], createdAt: '2026-05-20' },
  { id: '4', name: 'Inbound Qualification', description: 'Playbook for qualifying and converting inbound marketing leads', pipelineId: 'p3', pipelineName: 'Inbound Pipeline', isActive: true, stages: [{ id: 's7' }, { id: 's8' }, { id: 's9' }, { id: 's10' }], battlecards: [{ id: 'b4' }, { id: 'b5' }, { id: 'b6' }], createdAt: '2026-06-15' },
  { id: '5', name: 'Renewal Playbook', description: 'Customer renewal and upsell strategies for existing accounts', pipelineId: 'p4', pipelineName: 'Renewals Pipeline', isActive: true, stages: [{ id: 's11' }, { id: 's12' }], battlecards: [{ id: 'b7' }], createdAt: '2026-06-18' },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', pipelineId: '' });

  useEffect(() => { fetchPlaybooks(); }, []);

  const fetchPlaybooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/playbooks', {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPlaybooks(Array.isArray(data) ? data : data.data || MOCK_PLAYBOOKS);
    } catch {
      setPlaybooks(MOCK_PLAYBOOKS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          pipelineId: form.pipelineId.trim() || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', description: '', pipelineId: '' });
        fetchPlaybooks();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'CRM', href: '/crm' },
    { label: 'Playbooks' },
  ];

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)' }}>
        <PageHeader title="Playbooks" breadcrumbs={breadcrumbs} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-10)' }}><Spinner /></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <PageHeader title="Playbooks" breadcrumbs={breadcrumbs}>
        <Button onClick={() => setShowModal(true)}>
          <Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Playbook
        </Button>
      </PageHeader>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--spacing-3)',
        marginTop: 'var(--spacing-5)',
      }}>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {playbooks.length}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Total Playbooks
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
            {playbooks.filter((p) => p.isActive).length}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Active
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {playbooks.reduce((sum, p) => sum + p.stages.length, 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Total Stages
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
            {playbooks.reduce((sum, p) => sum + p.battlecards.length, 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Total Battlecards
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
        {playbooks.map((pb) => (
          <Card key={pb.id} style={{ padding: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <BookOpen style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {pb.name}
                </h3>
              </div>
              <StatusBadge
                status={pb.isActive ? 'active' : 'inactive'}
                label={pb.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            {pb.description && (
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}>
                {pb.description}
              </p>
            )}

            {pb.pipelineName && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-2) var(--spacing-3)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}>
                <Layers style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 500 }}>{pb.pipelineName}</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-4)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronRight style={{ width: 14, height: 14 }} />
                {pb.stages.length} {pb.stages.length === 1 ? 'stage' : 'stages'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Swords style={{ width: 14, height: 14 }} />
                {pb.battlecards.length} {pb.battlecards.length === 1 ? 'battlecard' : 'battlecards'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--spacing-3)',
              marginTop: 'var(--spacing-1)',
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
              }}>
                <Calendar style={{ width: 12, height: 12 }} />
                Created {new Date(pb.createdAt).toLocaleDateString()}
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--font-size-xs)',
                color: pb.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
              }}>
                {pb.isActive
                  ? <ToggleRight style={{ width: 14, height: 14 }} />
                  : <ToggleLeft style={{ width: 14, height: 14 }} />}
                {pb.isActive ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {playbooks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-secondary)' }}>
          <BookOpen style={{ width: 48, height: 48, marginBottom: 'var(--spacing-3)', opacity: 0.4 }} />
          <p>No playbooks yet. Create your first playbook to get started.</p>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: 480, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>New Playbook</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Enterprise Sales" style={{ padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the sales playbook..." rows={3} style={{ padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', resize: 'vertical', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Pipeline ID (optional)</label>
              <input value={form.pipelineId} onChange={(e) => setForm({ ...form, pipelineId: e.target.value })} placeholder="Link to a pipeline" style={{ padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>
                {saving ? 'Creating...' : 'Create Playbook'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
