'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, PageHeader, Spinner, Button } from '@unerp/ui';
import { LayoutDashboard, X, Edit3, Eye, BarChart3, PieChart, TrendingUp, Table, Award, Activity } from 'lucide-react';
import { useApiClient, RouteGuard } from '@unerp/framework';
import styles from './page.module.css';

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
  KPI_CARD: <TrendingUp className={styles.widgetIcon} />,
  BAR_CHART: <BarChart3 className={styles.widgetIcon} />,
  PIE_CHART: <PieChart className={styles.widgetIcon} />,
  FUNNEL: <Activity className={styles.widgetIcon} />,
  TABLE: <Table className={styles.widgetIcon} />,
  LEADERBOARD: <Award className={styles.widgetIcon} />,
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
  if (type === 'KPI_CARD') {
    const val = Math.floor(Math.random() * 900 + 100);
    return (
      <div className={styles.metricContent}>
        <div className={styles.metricValue}>${val}K</div>
        <div className={styles.metricChange}>+12.5% vs last period</div>
      </div>
    );
  }
  if (type === 'BAR_CHART') {
    const bars = [65, 45, 80, 55, 35];
    return (
      <div className={styles.barChart}>
        {bars.map((h, i) => (
          <div key={i} className={styles.barColumn}>
            <div className={styles.barFill} style={{ height: h, opacity: 0.7 + i * 0.06 }} />
            <span className={styles.chartLabel}>S{i + 1}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'PIE_CHART') {
    return (
      <div className={styles.pieChart}>
        <div className={styles.pie} />
        <div className={styles.pieLegend}>
          <span>Web 35%</span><span>Referral 25%</span><span>Direct 20%</span><span>Other 20%</span>
        </div>
      </div>
    );
  }
  if (type === 'FUNNEL') {
    const stages = [{ label: 'Prospects', w: 100 }, { label: 'Qualified', w: 75 }, { label: 'Proposal', w: 50 }, { label: 'Won', w: 30 }];
    return (
      <div className={styles.funnel}>
        {stages.map((s, i) => (
          <div key={i} className={styles.funnelStage} style={{ width: `${s.w}%`, opacity: 0.9 - i * 0.15 }}>{s.label}</div>
        ))}
      </div>
    );
  }
  if (type === 'TABLE') {
    return (
      <div className={styles.tableVisualization}>
        <div className={styles.tableHeader}>
          <span>Name</span><span>Value</span><span>Stage</span>
        </div>
        {['Acme Deal|$45K|Proposal', 'Beta Corp|$120K|Negotiation', 'Gamma Inc|$30K|Qualified'].map((row, i) => {
          const [n, v, s] = row.split('|');
          return <div key={i} className={styles.tableRow}><span>{n}</span><span>{v}</span><span>{s}</span></div>;
        })}
      </div>
    );
  }
  if (type === 'LEADERBOARD') {
    return (
      <div className={styles.leaderboard}>
        {['Sarah Chen|$320K', 'James Park|$285K', 'Maria Santos|$240K'].map((row, i) => {
          const [name, val] = row.split('|');
          return (
            <div key={i} className={`${styles.leaderboardRow} ${i < 2 ? styles.withDivider : ''}`}>
              <span><strong className={styles.rank}>#{i + 1}</strong>{name}</span>
              <span className={styles.leaderboardValue}>{val}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return <div className={styles.visualizationFallback}>{title}</div>;
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
  const client = useApiClient();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await client.get<any>(`/crm/dashboards/${dashboardId}`);
      setDashboard(data);
    } catch {
      setDashboard({ ...MOCK_DASHBOARD, id: dashboardId });
    } finally {
      setLoading(false);
    }
  }, [dashboardId, client]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleAddWidget = async () => {
    if (!widgetForm.title.trim()) return;
    setSaving(true);
    try {
      await client.post(`/crm/dashboards/${dashboardId}/widgets`, {
        widgetType: widgetForm.widgetType,
        title: widgetForm.title.trim(),
        dataSource: widgetForm.dataSource,
        config: {},
        position: { x: 0, y: 0, w: 4, h: 3 }
      });
      setShowAddModal(false);
      setWidgetForm({ widgetType: 'KPI_CARD', title: '', dataSource: 'PIPELINE' });
      fetchDashboard();
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
  if (loading) {
    return (
      <RouteGuard permission="crm.read">
        <div className={styles.page}>
          <PageHeader title="Dashboard" breadcrumbs={breadcrumbs} />
          <div className={styles.loading}><Spinner /></div>
        </div>
      </RouteGuard>
    );
  }

  if (!dashboard) {
    return (
      <RouteGuard permission="crm.read">
        <div>Dashboard not found</div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="crm.read">
      <div className={styles.page}>
        <PageHeader
          title={dashboard.name}
          breadcrumbs={breadcrumbs}
          actions={
            <Button onClick={() => setEditMode(!editMode)}>
              {editMode ? <><Eye className={styles.buttonIcon} /> View Mode</> : <><Edit3 className={styles.buttonIcon} /> Edit Mode</>}
            </Button>
          }
        />

        {dashboard.description && (
          <p className={styles.description}>{dashboard.description}</p>
        )}

        <div className={styles.dashboardLayout}>
          {/* Widget Palette - visible in edit mode */}
          {editMode && (
            <div className={styles.widgetPalette}>
              <h4 className={styles.paletteTitle}>Add Widget</h4>
              {WIDGET_TYPES.map((wt) => (
                <button key={wt} onClick={() => { setWidgetForm({ ...widgetForm, widgetType: wt }); setShowAddModal(true); }} className={styles.paletteButton}>
                  {WIDGET_ICONS[wt]}
                  <span>{wt.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Widget Grid */}
          <div className={styles.widgetGrid}>
            {dashboard.widgets.map((widget) => (
              <Card key={widget.id} className={`${styles.widgetCard} ${editMode ? styles.editMode : ''}`} style={{
                gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
              }}>
                <div className={styles.widgetHeader}>
                  {WIDGET_ICONS[widget.widgetType]}
                  <span className={styles.widgetTitle}>{widget.title}</span>
                  <span className={styles.widgetSource}>{widget.dataSource}</span>
                </div>
                <div className={styles.widgetContent}>
                  <MockVisualization type={widget.widgetType} title={widget.title} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {dashboard.widgets.length === 0 && (
          <div className={styles.emptyState}>
            <LayoutDashboard className={styles.emptyIcon} />
            <p>No widgets yet. Switch to Edit Mode and add your first widget.</p>
          </div>
        )}

        {showAddModal && (
          <div className={styles.modalOverlay}>
            <Card className={styles.modal}>
              <div className="ui-flex-between">
                <h2 className={styles.modalTitle}>Add Widget</h2>
                <button onClick={() => setShowAddModal(false)} className="ui-btn-icon ui-text-muted"><X className={styles.closeIcon} /></button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Widget Type</label>
                <select value={widgetForm.widgetType} onChange={(e) => setWidgetForm({ ...widgetForm, widgetType: e.target.value as WidgetType })} className={styles.formControl}>
                  {WIDGET_TYPES.map((wt) => <option key={wt} value={wt}>{wt.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title *</label>
                <input value={widgetForm.title} onChange={(e) => setWidgetForm({ ...widgetForm, title: e.target.value })} placeholder="e.g. Revenue by Quarter" className={styles.formControl} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Source</label>
                <select value={widgetForm.dataSource} onChange={(e) => setWidgetForm({ ...widgetForm, dataSource: e.target.value as DataSource })} className={styles.formControl}>
                  {DATA_SOURCES.map((ds) => <option key={ds} value={ds}>{ds}</option>)}
                </select>
              </div>

              <div className={styles.modalActions}>
                <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddWidget} disabled={!widgetForm.title.trim() || saving}>{saving ? 'Adding...' : 'Add Widget'}</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
