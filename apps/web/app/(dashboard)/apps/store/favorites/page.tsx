'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@unerp/ui';
import { ArrowLeft, Heart, Download, Star, Shield, Loader2, Trash2 } from 'lucide-react';

const API_BASE = '/api/v1/admin/marketplace';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

interface FavoriteApp {
  id: string; slug: string; name: string; description: string; category: string;
  icon: string | null; publisher: string; version: string; pricing: string;
  price: number | null; rating: number; reviewCount: number; installs: number;
  verified: boolean;
}

interface FavoriteEntry {
  id: string;
  app: FavoriteApp;
  createdAt: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [favRes, instRes] = await Promise.all([
          fetch(`${API_BASE}/favorites`, { headers: authHeaders() }),
          fetch(`${API_BASE}/installed`, { headers: authHeaders() }),
        ]);
        if (favRes.ok) setFavorites(await favRes.json());
        if (instRes.ok) {
          const list = await instRes.json();
          setInstalledSlugs(new Set(list.map((a: any) => a.appSlug)));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const removeFavorite = async (slug: string) => {
    try {
      await fetch(`${API_BASE}/favorites/${slug}`, { method: 'DELETE', headers: authHeaders() });
      setFavorites(prev => prev.filter(f => f.app.slug !== slug));
      setToast({ message: 'Removed from favorites', type: 'success' });
    } catch {}
  };

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      const res = await fetch(`${API_BASE}/install/${slug}`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        setInstalledSlugs(prev => new Set([...prev, slug]));
        setToast({ message: 'App installed!', type: 'success' });
      }
    } catch {}
    finally { setInstallingSlug(null); }
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--radius-md)', background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)', color: '#fff', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-lg)' }}>{toast.message}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Link href="/apps/store" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Heart style={{ color: '#ef4444' }} /> My Favorites
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            {favorites.length} saved app{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
          <Heart size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>No favorites yet</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>
            Browse the <Link href="/apps/store" style={{ color: 'var(--color-primary)' }}>App Store</Link> and heart apps you want to save for later.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {favorites.map(({ app }) => {
            const isInstalled = installedSlugs.has(app.slug);
            const isBusy = installingSlug === app.slug;
            return (
              <Card key={app.slug} padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--color-border)', position: 'relative' }}>
                <button onClick={() => removeFavorite(app.slug)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }} title="Remove from favorites">
                  <Trash2 size={14} />
                </button>
                <Link href={`/apps/store/${app.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{app.icon || '📦'}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{app.name}</span>
                        {app.verified && <Shield size={12} style={{ color: 'var(--color-success)' }} />}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{app.publisher} · v{app.version}</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', gap: 1 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: s <= Math.floor(Number(app.rating)) ? '#f59e0b' : 'var(--color-border)' }} fill={s <= Math.floor(Number(app.rating)) ? '#f59e0b' : 'none'} />)}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{Number(app.rating).toFixed(1)}</span>
                    <Badge variant={app.pricing === 'FREE' ? 'success' : 'warning'} style={{ fontSize: '9px', marginLeft: 'auto' }}>
                      {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                    </Badge>
                  </div>
                </Link>
                <div>
                  {isInstalled ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--weight-semibold)' }}>Installed</div>
                  ) : (
                    <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', cursor: isBusy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                      <Download size={13} /> {isBusy ? 'Installing...' : 'Install'}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
