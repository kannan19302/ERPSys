'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Grid3X3,
  TrendingUp,
  PieChart,
  GaugeCircle,
  LayoutDashboard,
  CheckCircle,
  Move,
  BarChart2,
  Activity,
} from 'lucide-react';

const DASHBOARDS_LIST = [
  { id: 1, name: 'CEO Executive Overview', type: 'Executive', widgets: 8, lastEdited: '1 day ago', status: 'Published' },
  { id: 2, name: 'CFO Financial Dashboard', type: 'Finance', widgets: 12, lastEdited: '3 hours ago', status: 'Published' },
  { id: 3, name: 'Operations KPI Board', type: 'Operations', widgets: 6, lastEdited: '2 days ago', status: 'Draft' },
  { id: 4, name: 'HR Workforce Analytics', type: 'HR', widgets: 9, lastEdited: '1 week ago', status: 'Published' },
  { id: 5, name: 'Sales Pipeline Overview', type: 'Sales', widgets: 7, lastEdited: '5 hours ago', status: 'Draft' },
];

const WIDGET_TYPES = [
  { type: 'kpi', label: 'KPI Card', icon: GaugeCircle },
  { type: 'bar', label: 'Bar Chart', icon: BarChart2 },
  { type: 'line', label: 'Line Chart', icon: TrendingUp },
  { type: 'pie', label: 'Pie Chart', icon: PieChart },
  { type: 'table', label: 'Data Table', icon: Grid3X3 },
  { type: 'gauge', label: 'Gauge Widget', icon: Activity },
];

const DEMO_WIDGETS = [
  { id: 'w1', type: 'kpi', title: 'Total Revenue', value: '$4.2M', change: '+12.4%', positive: true, color: '#059669', col: 1, row: 1, span: 1 },
  { id: 'w2', type: 'kpi', title: 'Active Customers', value: '1,284', change: '+5.2%', positive: true, color: 'var(--color-primary)', col: 2, row: 1, span: 1 },
  { id: 'w3', type: 'kpi', title: 'Pending Orders', value: '87', change: '-3.1%', positive: false, color: '#d97706', col: 3, row: 1, span: 1 },
  { id: 'w4', type: 'kpi', title: 'Inventory Value', value: '$890K', change: '+8.7%', positive: true, color: '#7c3aed', col: 4, row: 1, span: 1 },
  { id: 'w5', type: 'bar', title: 'Monthly Sales', col: 1, row: 2, span: 2 },
  { id: 'w6', type: 'pie', title: 'Revenue by Segment', col: 3, row: 2, span: 1 },
  { id: 'w7', type: 'line', title: 'Cash Flow Trend', col: 4, row: 2, span: 1 },
];


function MiniBarChart() {
  const bars = [60, 85, 45, 92, 72, 88, 65, 78, 94, 70, 82, 90];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px', padding: 'var(--space-2) 0' }}>
      {bars.map((h, i) => (
        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === bars.length - 1 ? 'var(--color-primary)' : 'var(--color-primary-light)', borderRadius: '2px 2px 0 0', transition: 'height var(--duration-normal)' }} />
      ))}
    </div>
  );
}

