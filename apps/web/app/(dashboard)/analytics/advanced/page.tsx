'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { 
  BarChart4, 
  RefreshCw, 
  LayoutGrid, 
  CalendarRange, 
  FileDown, 
  Search,
  Sparkles,
  } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [views, setViews] = useState<ReportView[]>([]);
  const [activeTab, setActiveTab] = useState<'widgets' | 'views'>('widgets');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [widgetsRes, viewsRes] = await Promise.all([
        client.get<ReportWidget[]>('/reporting/widgets'),
        client.get<ReportView[]>('/reporting/views'),
      ]);
      setWidgets(Array.isArray(widgetsRes) ? widgetsRes : []);
      setViews(Array.isArray(viewsRes) ? viewsRes : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleCreateWidget = async () => {
    const title = prompt('Enter report widget title:');
    if (!title) return;

    try {
      await client.post('/reporting/widgets', {
          dashboardId: 'main-db',
          title,
          chartType: 'BAR',
          queryConfig: JSON.stringify({ series: 'encounters', period: 'weekly' }),
          position: JSON.stringify({ x: 0, y: 0, w: 6, h: 4 })
      });
      loadData();
    } catch {
      alert('Error creating widget.');
    }
  };

  const handleCreateView = async () => {
    const name = prompt('Enter report view name:');
    if (!name) return;

    try {
      await client.post('/reporting/views', {
          name,
          queryConfig: JSON.stringify({ filter: 'all' }),
          isScheduled: true,
          scheduleCron: '0 8 * * 1',
          recipientEmails: 'admin@unerp.dev'
      });
      loadData();
    } catch {
      alert('Error creating view.');
    }
  };

  const filteredWidgets = widgets.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className={styles.s1}>
        <RefreshCw className="animate-spin" size={32} />
        <span className={styles.s2}>Loading Analytics Builder...</span>
      </div>
    );
  }

  return (
    <RouteGuard permission="analytics.reporting.read">
      <div className="ui-stack-6">
      {/* Header */}
      <div className={styles.s3}>
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <BarChart4 className="ui-text-primary" />
            Advanced Reporting & Pivot Builder
          </h1>
          <p className="ui-text-sm-muted">
            Configure pivot matrix grids, schedule report distributions, and construct drag-and-drop dashboard layouts.
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <button onClick={handleCreateView} className={styles.s4}>
            <CalendarRange size={16} className="ui-text-primary" /> Schedule Distribution
          </button>
          <button onClick={handleCreateWidget} className={styles.s5}>
            Add Chart Widget
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.s6}>
        <button 
          onClick={() => setActiveTab('widgets')}
          style={{ borderBottom: activeTab === 'widgets' ? '2px solid var(--color-primary)' : 'none', color: activeTab === 'widgets' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s7}
        >
          <LayoutGrid size={16} /> Dashboard Widgets
        </button>
        <button 
          onClick={() => setActiveTab('views')}
          style={{ borderBottom: activeTab === 'views' ? '2px solid var(--color-primary)' : 'none', color: activeTab === 'views' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s7}
        >
          <FileDown size={16} /> Saved Report Runs
        </button>
      </div>

      {/* Main Grid content */}
      <div className={styles.s8}>
        
        {/* Tab view */}
        <div className="ui-card p-5">
          {activeTab === 'widgets' && (
            <div className="ui-stack-4">
              <div className={styles.s9}>
                <Search size={16} className={styles.s10} />
                <input 
                  type="text" 
                  placeholder="widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.s11}
                />
              </div>

              <div className={styles.s12}>
                {filteredWidgets.map(w => (
                  <div key={w.id} className={styles.s13}>
                    <h4 className={styles.s14}>{w.title}</h4>
                    <p className="ui-text-xs-muted m-0">Type: {w.chartType} Chart</p>
                    <div className={styles.s15}>
                      [Mock {w.chartType} Visualization]
                    </div>
                  </div>
                ))}
                {filteredWidgets.length === 0 && (
                  <div className={styles.s16}>No report widgets found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'views' && (
            <div className="ui-stack-4">
              <h2 className={styles.s17}>Saved Views & Schedules</h2>
              <div className="ui-stack-3">
                {views.map(v => (
                  <div key={v.id} className={styles.s18}>
                    <div>
                      <p className={styles.s19}>{v.name}</p>
                      <p className="ui-text-xs-muted m-0">Recipients: {v.recipientEmails}</p>
                      <p className={styles.s20}>Cron Schedule: {v.scheduleCron}</p>
                    </div>
                    <span className={styles.s21}>
                      Active Cron
                    </span>
                  </div>
                ))}
                {views.length === 0 && (
                  <p className={styles.s22}>No saved views found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Rules info */}
        <div className={styles.s23}>
          <h3 className={styles.s24}>
            <Sparkles size={16} className="ui-text-primary" />
            Pivot Matrices
          </h3>
          <p className={styles.s25}>
            Reporting views pull directly from the consolidated double-entry ledger ledger schemas, patient logs, and class course registries.
          </p>
        </div>

      </div>
      </div>
    </RouteGuard>
  );
}
