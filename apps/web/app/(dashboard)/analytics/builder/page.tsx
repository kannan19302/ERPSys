'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Save, Trash2, BarChart3, LineChart, PieChart,
  Gauge, RefreshCw, GripVertical, Check,
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface Dashboard {
  id: string;
  name: string;
  layout?: Widget[];
}

interface Widget {
  id: string;
  title: string;
  chartType: 'BAR' | 'LINE' | 'PIE' | 'GAUGE';
  source: string;
  width: 1 | 2;
}

const CHART_TYPES: { type: Widget['chartType']; icon: React.ReactNode; label: string }[] = [
  { type: 'BAR', icon: <BarChart3 size={16} />, label: 'Bar' },
  { type: 'LINE', icon: <LineChart size={16} />, label: 'Line' },
  { type: 'PIE', icon: <PieChart size={16} />, label: 'Pie' },
  { type: 'GAUGE', icon: <Gauge size={16} />, label: 'Gauge' },
];

const SOURCES = ['Revenue', 'Invoices', 'Products', 'Employees', 'Purchase Orders', 'Sales Orders'];

let widgetSeq = 0;
const newWidget = (): Widget => ({
  id: `w-${Date.now()}-${widgetSeq++}`,
  title: 'New Widget',
  chartType: 'BAR',
  source: 'Revenue',
  width: 1,
});

export default function DashboardBuilderPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const loadDashboards = async () => {
    try {
      const data = await client.get<Dashboard[]>('/analytics/dashboards');
      const list: Dashboard[] = Array.isArray(data) ? data : [];
      setDashboards(list);
      if (list[0]) selectDashboard(list[0]);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, [client]);

  const selectDashboard = (d: Dashboard) => {
    setActiveId(d.id);
    setWidgets(Array.isArray(d.layout) ? d.layout : []);
    setSaved(false);
  };

  const createDashboard = async () => {
    const name = prompt('New dashboard name:');
    if (!name) return;
    const d = await client.post<Dashboard>('/analytics/dashboards', { name, layout: [] });
    setDashboards(prev => [d, ...prev]);
    selectDashboard(d);
  };

  const addWidget = () => {
    setWidgets(prev => [...prev, newWidget()]);
    setSaved(false);
  };

  const updateWidget = (id: string, patch: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => (w.id === id ? { ...w, ...patch } : w)));
    setSaved(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setSaved(false);
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setWidgets(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      if (moved) next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setSaved(false);
  };

  const saveLayout = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      await client.patch(`/analytics/dashboards/${activeId}`, { layout: widgets });
      setSaved(true);
      setDashboards(prev => prev.map(d => (d.id === activeId ? { ...d, layout: widgets } : d)));
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Save error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <RefreshCw className="animate-spin" size={32} />
        <span className={styles.s2}>Loading dashboards…</span>
      </div>
    );
  }

  const chartIcon = (t: Widget['chartType']) => CHART_TYPES.find(c => c.type === t)?.icon;

  return (
    <RouteGuard permission="analytics.dashboard.manage">
      <div className="ui-stack-6">
      <div className={styles.s3}>
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <LayoutDashboard className="ui-text-primary" />
            Dashboard Builder
          </h1>
          <p className="ui-text-sm-muted">
            Compose widgets, drag to reorder, and save the layout to your dashboard.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <button onClick={addWidget} disabled={!activeId} style={{ cursor: activeId ? 'pointer' : 'not-allowed' }} className={styles.s4}>
            <Plus size={16} /> Add Widget
          </button>
          <button onClick={saveLayout} disabled={!activeId || saving} style={{ background: saved ? 'var(--color-success)' : 'var(--color-primary)', cursor: activeId ? 'pointer' : 'not-allowed' }} className={styles.s5}>
            {saved ? <Check size={16} /> : <Save size={16} />} {saving ? 'Saving…' : saved ? 'Saved' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div className={styles.s6}>
        {/* Dashboard list */}
        <div className={styles.s7}>
          <div className="ui-flex-between">
            <h3 className={styles.s8}>Dashboards</h3>
            <button onClick={createDashboard} title="New dashboard" className={styles.s9}>
              <Plus size={16} />
            </button>
          </div>
          {dashboards.map(d => (
            <button key={d.id} onClick={() => selectDashboard(d)} style={{ borderColor: activeId === d.id ? 'var(--color-primary)' : 'var(--color-border)', background: activeId === d.id ? 'var(--color-primary-light)' : 'var(--color-bg)' }} className={styles.s10}>
              {d.name}
            </button>
          ))}
          {dashboards.length === 0 && (
            <p className="ui-text-xs-muted">No dashboards yet. Create one.</p>
          )}
        </div>

        {/* Canvas */}
        <div className="ui-stack-4">
          {!activeId && (
            <div className={styles.s11}>
              Select or create a dashboard to start building.
            </div>
          )}

          {activeId && (
            <div className={styles.s12}>
              {widgets.map((w, idx) => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(idx)}
                  style={{ gridColumn: w.width === 2 ? 'span 2' : 'span 1', opacity: dragIndex === idx ? 0.5 : 1 }} className={styles.s13}
                >
                  <div className="ui-hstack-2">
                    <GripVertical size={16} className="ui-text-tertiary" />
                    <input
                      value={w.title}
                      onChange={(e) => updateWidget(w.id, { title: e.target.value })}
                      className={styles.s14}
                    />
                    <button onClick={() => removeWidget(w.id)} className="ui-btn-icon ui-text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={styles.s15}>
                    {CHART_TYPES.map(ct => (
                      <button key={ct.type} onClick={() => updateWidget(w.id, { chartType: ct.type })} title={ct.label} style={{ borderColor: w.chartType === ct.type ? 'var(--color-primary)' : 'var(--color-border)', background: w.chartType === ct.type ? 'var(--color-primary-light)' : 'var(--color-bg)', color: w.chartType === ct.type ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s16}>
                        {ct.icon} {ct.label}
                      </button>
                    ))}
                  </div>

                  <div className={styles.s17}>
                    <select value={w.source} onChange={(e) => updateWidget(w.id, { source: e.target.value })} className={styles.s18}>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => updateWidget(w.id, { width: w.width === 2 ? 1 : 2 })} className={styles.s19}>
                      {w.width === 2 ? 'Full' : 'Half'}
                    </button>
                  </div>

                  {/* Preview */}
                  <div className={styles.s20}>
                    {chartIcon(w.chartType)} {w.chartType} · {w.source}
                  </div>
                </div>
              ))}

              {widgets.length === 0 && (
                <div className={styles.s21}>
                  No widgets yet. Click “Add Widget” to begin.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </RouteGuard>
  );
}
