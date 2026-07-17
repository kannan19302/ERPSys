'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Sparkles,
  Target,
  X,
  Plus
} from 'lucide-react';
import { Card, PageHeader, Button, Spinner, DashboardKPICard, DashboardChart, DrillDownModal } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface KPI {
  id: string;
  code: string;
  name: string;
  value: string;
  unit?: string;
  trend?: number[];
  target?: number;
  targetValue?: string;
  progressPct?: number;
  changePct?: number;
}

interface Dashboard {
  id: string;
  name: string;
}

interface Report {
  id: string;
  name: string;
  type: string;
}

interface Drilldown {
  code: string;
  columns: string[];
  rows: Record<string, string | number | boolean>[];
}

export default function AnalyticsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<{ kpi: KPI; data: Drilldown | null; loading: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      const [kpiRes, dashRes, repRes] = await Promise.all([
        client.get<KPI[]>('/analytics/kpis'),
        client.get<Dashboard[]>('/analytics/dashboards'),
        client.get<Report[]>('/analytics/reports'),
      ]);

      setKpis(Array.isArray(kpiRes) ? kpiRes : []);
      setDashboards(Array.isArray(dashRes) ? dashRes : []);
      const firstDashboard = dashRes[0];
      if (firstDashboard) setSelectedDashboard(firstDashboard.id);
      setReports(Array.isArray(repRes) ? repRes : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const openDrilldown = async (kpi: KPI) => {
    setDrilldown({ kpi, data: null, loading: true });
    try {
      const data = await client.get<Drilldown | null>(`/analytics/kpis/${kpi.code}/drilldown`);
      setDrilldown({ kpi, data, loading: false });
    } catch {
      setDrilldown({ kpi, data: null, loading: false });
    }
  };

  const exportDataset = async (dataset: string) => {
    setExporting(true);
    try {
      const payload = await client.get<{ content: string; mimeType?: string; filename?: string }>(`/analytics/export/${dataset}`);
      const blob = new Blob([payload.content], { type: payload.mimeType || 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = payload.filename || `${dataset}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export error.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
        <span className={styles.s2}>Loading Executive Dashboard...</span>
      </div>
    );
  }

  // Monthly Sales trend mock/derived data for the main chart
  const monthlySalesChartData = [
    { name: 'Jan', Sales: 45000 },
    { name: 'Feb', Sales: 60000 },
    { name: 'Mar', Sales: 52000 },
    { name: 'Apr', Sales: 78000 },
    { name: 'May', Sales: 88000 },
    { name: 'Jun', Sales: 92000 },
    { name: 'Jul', Sales: 70000 },
    { name: 'Aug', Sales: 85000 },
    { name: 'Sep', Sales: 95000 },
    { name: 'Oct', Sales: 110000 },
    { name: 'Nov', Sales: 120000 },
    { name: 'Dec', Sales: 130000 }
  ];

  return (
    <RouteGuard permission="analytics.dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
      {/* Page Header */}
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor KPIs against goals, drill into source records, and export live data sets."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'BI Analytics' }]}
        actions={
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" className="ui-hstack-2">
              <Calendar size={16} /> Date Range
            </Button>
            <Button onClick={() => exportDataset('invoices')} disabled={exporting} variant="primary" className="ui-hstack-2">
              <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* KPI Grid with goal tracking */}
      <div className={styles.s3}>
        {kpis.map((kpi: KPI) => {
          const up = (kpi.changePct ?? 0) >= 0;
          return (
            <DashboardKPICard
              key={kpi.id}
              title={kpi.name}
              value={kpi.value}
              icon={up ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              color={up ? 'var(--color-success)' : 'var(--color-danger)'}
              progress={kpi.progressPct}
              progressLabel={`Goal: ${kpi.targetValue}`}
              changeLabel={`${up ? '+' : ''}${kpi.changePct ?? 0}% from last month`}
              trend={kpi.trend}
              onClick={() => openDrilldown(kpi)}
            />
          );
        })}
      </div>

      {/* Main Board Layout */}
      <div className={styles.s4}>

        <div className={styles.s5}>
          <div className={styles.s6}>
            <h2 className="ui-heading-lg">
              {dashboards.find(d => d.id === selectedDashboard)?.name || 'Executive Sales Summary'}
            </h2>
            <div className="ui-flex ui-gap-2">
              <button onClick={loadData} className={styles.s7}>
                <RefreshCw size={16} />
              </button>
              <button onClick={() => exportDataset('invoices')} className={styles.s7}>
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* Upgraded Recharts DashboardChart */}
          <DashboardChart
            title="Monthly Sales Distribution"
            subtitle="Executive dashboard monthly sales revenue trends"
            data={monthlySalesChartData}
            config={{ xAxisKey: 'name', series: [{ dataKey: 'Sales', name: 'Monthly Sales ($)', color: 'var(--color-primary)' }] }}
            defaultChartType="area"
            allowedChartTypes={['area', 'bar', 'line']}
            height={300}
          />
        </div>

        {/* Side Panel: Reports + export shortcuts */}
        <div className={styles.s5}>
          <h3 className={styles.s8}>
            <Download size={18} className="ui-text-primary" />
            Quick Export
          </h3>
          <div className="ui-stack-2">
            {['invoices', 'products', 'employees'].map(ds => (
              <button key={ds} onClick={() => exportDataset(ds)} disabled={exporting} className={styles.s9}>
                {ds} <Download size={13} className="ui-text-muted" />
              </button>
            ))}
          </div>

          <h3 className={styles.s10}>
            <FileText size={18} className="ui-text-primary" />
            Saved Reports
          </h3>
          <div className="ui-stack-2">
            {reports.map((rep: Report) => (
              <div key={rep.id} className={styles.s11}>
                <div>
                  <p className={styles.s12}>{rep.name}</p>
                  <p className={styles.s13}>{rep.type} Report</p>
                </div>
                <Download size={14} className="ui-text-muted" />
              </div>
            ))}
            {reports.length === 0 && (
              <p className={styles.s14}>
                No custom reports saved.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Drill-down modal */}
      {drilldown && (
        <DrillDownModal
          isOpen={!!drilldown}
          onClose={() => setDrilldown(null)}
          title={`${drilldown.kpi.name} — Source Records`}
          columns={drilldown.data?.columns.map(c => ({ key: c, label: c })) || []}
          rows={drilldown.data?.rows || []}
        />
      )}
      </div>
    </RouteGuard>
  );
}
