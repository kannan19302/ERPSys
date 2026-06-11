'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart4, 
  RefreshCw, 
  LayoutGrid, 
  CalendarRange, 
  FileDown, 
  Search,
  Sparkles,
  Plus
} from 'lucide-react';

interface ReportWidget {
  id: string;
  title: string;
  chartType: string;
  queryConfig: string;
}

interface ReportView {
  id: string;
  name: string;
  isScheduled: boolean;
  scheduleCron: string;
  recipientEmails: string;
}

export default function AdvancedReportingPage() {
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [views, setViews] = useState<ReportView[]>([]);
  const [activeTab, setActiveTab] = useState<'widgets' | 'views'>('widgets');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [widgetsRes, viewsRes] = await Promise.all([
        fetch('http://localhost:3001/reporting/widgets', { headers }),
        fetch('http://localhost:3001/reporting/views', { headers }),
      ]);

      const [widgetsData, viewsData] = await Promise.all([
        widgetsRes.json(), viewsRes.json()
      ]);

      setWidgets(Array.isArray(widgetsData) ? widgetsData : []);
      setViews(Array.isArray(viewsData) ? viewsData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWidget = async () => {
    const title = prompt('Enter report widget title:');
    if (!title) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/reporting/widgets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dashboardId: 'main-db',
          title,
          chartType: 'BAR',
          queryConfig: JSON.stringify({ series: 'encounters', period: 'weekly' }),
          position: JSON.stringify({ x: 0, y: 0, w: 6, h: 4 })
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to create widget.');
      }
    } catch {
      alert('Error creating widget.');
    }
  };

  const handleCreateView = async () => {
    const name = prompt('Enter report view name:');
    if (!name) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/reporting/views', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          queryConfig: JSON.stringify({ filter: 'all' }),
          isScheduled: true,
          scheduleCron: '0 8 * * 1',
          recipientEmails: 'admin@unerp.dev'
        })
      });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to create view.');
      }
    } catch {
      alert('Error creating view.');
    }
  };

  const filteredWidgets = widgets.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Analytics Builder...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <BarChart4 style={{ color: 'var(--color-primary)' }} />
            Advanced Reporting & Pivot Builder
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Configure pivot matrix grids, schedule report distributions, and construct drag-and-drop dashboard layouts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={handleCreateView} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <CalendarRange size={16} style={{ color: 'var(--color-primary)' }} /> Schedule Distribution
          </button>
          <button onClick={handleCreateWidget} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Plus size={16} /> Add Chart Widget
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('widgets')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'widgets' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'widgets' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <LayoutGrid size={16} /> Dashboard Widgets
        </button>
        <button 
          onClick={() => setActiveTab('views')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'views' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'views' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <FileDown size={16} /> Saved Report Runs
        </button>
      </div>

      {/* Main Grid content */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Tab view */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {activeTab === 'widgets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Filter widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-9)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {filteredWidgets.map(w => (
                  <div key={w.id} style={{ padding: 'var(--space-5)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', background: 'var(--color-bg)' }}>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{w.title}</h4>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Type: {w.chartType} Chart</p>
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-elevated)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                      [Mock {w.chartType} Visualization]
                    </div>
                  </div>
                ))}
                {filteredWidgets.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>No report widgets found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'views' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', margin: 0 }}>Saved Views & Schedules</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {views.map(v => (
                  <div key={v.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{v.name}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Recipients: {v.recipientEmails}</p>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>Cron Schedule: {v.scheduleCron}</p>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Active Cron
                    </span>
                  </div>
                ))}
                {views.length === 0 && (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No saved views found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', margin: 0, display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
            Pivot Matrices
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            Reporting views pull directly from the consolidated double-entry ledger ledger schemas, patient logs, and class course registries.
          </p>
        </div>

      </div>
    </div>
  );
}
