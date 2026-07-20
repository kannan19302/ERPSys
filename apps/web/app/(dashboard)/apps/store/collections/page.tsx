'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@unerp/ui';
import { ArrowLeft, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface AppCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  items: { app: { slug: string; name: string; icon: string | null; rating: number } }[];
}

export default function CollectionsPage() {
  const client = useApiClient();
  const [collections, setCollections] = useState<AppCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setCollections(await client.get<AppCollection[]>('/admin/marketplace/collections'));
      } catch {}
      setLoading(false);
    })();
  }, [client]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className="animate-spin ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="apps.store.collections.read">
    <div className="ui-stack-5 ui-animate-in">
      <div className="ui-hstack-3">
        <Link href="/apps/store" className="ui-text-muted">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="ui-heading-lg ui-flex ui-items-center ui-gap-2">
            <Sparkles className="ui-text-primary" /> Collections
          </h1>
          <p className="ui-text-sm-muted">
            Curated app bundles hand-picked for specific use cases
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="ui-empty-state">
          <Sparkles size={48} className="ui-empty-state-icon" />
          <h3 className="ui-empty-state-title">No collections yet</h3>
          <p className="ui-empty-state-text">Collections will appear here once created by admins.</p>
        </div>
      ) : (
        <div className={styles.colGrid}>
          {collections.map(col => (
            <Link key={col.slug} href={`/apps/store/collections/${col.slug}`} className={styles.collectionCardLink}>
              <Card padding="lg" className={styles.collectionCard}>
                <div className={styles.colHeader}>
                  <span className={styles.colIcon}>{col.icon || '📦'}</span>
                  <div>
                    <h3 className={styles.colName}>{col.name}</h3>
                    <span className={styles.colCount}>{col.items.length} apps</span>
                  </div>
                  {col.featured && <span className={styles.featuredBadge}>Featured</span>}
                </div>
                <p className={styles.colDesc}>
                  {col.description}
                </p>
                <div className="ui-hstack-2">
                  <div className={styles.avatarStack}>
                    {col.items.slice(0, 4).map((item, i) => (
                      <div key={i} className={styles.appAvatar}>
                        {item.app.icon || '📦'}
                      </div>
                    ))}
                    {col.items.length > 4 && (
                      <div className={styles.appAvatarOverflow}>
                        +{col.items.length - 4}
                      </div>
                    )}
                  </div>
                  <span className={styles.viewLink}>
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
    </RouteGuard>
  );
}
