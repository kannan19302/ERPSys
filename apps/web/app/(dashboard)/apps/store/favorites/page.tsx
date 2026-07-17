'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge } from '@unerp/ui';
import { ArrowLeft, Heart, Download, Star, Shield, Loader2, Trash2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [favRes, instRes] = await Promise.all([
          client.get<FavoriteEntry[]>('/admin/marketplace/favorites'),
          client.get<Array<{ appSlug: string }>>('/admin/marketplace/installed'),
        ]);
        setFavorites(favRes);
        setInstalledSlugs(new Set(instRes.map(a => a.appSlug)));
      } catch {}
      setLoading(false);
    })();
  }, [client]);

  const removeFavorite = async (slug: string) => {
    try {
      await client.delete(`/admin/marketplace/favorites/${slug}`);
      setFavorites(prev => prev.filter(f => f.app.slug !== slug));
      setToast({ message: 'Removed from favorites', type: 'success' });
    } catch {}
  };

  const handleInstall = async (slug: string) => {
    setInstallingSlug(slug);
    try {
      await client.post(`/admin/marketplace/install/${slug}`);
      setInstalledSlugs(prev => new Set([...prev, slug]));
      setToast({ message: 'App installed!', type: 'success' });
    } catch {}
    finally { setInstallingSlug(null); }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return <div className={styles.s1}><Loader2 size={32} className={styles.s14} /></div>;
  }

  return (
    <RouteGuard permission="apps.store.favorites.read">
    <div className="ui-stack-6 ui-animate-in">
      {toast && <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s2}>{toast.message}</div>}

      <div className="ui-hstack-3">
        <Link href="/apps/store" className={styles.s17}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className={styles.s3}>
            <Heart className={styles.s15} /> My Favorites
          </h1>
          <p className={styles.s4}>
            {favorites.length} saved app{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="ui-empty-state">
          <Heart size={48} className={styles.s16} />
          <p className={styles.s5}>No favorites yet</p>
          <p className="text-sm">
            Browse the <Link href="/apps/store" className="ui-text-primary">App Store</Link> and heart apps you want to save for later.
          </p>
        </div>
      ) : (
        <div className={styles.s6}>
          {favorites.map(({ app }) => {
            const isInstalled = installedSlugs.has(app.slug);
            const isBusy = installingSlug === app.slug;
            return (
              <Card key={app.slug} padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--color-border)', position: 'relative' }}>
                <button onClick={() => removeFavorite(app.slug)} className={styles.s7} title="Remove from favorites">
                  <Trash2 size={14} />
                </button>
                <Link href={`/apps/store/${app.slug}`} className={styles.s18}>
                  <div className="ui-hstack-3">
                    <div className={styles.s8}>{app.icon || '📦'}</div>
                    <div>
                      <div className="ui-flex ui-items-center ui-gap-1">
                        <span className="ui-heading-sm">{app.name}</span>
                        {app.verified && <Shield size={12} className="ui-text-success" />}
                      </div>
                      <div className="ui-text-caption ui-text-tertiary">{app.publisher} · v{app.version}</div>
                    </div>
                  </div>
                  <p className={styles.s9}>{app.description}</p>
                  <div className="ui-hstack-2">
                    <div className={styles.s10}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: s <= Math.floor(Number(app.rating)) ? '#f59e0b' : 'var(--color-border)' }} fill={s <= Math.floor(Number(app.rating)) ? '#f59e0b' : 'none'} />)}
                    </div>
                    <span className="ui-text-caption">{Number(app.rating).toFixed(1)}</span>
                    <span className={styles.s11}>
                      <Badge variant={app.pricing === 'FREE' ? 'success' : 'warning'}>
                        {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                      </Badge>
                    </span>
                  </div>
                </Link>
                <div>
                  {isInstalled ? (
                    <div className={styles.s12}>Installed</div>
                  ) : (
                    <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ cursor: isBusy ? 'wait' : 'pointer' }} className={styles.s13}>
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
    </RouteGuard>
  );
}
