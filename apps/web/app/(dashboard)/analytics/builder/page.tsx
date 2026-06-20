'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Save, Trash2, BarChart3, LineChart, PieChart,
  Gauge, RefreshCw, GripVertical, Check,
} from 'lucide-react';

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

const API = 'http://localhost:3001/api/v1/analytics';

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
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const loadDashboards = async () => {
    try {
      const res = await fetch(`${API}/dashboards`, { headers: authHeaders() });
      const data = res.ok ? await res.json() : [];
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
  }, []);

  const selectDashboard = (d: Dashboard) => {
    setActiveId(d.id);
    setWidgets(Array.isArray(d.layout) ? d.layout : []);
    setSaved(false);
  };

  const createDashboard = async () => {
    const name = prompt('New dashboard name:');
    if (!name) return;
    const res = await fetch(`${API}/dashboards`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, layout: [] }),
    });
    if (res.ok) {
      const d = await res.json();
      setDashboards(prev => [d, ...prev]);
      selectDashboard(d);
    }
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
      const res = await fetch(`${API}/dashboards/${activeId}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ layout: widgets }),
      });
      if (res.ok) {
        setSaved(true);
        setDashboards(prev => prev.map(d => (d.id === activeId ? { ...d, layout: widgets } : d)));
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert('Save failed.');
      }
    } catch {
      alert('Save error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading dashboards…</span>
      </div>
    );
  }

  const chartIcon = (t: Widget['chartType']) => CHART_TYPES.find(c => c.type === t)?.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <LayoutDashboard style={{ color: 'var(--color-primary)' }} />
            Dashboard Builder
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Compose widgets, drag to reorder, and save the layout to your dashboard.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={addWidget} disabled={!activeId} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: activeId ? 'pointer' : 'not-allowed', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
          }}>
            <Plus size={16} /> Add Widget
          </button>
          <button onClick={saveLayout} disabled={!activeId || saving} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: saved ? 'var(--color-success)' : 'var(--color-primary)', border: 'none',
            color: '#fff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: activeId ? 'pointer' : 'not-allowed', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
          }}>
            {saved ? <Check size={16} /> : <Save size={16} />} {saving ? 'Saving…' : saved ? 'Saved' : 'Save Layout'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        {/* Dashboard list */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>Dashboards</h3>
            <button onClick={createDashboard} title="New dashboard" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}>
              <Plus size={16} />
            </button>
          </div>
          {dashboards.map(d => (
            <button key={d.id} onClick={() => selectDashboard(d)} style={{
              textAlign: 'left', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
              border: '1px solid', borderColor: activeId === d.id ? 'var(--color-primary)' : 'var(--color-border)',
              background: activeId === d.id ? 'var(--color-primary-light)' : 'var(--color-bg)',
              color: 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)'
            }}>
              {d.name}
            </button>
          ))}
          {dashboards.length === 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>No dashboards yet. Create one.</p>
          )}
        </div>

        {/* Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {!activeId && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              Select or create a dashboard to start building.
            </div>
          )}

          {activeId && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              {widgets.map((w, idx) => (
                <div
                  key={w.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(idx)}
                  style={{
                    gridColumn: w.width === 2 ? 'span 2' : 'span 1',
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                    opacity: dragIndex === idx ? 0.5 : 1, cursor: 'grab'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <GripVertical size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                    <input
                      value={w.title}
                      onChange={(e) => updateWidget(w.id, { title: e.target.value })}
                      style={{ flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', color: 'var(--color-text)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}
                    />
                    <button onClick={() => removeWidget(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {CHART_TYPES.map(ct => (
                      <button key={ct.type} onClick={() => updateWidget(w.id, { chartType: ct.type })} title={ct.label} style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer',
                        border: '1px solid', borderColor: w.chartType === ct.type ? 'var(--color-primary)' : 'var(--color-border)',
                        background: w.chartType === ct.type ? 'var(--color-primary-light)' : 'var(--color-bg)',
                        color: w.chartType === ct.type ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                      }}>
                        {ct.icon} {ct.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <select value={w.source} onChange={(e) => updateWidget(w.id, { source: e.target.value })} style={{ flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', color: 'var(--color-text)', fontSize: 'var(--text-xs)' }}>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => updateWidget(w.id, { width: w.width === 2 ? 1 : 2 })} style={{
                      padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', cursor: 'pointer',
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-secondary)'
                    }}>
                      {w.width === 2 ? 'Full' : 'Half'}
                    </button>
                  </div>

                  {/* Preview */}
                  <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--color-bg)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    {chartIcon(w.chartType)} {w.chartType} · {w.source}
                  </div>
                </div>
              ))}

              {widgets.length === 0 && (
                <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-6)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  No widgets yet. Click “Add Widget” to begin.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
