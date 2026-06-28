/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import {
  Plus,
  Search,
  Cpu,
  Package,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  X,
  Loader2,
  Globe,
  Lock,
  AlertTriangle,
  Activity,
  MoreVertical,
  Trash2,
  Eye,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
interface AppModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  scope: string;
  version: string;
  components: any[];
  pages: any[];
  dataModels: any[];
  testResults: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'unknown';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + 'm ago';
  return 'just now';
}

const ICON_OPTIONS = ['📦', '🏗️', '📊', '🛒', '💼', '🔧', '📋', '🎯', '⚡', '🧩', '🚀', '📱', '🏠', '🔬', '🎨', '📐'];
const COLOR_OPTIONS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'];

function CreateAppModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (id: string) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#3b82f6');
  const [scope, setScope] = useState('ORGANIZATION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('App name is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ name, slug, description, icon, color, scope }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create app');
      }
      const data = await res.json();
      onSuccess(data.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create app');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
        width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>New Custom App</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--color-danger-bg, #fef2f2)', color: 'var(--color-danger, #dc2626)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            {error}
          </div>
        )}

        <div className="frappe-form-group">
          <label className="frappe-label" style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>App Name *</label>
          <input className="frappe-input" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Customer Portal" autoFocus
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)' }} />
        </div>

        <div className="frappe-form-group" style={{ marginTop: 'var(--space-4)' }}>
          <label className="frappe-label" style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Slug *</label>
          <input className="frappe-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="customer-portal"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', fontFamily: 'monospace' }} />
        </div>

        <div className="frappe-form-group" style={{ marginTop: 'var(--space-4)' }}>
          <label className="frappe-label" style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Description</label>
          <textarea className="frappe-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this app do?"
            style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', color: 'var(--color-text)', minHeight: 80, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)',
                    border: icon === ic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: icon === ic ? 'var(--color-primary-bg)' : 'var(--color-bg-subtle)',
                    cursor: 'pointer', fontSize: 18 }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: c,
                    border: color === c ? '3px solid var(--color-text)' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>

        <div className="frappe-form-group" style={{ marginTop: 'var(--space-4)' }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Access Scope</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['ORGANIZATION', 'GLOBAL'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)', border: scope === s ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: scope === s ? 'var(--color-primary-bg)' : 'var(--color-bg-subtle)', cursor: 'pointer',
                  fontWeight: scope === s ? 600 : 400, fontSize: 'var(--text-sm)', color: scope === s ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {s === 'ORGANIZATION' ? <Lock size={14} /> : <Globe size={14} />}
                {s === 'ORGANIZATION' ? 'Organization Only' : 'App Store (Global)'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
          <button onClick={onClose} style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: isSubmitting ? 'wait' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Create App
          </button>
        </div>
      </div>
    </div>
  );
}

