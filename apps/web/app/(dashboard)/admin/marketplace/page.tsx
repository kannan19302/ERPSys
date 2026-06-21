'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge } from '@unerp/ui';
import {
  Search, Download, Star, Loader2, Puzzle, CheckCircle, XCircle,
  Plus, Trash2, BarChart3, Package, FileText, Layers, Settings,
  TrendingUp, Clock, Eye,
} from 'lucide-react';

const API_BASE = '/api/v1/admin/marketplace';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

interface MarketplaceApp {
  id: string; slug: string; name: string; description: string; category: string;
  icon: string | null; publisher: string; version: string; pricing: string;
  price: number | null; rating: number; reviewCount: number; installs: number;
  features: string[]; status: string; featured: boolean; verified: boolean;
}

interface InstalledApp {
  id: string; appSlug: string; appName: string; installedVersion: string; status: string; installedAt: string;
}

interface Submission {
  id: string; name: string; slug: string; description: string; category: string;
  submitterName: string; pricing: string; price: number | null; status: string;
  createdAt: string; reviewNotes: string | null;
}

interface Collection {
  id: string; slug: string; name: string; description: string | null; icon: string | null;
  featured: boolean; sortOrder: number; items: { app: { name: string; slug: string } }[];
}

interface Stats {
  totalApps: number; totalInstalls: number;
  categories: { category: string; count: number }[];
  topApps: MarketplaceApp[];
}

type Tab = 'catalog' | 'submissions' | 'collections' | 'analytics';

