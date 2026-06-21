'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button } from '@unerp/ui';
import { LayoutDashboard, Plus, X, Copy, Share2, Star, Calendar, Grid3X3, Users, Lock } from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  isShared: boolean;
  isDefault: boolean;
  widgetCount: number;
  createdAt: string;
}

const MOCK_DASHBOARDS: Dashboard[] = [
  { id: '1', name: 'Sales Overview', description: 'Key metrics for the sales team including pipeline and revenue', isShared: true, isDefault: true, widgetCount: 6, createdAt: '2026-05-15' },
  { id: '2', name: 'Pipeline Health', description: 'Detailed pipeline analysis with stage breakdown and velocity', isShared: true, isDefault: false, widgetCount: 4, createdAt: '2026-06-01' },
  { id: '3', name: 'My Performance', description: 'Personal sales targets and activity tracking', isShared: false, isDefault: false, widgetCount: 3, createdAt: '2026-06-10' },
  { id: '4', name: 'Marketing ROI', description: 'Lead source attribution and campaign effectiveness metrics', isShared: true, isDefault: false, widgetCount: 5, createdAt: '2026-06-14' },
  { id: '5', name: 'Executive Summary', description: 'High-level revenue, win rate, and forecast overview for leadership', isShared: true, isDefault: false, widgetCount: 8, createdAt: '2026-06-18' },
];

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isShared: false });

  useEffect(() => { fetchDashboards(); }, []);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/dashboards', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setDashboards(Array.isArray(data) ? data : data.data || MOCK_DASHBOARDS);
    } catch {
      setDashboards(MOCK_DASHBOARDS);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, isShared: form.isShared }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', description: '', isShared: false });
        fetchDashboards();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async (dashboard: Dashboard) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ name: `${dashboard.name} (Copy)`, description: dashboard.description, isShared: false }),
      });
      if (res.ok) fetchDashboards();
    } catch {
      // silent
    }
  };

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Dashboards' }];
  const inputStyle: React.CSSProperties = { padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)' }}>
        <PageHeader title="Dashboards" breadcrumbs={breadcrumbs} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-10)' }}><Spinner /></div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <PageHeader title="Dashboards" breadcrumbs={breadcrumbs}>
        <Button onClick={() => setShowModal(true)}><Plus style={{ width: 16, height: 16, marginRight: 6 }} /> New Dashboard</Button>
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
            {dashboards.length}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Total Dashboards
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-success)' }}>
            {dashboards.filter((d) => d.isShared).length}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Shared
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {dashboards.reduce((sum, d) => sum + d.widgetCount, 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Total Widgets
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-4)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
            {dashboards.filter((d) => !d.isShared).length}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Private
          </div>
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 'var(--spacing-4)',
        marginTop: 'var(--spacing-4)',
      }}>
        {dashboards.map((db) => (
          <Card
            key={db.id}
            style={{
              padding: 'var(--spacing-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-3)',
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}
            onClick={() => window.location.href = `/crm/dashboards/${db.id}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <LayoutDashboard style={{ width: 20, height: 20, color: 'var(--color-primary)' }} />
                <h3 style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}>
                  {db.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
                {db.isDefault && <StatusBadge status="active" label="Default" />}
                {db.isShared ? (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <Users style={{ width: 12, height: 12 }} /> Shared
                  </span>
                ) : (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-secondary)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    <Lock style={{ width: 12, height: 12 }} /> Private
                  </span>
                )}
              </div>
            </div>

            {db.description && (
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
              }}>
                {db.description}
              </p>
            )}

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
              <Grid3X3 style={{ width: 14, height: 14, color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 500 }}>
                {db.widgetCount} {db.widgetCount === 1 ? 'widget' : 'widgets'} configured
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--spacing-3)',
              marginTop: 'var(--spacing-1)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-xs)' }}>
                <Calendar style={{ width: 12, height: 12 }} />
                Created {new Date(db.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleClone(db); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <Copy style={{ width: 12, height: 12 }} /> Clone
              </button>
            </div>
          </Card>
        ))}
      </div>

      {dashboards.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-secondary)' }}>
          <LayoutDashboard style={{ width: 48, height: 48, marginBottom: 'var(--spacing-3)', opacity: 0.4 }} />
          <p>No dashboards yet. Create your first dashboard to get started.</p>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: 480, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>New Dashboard</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Overview" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this dashboard for..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isShared} onChange={(e) => setForm({ ...form, isShared: e.target.checked })} />
              Share with team
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>{saving ? 'Creating...' : 'Create Dashboard'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
