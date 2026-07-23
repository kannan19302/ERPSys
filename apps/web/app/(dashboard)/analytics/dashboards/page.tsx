'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, X, Trash2, Edit3 } from 'lucide-react';
import { useApiClient } from '@unerp/framework';

interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: string;
  title: string;
  config: Record<string, any>;
  position: number;
  isVisible: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  widgets: DashboardWidget[];
}

export default function DashboardsPage() {
  const client = useApiClient();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => { fetchDashboards(); }, [client]);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const db = await client.get<Dashboard[] | { data?: Dashboard[] }>('/analytics/dashboards');
      const dashboards = Array.isArray(db) ? db : (db?.data || []);
      for (const d of dashboards) {
        const w = await client.get<DashboardWidget[] | { data?: DashboardWidget[] }>(`/analytics/dashboards/${d.id}/widgets`);
        d.widgets = Array.isArray(w) ? w : (w?.data || []);
      }
      setDashboards(dashboards);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDashboard) {
        await client.patch(`/analytics/dashboards/${editDashboard}`, form);
      } else {
        await client.post('/analytics/dashboards', form);
      }
      setIsModalOpen(false);
      setEditDashboard(null);
      setForm({ name: '', description: '' });
      fetchDashboards();
    } catch { alert('Failed to save dashboard'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dashboard?')) return;
    try { await client.delete(`/analytics/dashboards/${id}`); fetchDashboards(); } catch { alert('Delete failed'); }
  };

  const openEdit = (d: Dashboard) => { setEditDashboard(d.id); setForm({ name: d.name, description: d.description || '' }); setIsModalOpen(true); };

  const widgetTypeIcons: Record<string, string> = { LINE_CHART: '📈', BAR_CHART: '📊', PIE_CHART: '🥧', TABLE: '📋', KPI: '🎯', GAUGE: '⏱️' };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}><LayoutDashboard size={28} className="ui-text-primary" /> Dashboards</h1>
          <p className={styles.p2}>Create and manage custom analytics dashboards</p>
        </div>
        <button onClick={() => { setEditDashboard(null); setForm({ name: '', description: '' }); setIsModalOpen(true); }} className={styles.addBtn}><Plus size={18} /> New Dashboard</button>
      </div>
      {dashboards.map(d => (
        <div key={d.id} className={styles.dashboardCard}>
          <div className="ui-flex-between">
            <div>
              <h2 className={styles.dashboardName}>{d.name} {d.isDefault && <span className={styles.defaultBadge}>Default</span>}</h2>
              {d.description && <p className={styles.desc}>{d.description}</p>}
            </div>
            <div className="ui-flex ui-gap-1">
              <button onClick={() => openEdit(d)} className={styles.iconBtn}><Edit3 size={14} /></button>
              <button onClick={() => handleDelete(d.id)} className={styles.iconBtn}><Trash2 size={14} /></button>
            </div>
          </div>
          {d.widgets.length > 0 && (
            <div className={styles.widgetGrid}>
              {d.widgets.map(w => (
                <div key={w.id} className={styles.widgetCard}>
                  <span className={styles.widgetIcon}>{widgetTypeIcons[w.widgetType] || '📦'}</span>
                  <div>
                    <p className={styles.widgetTitle}>{w.title}</p>
                    <p className={styles.widgetType}>{w.widgetType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {d.widgets.length === 0 && <p className="ui-text-muted" style={{ marginTop: '0.75rem' }}>No widgets yet. Add via the dashboard builder.</p>}
        </div>
      ))}
      {dashboards.length === 0 && !loading && <div className="ui-text-muted">No dashboards created yet.</div>}
      {isModalOpen && (
        <div className={styles.overlay}><div className={styles.modal}>
          <div className="ui-flex-between"><h3>{editDashboard ? 'Edit' : 'New'} Dashboard</h3><button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={18} /></button></div>
          <form onSubmit={handleSubmit} className="ui-stack-3">
            <div className="ui-form-group"><label className="ui-label">Name</label><input className="ui-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="ui-form-group"><label className="ui-label">Description</label><textarea className="ui-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <button type="submit" className={styles.submitBtn}>{editDashboard ? 'Update' : 'Create'}</button>
          </form>
        </div></div>
      )}
    </div>
  );
}