export default function AdminMarketplacePage() {
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Catalog
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);

  // Submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState('PENDING');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [colName, setColName] = useState('');
  const [colSlug, setColSlug] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [colIcon, setColIcon] = useState('');

  // Stats
  const [stats, setStats] = useState<Stats | null>(null);

  const categories = ['', 'Finance', 'HR', 'Analytics', 'Operations', 'Manufacturing', 'Sales', 'Integrations', 'AI & Automation'];

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '100');
      const res = await fetch(`${API_BASE}/apps?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch {}
  }, [activeCategory, searchQuery]);

  const loadInstalled = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/installed`, { headers: authHeaders() });
      if (res.ok) {
        const list = await res.json();
        setInstalledSlugs(new Set(list.map((a: any) => a.appSlug)));
      }
    } catch {}
  }, []);

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/submissions?status=${submissionFilter}`, { headers: authHeaders() });
      if (res.ok) setSubmissions(await res.json());
    } catch {}
  }, [submissionFilter]);

  const loadCollections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/collections`, { headers: authHeaders() });
      if (res.ok) setCollections(await res.json());
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadApps(), loadInstalled(), loadStats()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);
  useEffect(() => { if (activeTab === 'submissions') loadSubmissions(); }, [activeTab, loadSubmissions]);
  useEffect(() => { if (activeTab === 'collections') loadCollections(); }, [activeTab, loadCollections]);
  useEffect(() => { if (activeTab === 'analytics') loadStats(); }, [activeTab, loadStats]);

  const handleInstall = async (slug: string) => {
    setInstalling(slug);
    try {
      const res = await fetch(`${API_BASE}/install/${slug}`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { setInstalledSlugs(prev => new Set([...prev, slug])); showToast('Installed!'); }
    } catch {} finally { setInstalling(null); }
  };

  const handleUninstall = async (slug: string) => {
    setInstalling(slug);
    try {
      const res = await fetch(`${API_BASE}/uninstall/${slug}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) { setInstalledSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; }); showToast('Uninstalled'); }
    } catch {} finally { setInstalling(null); }
  };

  const seedApps = async () => {
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST', headers: authHeaders() });
      if (res.ok) { showToast('Marketplace seeded!'); loadApps(); loadStats(); loadCollections(); }
    } catch {}
  };

  const approveSubmission = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}/approve`, { method: 'PUT', headers: authHeaders() });
      if (res.ok) { showToast('Submission approved & published!'); loadSubmissions(); loadApps(); }
    } catch {}
  };

  const rejectSubmission = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/submissions/${id}/reject`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ reviewNotes: rejectNotes }),
      });
      if (res.ok) { showToast('Submission rejected'); setRejectId(null); setRejectNotes(''); loadSubmissions(); }
    } catch {}
  };

  const createCollection = async () => {
    if (!colName || !colSlug) return;
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: colName, slug: colSlug, description: colDesc || undefined, icon: colIcon || undefined }),
      });
      if (res.ok) { showToast('Collection created!'); setShowCollectionForm(false); setColName(''); setColSlug(''); setColDesc(''); setColIcon(''); loadCollections(); }
    } catch {}
  };

  const deleteCollection = async (id: string) => {
    try {
      await fetch(`${API_BASE}/collections/${id}`, { method: 'DELETE', headers: authHeaders() });
      showToast('Collection deleted');
      loadCollections();
    } catch {}
  };

  const renderStars = (rating: number) => {
    const r = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={11} style={{ color: i < Math.floor(r) ? '#f59e0b' : 'var(--color-border)', fill: i < Math.floor(r) ? '#f59e0b' : 'none' }} />
    ));
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} /></div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'catalog', label: 'Catalog', icon: <Package size={15} />, count: apps.length },
    { key: 'submissions', label: 'Submissions', icon: <FileText size={15} /> },
    { key: 'collections', label: 'Collections', icon: <Layers size={15} />, count: collections.length },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)' }}>{toast.message}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Puzzle style={{ color: 'var(--color-primary)' }} /> Marketplace Management
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage apps, review submissions, curate collections, and view analytics.
          </p>
        </div>
        {apps.length === 0 && (
          <button onClick={seedApps} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
            Seed Default Apps
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {[
            { label: 'Total Apps', value: stats.totalApps, icon: <Package size={18} />, color: '#6366f1' },
            { label: 'Total Installs', value: stats.totalInstalls.toLocaleString(), icon: <Download size={18} />, color: '#10b981' },
            { label: 'Categories', value: stats.categories.length, icon: <Layers size={18} />, color: '#f59e0b' },
            { label: 'Top App', value: stats.topApps[0]?.name || '—', icon: <TrendingUp size={18} />, color: '#ec4899' },
          ].map((s, i) => (
            <Card key={i} padding="md" style={{ border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{s.label}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', borderBottom: '2px solid var(--color-border)' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-4)', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2, background: 'transparent', color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
            {tab.icon} {tab.label}
            {tab.count !== undefined && <span style={{ fontSize: '10px', background: 'var(--color-bg-sunken)', padding: '1px 6px', borderRadius: 'var(--radius-full)', marginLeft: 4 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search apps..."
                style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
            </div>
            <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)}
              style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', cursor: 'pointer', outline: 'none' }}>
              <option value="">All Categories</option>
              {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-3)' }}>
            {apps.map(app => (
              <div key={app.id} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{app.icon || '📦'}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{app.name}</span>
                        {app.verified && <CheckCircle size={12} style={{ color: 'var(--color-success)' }} />}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{app.publisher} · v{app.version}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {app.featured && <Badge variant="warning" style={{ fontSize: '9px' }}>Featured</Badge>}
                    {installedSlugs.has(app.slug) && <Badge variant="success" style={{ fontSize: '9px' }}>Installed</Badge>}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex' }}>{renderStars(app.rating)}</div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>· {app.installs} installs</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 'var(--weight-bold)', color: app.pricing === 'FREE' ? 'var(--color-success)' : 'var(--color-text)' }}>
                    {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {installedSlugs.has(app.slug) ? (
                    <button onClick={() => handleUninstall(app.slug)} disabled={installing === app.slug} style={{ flex: 1, padding: 'var(--space-1.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
                      {installing === app.slug ? '...' : 'Uninstall'}
                    </button>
                  ) : (
                    <button onClick={() => handleInstall(app.slug)} disabled={installing === app.slug} style={{ flex: 1, padding: 'var(--space-1.5)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '12px', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
                      {installing === app.slug ? '...' : 'Install'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {apps.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <Puzzle size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
              <p>No apps found. Click "Seed Default Apps" to populate.</p>
            </div>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setSubmissionFilter(s)}
                style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-full)', border: submissionFilter === s ? 'none' : '1px solid var(--color-border)', background: submissionFilter === s ? 'var(--color-primary)' : 'transparent', color: submissionFilter === s ? '#fff' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <FileText size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
              <p>No {submissionFilter.toLowerCase()} submissions.</p>
            </div>
          ) : (
            submissions.map(sub => (
              <Card key={sub.id} padding="md" style={{ border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {sub.name}
                      <Badge variant={sub.status === 'PENDING' ? 'warning' : sub.status === 'APPROVED' ? 'success' : 'error'}>{sub.status}</Badge>
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      by {sub.submitterName} · {sub.category} · {sub.pricing === 'FREE' ? 'Free' : `$${sub.price}/mo`}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{sub.description}</p>
                {sub.reviewNotes && (
                  <div style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-danger-light, #fef2f2)', border: '1px solid var(--color-danger)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                    Rejection notes: {sub.reviewNotes}
                  </div>
                )}
                {sub.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button onClick={() => approveSubmission(sub.id)} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-success)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={13} /> Approve & Publish
                    </button>
                    {rejectId === sub.id ? (
                      <div style={{ flex: 1, display: 'flex', gap: 'var(--space-2)' }}>
                        <input value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason..."
                          style={{ flex: 1, padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-xs)', outline: 'none', color: 'var(--color-text)' }} />
                        <button onClick={() => rejectSubmission(sub.id)} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-danger)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>Confirm</button>
                        <button onClick={() => { setRejectId(null); setRejectNotes(''); }} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setRejectId(sub.id)} style={{ padding: 'var(--space-1.5) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCollectionForm(!showCollectionForm)}
              style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> New Collection
            </button>
          </div>

          {showCollectionForm && (
            <Card padding="lg" style={{ border: '1px solid var(--color-primary)' }}>
              <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Create Collection</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <input value={colName} onChange={e => { setColName(e.target.value); if (!colSlug || colSlug === colName.toLowerCase().replace(/\s+/g, '-')) setColSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Collection name"
                  style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
                <input value={colSlug} onChange={e => setColSlug(e.target.value)} placeholder="slug"
                  style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
              </div>
              <input value={colDesc} onChange={e => setColDesc(e.target.value)} placeholder="Description (optional)" style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)', marginBottom: 'var(--space-3)' }} />
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input value={colIcon} onChange={e => setColIcon(e.target.value)} placeholder="Icon emoji (e.g. ⭐)" style={{ width: 120, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }} />
                <button onClick={createCollection} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>Create</button>
                <button onClick={() => setShowCollectionForm(false)} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </Card>
          )}

          {collections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <Layers size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
              <p>No collections. Create one to curate apps for your users.</p>
            </div>
          ) : (
            collections.map(col => (
              <Card key={col.id} padding="md" style={{ border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 28 }}>{col.icon || '📦'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{col.name}</span>
                      {col.featured && <Badge variant="warning" style={{ fontSize: '9px' }}>Featured</Badge>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {col.items.length} apps · /{col.slug}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button onClick={() => deleteCollection(col.id)} style={{ padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Category Distribution */}
            <Card padding="lg" style={{ border: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Apps by Category</h3>
              {stats.categories.map(cat => {
                const maxCount = Math.max(...stats.categories.map(c => c.count));
                return (
                  <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', width: 120, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.category}</span>
                    <div style={{ flex: 1, height: 20, borderRadius: 4, background: 'var(--color-bg-sunken)', overflow: 'hidden' }}>
                      <div style={{ width: `${(cat.count / maxCount) * 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)', width: 24, textAlign: 'right' }}>{cat.count}</span>
                  </div>
                );
              })}
            </Card>

            {/* Top Apps */}
            <Card padding="lg" style={{ border: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>Top Apps by Installs</h3>
              {stats.topApps.map((app, i) => (
                <div key={app.slug} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: i < stats.topApps.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <span style={{ width: 24, textAlign: 'center', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--color-text-tertiary)' }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{app.icon || '📦'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{app.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{app.category}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{app.installs.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>installs</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
