'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge } from '@unerp/ui';
import {
  Search, Download, Star, Loader2, Puzzle, CheckCircle, XCircle,
  Plus, Trash2, BarChart3, Package, FileText, Layers, Settings,
  TrendingUp, Clock, Eye,
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';
import styles from './page.module.css';

const API_BASE = '/api/v1/admin/marketplace';

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
  const client = useApiClient();
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
      const data = await client.get<{ apps?: MarketplaceApp[] }>(`${API_BASE}/apps?${params}`);
      setApps(data.apps || []);
    } catch {}
  }, [activeCategory, searchQuery]);

  const loadInstalled = useCallback(async () => {
    try {
      const list = await client.get<InstalledApp[]>(`${API_BASE}/installed`);
      setInstalledSlugs(new Set(list.map((a) => a.appSlug)));
    } catch {}
  }, []);

  const loadSubmissions = useCallback(async () => {
    try {
      setSubmissions(await client.get<Submission[]>(`${API_BASE}/submissions?status=${submissionFilter}`));
    } catch {}
  }, [submissionFilter]);

  const loadCollections = useCallback(async () => {
    try {
      setCollections(await client.get<Collection[]>(`${API_BASE}/collections`));
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await client.get<Stats>(`${API_BASE}/stats`));
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
      await client.post(`${API_BASE}/install/${slug}`);
      setInstalledSlugs(prev => new Set([...prev, slug])); showToast('Installed!');
    } catch {} finally { setInstalling(null); }
  };

  const handleUninstall = async (slug: string) => {
    setInstalling(slug);
    try {
      await client.delete(`${API_BASE}/uninstall/${slug}`);
      setInstalledSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; }); showToast('Uninstalled');
    } catch {} finally { setInstalling(null); }
  };

  const seedApps = async () => {
    try {
      await client.post(`${API_BASE}/seed`); showToast('Marketplace seeded!'); loadApps(); loadStats(); loadCollections();
    } catch {}
  };

  const approveSubmission = async (id: string) => {
    try {
      await client.request(`${API_BASE}/submissions/${id}/approve`, { method: 'PUT' }); showToast('Submission approved & published!'); loadSubmissions(); loadApps();
    } catch {}
  };

  const rejectSubmission = async (id: string) => {
    try {
      await client.request(`${API_BASE}/submissions/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reviewNotes: rejectNotes }),
      });
      showToast('Submission rejected'); setRejectId(null); setRejectNotes(''); loadSubmissions();
    } catch {}
  };

  const createCollection = async () => {
    if (!colName || !colSlug) return;
    try {
      await client.post(`${API_BASE}/collections`, { name: colName, slug: colSlug, description: colDesc || undefined, icon: colIcon || undefined });
      showToast('Collection created!'); setShowCollectionForm(false); setColName(''); setColSlug(''); setColDesc(''); setColIcon(''); loadCollections();
    } catch {}
  };

  const deleteCollection = async (id: string) => {
    try {
      await client.delete(`${API_BASE}/collections/${id}`);
      showToast('Collection deleted');
      loadCollections();
    } catch {}
  };

  const renderStars = (rating: number) => {
    const r = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={11} className={i < Math.floor(r) ? styles.starFilled : styles.starEmpty} />
    ));
  };

  if (loading) {
    return <div className={styles.loading}><Loader2 size={32} className={styles.spinner} /></div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'catalog', label: 'Catalog', icon: <Package size={15} />, count: apps.length },
    { key: 'submissions', label: 'Submissions', icon: <FileText size={15} /> },
    { key: 'collections', label: 'Collections', icon: <Layers size={15} />, count: collections.length },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
  ];

  return (
    <RouteGuard permission="settings.marketplace.read">
    <div className="ui-stack-6">
      {toast && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastDanger}`}>{toast.message}</div>}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Puzzle className="ui-text-primary" /> Marketplace Management
          </h1>
          <p className={styles.pageDescription}>
            Manage apps, review submissions, curate collections, and view analytics.
          </p>
        </div>
        {apps.length === 0 && (
          <button onClick={seedApps} className={styles.primaryButton}>
            Seed Default Apps
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          {[
            { label: 'Total Apps', value: stats.totalApps, icon: <Package size={18} />, tone: styles.statPrimary },
            { label: 'Total Installs', value: stats.totalInstalls.toLocaleString(), icon: <Download size={18} />, tone: styles.statSuccess },
            { label: 'Categories', value: stats.categories.length, icon: <Layers size={18} />, tone: styles.statWarning },
            { label: 'Top App', value: stats.topApps[0]?.name || '—', icon: <TrendingUp size={18} />, tone: styles.statAccent },
          ].map((s, i) => (
            <Card key={i} padding="md" className={styles.statCard}>
              <div className={`${styles.statIcon} ${s.tone}`}>{s.icon}</div>
              <div>
                <div className="ui-heading-lg">{s.value}</div>
                <div className="ui-text-caption ui-text-tertiary">{s.label}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}>
            {tab.icon} {tab.label}
            {tab.count !== undefined && <span className={styles.tabCount}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="ui-stack-4">
          <div className={styles.catalogToolbar}>
            <div className={styles.searchField}>
              <Search size={16} className="ui-input-icon-abs" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search apps..."
                className={styles.searchInput} />
            </div>
            <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)}
              className={styles.select}>
              <option value="">All Categories</option>
              {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.appGrid}>
            {apps.map(app => (
              <div key={app.id} className={styles.appCard}>
                <div className="ui-flex-between ui-items-start">
                  <div className={styles.appIdentity}>
                    <div className={styles.appIcon}>{app.icon || '📦'}</div>
                    <div>
                      <div className="ui-flex ui-items-center ui-gap-1">
                        <span className="ui-heading-sm font-bold">{app.name}</span>
                        {app.verified && <CheckCircle size={12} className="ui-text-success" />}
                      </div>
                      <div className="ui-text-micro">{app.publisher} · v{app.version}</div>
                    </div>
                  </div>
                  <div className={styles.badgeList}>
                    {app.featured && <span className={styles.badgeWrap}><Badge variant="warning">Featured</Badge></span>}
                    {installedSlugs.has(app.slug) && <span className={styles.badgeWrap}><Badge variant="success">Installed</Badge></span>}
                  </div>
                </div>
                <p className={styles.appDescription}>{app.description}</p>
                <div className="ui-flex-between">
                  <div className="ui-hstack-2">
                    <div className={styles.stars}>{renderStars(app.rating)}</div>
                    <span className="ui-text-micro ui-text-muted">{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
                    <span className="ui-text-micro">· {app.installs} installs</span>
                  </div>
                  <span className={`${styles.price} ${app.pricing === 'FREE' ? styles.freePrice : ''}`}>
                    {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                  </span>
                </div>
                <div className="ui-flex ui-gap-2">
                  {installedSlugs.has(app.slug) ? (
                    <button onClick={() => handleUninstall(app.slug)} disabled={installing === app.slug} className={styles.dangerOutlineButton}>
                      {installing === app.slug ? '...' : 'Uninstall'}
                    </button>
                  ) : (
                    <button onClick={() => handleInstall(app.slug)} disabled={installing === app.slug} className={styles.installButton}>
                      {installing === app.slug ? '...' : 'Install'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {apps.length === 0 && (
            <div className="ui-empty-state">
              <Puzzle size={48} className={styles.emptyIcon} />
              <p>No apps found. Click "Seed Default Apps" to populate.</p>
            </div>
          )}
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="ui-stack-4">
          <div className="ui-flex ui-gap-2">
            {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setSubmissionFilter(s)}
                className={`${styles.filterButton} ${submissionFilter === s ? styles.filterButtonActive : ''}`}>
                {s}
              </button>
            ))}
          </div>

          {submissions.length === 0 ? (
            <div className="ui-empty-state">
              <FileText size={48} className={styles.emptyIcon} />
              <p>No {submissionFilter.toLowerCase()} submissions.</p>
            </div>
          ) : (
            submissions.map(sub => (
              <Card key={sub.id} padding="md" className={styles.borderedCard}>
                <div className={styles.submissionHeader}>
                  <div>
                    <h3 className={styles.submissionTitle}>
                      {sub.name}
                      <Badge variant={sub.status === 'PENDING' ? 'warning' : sub.status === 'APPROVED' ? 'success' : 'danger'}>{sub.status}</Badge>
                    </h3>
                    <div className={styles.submissionMeta}>
                      by {sub.submitterName} · {sub.category} · {sub.pricing === 'FREE' ? 'Free' : `$${sub.price}/mo`}
                    </div>
                  </div>
                  <span className={styles.submissionDate}>
                    <Clock size={12} /> {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={styles.submissionDescription}>{sub.description}</p>
                {sub.reviewNotes && (
                  <div className={styles.reviewNotes}>
                    Rejection notes: {sub.reviewNotes}
                  </div>
                )}
                {sub.status === 'PENDING' && (
                  <div className="ui-flex ui-gap-2">
                    <button onClick={() => approveSubmission(sub.id)} className={styles.successButton}>
                      <CheckCircle size={13} /> Approve & Publish
                    </button>
                    {rejectId === sub.id ? (
                      <div className={styles.rejectForm}>
                        <input value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} placeholder="Rejection reason..."
                          className={styles.compactInput} />
                        <button onClick={() => rejectSubmission(sub.id)} className={styles.dangerButton}>Confirm</button>
                        <button onClick={() => { setRejectId(null); setRejectNotes(''); }} className={styles.secondaryButton}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setRejectId(sub.id)} className={styles.dangerOutlineAction}>
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
        <div className="ui-stack-4">
          <div className="ui-flex-end">
            <button onClick={() => setShowCollectionForm(!showCollectionForm)}
              className={styles.primaryAction}>
              <Plus size={14} /> New Collection
            </button>
          </div>

          {showCollectionForm && (
            <Card padding="lg" className={styles.collectionFormCard}>
              <h4 className={styles.collectionFormTitle}>Create Collection</h4>
              <div className={styles.collectionFields}>
                <input value={colName} onChange={e => { setColName(e.target.value); if (!colSlug || colSlug === colName.toLowerCase().replace(/\s+/g, '-')) setColSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} placeholder="Collection name"
                  className={styles.input} />
                <input value={colSlug} onChange={e => setColSlug(e.target.value)} placeholder="slug"
                  className={styles.input} />
              </div>
              <input value={colDesc} onChange={e => setColDesc(e.target.value)} placeholder="Description (optional)" className={`${styles.input} ${styles.descriptionInput}`} />
              <div className={styles.collectionActions}>
                <input value={colIcon} onChange={e => setColIcon(e.target.value)} placeholder="Icon emoji (e.g. ⭐)" className={`${styles.input} ${styles.iconInput}`} />
                <button onClick={createCollection} className={styles.primaryButton}>Create</button>
                <button onClick={() => setShowCollectionForm(false)} className={styles.secondaryButton}>Cancel</button>
              </div>
            </Card>
          )}

          {collections.length === 0 ? (
            <div className="ui-empty-state">
              <Layers size={48} className={styles.emptyIcon} />
              <p>No collections. Create one to curate apps for your users.</p>
            </div>
          ) : (
            collections.map(col => (
              <Card key={col.id} padding="md" className={`${styles.borderedCard} ${styles.collectionCard}`}>
                <div className="ui-hstack-3">
                  <span className={styles.collectionIcon}>{col.icon || '📦'}</span>
                  <div>
                    <div className="ui-hstack-2">
                      <span className="ui-heading-sm font-bold">{col.name}</span>
                      {col.featured && <span className={styles.badgeWrap}><Badge variant="warning">Featured</Badge></span>}
                    </div>
                    <div className="ui-text-caption">
                      {col.items.length} apps · /{col.slug}
                    </div>
                  </div>
                </div>
                <div className="ui-flex ui-gap-2">
                  <button onClick={() => deleteCollection(col.id)} className={styles.iconDangerButton}>
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
        <div className={styles.analytics}>
          <div className="ui-grid-2">
            {/* Category Distribution */}
            <Card padding="lg" className={styles.borderedCard}>
              <h3 className={styles.analyticsTitle}>Apps by Category</h3>
              {stats.categories.map(cat => {
                const maxCount = Math.max(...stats.categories.map(c => c.count));
                return (
                  <div key={cat.category} className={styles.categoryRow}>
                    <span className={styles.categoryName}>{cat.category}</span>
                    <div className={styles.categoryTrack}>
                      <div className={styles.categoryBar} style={{ width: `${(cat.count / maxCount) * 100}%` }} />
                    </div>
                    <span className={styles.categoryCount}>{cat.count}</span>
                  </div>
                );
              })}
            </Card>

            {/* Top Apps */}
            <Card padding="lg" className={styles.borderedCard}>
              <h3 className={styles.analyticsTitle}>Top Apps by Installs</h3>
              {stats.topApps.map((app, i) => (
                <div key={app.slug} className={`${styles.topAppRow} ${i < stats.topApps.length - 1 ? styles.topAppRowBorder : ''}`}>
                  <span className={`${styles.rank} ${i === 0 ? styles.rankFirst : i === 1 ? styles.rankSecond : i === 2 ? styles.rankThird : ''}`}>
                    {i + 1}
                  </span>
                  <div className={styles.topAppIcon}>{app.icon || '📦'}</div>
                  <div className="flex-1">
                    <div className="ui-heading-sm">{app.name}</div>
                    <div className="ui-text-micro">{app.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="ui-heading-sm font-bold">{app.installs.toLocaleString()}</div>
                    <div className="ui-text-micro">installs</div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

    </div>
    </RouteGuard>
  );
}
