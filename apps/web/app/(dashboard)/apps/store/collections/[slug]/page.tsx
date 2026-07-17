'use client';
import styles from './page.module.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, Badge } from '@unerp/ui';
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
    return <div className={styles.s1}><Loader2 size={32} className={styles.s2} /></div>;
  }

  if (!collection) {
    return <div className="text-center p-12"><h3>Collection not found</h3><Link href="/apps/store/collections" className="ui-text-primary">Back to Collections</Link></div>;
  }

  return (
    <RouteGuard permission="apps.store.collections.read">
    <div className="ui-stack-6 ui-animate-in">
      {toast && <div style={{ background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} className={styles.s3}>{toast.message}</div>}

      <div className={styles.s4}>
        <Link href="/apps/store" className={styles.s5}>App Store</Link>
        <span>/</span>
        <Link href="/apps/store/collections" className={styles.s5}>Collections</Link>
        <span>/</span>
        <span className={styles.s6}>{collection.name}</span>
      </div>

      <div className="ui-hstack-4">
        <span className={styles.s7}>{collection.icon || '📦'}</span>
        <div>
          <h1 className={styles.s8}>{collection.name}</h1>
          <p className={styles.s9}>
            {collection.description} · {collection.items.length} apps
          </p>
        </div>
      </div>

      <div className={styles.s10}>
        {collection.items.map(({ app }) => {
          const isInstalled = installedSlugs.has(app.slug);
          const isBusy = installingSlug === app.slug;
          return (
            <Card key={app.slug} padding="lg" className={`${styles.s11} ${styles.appCard}`}>
              <Link href={`/apps/store/${app.slug}`} className={styles.s12}>
                <div className="ui-hstack-3">
                  <div className={styles.s13}>{app.icon || '📦'}</div>
                  <div>
                    <div className="ui-flex ui-items-center ui-gap-1">
                      <span className="ui-heading-sm">{app.name}</span>
                      {app.verified && <Shield size={12} className="ui-text-success" />}
                    </div>
                    <div className="ui-text-caption ui-text-tertiary">{app.publisher} · v{app.version}</div>
                  </div>
                </div>
                <p className={styles.s14}>{app.description}</p>
                <div className="ui-hstack-2">
                  <div className={styles.s15}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} style={{ color: s <= Math.floor(Number(app.rating)) ? 'var(--color-primary)' : 'var(--color-border)' }} fill={s <= Math.floor(Number(app.rating)) ? 'var(--color-primary)' : 'none'} />)}
                  </div>
                  <span className="ui-text-caption">{Number(app.rating).toFixed(1)} ({app.reviewCount})</span>
                  <span className={styles.s16}>
                    <Badge variant={app.pricing === 'FREE' ? 'success' : 'warning'}>
                      {app.pricing === 'FREE' ? 'Free' : `$${app.price}/mo`}
                    </Badge>
                  </span>
                </div>
              </Link>
              <div>
                {isInstalled ? (
                  <div className={styles.s17}>Installed</div>
                ) : (
                  <button onClick={() => handleInstall(app.slug)} disabled={isBusy} style={{ cursor: isBusy ? 'wait' : 'pointer' }} className={styles.s18}>
                    <Download size={13} /> {isBusy ? 'Installing...' : 'Install'}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
    </RouteGuard>
  );
}
