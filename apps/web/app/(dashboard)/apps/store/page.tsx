'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@unerp/ui';
import {
  Search, ArrowLeft, Download, Star, TrendingUp, Heart, ChevronRight,
  SlidersHorizontal, LayoutGrid, List, Loader2, Sparkles, Package,
  BarChart3, Cpu, Users, Settings, Zap, DollarSign, ShoppingBag,
  Factory, Shield, ChevronLeft, HeartPulse, Code2,
} from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface MarketplaceApp {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  icon: string | null;
  publisher: string;
  publisherLogo?: string;
  version: string;
  pricing: string;
  price: number | null;
  rating: number;
  reviewCount: number;
  installs: number;
  features: string[];
  tags: string[];
  screenshots: { url: string; caption: string }[];
  featured: boolean;
  verified: boolean;
  status: string;
  metadata?: { isSystem?: boolean };
}

interface AppCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  items: { app: MarketplaceApp }[];
}

// Kernel apps are locked (never uninstallable) so an admin surface is always available.
// Every other app — gated core business modules and industry bundles — is install/uninstall-able.
// Keep in sync with apps/api/src/common/module-tiers.ts.
const KERNEL_SLUGS = new Set(['dashboard', 'admin', 'builder', 'api-keys', 'saas']);

const categoryMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  'Analytics': { icon: <BarChart3 size={20} />, color: 'var(--color-primary)' },
  'AI & Automation': { icon: <Cpu size={20} />, color: 'var(--color-primary)' },
  'HR': { icon: <Users size={20} />, color: 'var(--color-primary)' },
  'Integrations': { icon: <Zap size={20} />, color: 'var(--color-primary)' },
  'Operations': { icon: <Settings size={20} />, color: 'var(--color-primary)' },
  'Manufacturing': { icon: <Factory size={20} />, color: 'var(--color-primary)' },
  'Finance': { icon: <DollarSign size={20} />, color: 'var(--color-primary)' },
  'Sales': { icon: <ShoppingBag size={20} />, color: 'var(--color-primary)' },
  'Healthcare': { icon: <HeartPulse size={20} />, color: 'var(--color-primary)' },
};

