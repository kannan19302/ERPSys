'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from '@unerp/ui';
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
    return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin ui-text-primary" /></div>;
  }

  return (
    <RouteGuard permission="apps.store.favorites.read">
    <div className="ui-stack-5 ui-animate-in">
      {toast && (
        <div className={`ui-alert ${toast.type === 'success' ? 'ui-alert-success' : 'ui-alert-danger'}`}>
          {toast.message}
        </div>
      )}

      <div className="ui-hstack-3">
        <Link href="/apps/store" className="ui-text-muted">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="ui-heading-lg ui-flex ui-items-center ui-gap-2">
            <Heart className="ui-text-danger" size={22} /> My Favorites
          </h1>
          <p className="ui-text-sm-muted">
            {favorites.length} saved app{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="ui-empty-state">
          <Heart size={48} className="ui-empty-state-icon" />
          <h3 className="ui-empty-state-title">No favorites yet</h3>
          <p className="ui-empty-state-text">
            Browse the <Link href="/apps/store" className="ui-text-primary">App Store</Link> and heart apps you want to save for later.
          </p>
        </div>
      ) : (
        <div className="ui-grid-auto-lg">
          {favorites.map(({ app }) => {
            const isInstalled = installedSlugs.has(app.slug);
            const isBusy = installingSlug === app.slug;
            return (
              <Card key={app.slug} padding="lg" hover className={styles.appCard}>
                <Button variant="danger" size="sm" className={styles.removeBtn} onClick={() => removeFavorite(app.slug)} title="Remove from favorites">
                  <Trash2 size={14} />
                </Button>
                <Link href={`/apps/store/${app.slug}`} className={styles.cardLink}>
                  <div className="ui-hstack-3">
                    <div className={styles.iconBox}>{app.icon || '📦'}</div>
                    <div>
                      <div className="ui-flex ui-items-center ui-gap-1">
                        <span className="ui-heading-sm">{app.name}</span>
                        {app.verified && <Shield size={12} className="ui-text-success" />}
                      </div>
                      <div className="ui-text-caption ui-text-tertiary">{app.publisher} · v{app.version}</div>
                    </div>
                  </div>
                  <p className={styles.description}>{app.description}</p>
                  <div className="ui-hstack-2">
                    <div className={styles.starRow}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={s <= Math.floor(Number(app.rating)) ? 'ui-text-warning' : 'ui-text-muted'} fill={s <= Math.floor(Number(app.rating)) ? 'var(--color-warning)' : 'none'} />
                      ))}
                    </div>
                    <span className="ui-text-caption">{Number(app.rating).toFixed(1)}</span>
                    <span className={styles.priceBadge}>
                      <Badge variant={app.pricing === 'FREE' ? 'success' : 'warning'}>
                        {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                      </Badge>
                    </span>
                  </div>
                </Link>
                <div>
                  {isInstalled ? (
                    <div className={`ui-text-success text-xs font-semibold text-center ${styles.installedLabel}`}>Installed</div>
                  ) : (
                    <Button variant="primary" size="sm" leftIcon={<Download size={13} />} onClick={() => handleInstall(app.slug)} disabled={isBusy} className="w-full">
                      {isBusy ? 'Installing...' : 'Install'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
