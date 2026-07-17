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
      <div className={styles.s1}>
        <Loader2 size={32} className={styles.s2} />
      </div>
    );
  }

  return (
    <RouteGuard permission="apps.store.collections.read">
    <div className="ui-stack-6 ui-animate-in">
      <div className="ui-hstack-3">
        <Link href="/apps/store" className={styles.s3}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className={styles.s4}>
            <Sparkles className="ui-text-primary" /> Collections
          </h1>
          <p className={styles.s5}>
            Curated app bundles hand-picked for specific use cases
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="ui-empty-state">
          <Sparkles size={48} className={styles.s6} />
          <p className={styles.s7}>No collections yet</p>
          <p className="text-sm">Collections will appear here once created by admins.</p>
        </div>
      ) : (
        <div className={styles.s8}>
          {collections.map(col => (
            <Link key={col.slug} href={`/apps/store/collections/${col.slug}`} className={styles.s9}>
              <Card padding="lg" className={`${styles.s10} ${styles.collectionCard}`}>
                <div className={styles.s11}>
                  <span className={styles.s12}>{col.icon || '📦'}</span>
                  <div>
                    <h3 className={styles.s13}>{col.name}</h3>
                    <span className={styles.s14}>{col.items.length} apps</span>
                  </div>
                  {col.featured && <span className={styles.s15}>Featured</span>}
                </div>
                <p className={styles.s16}>
                  {col.description}
                </p>
                <div className="ui-hstack-2">
                  <div className={styles.s17}>
                    {col.items.slice(0, 4).map((item, i) => (
                      <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }} className={styles.s18}>
                        {item.app.icon || '📦'}
                      </div>
                    ))}
                    {col.items.length > 4 && (
                      <div className={styles.s19}>
                        +{col.items.length - 4}
                      </div>
                    )}
                  </div>
                  <span className={styles.s20}>
                    View <ChevronRight size={14} />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
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
