'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Eye, Smartphone, Tablet, Monitor, Trash2, Plus, ArrowUp, ArrowDown,
  Layout, BarChart3, List, FileCode2, Type, Heading, Settings, X
} from 'lucide-react';
import { useToast } from '@/components/builder/ToastProvider';

export interface PageBuilderWorkspaceProps {
  appId: string;
  pageId: string;
  pageName: string;
  initialLayout: any[];
  forms: any[];
  dataModels: any[];
  dashboards: any[];
  onBack: () => void;
  onSaved: (layout: any[]) => void;
}

export interface PageWidget {
  id: string;
  type: 'header' | 'stats' | 'form' | 'table' | 'chart' | 'alert';
  title: string;
  gridSpan: number; // 1-12
  config: Record<string, any>;
}

export function PageBuilderWorkspace({
  appId,
  pageId,
  pageName,
  initialLayout = [],
  forms = [],
  dataModels = [],
  dashboards = [],
  onBack,
  onSaved,
}: PageBuilderWorkspaceProps) {
  const { showToast } = useToast();
  const [widgets, setWidgets] = useState<PageWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialLayout)) {
      setWidgets(initialLayout);
    } else {
      setWidgets([]);
    }
  }, [initialLayout]);

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  const handleAddWidget = (type: PageWidget['type']) => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newWidget: PageWidget = {
      id,
      type,
      title: `New ${type.toUpperCase()}`,
      gridSpan: 12,
      config: {},
    };

    if (type === 'header') {
      newWidget.title = 'Page Header';
      newWidget.config = { subtitle: 'Manage your operations from here', badge: 'Draft' };
    } else if (type === 'stats') {
      newWidget.title = 'Counters';
      newWidget.config = {
        items: [
          { label: 'Total Invoices', value: '42', color: '#3b82f6' },
          { label: 'Pending Approvals', value: '7', color: '#f59e0b' },
          { label: 'Settled', value: '35', color: '#10b981' },
        ],
      };
    } else if (type === 'alert') {
      newWidget.title = 'Alert Banner';
      newWidget.config = {
        text: 'This application is currently in draft mode. Submissions are captured locally.',
        type: 'warning', // info, warning, danger, success
      };
    } else if (type === 'form') {
      newWidget.title = 'Linked Form';
      newWidget.config = { formId: forms[0]?.id || '' };
    } else if (type === 'table') {
      newWidget.title = 'Data List';
      newWidget.config = { dataModelId: dataModels[0]?.id || '', maxRows: 5 };
    } else if (type === 'chart') {
      newWidget.title = 'Analytics Chart';
      newWidget.config = { dashboardId: dashboards[0]?.id || '', chartType: 'bar' };
    }

    setWidgets((prev) => [...prev, newWidget]);
    setSelectedWidgetId(id);
    showToast(`Added ${type} widget.`, 'success');
  };

  const handleRemoveWidget = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (selectedWidgetId === id) setSelectedWidgetId(null);
    showToast('Widget removed.', 'success');
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === widgets.length - 1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    const nextWidgets = [...widgets];
    const temp = nextWidgets[index]!;
    nextWidgets[index] = nextWidgets[nextIndex]!;
    nextWidgets[nextIndex] = temp;
    setWidgets(nextWidgets);
  };

  const handleUpdateWidget = (id: string, updates: Partial<PageWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const handleUpdateConfig = (id: string, key: string, value: any) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, config: { ...w.config, [key]: value } }
          : w
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/builder/modules/${appId}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ layout: widgets }),
      });

      if (res.ok) {
        showToast('Page layout successfully saved!', 'success');
        onSaved(widgets);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`Save failed: ${err.message || 'Server error'}`, 'error');
      }
    } catch {
      showToast('Error connecting to the server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const widgetPalette = [
    { type: 'header' as const, label: 'Header Block', desc: 'App title, subtitle, and statuses', icon: Heading, color: '#ec4899' },
    { type: 'stats' as const, label: 'Stats Counters', desc: 'Visual numeric indicators', icon: Layout, color: '#3b82f6' },
    { type: 'form' as const, label: 'Form Widget', desc: 'Link and embed a developer form', icon: FileCode2, color: '#10b981' },
    { type: 'table' as const, label: 'Data Table', desc: 'Dynamic listing for a data model', icon: List, color: '#8b5cf6' },
    { type: 'chart' as const, label: 'Dashboard Chart', desc: 'Interactive Recharts card', icon: BarChart3, color: '#f59e0b' },
    { type: 'alert' as const, label: 'Alert/Info Banner', desc: 'Informational rich text banners', icon: Type, color: '#64748b' },
  ];

  return (
    <div className="builder-dark-theme" style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      position: 'fixed', top: 0, left: 0, zIndex: 10000,
      backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'var(--font-sans)', overflow: 'hidden'
    }}>
      {/* Header Panel */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-4)', height: '60px',
        background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', cursor: 'pointer', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'white' }}>Page Layout Builder</h1>
            <span style={{ fontSize: 'var(--text-xs)', color: '#94a3b8' }}>Design layouts dynamically for: <strong>{pageName}</strong></span>
          </div>
        </div>

        {/* Viewport controls */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Mobile']] as const).map(([v, Icon, label]) => (
            <button key={v} onClick={() => setViewport(v)}
              style={{ background: viewport === v ? 'rgba(255,255,255,0.1)' : 'transparent', color: viewport === v ? 'white' : '#64748b', border: 'none', padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={14} /> <span style={{ fontSize: '12px' }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button onClick={() => { setPreviewMode(!previewMode); setSelectedWidgetId(null); }}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: previewMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: previewMode ? '#60a5fa' : 'white', border: '1px solid ' + (previewMode ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', fontSize: '13px' }}>
            <Eye size={14} /> <span>{previewMode ? 'Edit Mode' : 'Preview Layout'}</span>
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 18px', borderRadius: 'var(--radius-md)', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}>
            {saving ? <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> : <Save size={14} />}
            <span>Save Layout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar - Widget Palette */}
        {!previewMode && (
          <aside style={{ width: '280px', background: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.1)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', overflowY: 'auto', flexShrink: 0 }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>Add Component</h3>
            {widgetPalette.map((p) => (
              <button key={p.type} onClick={() => handleAddWidget(p.type)} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.2s ease-in-out'
              }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p.icon size={16} style={{ color: p.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'white' }}>{p.label}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: 1 }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </aside>
        )}

        {/* Center Canvas Viewport */}
        <main style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'var(--space-6) var(--space-4)', overflowY: 'auto', backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div style={{
            width: '100%',
            maxWidth: viewport === 'desktop' ? '1080px' : (viewport === 'tablet' ? '768px' : '375px'),
            background: 'white',
            color: '#0f172a',
            padding: 'var(--space-6)',
            borderRadius: viewport === 'desktop' ? 'var(--radius-xl)' : '24px',
            border: viewport !== 'desktop' ? '12px solid #1e293b' : '1px solid var(--color-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            minHeight: viewport === 'desktop' ? '640px' : '820px',
            transition: 'max-width 0.3s ease'
          }}>
            {viewport !== 'desktop' && (
              <div style={{ height: '20px', display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: '60px', height: '6px', background: '#cbd5e1', borderRadius: '4px' }} />
              </div>
            )}

            {widgets.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', border: '2px dashed #cbd5e1', borderRadius: 'var(--radius-lg)', color: '#64748b', textAlign: 'center', padding: 'var(--space-6)' }}>
                <Layout size={32} style={{ marginBottom: 'var(--space-3)' }} />
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: '#1e293b' }}>Empty Page Canvas</div>
                <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Add widgets from the left panel to build the layout.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-4)' }}>
                {widgets.map((w, index) => {
                  const isSelected = selectedWidgetId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => !previewMode && setSelectedWidgetId(w.id)}
                      style={{
                        gridColumn: `span ${w.gridSpan}`,
                        position: 'relative',
                        border: isSelected && !previewMode ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        borderRadius: 'var(--radius-lg)',
                        background: '#f8fafc',
                        padding: 'var(--space-4)',
                        cursor: previewMode ? 'default' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Widget Controls (Edit Mode only) */}
                      {!previewMode && (
                        <div style={{ position: 'absolute', top: -14, right: 10, display: 'flex', gap: 4, background: 'white', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 10 }}>
                          <button onClick={(e) => handleMoveWidget(index, 'up', e)} disabled={index === 0} style={{ padding: 2, border: 'none', background: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? '#cbd5e1' : '#64748b' }}><ArrowUp size={12} /></button>
                          <button onClick={(e) => handleMoveWidget(index, 'down', e)} disabled={index === widgets.length - 1} style={{ padding: 2, border: 'none', background: 'none', cursor: index === widgets.length - 1 ? 'not-allowed' : 'pointer', color: index === widgets.length - 1 ? '#cbd5e1' : '#64748b' }}><ArrowDown size={12} /></button>
                          <button onClick={(e) => handleRemoveWidget(w.id, e)} style={{ padding: 2, border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={12} /></button>
                        </div>
                      )}

                      {/* Mock Widget Visual Renders */}
                      {w.type === 'header' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{w.title}</h2>
                              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>{w.config.subtitle || 'Add subtitle'}</p>
                            </div>
                            {w.config.badge && (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: '#eff6ff', color: '#2563eb' }}>{w.config.badge}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {w.type === 'stats' && (
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>{w.title}</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                            {(w.config.items || []).map((item: any, i: number) => (
                              <div key={i} style={{ padding: 'var(--space-3)', background: 'white', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: item.color || '#0f172a' }}>{item.value || '0'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>{item.label || 'Indicator'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {w.type === 'alert' && (
                        <div style={{
                          padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10,
                          background: w.config.type === 'danger' ? '#fef2f2' : w.config.type === 'warning' ? '#fffbeb' : w.config.type === 'success' ? '#f0fdf4' : '#eff6ff',
                          color: w.config.type === 'danger' ? '#dc2626' : w.config.type === 'warning' ? '#d97706' : w.config.type === 'success' ? '#16a34a' : '#2563eb',
                          border: `1px solid ${w.config.type === 'danger' ? '#fee2e2' : w.config.type === 'warning' ? '#fef3c7' : w.config.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{w.config.text || 'Alert/Notification Banner'}</div>
                        </div>
                      )}

                      {w.type === 'form' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{w.title}</div>
                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Form Widget</span>
                          </div>
                          {w.config.formId ? (
                            <div style={{ padding: 'var(--space-4) 0', pointerEvents: 'none' }}>
                              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Example Field</label>
                              <input placeholder="Form placeholder..." style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 'var(--text-xs)' }} />
                            </div>
                          ) : (
                            <div style={{ fontSize: 'var(--text-xs)', color: '#dc2626', textAlign: 'center', padding: 'var(--space-4) 0' }}>No Form Linked. Select a form in properties.</div>
                          )}
                        </div>
                      )}

                      {w.type === 'table' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{w.title}</div>
                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Data Table</span>
                          </div>
                          {w.config.dataModelId ? (
                            <div style={{ fontSize: '11px', pointerEvents: 'none' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 6, fontWeight: 600, borderBottom: '1px solid #f1f5f9', background: '#f1f5f9' }}>
                                <span>Record / Identifier</span>
                                <span style={{ textAlign: 'right' }}>Status</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 6, borderBottom: '1px solid #f1f5f9' }}>
                                <span>Item 1002</span>
                                <span style={{ textAlign: 'right', color: '#10b981' }}>Active</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 6 }}>
                                <span>Item 1001</span>
                                <span style={{ textAlign: 'right', color: '#f59e0b' }}>Pending</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 'var(--text-xs)', color: '#dc2626', textAlign: 'center', padding: 'var(--space-4) 0' }}>No Data Model Linked. Configure properties.</div>
                          )}
                        </div>
                      )}

                      {w.type === 'chart' && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 'var(--space-3)' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{w.title}</div>
                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Chart</span>
                          </div>
                          <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-4) 0 var(--space-4)' }}>
                            <div style={{ width: '15%', height: '40%', background: '#3b82f6', borderRadius: '2px' }} />
                            <div style={{ width: '15%', height: '80%', background: '#3b82f6', borderRadius: '2px' }} />
                            <div style={{ width: '15%', height: '60%', background: '#3b82f6', borderRadius: '2px' }} />
                            <div style={{ width: '15%', height: '95%', background: '#3b82f6', borderRadius: '2px' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Settings Panel */}
        {!previewMode && (
          <aside style={{ width: '320px', background: '#1e293b', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: 'var(--space-4)', overflowY: 'auto', flexShrink: 0 }}>
            {selectedWidget ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textTransform: 'uppercase', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}><Settings size={15} /> Widget Settings</h3>
                  <button onClick={() => setSelectedWidgetId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={15} /></button>
                </div>

                {/* Common property: Title */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Widget Title</label>
                  <input value={selectedWidget.title} onChange={e => handleUpdateWidget(selectedWidget.id, { title: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }} />
                </div>

                {/* Common property: Column Span */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Width (Grid Columns)</label>
                  <select value={selectedWidget.gridSpan} onChange={e => handleUpdateWidget(selectedWidget.id, { gridSpan: Number(e.target.value) })}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}>
                    <option value={12}>Full Width (12 Columns)</option>
                    <option value={8}>2/3 Width (8 Columns)</option>
                    <option value={6}>Half Width (6 Columns)</option>
                    <option value={4}>1/3 Width (4 Columns)</option>
                  </select>
                </div>

                {/* Widget-specific settings */}
                {selectedWidget.type === 'header' && (
                  <>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Subtitle</label>
                      <input value={selectedWidget.config.subtitle || ''} onChange={e => handleUpdateConfig(selectedWidget.id, 'subtitle', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }} />
                    </div>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Badge Text</label>
                      <input value={selectedWidget.config.badge || ''} onChange={e => handleUpdateConfig(selectedWidget.id, 'badge', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }} />
                    </div>
                  </>
                )}

                {selectedWidget.type === 'alert' && (
                  <>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Banner Alert Text</label>
                      <textarea value={selectedWidget.config.text || ''} onChange={e => handleUpdateConfig(selectedWidget.id, 'text', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px', minHeight: 60, resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Alert Severity Type</label>
                      <select value={selectedWidget.config.type || 'info'} onChange={e => handleUpdateConfig(selectedWidget.id, 'type', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}>
                        <option value="info">Info (Blue)</option>
                        <option value="warning">Warning (Amber)</option>
                        <option value="success">Success (Green)</option>
                        <option value="danger">Danger (Red)</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedWidget.type === 'form' && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Select Workspace Form</label>
                    <select
                      value={selectedWidget.config.formId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const selectedForm = forms.find(f => f.id === val);
                        setWidgets(prev => prev.map(w => w.id === selectedWidget.id ? {
                          ...w,
                          config: {
                            ...w.config,
                            formId: val,
                            formSlug: selectedForm?.slug || '',
                            formName: selectedForm?.name || ''
                          }
                        } : w));
                      }}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}
                    >
                      <option value="">Select a Form...</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}

                {selectedWidget.type === 'table' && (
                  <>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Select Backing Data Model</label>
                      <select
                        value={selectedWidget.config.dataModelId || ''}
                        onChange={e => {
                          const val = e.target.value;
                          const selectedDm = dataModels.find(dm => dm.id === val);
                          const dmSlug = selectedDm ? String(selectedDm.name || 'model').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
                          setWidgets(prev => prev.map(w => w.id === selectedWidget.id ? {
                            ...w,
                            config: {
                              ...w.config,
                              dataModelId: val,
                              dataModelSlug: dmSlug,
                              dataModelName: selectedDm?.name || ''
                            }
                          } : w));
                        }}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}
                      >
                        <option value="">Select a Data Model...</option>
                        {dataModels.map(dm => <option key={dm.id} value={dm.id}>{dm.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Max Rows Displayed</label>
                      <input type="number" min={1} max={20} value={selectedWidget.config.maxRows || 5} onChange={e => handleUpdateConfig(selectedWidget.id, 'maxRows', Number(e.target.value))}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }} />
                    </div>
                  </>
                )}

                {selectedWidget.type === 'chart' && (
                  <>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Select Dashboard Source</label>
                      <select value={selectedWidget.config.dashboardId || ''} onChange={e => handleUpdateConfig(selectedWidget.id, 'dashboardId', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}>
                        <option value="">Select a Dashboard...</option>
                        {dashboards.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Chart Render Type</label>
                      <select value={selectedWidget.config.chartType || 'bar'} onChange={e => handleUpdateConfig(selectedWidget.id, 'chartType', e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '13px' }}>
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Chart</option>
                        <option value="donut">Donut Chart</option>
                      </select>
                    </div>
                  </>
                )}

                {selectedWidget.type === 'stats' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#94a3b8', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Stats Items</label>
                    {(selectedWidget.config.items || []).map((item: any, i: number) => (
                      <div key={i} style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 4 }}>
                          <input placeholder="Label" value={item.label} onChange={e => {
                            const nextItems = [...selectedWidget.config.items];
                            nextItems[i].label = e.target.value;
                            handleUpdateConfig(selectedWidget.id, 'items', nextItems);
                          }} style={{ flex: 1, padding: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '11px', borderRadius: 2 }} />
                          <input placeholder="Value" value={item.value} onChange={e => {
                            const nextItems = [...selectedWidget.config.items];
                            nextItems[i].value = e.target.value;
                            handleUpdateConfig(selectedWidget.id, 'items', nextItems);
                          }} style={{ width: '60px', padding: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', fontSize: '11px', borderRadius: 2 }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input type="color" value={item.color || '#3b82f6'} onChange={e => {
                            const nextItems = [...selectedWidget.config.items];
                            nextItems[i].color = e.target.value;
                            handleUpdateConfig(selectedWidget.id, 'items', nextItems);
                          }} style={{ width: 40, height: 18, border: 'none', background: 'none', cursor: 'pointer' }} />
                          <button onClick={() => {
                            const nextItems = (selectedWidget.config.items || []).filter((_: any, idx: number) => idx !== i);
                            handleUpdateConfig(selectedWidget.id, 'items', nextItems);
                          }} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '10px' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => {
                      const nextItems = [...(selectedWidget.config.items || []), { label: 'New Stat', value: '10', color: '#3b82f6' }];
                      handleUpdateConfig(selectedWidget.id, 'items', nextItems);
                    }} style={{ width: '100%', padding: '4px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', background: 'none', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>+ Add Stat Card</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', textAlign: 'center' }}>
                <Settings size={20} style={{ marginBottom: 6 }} />
                <span style={{ fontSize: '12px' }}>Select a widget on the canvas to configure properties.</span>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
