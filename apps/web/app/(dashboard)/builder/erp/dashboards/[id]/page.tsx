'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  ArrowLeft, Save, PlusCircle, Settings, BarChart2, PieChart, TrendingUp, Hash,
  Table as TableIcon, LayoutDashboard, Trash2, BoxSelect
} from 'lucide-react';
import { useToast } from '@/components/builder/ToastProvider';

const WIDGET_TYPES = [
  { type: 'kpi', label: 'KPI Metric', icon: Hash, color: '#10b981', defaultW: 3, defaultH: 2 },
  { type: 'bar', label: 'Bar Chart', icon: BarChart2, color: '#3b82f6', defaultW: 6, defaultH: 4 },
  { type: 'line', label: 'Line Chart', icon: TrendingUp, color: '#f59e0b', defaultW: 6, defaultH: 4 },
  { type: 'pie', label: 'Pie Chart', icon: PieChart, color: '#8b5cf6', defaultW: 4, defaultH: 4 },
  { type: 'table', label: 'Data Table', icon: TableIcon, color: '#64748b', defaultW: 12, defaultH: 5 },
];

export default function DashboardEditor() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState<any>(null);
  const [layout, setLayout] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [width, setWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/v1/builder/dashboards/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setDashboard(data);
          if (data.layout) setLayout(typeof data.layout === 'string' ? JSON.parse(data.layout) : data.layout);
          if (data.widgets) setWidgets(typeof data.widgets === 'string' ? JSON.parse(data.widgets) : data.widgets);
        } else {
          showToast('Failed to load dashboard', 'error');
        }
      } catch (err) {
        if (isMounted) showToast('Network error loading dashboard', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { isMounted = false; };
  }, [params.id, showToast]);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/dashboards/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ layout, widgets })
      });
      if (res.ok) {
        showToast('Dashboard saved successfully', 'success');
      } else {
        showToast('Failed to save dashboard', 'error');
      }
    } catch (err) {
      showToast('Network error saving dashboard', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const addWidget = (type: string) => {
    const wt = WIDGET_TYPES.find(t => t.type === type);
    if (!wt) return;
    const id = 'w_' + Math.random().toString(36).substr(2, 9);
    
    const newWidget = {
      id,
      type,
      title: `New ${wt.label}`,
      dataSource: '',
      config: {}
    };
    
    const newLayoutItem = {
      i: id,
      x: (layout.length * 3) % 12,
      y: Infinity,
      w: wt.defaultW,
      h: wt.defaultH
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
    setSelectedWidgetId(id);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    setLayout(layout.filter(l => l.i !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
  };

  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);

  const updateWidgetConfig = (key: string, value: any) => {
    if (!selectedWidget) return;
    setWidgets(widgets.map(w => w.id === selectedWidget.id ? { ...w, [key]: value } : w));
  };

  const onLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout as any[]);
  };

  if (loading) {
    return <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboard editor...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: '#f1f5f9', color: '#0f172a', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-4)', height: '60px', background: 'white', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={() => router.push('/builder/erp/dashboards')} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={16} color="#64748b" />
          </button>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={16} color="#10b981" />
              {dashboard?.name || 'Dashboard Editor'}
            </h1>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{dashboard?.status || 'DRAFT'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} disabled={isSaving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
            {isSaving ? <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> : <Save size={14} />}
            <span>Save Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Palette */}
        <div style={{ width: '240px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Widgets</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {WIDGET_TYPES.map(wt => (
              <button
                key={wt.type}
                onClick={() => addWidget(wt.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'white',
                  border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = wt.color; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
              >
                <wt.icon size={16} color={wt.color} />
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#334155', flex: 1 }}>{wt.label}</span>
                <PlusCircle size={14} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '24px' }}>
          {layout.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', border: '2px dashed #cbd5e1', borderRadius: '16px' }}>
              <LayoutDashboard size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '15px', fontWeight: '500' }}>Dashboard is empty</p>
              <p style={{ fontSize: '13px' }}>Click a widget type from the sidebar to add it to the canvas.</p>
            </div>
          ) : (
            <div style={{ minHeight: '100%', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '16px' }}>
              <GridLayout
                className="layout"
                layout={layout}
                // @ts-ignore
                cols={12}
                rowHeight={40}
                width={width - 48 - 32} // padding adjustments
                onLayoutChange={onLayoutChange}
                isDraggable={true}
                isResizable={true}
                margin={[16, 16]}
              >
                {layout.map(l => {
                  const widget = widgets.find(w => w.id === l.i);
                  if (!widget) return <div key={l.i}></div>;
                  const isSelected = selectedWidgetId === widget.id;
                  const wt = WIDGET_TYPES.find(t => t.type === widget.type);
                  const Icon = wt?.icon || LayoutDashboard;
                  
                  return (
                    <div 
                      key={l.i} 
                      onClick={() => setSelectedWidgetId(widget.id)}
                      style={{ 
                        background: '#f8fafc', border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, 
                        borderRadius: '8px', overflow: 'hidden', cursor: 'grab',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none'
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', background: 'white' }}>
                        <Icon size={14} color={wt?.color || '#64748b'} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {widget.title}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                        <BarChart2 size={32} opacity={0.5} />
                      </div>
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          )}
        </div>

        {/* Right Properties Panel */}
        <div style={{ width: '300px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="#64748b" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Widget Settings</span>
          </div>
          
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
            {selectedWidget ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Widget Title</label>
                  <input 
                    type="text" 
                    value={selectedWidget.title} 
                    onChange={(e) => updateWidgetConfig('title', e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Data Source</label>
                  <select 
                    value={selectedWidget.dataSource}
                    onChange={(e) => updateWidgetConfig('dataSource', e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="">Select a module...</option>
                    <option value="sales_orders">Sales Orders</option>
                    <option value="purchase_orders">Purchase Orders</option>
                    <option value="invoices">Invoices</option>
                    <option value="custom">Custom Query</option>
                  </select>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                  <button 
                    onClick={() => removeWidget(selectedWidget.id)}
                    style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                  >
                    <Trash2 size={14} /> Remove Widget
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <BoxSelect size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px' }}>Select a widget on the canvas<br/>to edit its properties.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