function AppCard({ app, onDelete, onClick }: { app: AppModule; onDelete: () => void; onClick: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const components = Array.isArray(app.components) ? app.components : [];
  const pages = Array.isArray(app.pages) ? app.pages : [];
  const testResults = app.testResults && typeof app.testResults === 'object' && !Array.isArray(app.testResults) ? app.testResults as any : {};
  const testScore = testResults.score ?? null;

  const getStatusColor = () => {
    if (app.status === 'ACTIVE') return { bg: '#dcfce7', text: '#16a34a', label: 'Published' };
    if (app.status === 'ARCHIVED') return { bg: '#fee2e2', text: '#dc2626', label: 'Archived' };
    return { bg: '#fef3c7', text: '#d97706', label: 'Draft' };
  };

  const getScopeInfo = () => {
    if (app.scope === 'GLOBAL') return { icon: Globe, label: 'App Store' };
    return { icon: Lock, label: 'Organization' };
  };

  const status = getStatusColor();
  const scopeInfo = getScopeInfo();

  return (
    <div onClick={onClick}
      style={{
        background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)',
        cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = app.color || 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>

      {/* Color bar */}
      <div style={{ height: 4, background: app.color || 'var(--color-primary)' }} />

      <div style={{ padding: 'var(--space-5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: `${app.color || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {app.icon || '📦'}
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1.3 }}>{app.name}</h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>v{app.version || '1.0.0'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: status.bg, color: status.text }}>{status.label}</span>
            <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}>
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 28, right: 0, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', minWidth: 140, zIndex: 10, padding: 4 }}>
                <button onClick={() => { setShowMenu(false); onDelete(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <Trash2 size={14} /> Delete App
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {app.description && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4) 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {app.description}
          </p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          <span>{components.length} components</span>
          <span>{pages.length} pages</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <scopeInfo.icon size={12} /> {scopeInfo.label}
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          {testScore !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: testScore >= 80 ? '#dcfce7' : testScore >= 50 ? '#fef3c7' : '#fee2e2', color: testScore >= 80 ? '#16a34a' : testScore >= 50 ? '#d97706' : '#dc2626' }}>
                {testScore}%
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Test Score</span>
            </div>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Not tested</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <Clock size={12} /> {formatTimeAgo(app.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ERPBuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (searchParams?.get('new') === '1') setShowCreateModal(true);
  }, [searchParams]);

  const fetchApps = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/builder/modules', { headers: { Authorization: `Bearer ${token || ''}` } });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const filteredApps = apps.filter(app => {
    if (search && !app.name.toLowerCase().includes(search.toLowerCase()) && !app.slug.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'draft' && app.status !== 'DRAFT') return false;
    if (filter === 'published' && app.status !== 'ACTIVE') return false;
    if (filter === 'archived' && app.status !== 'ARCHIVED') return false;
    return true;
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const executeDeleteApp = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/builder/modules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token || ''}` } });
    fetchApps();
  };

  const stats = {
    total: apps.length,
    published: apps.filter(a => a.status === 'ACTIVE').length,
    draft: apps.filter(a => a.status === 'DRAFT').length,
    tested: apps.filter(a => {
      const tr = a.testResults && typeof a.testResults === 'object' && !Array.isArray(a.testResults) ? a.testResults as any : {};
      return tr.score != null;
    }).length,
  };

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        title="My Custom Apps"
        description="Build, test, and publish custom ERP applications"
        actions={
          <button className="frappe-btn frappe-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> New Custom App
          </button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total Apps', value: stats.total, icon: Package, color: '#3b82f6' },
          { label: 'Published', value: stats.published, icon: CheckCircle, color: '#10b981' },
          { label: 'In Development', value: stats.draft, icon: FileText, color: '#f59e0b' },
          { label: 'Tested', value: stats.tested, icon: Activity, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text)' }}>{loading ? '—' : stat.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {mounted && (
        <div className="frappe-card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>App Compilation & Testing History</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: 'Jan', builds: 15, avgScore: 78 },
                { month: 'Feb', builds: 22, avgScore: 82 },
                { month: 'Mar', builds: 18, avgScore: 80 },
                { month: 'Apr', builds: 30, avgScore: 88 },
                { month: 'May', builds: 25, avgScore: 85 },
                { month: 'Jun', builds: 35, avgScore: 92 },
              ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBuildsErp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="builds" name="App Version Builds" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBuildsErp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..."
            style={{ width: '100%', padding: 'var(--space-3) var(--space-3) var(--space-3) 36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)' }} />
        </div>
        {(['all', 'draft', 'published', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-lg)', border: filter === f ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: filter === f ? 'var(--color-primary-bg)' : 'var(--color-bg)', color: filter === f ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontWeight: filter === f ? 600 : 400, fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* App Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', height: 220, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', background: 'var(--color-bg)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-border)' }}>
          <Package size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }} />
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            {search || filter !== 'all' ? 'No apps match your filter' : 'No custom apps yet'}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
            {search || filter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Create your first custom ERP application to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={() => setShowCreateModal(true)}
              style={{ padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Create Your First App
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' }}>
          {filteredApps.map(app => (
            <AppCard key={app.id} app={app} onDelete={() => setDeleteTarget(app.id)} onClick={() => router.push(`/builder/erp/apps/${app.id}`)} />
          ))}
        </div>
      )}

      <CreateAppModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={id => { setShowCreateModal(false); router.push(`/builder/erp/apps/${id}`); }} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { executeDeleteApp(deleteTarget); setDeleteTarget(null); } }}
        title="Delete App"
        message="Are you sure you want to delete this app? All associated modules, pages and definitions will be deleted."
        confirmLabel="Delete"
        variant="danger"
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function ERPBuilderPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Loading...</div>}>
      <ERPBuilderPageContent />
    </React.Suspense>
  );
}
