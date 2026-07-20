'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Badge, Button } from '@unerp/ui';
import { ArrowLeft, Download, Star, Heart, Shield, Loader2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface CollectionApp {
  id: string; slug: string; name: string; description: string; category: string;
  icon: string | null; publisher: string; version: string; pricing: string;
  price: number | null; rating: number; reviewCount: number; installs: number;
  verified: boolean;
}

interface CollectionDetail {
  id: string; slug: string; name: string; description: string | null; icon: string | null;
  items: { app: CollectionApp }[];
}

export default function CollectionDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const slug = params.slug as string;
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [installedSlugs, setInstalledSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [colRes, instRes] = await Promise.all([
          client.get<CollectionDetail>(`/admin/marketplace/collections/${slug}`),
          client.get<Array<{ appSlug: string }>>('/admin/marketplace/installed'),
        ]);
        setCollection(colRes);
        setInstalledSlugs(new Set(instRes.map(a => a.appSlug)));
      } catch {}
      setLoading(false);
    })();
  }, [slug, client]);

  const handleInstall = async (appSlug: string) => {
    setInstallingSlug(appSlug);
    try {
      await client.post(`/admin/marketplace/install/${appSlug}`);
      setInstalledSlugs(prev => new Set([...prev, appSlug]));
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

  if (!collection) {
    return <div className={styles.notFound}><h3>Collection not found</h3><Link href="/apps/store/collections" className="ui-text-primary">Back to Collections</Link></div>;
  }

  return (
    <RouteGuard permission="apps.store.collections.read">
    <div className="ui-stack-5 ui-animate-in">
      {toast && (
        <div className={`ui-alert ${toast.type === 'success' ? 'ui-alert-success' : 'ui-alert-danger'}`}>
          {toast.message}
        </div>
      )}

      <nav className="ui-breadcrumb">
        <Link href="/apps/store" className="ui-breadcrumb-link">App Store</Link>
        <span className="ui-breadcrumb-separator">/</span>
        <Link href="/apps/store/collections" className="ui-breadcrumb-link">Collections</Link>
        <span className="ui-breadcrumb-separator">/</span>
        <span className="ui-breadcrumb-active">{collection.name}</span>
      </nav>

      <div className="ui-hstack-4">
        <span className={styles.colIconLarge}>{collection.icon || '📦'}</span>
        <div>
          <h1 className={`ui-heading-lg ${styles.pageTitle}`}>{collection.name}</h1>
          <p className={`ui-text-sm-muted ${styles.pageSubtitle}`}>
            {collection.description} · {collection.items.length} apps
          </p>
        </div>
      </div>

      <div className={styles.appGrid}>
        {collection.items.map(({ app }) => {
          const isInstalled = installedSlugs.has(app.slug);
          const isBusy = installingSlug === app.slug;
          return (
            <Card key={app.slug} padding="lg" className={styles.appCard}>
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
                  <span className="ui-text-caption">{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
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
    </div>
    </RouteGuard>
  );
}