export default function AppStorePage() {
  const client = useApiClient();
  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [collections, setCollections] = useState<AppCollection[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [favoriteSlugs, setFavoriteSlugs] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activePricing, setActivePricing] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price_asc' | 'price_desc'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryStats, setCategoryStats] = useState<{ category: string; count: number }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadApps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeCategory) params.set('category', activeCategory);
      if (searchQuery) params.set('search', searchQuery);
      if (activePricing) params.set('pricing', activePricing);
      params.set('sort', sortBy);
      params.set('page', String(page));
      params.set('limit', '24');
      const data = await client.get<{ apps: MarketplaceApp[]; totalPages: number; total: number }>(`/admin/marketplace/apps?${params}`);
      setApps(data.apps);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {}
  }, [activeCategory, searchQuery, activePricing, sortBy, page, client]);

  const loadCollections = useCallback(async () => {
    try {
      setCollections(await client.get<AppCollection[]>('/admin/marketplace/collections'));
    } catch {}
  }, [client]);

  const loadInstalled = useCallback(async () => {
    try {
      const list = await client.get<Array<{ appSlug: string }>>('/admin/marketplace/installed');
      setInstalledSlugs(new Set(list.map(a => a.appSlug)));
    } catch {}
  }, [client]);

  const loadFavorites = useCallback(async () => {
    try {
      const list = await client.get<Array<{ app?: { slug?: string } }>>('/admin/marketplace/favorites');
      setFavoriteSlugs(new Set(list.map(f => f.app?.slug).filter((slug): slug is string => Boolean(slug))));
    } catch {}
  }, [client]);

  const loadStats = useCallback(async () => {
    try {
      const data = await client.get<{ categories?: { category: string; count: number }[] }>('/admin/marketplace/stats');
      setCategoryStats(data.categories || []);
    } catch {}
  }, [client]);

  useEffect(() => {
    Promise.all([loadApps(), loadCollections(), loadInstalled(), loadFavorites(), loadStats()])
      .finally(() => setLoading(false));
  }, [client]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setInstalledSlugs(prev => new Set([...prev, slug]));
      showToast('App installed successfully!');
      loadInstalled();
    } catch {
      showToast('Failed to install app', 'error');
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleUninstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      await client.delete(`/admin/marketplace/uninstall/${slug}`);
      setInstalledSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; });
      showToast('App uninstalled');
    } catch {
      showToast('Failed to uninstall', 'error');
    } finally {
      setInstallingSlug(null);
    }
  };

  const toggleFavorite = async (slug: string) => {
    const isFav = favoriteSlugs.has(slug);
    try {
      if (isFav) {
        await client.delete(`/admin/marketplace/favorites/${slug}`);
        setFavoriteSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; });
      } else {
        await client.post(`/admin/marketplace/favorites/${slug}`);
        setFavoriteSlugs(prev => new Set([...prev, slug]));
      }
    } catch {}
  };

  const seedApps = async () => {
    try {
      await client.post('/admin/marketplace/seed');
      showToast('Marketplace seeded with apps, collections & changelogs!');
      setLoading(true);
      await Promise.all([loadApps(), loadCollections(), loadStats()]);
      setLoading(false);
    } catch {}
  };

  const featuredApps = apps.filter(a => a.featured).slice(0, 4);
  const allCategories = Object.keys(categoryMeta);

  const renderStars = (rating: number) => {
    const r = Number(rating) || 0;
    return (
      <div className={styles.s1}>
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={11} style={{ color: s <= Math.floor(r) ? 'var(--color-primary)' : 'var(--color-border)' }} fill={s <= Math.floor(r) ? 'var(--color-primary)' : 'none'} />
        ))}
      </div>
    );
  };

  const renderAppCard = (app: MarketplaceApp) => {
    const isInstalled = installedSlugs.has(app.slug);
    const isFav = favoriteSlugs.has(app.slug);
    const isBusy = installingSlug === app.slug;
    // Locked = kernel app (non-uninstallable). Gated business modules are now uninstallable.
    const isSystem = KERNEL_SLUGS.has(app.slug);

    if (viewMode === 'list') {
      return (
        <div key={app.slug} className={styles.s2}>
          <div style={{ background: `${categoryMeta[app.category]?.color || 'var(--color-primary)'}15` }} className={styles.s3}>
            {app.icon || '📦'}
          </div>
          <div className="flex-1 overflow-hidden">
            <Link href={`/apps/store/${app.slug}`} className={styles.s4}>
              <div className="ui-hstack-2">
                <span className="ui-heading-sm">{app.name}</span>
                {app.verified && <Shield size={12} className="ui-text-success" />}
              </div>
            </Link>
            <p className={styles.s5}>{app.description}</p>
          </div>
          <div className={styles.s6}>
            {renderStars(app.rating)}
            <span className="ui-text-caption">{Number(app.rating).toFixed(1)}</span>
          </div>
          <span className={styles.s7}>
            <Badge variant={app.pricing === 'FREE' ? 'success' : app.pricing === 'FREEMIUM' ? 'info' : 'warning'}>
              {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
            </Badge>
          </span>
          <div className={styles.s8}>
            {!isSystem && (
              <button onClick={(e) => { e.preventDefault(); toggleFavorite(app.slug); }} style={{ color: isFav ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s9}>
                <Heart size={16} fill={isFav ? 'var(--color-primary)' : 'none'} />
              </button>
            )}
            {isSystem ? (
              <button disabled title="Core platform module — always installed" className={styles.s10}>
                Core · Locked
              </button>
            ) : isInstalled ? (
              <button onClick={() => handleUninstall(app.slug)} disabled={isBusy} style={{ cursor: isBusy ? 'wait' : 'pointer' }} className={styles.s11}>
                {isBusy ? '...' : 'Uninstall'}
              </button>
            ) : (
              <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ cursor: isBusy ? 'wait' : 'pointer' }} className={styles.s12}>
                {isBusy ? '...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card key={app.slug} padding="lg" className={`${styles.s13} ${styles.storeCard}`}>

        {!isSystem && (
          <button onClick={() => toggleFavorite(app.slug)} style={{ color: isFav ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s14}>
            <Heart size={16} fill={isFav ? 'var(--color-primary)' : 'none'} />
          </button>
        )}

        <Link href={`/apps/store/${app.slug}`} className={styles.s15}>
          <div className={styles.s16}>
            <div style={{ background: `${categoryMeta[app.category]?.color || 'var(--color-primary)'}15` }} className={styles.s3}>
              {app.icon || '📦'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="ui-hstack-2">
                <h3 className={styles.s17}>{app.name}</h3>
                {app.verified && <Shield size={12} className="ui-text-success" />}
              </div>
              <div className={styles.s18}>
                {app.publisher} · v{app.version}
              </div>
            </div>
          </div>

          <p className={styles.s19}>
            {app.description}
          </p>

          <div className={styles.s20}>
            <div className="ui-flex ui-items-center ui-gap-1">
              {renderStars(app.rating)}
              <span className={styles.s21}>{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
            </div>
            <span className={styles.s22}>
              <Download size={10} /> {app.installs.toLocaleString()}
            </span>
            <span className={styles.s23}>
              <Badge variant={app.pricing === 'FREE' ? 'success' : app.pricing === 'FREEMIUM' ? 'info' : 'warning'}>
                {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
              </Badge>
            </span>
          </div>
        </Link>

        <div className={styles.s24}>
          {isSystem ? (
            <button disabled title="Core platform module — always installed" className={styles.s25}>
              Core · Locked
            </button>
          ) : isInstalled ? (
            <button onClick={() => handleUninstall(app.slug)} disabled={isBusy} style={{ cursor: isBusy ? 'wait' : 'pointer' }} className={styles.s26}>
              {isBusy ? <Loader2 size={14} className={styles.s27} /> : null}
              {isBusy ? 'Uninstalling...' : 'Installed · Uninstall'}
            </button>
          ) : (
            <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ background: isBusy ? 'var(--color-bg-sunken)' : 'var(--color-primary)', color: isBusy ? 'var(--color-text-secondary)' : 'var(--color-bg-elevated)', cursor: isBusy ? 'wait' : 'pointer', boxShadow: isBusy ? 'none' : 'var(--shadow-sm)' }} className={styles.s28}>
              {isBusy ? <Loader2 size={14} className={styles.s27} /> : <Download size={14} />}
              {isBusy ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={styles.s29}>
        <Loader2 size={32} className={styles.s30} />
      </div>
    );
  }

  return (
    <RouteGuard permission="apps.store.read">
    <div className="ui-stack-6 ui-animate-in">
      {toast && (
        <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s31}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.s32}>
        <div>
          <div className={styles.s33}>
            <Link href="/apps" className={styles.s34}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className={styles.s35}>
              <Package className="ui-text-primary" /> App Store
            </h1>
          </div>
          <p className={styles.s36}>
            {total} apps available · Discover, install, and manage extensions
          </p>
        </div>
        <div className={styles.s37}>
          <Link href="/apps/store/favorites" className={styles.s38}>
            <Heart size={14} /> Favorites
          </Link>
          <Link href="/apps/store/collections" className={styles.s38}>
            <Sparkles size={14} /> Collections
          </Link>
          <Link href="/apps/developer" className={styles.s38}>
            <Code2 size={14} /> Developer
          </Link>
          {apps.length === 0 && (
            <button onClick={seedApps} className={styles.s39}>
              Seed Core + Healthcare
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      {featuredApps.length > 0 && !activeCategory && !searchQuery && (
        <div className={styles.s40}>
          <div className={styles.s41} />
          <div className={styles.s42} />
          <div className={styles.s43}>
            <div className={styles.s44}>
              <TrendingUp size={16} />
              <span className={styles.s45}>Featured & Trending</span>
            </div>
            <h2 className={styles.s46}>
              Extend Your ERP with Powerful Modules
            </h2>
            <p className={styles.s47}>
              Browse {total}+ apps across {categoryStats.length} categories. Install with one click and start using immediately.
            </p>
            <div className={styles.s48}>
              {featuredApps.map(app => (
                <Link key={app.slug} href={`/apps/store/${app.slug}`} className={styles.s49}>
                  <div className={`${styles.s50} ${styles.featuredApp}`}>
                    <div className={styles.s51}>{app.icon || '📦'}</div>
                    <div>
                      <div className="ui-heading-sm">{app.name}</div>
                      <div className={styles.s52}>{Number(app.rating).toFixed(1)} ★ · {app.installs.toLocaleString()} installs</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collections Row */}
      {collections.filter(c => c.featured).length > 0 && !activeCategory && !searchQuery && (
        <div>
          <div className={styles.s53}>
            <h2 className={styles.s54}>
              <Sparkles size={18} className={styles.s55} />
              Curated Collections
            </h2>
            <Link href="/apps/store/collections" className={styles.s56}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className={styles.s57}>
            {collections.filter(c => c.featured).slice(0, 3).map(col => (
              <Link key={col.slug} href={`/apps/store/collections/${col.slug}`} className={styles.s49}>
                <Card padding="md" className={`${styles.s58} ${styles.featuredCollection}`}>
                  <div className={styles.s59}>
                    <span className={styles.s60}>{col.icon || '📦'}</span>
                    <div>
                      <h3 className={styles.s61}>{col.name}</h3>
                      <span className="ui-text-caption">{col.items.length} apps</span>
                    </div>
                  </div>
                  <p className={styles.s62}>{col.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      {!activeCategory && !searchQuery && (
        <div>
          <h2 className={styles.s63}>Browse by Category</h2>
          <div className={styles.s64}>
            {allCategories.map(cat => {
              const meta = categoryMeta[cat] || { icon: '📦', color: 'var(--color-primary)', description: '' };
              const stat = categoryStats.find(s => s.category === cat);
              return (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  className={`${styles.s65} ${styles.categoryCard}`}
                  style={{ '--category-color': meta.color } as React.CSSProperties}>
                  <div style={{ color: meta.color }}>{meta.icon}</div>
                  <div className={styles.s66}>
                    <div className={styles.s67}>{cat}</div>
                    <div className="ui-text-caption ui-text-tertiary">{stat?.count || 0} apps</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Bar */}
      <Card padding="md" className={styles.s20}>
        <div className={styles.s68}>
          <Search size={16} className={styles.s69} />
          <input
            type="text" placeholder="Search apps..." value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className={styles.s70}
          />
        </div>

        {activeCategory && (
          <div style={{ background: `${categoryMeta[activeCategory]?.color || 'var(--color-primary)'}15`, color: categoryMeta[activeCategory]?.color || 'var(--color-primary)' }} className={styles.s71}>
            {activeCategory}
            <button onClick={() => { setActiveCategory(''); setPage(1); }} className={styles.s72}>×</button>
          </div>
        )}

        <button onClick={() => setShowFilters(!showFilters)} style={{ background: showFilters ? 'var(--color-primary)' : 'transparent', color: showFilters ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s73}>
          <SlidersHorizontal size={14} /> Filters
        </button>

        <select value={sortBy} onChange={e => { setSortBy(e.target.value as any); setPage(1); }}
          className={styles.s74}>
          <option value="popular">Most Popular</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <div className={styles.s75}>
          <button onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s76}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s77}>
            <List size={14} />
          </button>
        </div>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <Card padding="md" className={styles.s78}>
          <div>
            <label className={styles.s79}>Pricing</label>
            <div className="ui-flex ui-gap-1">
              {['', 'FREE', 'PAID', 'FREEMIUM'].map(p => (
                <button key={p} onClick={() => { setActivePricing(p); setPage(1); }}
                  style={{ border: activePricing === p ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: activePricing === p ? 'var(--color-primary)' : 'transparent', color: activePricing === p ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s80}>
                  {p || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={styles.s79}>Category</label>
            <div className={styles.s81}>
              <button onClick={() => { setActiveCategory(''); setPage(1); }}
                style={{ border: !activeCategory ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: !activeCategory ? 'var(--color-primary)' : 'transparent', color: !activeCategory ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s80}>
                All
              </button>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  style={{ border: activeCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: activeCategory === cat ? 'var(--color-primary)' : 'transparent', color: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s80}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* App Grid/List */}
      {viewMode === 'grid' ? (
        <div className={styles.s82}>
          {apps.map(renderAppCard)}
        </div>
      ) : (
        <div className="ui-stack-2">
          {apps.map(renderAppCard)}
        </div>
      )}

      {apps.length === 0 && !loading && (
        <div className="text-center p-12">
          <Search size={48} className={styles.s83} />
          <h4 className={styles.s84}>No Apps Found</h4>
          <p className={styles.s36}>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.s85}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ color: page === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text)', cursor: page === 1 ? 'default' : 'pointer' }} className={styles.s86}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span className="ui-text-sm-muted">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ color: page === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text)', cursor: page === totalPages ? 'default' : 'pointer' }} className={styles.s86}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
    </RouteGuard>
  );
}
