'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Spinner, Button } from '@unerp/ui';
import { LayoutDashboard, Plus, X, Edit3, Eye, BarChart3, PieChart, TrendingUp, Table, Award, Activity } from 'lucide-react';

type WidgetType = 'KPI_CARD' | 'BAR_CHART' | 'PIE_CHART' | 'FUNNEL' | 'TABLE' | 'LEADERBOARD';
type DataSource = 'PIPELINE' | 'LEADS' | 'ACTIVITIES' | 'REVENUE' | 'TARGETS' | 'CONVERSIONS' | 'COMMISSIONS';

interface Widget {
  id: string;
  widgetType: WidgetType;
  title: string;
  dataSource: DataSource;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  widgets: Widget[];
}

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  KPI_CARD: <TrendingUp style={{ width: 16, height: 16 }} />,
  BAR_CHART: <BarChart3 style={{ width: 16, height: 16 }} />,
  PIE_CHART: <PieChart style={{ width: 16, height: 16 }} />,
  FUNNEL: <Activity style={{ width: 16, height: 16 }} />,
  TABLE: <Table style={{ width: 16, height: 16 }} />,
  LEADERBOARD: <Award style={{ width: 16, height: 16 }} />,
};

const WIDGET_TYPES: WidgetType[] = ['KPI_CARD', 'BAR_CHART', 'PIE_CHART', 'FUNNEL', 'TABLE', 'LEADERBOARD'];
const DATA_SOURCES: DataSource[] = ['PIPELINE', 'LEADS', 'ACTIVITIES', 'REVENUE', 'TARGETS', 'CONVERSIONS', 'COMMISSIONS'];

const MOCK_DASHBOARD: Dashboard = {
  id: '1', name: 'Sales Overview', description: 'Key metrics for the sales team',
  widgets: [
    { id: 'w1', widgetType: 'KPI_CARD', title: 'Total Revenue', dataSource: 'REVENUE', config: {}, position: { x: 0, y: 0, w: 3, h: 2 } },
    { id: 'w2', widgetType: 'BAR_CHART', title: 'Pipeline by Stage', dataSource: 'PIPELINE', config: {}, position: { x: 3, y: 0, w: 5, h: 4 } },
    { id: 'w3', widgetType: 'PIE_CHART', title: 'Lead Sources', dataSource: 'LEADS', config: {}, position: { x: 8, y: 0, w: 4, h: 4 } },
    { id: 'w4', widgetType: 'KPI_CARD', title: 'Win Rate', dataSource: 'CONVERSIONS', config: {}, position: { x: 0, y: 2, w: 3, h: 2 } },
    { id: 'w5', widgetType: 'FUNNEL', title: 'Sales Funnel', dataSource: 'PIPELINE', config: {}, position: { x: 0, y: 4, w: 6, h: 4 } },
    { id: 'w6', widgetType: 'LEADERBOARD', title: 'Top Reps', dataSource: 'COMMISSIONS', config: {}, position: { x: 6, y: 4, w: 6, h: 4 } },
  ],
};

