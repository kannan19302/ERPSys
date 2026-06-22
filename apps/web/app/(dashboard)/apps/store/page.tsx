'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@unerp/ui';
import {
  Search, ArrowLeft, Download, Star, TrendingUp, Heart, ChevronRight,
  SlidersHorizontal, LayoutGrid, List, Loader2, Sparkles, Package,
  BarChart3, Cpu, Users, Settings, Zap, DollarSign, ShoppingBag,
  Factory, Shield, ChevronLeft,
} from 'lucide-react';

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

const API_BASE = '/api/v1/admin/marketplace';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const categoryMeta: Record<string, { icon: React.ReactNode; color: string }> = {
  'Analytics': { icon: <BarChart3 size={20} />, color: '#6366f1' },
  'AI & Automation': { icon: <Cpu size={20} />, color: '#8b5cf6' },
  'HR': { icon: <Users size={20} />, color: '#ec4899' },
  'Integrations': { icon: <Zap size={20} />, color: '#f59e0b' },
  'Operations': { icon: <Settings size={20} />, color: '#6b7280' },
  'Manufacturing': { icon: <Factory size={20} />, color: '#f97316' },
  'Finance': { icon: <DollarSign size={20} />, color: '#10b981' },
  'Sales': { icon: <ShoppingBag size={20} />, color: '#3b82f6' },
};

