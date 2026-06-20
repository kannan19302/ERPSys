/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Layers,
  Globe,
  FileCode2,
  Database,
  Image,
  FileText,
  PlusCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Cpu,
  Monitor,
  Workflow,
  Code2,
} from 'lucide-react';

interface RecentItem {
  id: string;
  name: string;
  type: string;
  path: string;
  status: string;
  updatedAt: string;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval >= 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval >= 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " mins ago";
  return "just now";
}

const ERP_QUICK_ACTIONS = [
  { label: 'New Form', icon: FileCode2, href: '/builder/erp/forms?new=1', color: 'var(--color-primary)' },
  { label: 'New Workflow', icon: Workflow, href: '/builder/erp/workflows/new', color: '#7c3aed' },
  { label: 'New Dashboard', icon: BarChart3, href: '/builder/erp/dashboards/new', color: '#059669' },
  { label: 'New Module', icon: Cpu, href: '/builder/erp/modules?new=1', color: '#d97706' },
];

const WEB_QUICK_ACTIONS = [
  { label: 'New Page', icon: Globe, href: '/builder/web/pages?new=1', color: 'var(--color-primary)' },
  { label: 'Upload Asset', icon: Image, href: '/builder/web/assets?new=1', color: '#7c3aed' },
  { label: 'New Template', icon: FileText, href: '/builder/web/templates?new=1', color: '#059669' },
  { label: 'SEO Settings', icon: Database, href: '/builder/web/seo?new=1', color: '#d97706' },
];

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get('tab') || 'all';

  const setTab = (newTab: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newTab === 'all') params.delete('tab');
    else params.set('tab', newTab);
    router.push(`/builder?${params.toString()}`);
  };

  const [stats, setStats] = useState({
    erp: { forms: 0, workflows: 0, dashboards: 0, modules: 0 },
    web: { pages: 0, blogPosts: 0, assets: 0, templates: 0 }
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/v1/builder/stats', { headers: { Authorization: `Bearer ${token || ''}` } }),
          fetch('/api/v1/builder/recent-items', { headers: { Authorization: `Bearer ${token || ''}` } })
        ]);
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            erp: {
              forms: data.erp.forms || 0,
              workflows: data.erp.workflows || 0,
              dashboards: data.erp.dashboards || 0,
              modules: data.erp.modules || 0,
            },
            web: {
              pages: data.web.pages || 0,
              blogPosts: data.web.blogPosts || 0,
              assets: data.web.assets || 0,
              templates: data.web.templates || 0,
            }
          });
        }
        
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentItems(data || []);
        }
      } catch {
        // fallback to empty state
      }
    };
    fetchStats();
  }, []);
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div className="builder-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', margin: 0 }}>
            Studio
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', margin: 'var(--space-1) 0 0 0' }}>
            Low-code platform for ERP modules, forms, workflows and website content management
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button 
            className={`frappe-btn ${activeTab === 'erp' ? 'frappe-btn-primary' : 'frappe-btn-secondary'}`} 
            onClick={() => setTab('erp')}
          >
            <Cpu size={15} />
            <span>App Studio</span>
          </button>
          <button 
            className={`frappe-btn ${activeTab === 'web' ? 'frappe-btn-primary' : 'frappe-btn-secondary'}`} 
            onClick={() => setTab('web')}
          >
            <Globe size={15} />
            <span>Web Studio</span>
          </button>
          {activeTab !== 'all' && (
            <button className="frappe-btn frappe-btn-secondary" onClick={() => setTab('all')}>
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Mode Cards */}
      <div className="builder-mode-grid" style={{ gridTemplateColumns: activeTab !== 'all' ? '1fr' : undefined }}>
        {/* App Studio Card */}
        {(activeTab === 'all' || activeTab === 'erp') && (
        <div
          className="frappe-card"
          style={{
            padding: 'var(--space-6)',
            cursor: 'pointer',
            border: '2px solid var(--color-primary)',
            background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg-elevated) 100%)',
            transition: 'all var(--duration-fast) var(--ease-default)',
          }}
          onClick={() => router.push('/builder/erp')}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>
                App Studio
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                Internal module & workflow creator
              </p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4) 0', lineHeight: 1.6 }}>
            Build custom ERP modules, design forms with drag-and-drop fields, create approval workflows, and design executive dashboards — all without writing code.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {[
              { icon: FileCode2, label: 'Form Builder', count: stats.erp.forms },
              { icon: Workflow, label: 'Workflows', count: stats.erp.workflows },
              { icon: BarChart3, label: 'Dashboards', count: stats.erp.dashboards },
              { icon: Database, label: 'Custom Modules', count: stats.erp.modules },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              }}>
                <item.icon size={14} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginLeft: 'auto' }}>{item.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/builder/erp')} className="frappe-btn frappe-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <span>Open App Studio</span>
            <ChevronRight size={15} />
          </button>
        </div>
        )}

        {/* Web Studio Card */}
        {(activeTab === 'all' || activeTab === 'web') && (
        <div
          className="frappe-card"
          style={{
            padding: 'var(--space-6)',
            cursor: 'pointer',
            border: '2px solid #7c3aed',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, var(--color-bg-elevated) 100%)',
            transition: 'all var(--duration-fast) var(--ease-default)',
          }}
          onClick={() => router.push('/builder/web')}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
              background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', margin: 0, color: 'var(--color-text)' }}>
                Web Studio
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                CMS for public-facing content
              </p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4) 0', lineHeight: 1.6 }}>
            Edit your public website content, pages, blog posts, and media in real-time. Publish changes instantly through the approval workflow engine.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {[
              { icon: Monitor, label: 'Pages', count: stats.web.pages },
              { icon: FileText, label: 'Blog Posts', count: stats.web.blogPosts },
              { icon: Image, label: 'Assets', count: stats.web.assets },
              { icon: Code2, label: 'Templates', count: stats.web.templates },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              }}>
                <item.icon size={14} style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', marginLeft: 'auto' }}>{item.count}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/builder/web')}
            className="frappe-btn"
            style={{ width: '100%', justifyContent: 'center', background: '#7c3aed', color: 'white', border: 'none' }}
          >
            <span>Open Web Studio</span>
            <ChevronRight size={15} />
          </button>
        </div>
        )}
      </div>

      {/* Quick Actions Row */}
      <div className="builder-mode-grid" style={{ gridTemplateColumns: activeTab !== 'all' ? '1fr' : undefined }}>
        {/* ERP Quick Actions */}
        {(activeTab === 'all' || activeTab === 'erp') && (
        <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '0 0 var(--space-3) 0', letterSpacing: '0.05em' }}>
            App Studio — Quick Create
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {ERP_QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2.5) var(--space-3)', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text)',
                  fontWeight: 'var(--weight-medium)', transition: 'all var(--duration-fast) var(--ease-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = action.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <PlusCircle size={13} style={{ color: action.color }} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Website Quick Actions */}
        {(activeTab === 'all' || activeTab === 'web') && (
        <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '0 0 var(--space-3) 0', letterSpacing: '0.05em' }}>
            Web Studio — Quick Create
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {WEB_QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: 'var(--space-2.5) var(--space-3)', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text)',
                  fontWeight: 'var(--weight-medium)', transition: 'all var(--duration-fast) var(--ease-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = action.color; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              >
                <PlusCircle size={13} style={{ color: action.color }} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Recent Items */}
      <div className="frappe-card" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', margin: 0, color: 'var(--color-text)' }}>
            Recent Items
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Across all builder modes</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {recentItems.length === 0 && (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
              No recent items found
            </div>
          )}
          {recentItems.map(item => (
            <div
              key={item.name}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-2.5) var(--space-3)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', transition: 'background var(--duration-fast)',
                border: '1px solid transparent',
              }}
              onClick={() => router.push(item.path)}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                  background: item.type === 'erp' ? 'var(--color-primary-light)' : 'rgba(124,58,237,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.type === 'erp'
                    ? <Layers size={13} style={{ color: 'var(--color-primary)' }} />
                    : <Globe size={13} style={{ color: '#7c3aed' }} />
                  }
                </div>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', margin: 0, color: 'var(--color-text)' }}>{item.name}</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>{item.type === 'erp' ? 'App Studio' : 'Web Studio'} · {formatTimeAgo(item.updatedAt)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 'var(--weight-semibold)',
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: item.status === 'Published' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                  color: item.status === 'Published' ? 'var(--color-success)' : 'var(--color-warning)',
                }}>
                  {item.status}
                </span>
                <ExternalLink size={13} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';

export default function BuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>Loading Studio...</div>}>
      <BuilderPageContent />
    </Suspense>
  );
}