function MockVisualization({ type, title }: { type: WidgetType; title: string }) {
  const barColor = 'var(--color-primary)';
  if (type === 'KPI_CARD') {
    const val = Math.floor(Math.random() * 900 + 100);
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-3)' }}>
        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>${val}K</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginTop: 4 }}>+12.5% vs last period</div>
      </div>
    );
  }
  if (type === 'BAR_CHART') {
    const bars = [65, 45, 80, 55, 35];
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: 'var(--spacing-2)' }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: h, background: barColor, borderRadius: '4px 4px 0 0', opacity: 0.7 + i * 0.06 }} />
            <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>S{i + 1}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'PIE_CHART') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-2)' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: `conic-gradient(var(--color-primary) 0% 35%, var(--color-success) 35% 60%, var(--color-warning) 60% 80%, var(--color-border) 80% 100%)` }} />
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>Web 35%</span><span>Referral 25%</span><span>Direct 20%</span><span>Other 20%</span>
        </div>
      </div>
    );
  }
  if (type === 'FUNNEL') {
    const stages = [{ label: 'Prospects', w: 100 }, { label: 'Qualified', w: 75 }, { label: 'Proposal', w: 50 }, { label: 'Won', w: 30 }];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: 'var(--spacing-2)' }}>
        {stages.map((s, i) => (
          <div key={i} style={{ width: `${s.w}%`, background: barColor, opacity: 0.9 - i * 0.15, padding: '4px 0', textAlign: 'center', fontSize: 10, color: '#fff', borderRadius: 2 }}>{s.label}</div>
        ))}
      </div>
    );
  }
  if (type === 'TABLE') {
    return (
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', padding: 'var(--spacing-2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontWeight: 600, borderBottom: '1px solid var(--color-border)', paddingBottom: 4, marginBottom: 4, color: 'var(--color-text-primary)' }}>
          <span>Name</span><span>Value</span><span>Stage</span>
        </div>
        {['Acme Deal|$45K|Proposal', 'Beta Corp|$120K|Negotiation', 'Gamma Inc|$30K|Qualified'].map((row, i) => {
          const [n, v, s] = row.split('|');
          return <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: '2px 0' }}><span>{n}</span><span>{v}</span><span>{s}</span></div>;
        })}
      </div>
    );
  }
  if (type === 'LEADERBOARD') {
    return (
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', padding: 'var(--spacing-2)' }}>
        {['Sarah Chen|$320K', 'James Park|$285K', 'Maria Santos|$240K'].map((row, i) => {
          const [name, val] = row.split('|');
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <span><strong style={{ color: 'var(--color-primary)', marginRight: 6 }}>#{i + 1}</strong>{name}</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return <div style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{title}</div>;
}

export default function DashboardCanvasPage() {
  const params = useParams();
  const dashboardId = params.id as string;
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [widgetForm, setWidgetForm] = useState({ widgetType: 'KPI_CARD' as WidgetType, title: '', dataSource: 'PIPELINE' as DataSource });

  useEffect(() => { fetchDashboard(); }, [dashboardId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/crm/dashboards/${dashboardId}`, { headers: { Authorization: `Bearer ${token || ''}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setDashboard(data);
    } catch {
      setDashboard({ ...MOCK_DASHBOARD, id: dashboardId });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = async () => {
    if (!widgetForm.title.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/crm/dashboards/${dashboardId}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ widgetType: widgetForm.widgetType, title: widgetForm.title.trim(), dataSource: widgetForm.dataSource, config: {}, position: { x: 0, y: 0, w: 4, h: 3 } }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setWidgetForm({ widgetType: 'KPI_CARD', title: '', dataSource: 'PIPELINE' });
        fetchDashboard();
      }
    } catch {
      // fallback: add locally
      if (dashboard) {
        const newWidget: Widget = { id: `w${Date.now()}`, ...widgetForm, title: widgetForm.title.trim(), config: {}, position: { x: 0, y: 0, w: 4, h: 3 } };
        setDashboard({ ...dashboard, widgets: [...dashboard.widgets, newWidget] });
      }
      setShowAddModal(false);
      setWidgetForm({ widgetType: 'KPI_CARD', title: '', dataSource: 'PIPELINE' });
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'CRM', href: '/crm' }, { label: 'Dashboards', href: '/crm/dashboards' }, { label: dashboard?.name || 'Dashboard' }];
  const inputStyle: React.CSSProperties = { padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' };

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-6)' }}>
        <PageHeader title="Dashboard" breadcrumbs={breadcrumbs} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-10)' }}><Spinner /></div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div style={{ padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      <PageHeader
        title={dashboard.name}
        breadcrumbs={breadcrumbs}
        actions={
          <Button onClick={() => setEditMode(!editMode)}>
            {editMode ? <><Eye style={{ width: 16, height: 16, marginRight: 6 }} /> View Mode</> : <><Edit3 style={{ width: 16, height: 16, marginRight: 6 }} /> Edit Mode</>}
          </Button>
        }
      />

      {dashboard.description && (
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{dashboard.description}</p>
      )}

      <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
        {/* Widget Palette - visible in edit mode */}
        {editMode && (
          <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-1)' }}>Add Widget</h4>
            {WIDGET_TYPES.map((wt) => (
              <button key={wt} onClick={() => { setWidgetForm({ ...widgetForm, widgetType: wt }); setShowAddModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', padding: 'var(--spacing-2) var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-primary)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', textAlign: 'left', width: '100%' }}>
                {WIDGET_ICONS[wt]}
                <span>{wt.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>
        )}

        {/* Widget Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--spacing-3)', gridAutoRows: 60 }}>
          {dashboard.widgets.map((widget) => (
            <Card key={widget.id} style={{
              gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
              gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
              padding: 'var(--spacing-3)',
              display: 'flex', flexDirection: 'column',
              border: editMode ? '2px dashed var(--color-border)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)', paddingBottom: 'var(--spacing-2)', borderBottom: '1px solid var(--color-border)' }}>
                {WIDGET_ICONS[widget.widgetType]}
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{widget.title}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>{widget.dataSource}</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <MockVisualization type={widget.widgetType} title={widget.title} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {dashboard.widgets.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)', color: 'var(--color-text-secondary)' }}>
          <LayoutDashboard style={{ width: 48, height: 48, marginBottom: 'var(--spacing-3)', opacity: 0.4 }} />
          <p>No widgets yet. Switch to Edit Mode and add your first widget.</p>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: 480, padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Add Widget</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Widget Type</label>
              <select value={widgetForm.widgetType} onChange={(e) => setWidgetForm({ ...widgetForm, widgetType: e.target.value as WidgetType })} style={selectStyle}>
                {WIDGET_TYPES.map((wt) => <option key={wt} value={wt}>{wt.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Title *</label>
              <input value={widgetForm.title} onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })} placeholder="e.g. Revenue by Quarter" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>Data Source</label>
              <select value={widgetForm.dataSource} onChange={(e) => setWidgetForm({ ...widgetForm, dataSource: e.target.value as DataSource })} style={selectStyle}>
                {DATA_SOURCES.map((ds) => <option key={ds} value={ds}>{ds}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
              <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddWidget} disabled={!widgetForm.title.trim() || saving}>{saving ? 'Adding...' : 'Add Widget'}</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
