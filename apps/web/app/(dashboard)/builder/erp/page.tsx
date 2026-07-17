'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, ConfirmDialog } from '@unerp/ui';
import { useApiClient } from '@unerp/framework';
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
  const client = useApiClient();
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
      const data = await client.post<{ id: string }>('/builder/modules', { name, slug, description, icon, color, scope });
      onSuccess(data.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create app');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.s1}>
      <div className={styles.s2} onClick={onClose} />
      <div className={styles.s3}>
        <div className={styles.s4}>
          <h2 className={styles.s5}>New Custom App</h2>
          <button onClick={onClose} className={styles.s6}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className={styles.s7}>
            {error}
          </div>
        )}

        <div className="ui-form-group">
          <label className="ui-label ui-label">App Name *</label>
          <input className={`ui-input ${styles.s8}`} value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Customer Portal" autoFocus
             />
        </div>

        <div className={`ui-form-group ${styles.s9}`} >
          <label className="ui-label ui-label">Slug *</label>
          <input className={`ui-input ${styles.s10}`} value={slug} onChange={e => setSlug(e.target.value)} placeholder="customer-portal"
             />
        </div>

        <div className={`ui-form-group ${styles.s9}`} >
          <label className="ui-label ui-label">Description</label>
          <textarea className={`ui-input ${styles.s11}`} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this app do?"
             />
        </div>

        <div className={styles.s12}>
          <div>
            <label className="ui-label">Icon</label>
            <div className={styles.s13}>
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  style={{ border: icon === ic ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: icon === ic ? 'var(--color-primary-bg)' : 'var(--color-bg-subtle)' }} className={styles.s14}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="ui-label">Color</label>
            <div className={styles.s13}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  style={{ background: c, border: color === c ? '3px solid var(--color-text)' : '2px solid transparent' }} className={styles.s15} />
              ))}
            </div>
          </div>
        </div>

        <div className={`ui-form-group ${styles.s9}`} >
          <label className="ui-label">Access Scope</label>
          <div className="ui-flex ui-gap-2">
            {(['ORGANIZATION', 'GLOBAL'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)}
                style={{ border: scope === s ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: scope === s ? 'var(--color-primary-bg)' : 'var(--color-bg-subtle)', fontWeight: scope === s ? 600 : 400, color: scope === s ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s16}>
                {s === 'ORGANIZATION' ? <Lock size={14} /> : <Globe size={14} />}
                {s === 'ORGANIZATION' ? 'Organization Only' : 'App Store (Global)'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.s17}>
          <button onClick={onClose} className={styles.s18}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            style={{ cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }} className={styles.s19}>
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
      className={`${styles.s20} ${styles.appCard}`}
      style={{ '--app-accent': app.color || 'var(--color-primary)' } as React.CSSProperties}>

      {/* Color bar */}
      <div style={{ background: app.color || 'var(--color-primary)' }} className={styles.s21} />

      <div className="p-5">
        {/* Header */}
        <div className={styles.s22}>
          <div className="ui-hstack-3">
            <div style={{ background: `${app.color || '#3b82f6'}15` }} className={styles.s23}>
              {app.icon || '📦'}
            </div>
            <div>
              <h3 className={styles.s24}>{app.name}</h3>
              <span className={styles.s25}>v{app.version || '1.0.0'}</span>
            </div>
          </div>
          <div className={styles.s26}>
            <span style={{ background: status.bg, color: status.text }} className={styles.s27}>{status.label}</span>
            <button onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className={styles.s6}>
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div onClick={e => e.stopPropagation()} className={styles.s28}>
                <button onClick={() => { setShowMenu(false); onDelete(); }}
                  className={`${styles.s29} ${styles.deleteMenuItem}`}>
                  <Trash2 size={14} /> Delete App
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {app.description && (
          <p className={styles.s30}>
            {app.description}
          </p>
        )}

        {/* Stats row */}
        <div className={styles.s31}>
          <span>{components.length} components</span>
          <span>{pages.length} pages</span>
          <span className="ui-flex ui-items-center ui-gap-1">
            <scopeInfo.icon size={12} /> {scopeInfo.label}
          </span>
        </div>

        {/* Footer */}
        <div className={styles.s32}>
          {testScore !== null ? (
            <div className={styles.s33}>
              <div style={{ background: testScore >= 80 ? '#dcfce7' : testScore >= 50 ? '#fef3c7' : '#fee2e2', color: testScore >= 80 ? '#16a34a' : testScore >= 50 ? '#d97706' : '#dc2626' }} className={styles.s34}>
                {testScore}%
              </div>
              <span className="ui-text-xs-soft">Test Score</span>
            </div>
          ) : (
            <span className="ui-text-xs-soft">Not tested</span>
          )}
          <div className={styles.s35}>
            <Clock size={12} /> {formatTimeAgo(app.updatedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ERPBuilderPageContent() {
  const client = useApiClient();
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
      setApps(await client.get<AppModule[]>('/builder/modules'));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [client]);

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
    await client.delete(`/builder/modules/${id}`);
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
    <div className={styles.s36}>
      {/* Header */}
      <PageHeader
        title="My Custom Apps"
        description="Build, test, and publish custom ERP applications"
        actions={
          <button className="ui-btn ui-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> New Custom App
          </button>
        }
      />

      {/* Stats Cards */}
      <div className={styles.s37}>
        {[
          { label: 'Total Apps', value: stats.total, icon: Package, color: '#3b82f6' },
          { label: 'Published', value: stats.published, icon: CheckCircle, color: '#10b981' },
          { label: 'In Development', value: stats.draft, icon: FileText, color: '#f59e0b' },
          { label: 'Tested', value: stats.tested, icon: Activity, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} className={styles.s38}>
            <div style={{ background: `${stat.color}12` }} className={styles.s39}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div>
              <div className={styles.s40}>{loading ? '—' : stat.value}</div>
              <div className={styles.s41}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {mounted && (
        <div className={`ui-card ${styles.s42}`} >
          <h3 className={styles.s43}>App Compilation & Testing History</h3>
          <div className={styles.s44}>
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
                <XAxis dataKey="month" stroke="var(--color-text-secondary)" className={styles.s45} />
                <YAxis stroke="var(--color-text-secondary)" className={styles.s45} />
                <Tooltip contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="builds" name="App Version Builds" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBuildsErp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* Filters */}
      <div className={styles.s46}>
        <div className={styles.s47}>
          <Search size={16} className={styles.s48} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..."
            className={styles.s49} />
        </div>
        {(['all', 'draft', 'published', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ border: filter === f ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: filter === f ? 'var(--color-primary-bg)' : 'var(--color-bg)', color: filter === f ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: filter === f ? 600 : 400 }} className={styles.s50}>
            {f}
          </button>
        ))}
      </div>

      {/* App Grid */}
      {loading ? (
        <div className={styles.s51}>
          {[1,2,3,4].map(i => (
            <div key={i} className={styles.s52} />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className={styles.s53}>
          <Package size={48} className={styles.s54} />
          <h3 className={styles.s55}>
            {search || filter !== 'all' ? 'No apps match your filter' : 'No custom apps yet'}
          </h3>
          <p className={styles.s56}>
            {search || filter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Create your first custom ERP application to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button onClick={() => setShowCreateModal(true)}
              className={styles.s57}>
              <Plus size={16} /> Create Your First App
            </button>
          )}
        </div>
      ) : (
        <div className={styles.s51}>
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
    <React.Suspense fallback={<div className={styles.s58}>Loading...</div>}>
      <ERPBuilderPageContent />
    </React.Suspense>
  );
}
