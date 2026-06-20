'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/builder/dashboards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboards(Array.isArray(data) ? data : data.data || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
    window.addEventListener('unerp_page_registry_updated', fetchDashboards);
    return () => window.removeEventListener('unerp_page_registry_updated', fetchDashboards);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dashboard?')) return;
    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/v1/builder/dashboards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboards();
    } catch { /* ignore */ }
  };

  const filtered = dashboards.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div className="builder-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <BarChart3 size={20} style={{ color: '#059669' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Dashboard Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Create executive dashboards with KPI widgets and real-time data visualizations
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => router.push('/builder/erp/dashboards/new')}>
            <PlusCircle size={15} />
            <span>New Dashboard</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="builder-stats-grid">
        {[
          { label: 'Total Dashboards', value: dashboards.length.toString(), icon: BarChart3, color: '#059669' },
          { label: 'Published', value: dashboards.filter(d => d.status === 'PUBLISHED').length.toString(), icon: Play, color: '#10b981' },
          { label: 'Drafts', value: dashboards.filter(d => d.status === 'DRAFT').length.toString(), icon: Edit3, color: '#f59e0b' },
          { label: 'Total Widgets', value: dashboards.reduce((a, d) => a + (Array.isArray(d.widgets) ? d.widgets.length : 0), 0).toString(), icon: Layout, color: '#8b5cf6' },
        ].map(stat => (
          <div key={stat.label} className="frappe-card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>{stat.value}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '28rem' }}>
        <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
        <input className="frappe-input" type="text" placeholder="Search dashboards..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
      </div>

      {/* Dashboard Cards */}
      {loading ? (
        <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboards...</div>
      ) : filtered.length === 0 ? (
        <div className="frappe-card" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
          <BarChart3 size={40} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto var(--space-3)', display: 'block', opacity: 0.3 }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No dashboards yet. Create your first KPI dashboard!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          {filtered.map(d => (
            <div key={d.id} className="frappe-card" style={{ padding: 'var(--space-4)', transition: 'all var(--duration-fast)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: '#05966920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={16} style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{d.name}</p>
                    {d.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{d.description}</p>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: d.status === 'PUBLISHED' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: d.status === 'PUBLISHED' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                  {d.status}
                </span>
                {d.refreshRate && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: '#3b82f620', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={10} /> {d.refreshRate}s
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                <Clock size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                  {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                  {Array.isArray(d.widgets) ? d.widgets.length : 0} widgets
                </span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button className="frappe-btn frappe-btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 'var(--space-1.5)' }} onClick={() => router.push(`/builder/erp/dashboards/${d.id}`)}>
                  <Edit3 size={13} /> <span>Edit</span>
                </button>
                <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }} onClick={() => router.push(`/dashboard?dashboardId=${d.id}`)}>
                  <Eye size={13} />
                </button>
                <button className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }} onClick={() => handleDelete(d.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}