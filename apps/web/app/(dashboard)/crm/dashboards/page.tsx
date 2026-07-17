'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, StatusBadge, Spinner, Button, Badge } from '@unerp/ui';
import { LayoutDashboard, Plus, X, Copy, Share2, Star, Calendar, Grid3X3, Users, Lock } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';

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
  const client = useApiClient();

  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<any>('/crm/dashboards');
      setDashboards(Array.isArray(data) ? data : data.data || MOCK_DASHBOARDS);
    } catch {
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await client.post('/crm/dashboards', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isShared: form.isShared
      });
      setShowModal(false);
      setForm({ name: '', description: '', isShared: false });
      fetchDashboards();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async (dashboard: Dashboard) => {
    try {
      await client.post('/crm/dashboards', {
        name: `${dashboard.name} (Copy)`,
        description: dashboard.description,
        isShared: false
      });
      fetchDashboards();
    } catch {
      // silent
    }
  };

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Dashboards' }];
  const inputStyle: React.CSSProperties = { padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' };

  if (loading) {
    return (
      <RouteGuard permission="crm.read">
        <div className={styles.page}>
          <PageHeader title="Dashboards" breadcrumbs={breadcrumbs} />
          <div className={styles.loading}><Spinner /></div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="crm.read">
      <div className={styles.page}>
        <PageHeader
          title="Dashboards"
          breadcrumbs={breadcrumbs}
          actions={
            <Button onClick={() => setShowModal(true)}>
              <Plus className={styles.buttonIcon} /> New Dashboard
            </Button>
          }
        />

        {/* Summary Stats */}
        <div className={styles.summaryGrid}>
          <Card className={styles.summaryCard}>
            <div className={styles.s1}>
              {dashboards.length}
            </div>
            <div className={styles.summaryLabel}>
              Total Dashboards
            </div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.s2}>
              {dashboards.filter((d) => d.isShared).length}
            </div>
            <div className={styles.summaryLabel}>
              Shared
            </div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.s3}>
              {dashboards.reduce((sum, d) => sum + d.widgetCount, 0)}
            </div>
            <div className={styles.summaryLabel}>
              Total Widgets
            </div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.s4}>
              {dashboards.filter((d) => !d.isShared).length}
            </div>
            <div className={styles.summaryLabel}>
              Private
            </div>
          </Card>
        </div>

        <div className={styles.dashboardGrid}>
          {dashboards.map((db) => (
            <Card
              key={db.id}
              className={styles.dashboardCard}
              onClick={() => window.location.href = `/crm/dashboards/${db.id}`}
            >
              <div className="ui-flex-between ui-items-start">
                <div className={styles.cardTitle}>
                  <LayoutDashboard className={styles.dashboardIcon} />
                  <h3 className={styles.s5}>
                    {db.name}
                  </h3>
                </div>
                <div className={styles.s6}>
                  {db.isDefault && <Badge variant="success">Default</Badge>}
                  {db.isShared ? (
                    <span className={styles.s7}>
                      <Users className={styles.s22} /> Shared
                    </span>
                  ) : (
                    <span className={styles.s7}>
                      <Lock className={styles.s22} /> Private
                    </span>
                  )}
                </div>
              </div>

              {db.description && (
                <p className={styles.s8}>
                  {db.description}
                </p>
              )}

              <div className={styles.s9}>
                <Grid3X3 className={styles.s23} />
                <span className={styles.s10}>
                  {db.widgetCount} {db.widgetCount === 1 ? 'widget' : 'widgets'} configured
                </span>
              </div>

              <div className={styles.s11}>
                <span className={styles.s12}>
                  <Calendar className={styles.s22} />
                  Created {new Date(db.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleClone(db); }}
                  className={styles.s13}
                >
                  <Copy className={styles.s22} /> Clone
                </button>
              </div>
            </Card>
          ))}
        </div>

        {dashboards.length === 0 && (
          <div className={styles.s14}>
            <LayoutDashboard className={styles.s24} />
            <p>No dashboards yet. Create your first dashboard to get started.</p>
          </div>
        )}

        {showModal && (
          <div className={styles.s15}>
            <Card style={{ width: 480, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div className="ui-flex-between">
                <h2 className={styles.s16}>New Dashboard</h2>
                <button onClick={() => setShowModal(false)} className="ui-btn-icon ui-text-muted"><X className={styles.s25} /></button>
              </div>

              <div className={styles.s17}>
                <label className={styles.s18}>Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales Overview" style={inputStyle} />
              </div>

              <div className={styles.s17}>
                <label className={styles.s18}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this dashboard for..." rows={3} style={{ ...inputStyle }} className={styles.s19} />
              </div>

              <label className={styles.s20}>
                <input type="checkbox" checked={form.isShared} onChange={(e) => setForm({ ...form, isShared: e.target.checked })} />
                Share with team
              </label>

              <div className={styles.s21}>
                <Button onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>{saving ? 'Creating...' : 'Create Dashboard'}</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