export default function AppStorePage() {
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
      const res = await fetch(`${API_BASE}/apps?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {}
  }, [activeCategory, searchQuery, activePricing, sortBy, page]);

  const loadCollections = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/collections`, { headers: authHeaders() });
      if (res.ok) setCollections(await res.json());
    } catch {}
  }, []);

  const loadInstalled = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/installed`, { headers: authHeaders() });
      if (res.ok) {
        const list = await res.json();
        setInstalledSlugs(new Set(list.map((a: any) => a.appSlug)));
      }
    } catch {}
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/favorites`, { headers: authHeaders() });
      if (res.ok) {
        const list = await res.json();
        setFavoriteSlugs(new Set(list.map((f: any) => f.app?.slug).filter(Boolean)));
      }
    } catch {}
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCategoryStats(data.categories || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([loadApps(), loadCollections(), loadInstalled(), loadFavorites(), loadStats()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      const res = await fetch(`${API_BASE}/install/${slug}`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        setInstalledSlugs(prev => new Set([...prev, slug]));
        showToast('App installed successfully!');
      } else {
        showToast('Failed to install app', 'error');
      }
    } catch {
      showToast('Failed to install app', 'error');
    } finally {
      setInstallingSlug(null);
    }
  };

  const handleUninstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      const res = await fetch(`${API_BASE}/uninstall/${slug}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        setInstalledSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; });
        showToast('App uninstalled');
      }
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
        await fetch(`${API_BASE}/favorites/${slug}`, { method: 'DELETE', headers: authHeaders() });
        setFavoriteSlugs(prev => { const s = new Set(prev); s.delete(slug); return s; });
      } else {
        await fetch(`${API_BASE}/favorites/${slug}`, { method: 'POST', headers: authHeaders() });
        setFavoriteSlugs(prev => new Set([...prev, slug]));
      }
    } catch {}
  };

  const seedApps = async () => {
    try {
      await fetch(`${API_BASE}/seed`, { method: 'POST', headers: authHeaders() });
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} size={11} style={{ color: s <= Math.floor(r) ? '#f59e0b' : 'var(--color-border)' }} fill={s <= Math.floor(r) ? '#f59e0b' : 'none'} />
        ))}
      </div>
    );
  };

  const renderAppCard = (app: MarketplaceApp) => {
    const isInstalled = installedSlugs.has(app.slug);
    const isFav = favoriteSlugs.has(app.slug);
    const isBusy = installingSlug === app.slug;
    const isSystem = app.metadata?.isSystem === true;

    if (viewMode === 'list') {
      return (
        <div key={app.slug} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${categoryMeta[app.category]?.color || '#6366f1'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
            {app.icon || '📦'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/apps/store/${app.slug}`} style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{app.name}</span>
                {app.verified && <Shield size={12} style={{ color: 'var(--color-success)' }} />}
              </div>
            </Link>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            {renderStars(app.rating)}
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{Number(app.rating).toFixed(1)}</span>
          </div>
          <Badge variant={app.pricing === 'FREE' ? 'success' : app.pricing === 'FREEMIUM' ? 'info' : 'warning'} style={{ flexShrink: 0 }}>
            {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
          </Badge>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
            {!isSystem && (
              <button onClick={(e) => { e.preventDefault(); toggleFavorite(app.slug); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isFav ? '#ef4444' : 'var(--color-text-tertiary)' }}>
                <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
              </button>
            )}
            {isSystem ? (
              <button disabled style={{ padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', fontSize: '12px', fontWeight: 'var(--weight-semibold)', cursor: 'not-allowed' }}>
                System App
              </button>
            ) : isInstalled ? (
              <button onClick={() => handleUninstall(app.slug)} disabled={isBusy} style={{ padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'var(--weight-semibold)', cursor: isBusy ? 'wait' : 'pointer' }}>
                {isBusy ? '...' : 'Uninstall'}
              </button>
            ) : (
              <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ padding: '4px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: '12px', fontWeight: 'var(--weight-semibold)', cursor: isBusy ? 'wait' : 'pointer' }}>
                {isBusy ? '...' : 'Install'}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <Card key={app.slug} padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--color-border)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', position: 'relative' }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

        {!isSystem && (
          <button onClick={() => toggleFavorite(app.slug)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isFav ? '#ef4444' : 'var(--color-text-tertiary)', zIndex: 1 }}>
            <Heart size={16} fill={isFav ? '#ef4444' : 'none'} />
          </button>
        )}

        <Link href={`/apps/store/${app.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${categoryMeta[app.category]?.color || '#6366f1'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {app.icon || '📦'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{app.name}</h3>
                {app.verified && <Shield size={12} style={{ color: 'var(--color-success)' }} />}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                {app.publisher} · v{app.version}
              </div>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {app.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              {renderStars(app.rating)}
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-medium)' }}>{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Download size={10} /> {app.installs.toLocaleString()}
            </span>
            <Badge variant={app.pricing === 'FREE' ? 'success' : app.pricing === 'FREEMIUM' ? 'info' : 'warning'} style={{ fontSize: '10px' }}>
              {app.pricing === 'FREE' ? 'Free' : app.pricing === 'FREEMIUM' ? 'Freemium' : `$${app.price}/mo`}
            </Badge>
          </div>
        </Link>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
          {isSystem ? (
            <button disabled style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              System App
            </button>
          ) : isInstalled ? (
            <button onClick={() => handleUninstall(app.slug)} disabled={isBusy} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)', background: 'transparent', color: 'var(--color-danger)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: isBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              {isBusy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
              {isBusy ? 'Uninstalling...' : 'Installed · Uninstall'}
            </button>
          ) : (
            <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: 'none', background: isBusy ? 'var(--color-bg-sunken)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: isBusy ? 'var(--color-text-secondary)' : '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: isBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', boxShadow: isBusy ? 'none' : '0 2px 8px rgba(99,102,241,0.3)' }}>
              {isBusy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={14} />}
              {isBusy ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.3s ease-out' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <Link href="/apps" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Package style={{ color: 'var(--color-primary)' }} /> App Store
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            {total} apps available · Discover, install, and manage extensions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <Link href="/apps/store/favorites" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
            <Heart size={14} /> Favorites
          </Link>
          <Link href="/apps/store/collections" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'var(--color-text)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>
            <Sparkles size={14} /> Collections
          </Link>
          {apps.length === 0 && (
            <button onClick={seedApps} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', cursor: 'pointer' }}>
              Seed Marketplace
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      {featuredApps.length > 0 && !activeCategory && !searchQuery && (
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 }}>Featured & Trending</span>
            </div>
            <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>
              Extend Your ERP with Powerful Modules
            </h2>
            <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', opacity: 0.8, maxWidth: 600 }}>
              Browse {total}+ apps across {categoryStats.length} categories. Install with one click and start using immediately.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {featuredApps.map(app => (
                <Link key={app.slug} href={`/apps/store/${app.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', border: '1px solid rgba(255,255,255,0.15)', minWidth: 200, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                    <div style={{ fontSize: 22 }}>{app.icon || '📦'}</div>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>{app.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{Number(app.rating).toFixed(1)} ★ · {app.installs.toLocaleString()} installs</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)', marginRight: 8, verticalAlign: 'middle' }} />
              Curated Collections
            </h2>
            <Link href="/apps/store/collections" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' }}>
            {collections.filter(c => c.featured).slice(0, 3).map(col => (
              <Link key={col.slug} href={`/apps/store/collections/${col.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card padding="md" style={{ border: '1px solid var(--color-border)', transition: 'border-color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 28 }}>{col.icon || '📦'}</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{col.name}</h3>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{col.items.length} apps</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{col.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      {!activeCategory && !searchQuery && (
        <div>
          <h2 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>Browse by Category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            {allCategories.map(cat => {
              const meta = categoryMeta[cat];
              const stat = categoryStats.find(s => s.category === cat);
              return (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = `${meta.color}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-elevated)'; }}>
                  <div style={{ color: meta.color }}>{meta.icon}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{cat}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{stat?.count || 0} apps</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search, Filter & Sort Bar */}
      <Card padding="md" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text" placeholder="Search apps..." value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-9)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', outline: 'none', color: 'var(--color-text)' }}
          />
        </div>

        {activeCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', background: `${categoryMeta[activeCategory]?.color || '#6366f1'}15`, color: categoryMeta[activeCategory]?.color || '#6366f1', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)' }}>
            {activeCategory}
            <button onClick={() => { setActiveCategory(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </div>
        )}

        <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: showFilters ? 'var(--color-primary)' : 'transparent', color: showFilters ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)' }}>
          <SlidersHorizontal size={14} /> Filters
        </button>

        <select value={sortBy} onChange={e => { setSortBy(e.target.value as any); setPage(1); }}
          style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 'var(--text-xs)', cursor: 'pointer', outline: 'none' }}>
          <option value="popular">Most Popular</option>
          <option value="rating">Top Rated</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', border: 'none', background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', border: 'none', borderLeft: '1px solid var(--color-border)', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <List size={14} />
          </button>
        </div>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <Card padding="md" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Pricing</label>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              {['', 'FREE', 'PAID', 'FREEMIUM'].map(p => (
                <button key={p} onClick={() => { setActivePricing(p); setPage(1); }}
                  style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', border: activePricing === p ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: activePricing === p ? 'var(--color-primary)' : 'transparent', color: activePricing === p ? '#fff' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  {p || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Category</label>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              <button onClick={() => { setActiveCategory(''); setPage(1); }}
                style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', border: !activeCategory ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: !activeCategory ? 'var(--color-primary)' : 'transparent', color: !activeCategory ? '#fff' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                All
              </button>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  style={{ padding: 'var(--space-1) var(--space-3)', borderRadius: 'var(--radius-full)', border: activeCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', background: activeCategory === cat ? 'var(--color-primary)' : 'transparent', color: activeCategory === cat ? '#fff' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* App Grid/List */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {apps.map(renderAppCard)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {apps.map(renderAppCard)}
        </div>
      )}

      {apps.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <Search size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
          <h4 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>No Apps Found</h4>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: page === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text)', cursor: page === 1 ? 'default' : 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: page === totalPages ? 'var(--color-text-tertiary)' : 'var(--color-text)', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
