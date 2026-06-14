'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Download, 
  RefreshCw,
  Calendar,
  Sparkles
} from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  value: string;
  trend?: number[];
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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch KPIs
      const kpiRes = await fetch('http://localhost:3001/api/v1/analytics/kpis', { headers });
      const kpisData = await kpiRes.json();
      setKpis(Array.isArray(kpisData) ? kpisData : []);

      // Fetch Dashboards
      const dashRes = await fetch('http://localhost:3001/api/v1/analytics/dashboards', { headers });
      const dashData = await dashRes.json();
      setDashboards(Array.isArray(dashData) ? dashData : []);
      if (dashData.length > 0) {
        setSelectedDashboard(dashData[0].id);
      }

      // Fetch Reports
      const repRes = await fetch('http://localhost:3001/api/v1/analytics/reports', { headers });
      const repData = await repRes.json();
      setReports(Array.isArray(repData) ? repData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--color-text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: 'var(--space-2)' }}>Loading Executive Dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles style={{ color: 'var(--color-primary)' }} />
            Business Intelligence Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Monitor enterprise key performance indicators, view real-time operations charts, and export custom files.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            <Calendar size={16} /> Date Range
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', border: 'none',
            color: '#ffffff', padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)'
          }}>
            Add Widget
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {kpis.map((kpi: KPI) => (
          <div key={kpi.id} style={{
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column',
            gap: 'var(--space-2)', position: 'relative', overflow: 'hidden'
          }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
              {kpi.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
                {kpi.value}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={12} /> +12.4%
              </span>
            </div>
            
            {/* Sparkline Visual */}
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '40px', gap: '3px', marginTop: 'var(--space-2)' }}>
              {Array.isArray(kpi.trend) && kpi.trend.map((val: number, i: number, arr: number[]) => {
                const max = Math.max(...arr);
                const pct = max > 0 ? (val / max) * 100 : 10;
                return (
                  <div key={i} style={{
                    flex: 1, height: `${pct}%`, background: 'var(--color-primary-light)',
                    borderRadius: '2px', borderTop: '2px solid var(--color-primary)'
                  }} />
                );
              })}
            </div>
          </div>
        ))}
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
              <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                <Download size={16} />
              </button>
            </div>
          </div>

          {/* Premium CSS Chart View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-2)', borderLeft: '2px solid var(--color-border)',
              borderBottom: '2px solid var(--color-border)', position: 'relative', marginTop: 'var(--space-4)'
            }}>
              {/* Grid Lines */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed var(--color-border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed var(--color-border)' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed var(--color-border)' }} />

              {/* Data Bars */}
              {[45, 60, 52, 78, 88, 92, 70, 85, 95, 110, 120, 130].map((val, idx) => (
                <div key={idx} style={{
                  width: '6%', height: `${(val / 130) * 100}%`,
                  background: 'linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                  borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                  position: 'relative', zIndex: 1
                }}>
                </div>
              ))}
            </div>
            
            {/* Chart X Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((lbl, idx) => (
                <span key={idx} style={{ width: '6%', textAlign: 'center' }}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel: Reports List */}
        <div style={{
          background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)'
        }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
            Saved Reports
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {reports.map((rep: Report) => (
              <div key={rep.id} style={{
                padding: 'var(--space-3)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', cursor: 'pointer', transition: 'background var(--duration-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
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
    </div>
  );
}