function MiniLineChart() {
  const points = [30, 55, 40, 72, 58, 80, 65, 88, 72, 95];
  const maxP = Math.max(...points);
  const minP = Math.min(...points);
  const h = 80; const w = 200;
  const mapped = points.map((p, i) => ({ x: (i / (points.length - 1)) * w, y: h - ((p - minP) / (maxP - minP)) * h }));
  const path = mapped.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  return (
    <svg width="100%" height="80" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MiniPieChart() {
  const segments = [{ v: 35, c: 'var(--color-primary)' }, { v: 28, c: '#7c3aed' }, { v: 22, c: '#059669' }, { v: 15, c: '#d97706' }];
  let cumulative = 0;
  const total = segments.reduce((a, b) => a + b.v, 0);
  return (
    <svg width="80" height="80" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const start = (cumulative / total) * 2 * Math.PI;
        cumulative += seg.v;
        const end = (cumulative / total) * 2 * Math.PI;
        const x1 = Math.cos(start); const y1 = Math.sin(start);
        const x2 = Math.cos(end); const y2 = Math.sin(end);
        const largeArc = end - start > Math.PI ? 1 : 0;
        return <path key={i} d={`M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={seg.c} />;
      })}
    </svg>
  );
}

export default function ERPDashboardsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);

  const filtered = DASHBOARDS_LIST.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <BarChart3 size={20} style={{ color: '#059669' }} />
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
              Dashboard Builder
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Drag-and-drop executive and operational dashboards with custom KPI widgets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="frappe-btn frappe-btn-secondary" onClick={() => router.push('/builder/erp')}>
            ← ERP Builder
          </button>
          <button className="frappe-btn frappe-btn-primary" onClick={() => setActiveTab('builder')}>
            <PlusCircle size={15} />
            <span>New Dashboard</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-1)' }}>
        {[
          { id: 'list', label: 'My Dashboards', icon: LayoutDashboard },
          { id: 'builder', label: 'Dashboard Builder', icon: Grid3X3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2.5) var(--space-4)',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: activeTab === tab.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: activeTab === tab.id ? '#059669' : 'var(--color-text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid #059669' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all var(--duration-fast)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Tab */}
      {activeTab === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '28rem' }}>
            <Search size={15} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input className="frappe-input" type="text" placeholder="Search dashboards..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 'var(--space-8)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            <div
              className="frappe-card"
              style={{ padding: 'var(--space-5)', cursor: 'pointer', border: '2px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', minHeight: '140px' }}
              onClick={() => setActiveTab('builder')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = 'rgba(5,150,105,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = ''; }}
            >
              <PlusCircle size={28} style={{ color: '#059669' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', margin: 0 }}>New Dashboard</p>
            </div>

            {filtered.map(db => (
              <div key={db.id} className="frappe-card" style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={18} style={{ color: '#059669' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>{db.name}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{db.type} · {db.widgets} widgets</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: db.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)', color: db.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    {db.status}
                  </span>
                </div>
                {/* Mini preview */}
                <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', marginBottom: 'var(--space-3)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ height: '28px', background: i % 2 === 0 ? 'var(--color-primary-light)' : 'rgba(5,150,105,0.1)', borderRadius: '4px' }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Edited {db.lastEdited}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-1.5)' }}>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }} onClick={() => setActiveTab('builder')}>
                      <Edit3 size={13} />
                    </button>
                    <button className="frappe-btn frappe-btn-secondary" style={{ padding: 'var(--space-1.5) var(--space-2.5)' }}>
                      <Eye size={13} />
                    </button>
                    <button className="frappe-btn" style={{ padding: 'var(--space-1.5) var(--space-2.5)', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-danger)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Builder */}
      {activeTab === 'builder' && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 220px', gap: 'var(--space-4)', height: 'calc(100vh - 300px)' }}>
          {/* Widget Palette */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Widget Types
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1.5)' }}>
              {WIDGET_TYPES.map(wt => (
                <div key={wt.type}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2.5)', padding: 'var(--space-2) var(--space-2.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'grab', fontSize: 'var(--text-xs)', color: 'var(--color-text)', transition: 'all var(--duration-fast)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(5,150,105,0.08)'; e.currentTarget.style.borderColor = '#059669'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <wt.icon size={14} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>{wt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="frappe-card" style={{ padding: 'var(--space-4)', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', margin: 0 }}>CEO Executive Overview</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>4 columns · 2 rows</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="frappe-btn frappe-btn-secondary">Preview</button>
                <button className="frappe-btn frappe-btn-primary">
                  <CheckCircle size={14} />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
              {DEMO_WIDGETS.filter(w => w.type === 'kpi').map(widget => (
                <div
                  key={widget.id}
                  onClick={() => setSelectedWidget(widget.id === selectedWidget ? null : widget.id)}
                  style={{
                    padding: 'var(--space-3)', border: `2px solid ${selectedWidget === widget.id ? (widget as {color: string}).color : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg)', position: 'relative',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  <Move size={12} style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--color-text-tertiary)' }} />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-1) 0' }}>{widget.title}</p>
                  <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--space-1) 0', color: 'var(--color-text)' }}>{widget.value}</p>
                  <span style={{ fontSize: '10px', fontWeight: 'var(--weight-semibold)', color: widget.positive ? '#059669' : '#dc2626' }}>
                    {widget.change} vs last month
                  </span>
                </div>
              ))}
            </div>

            {/* Chart Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-3)' }}>
              <div
                onClick={() => setSelectedWidget('w5')}
                style={{ padding: 'var(--space-3)', border: `2px solid ${selectedWidget === 'w5' ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg)', transition: 'all var(--duration-fast)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text)' }}>Monthly Sales</p>
                <MiniBarChart />
              </div>
              <div
                onClick={() => setSelectedWidget('w6')}
                style={{ padding: 'var(--space-3)', border: `2px solid ${selectedWidget === 'w6' ? '#7c3aed' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all var(--duration-fast)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text)', alignSelf: 'flex-start' }}>Revenue by Segment</p>
                <MiniPieChart />
              </div>
              <div
                onClick={() => setSelectedWidget('w7')}
                style={{ padding: 'var(--space-3)', border: `2px solid ${selectedWidget === 'w7' ? '#d97706' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-bg)', transition: 'all var(--duration-fast)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', margin: '0 0 var(--space-2) 0', color: 'var(--color-text)' }}>Cash Flow Trend</p>
                <MiniLineChart />
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="frappe-card" style={{ padding: 'var(--space-3)', overflow: 'auto' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.05em', margin: '0 0 var(--space-3) 0' }}>
              Widget Properties
            </p>
            {selectedWidget ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {[
                  { label: 'Widget Title', value: DEMO_WIDGETS.find(w => w.id === selectedWidget)?.title || '' },
                  { label: 'Data Source', value: 'Sales Order (SUM)' },
                  { label: 'Date Filter', value: 'Last 12 Months' },
                  { label: 'Refresh Rate', value: 'Every 5 minutes' },
                ].map(prop => (
                  <div key={prop.label} className="frappe-form-group">
                    <label className="frappe-label">{prop.label}</label>
                    <input className="frappe-input" type="text" defaultValue={prop.value} style={{ fontSize: 'var(--text-xs)' }} />
                  </div>
                ))}
                <button className="frappe-btn frappe-btn-primary" style={{ justifyContent: 'center' }}>Save Widget</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                <LayoutDashboard size={24} style={{ margin: '0 auto var(--space-2)', opacity: 0.4, display: 'block' }} />
                Click a widget in the canvas to configure
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
