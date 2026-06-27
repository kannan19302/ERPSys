'use client';

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

const API = '/api/v1/analytics';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<{ kpi: KPI; data: Drilldown | null; loading: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const loadData = async () => {
    try {
      const headers = authHeaders();
      const [kpiRes, dashRes, repRes] = await Promise.all([
        fetch(`${API}/kpis`, { headers }),
        fetch(`${API}/dashboards`, { headers }),
        fetch(`${API}/reports`, { headers }),
      ]);
      const [kpisData, dashData, repData] = await Promise.all([kpiRes.json(), dashRes.json(), repRes.json()]);

      setKpis(Array.isArray(kpisData) ? kpisData : []);
      setDashboards(Array.isArray(dashData) ? dashData : []);
      if (Array.isArray(dashData) && dashData.length > 0) setSelectedDashboard(dashData[0].id);
      setReports(Array.isArray(repData) ? repData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDrilldown = async (kpi: KPI) => {
    setDrilldown({ kpi, data: null, loading: true });
    try {
      const res = await fetch(`${API}/kpis/${kpi.code}/drilldown`, { headers: authHeaders() });
      const data = res.ok ? await res.json() : null;
      setDrilldown({ kpi, data, loading: false });
    } catch {
      setDrilldown({ kpi, data: null, loading: false });
    }
  };

  const exportDataset = async (dataset: string) => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/export/${dataset}`, { headers: authHeaders() });
      if (!res.ok) {
        alert('Export failed.');
        return;
      }
      const payload = await res.json();
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <Spinner size="lg" />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Executive Dashboard...</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Page Header */}
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor KPIs against goals, drill into source records, and export live data sets."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'BI Analytics' }]}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={16} /> Date Range
            </Button>
            <Button onClick={() => exportDataset('invoices')} disabled={exporting} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      {/* KPI Grid with goal tracking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
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
              sparkline={kpi.trend}
              onClick={() => openDrilldown(kpi)}
            />
          );
        })}
      </div>

      {/* Main Board Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>

        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
              {dashboards.find(d => d.id === selectedDashboard)?.name || 'Executive Sales Summary'}
            </h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button onClick={loadData} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
              <button onClick={() => exportDataset('invoices')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
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
        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
        }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Download size={18} style={{ color: 'var(--color-primary)' }} />
            Quick Export
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {['invoices', 'products', 'employees'].map(ds => (
              <button key={ds} onClick={() => exportDataset(ds)} disabled={exporting} style={{
                padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', textTransform: 'capitalize',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                {ds} <Download size={13} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            Saved Reports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {reports.map((rep: Report) => (
              <div key={rep.id} style={{
                padding: 'var(--space-3)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', cursor: 'pointer'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{rep.name}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: 'var(--color-text-secondary)' }}>{rep.type} Report</p>
                </div>
                <Download size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </div>
            ))}
            {reports.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>
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
  );
}
