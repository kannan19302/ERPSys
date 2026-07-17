'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
import {
  BarChart3,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Play,
  Clock,
  Layout,
  RefreshCw,
} from 'lucide-react';

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  status: string;
  widgets: any[];
  refreshRate: number;
  updatedAt: string;
}

export default function DashboardsPage() {
  const client = useApiClient();

  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const data = await client.get<Dashboard[] | { data?: Dashboard[] }>('/builder/dashboards');
      setDashboards(Array.isArray(data) ? data : data.data || []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
    window.addEventListener('unerp_page_registry_updated', fetchDashboards);
    return () => window.removeEventListener('unerp_page_registry_updated', fetchDashboards);
  }, [client]);

  const executeDelete = async (id: string) => {
    try {
      await client.delete(`/builder/dashboards/${id}`);
      fetchDashboards();
    } catch { /* ignore */ }
  };

  const filtered = dashboards.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 ui-stack-5">
      {/* Header */}
      <PageHeader
        title="Dashboard Builder"
        description="Create executive dashboards with KPI widgets and real-time data visualizations"
        actions={
          <div className="ui-flex ui-gap-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => router.push('/builder/erp')}>
              ← App Studio
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => router.push('/builder/erp/dashboards/new')}>
              <PlusCircle size={15} />
              <span>New Dashboard</span>
            </button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Dashboards', value: dashboards.length.toString(), icon: BarChart3, color: '#059669' },
          { label: 'Published', value: dashboards.filter(d => d.status === 'PUBLISHED').length.toString(), icon: Play, color: '#10b981' },
          { label: 'Drafts', value: dashboards.filter(d => d.status === 'DRAFT').length.toString(), icon: Edit3, color: '#f59e0b' },
          { label: 'Total Widgets', value: dashboards.reduce((a, d) => a + (Array.isArray(d.widgets) ? d.widgets.length : 0), 0).toString(), icon: Layout, color: '#8b5cf6' },
        ].map(stat => (
          <div key={stat.label} className={`ui-card ${styles.s1}`} >
            <div style={{ background: `${stat.color}20` }} className={styles.s2}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p className={styles.s3}>{stat.value}</p>
              <p className="ui-text-xs-muted m-0">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className={styles.s4}>
        <Search size={15} className="ui-input-icon-abs" />
        <input className={`ui-input ${styles.s5}`} type="text" placeholder="Search dashboards..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}  />
      </div>

      {/* Dashboard Cards */}
      {loading ? (
        <div className={styles.s6}>Loading dashboards...</div>
      ) : filtered.length === 0 ? (
        <div className={`ui-card ${styles.s7}`} >
          <BarChart3 size={40} className={styles.s8} />
          <p className="ui-text-muted">No dashboards yet. Create your first KPI dashboard!</p>
        </div>
      ) : (
        <div className={styles.s9}>
          {filtered.map(d => (
            <div key={d.id} className={`ui-card ${styles.s10} ${styles.dashboardCard}`}>
              <div className={styles.s11}>
                <div className="ui-hstack-2">
                  <div className={styles.s12}>
                    <BarChart3 size={16} className={styles.s13} />
                  </div>
                  <div>
                    <p className={styles.s14}>{d.name}</p>
                    {d.description && <p className="ui-text-xs-muted m-0">{d.description}</p>}
                  </div>
                </div>
              </div>

              <div className={styles.s15}>
                <span style={{ background: d.status === 'PUBLISHED' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: d.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-warning)' }} className={styles.s16}>
                  {d.status}
                </span>
                {d.refreshRate && (
                  <span className={styles.s17}>
                    <RefreshCw size={10} /> {d.refreshRate}s
                  </span>
                )}
              </div>

              <div className={styles.s18}>
                <Clock size={12} className="ui-text-tertiary" />
                <span className="ui-text-xs-tertiary">
                  {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
                <span className={styles.s19}>
                  {Array.isArray(d.widgets) ? d.widgets.length : 0} widgets
                </span>
              </div>

              <div className="ui-flex ui-gap-1">
                <button className={`ui-btn ui-btn-secondary ${styles.s20}`}  onClick={() => router.push(`/builder/erp/dashboards/${d.id}`)}>
                  <Edit3 size={13} /> <span>Edit</span>
                </button>
                <button className={`ui-btn ui-btn-secondary ${styles.s21}`}  onClick={() => router.push(`/dashboard?dashboardId=${d.id}`)}>
                  <Eye size={13} />
                </button>
                <button className={`ui-btn ${styles.s22}`}  onClick={() => setDeleteTarget(d.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDelete(deleteTarget); setDeleteTarget(null); } }}
        title="Delete Dashboard"
        message="Are you sure you want to delete this dashboard? All widgets will be removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
