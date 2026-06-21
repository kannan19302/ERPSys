'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@unerp/ui';
import { ArrowLeft, Sparkles, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = '/api/v1/admin/marketplace';

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
  const [collections, setCollections] = useState<AppCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/collections`, { headers: authHeaders() });
        if (res.ok) setCollections(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Link href="/apps/store" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles style={{ color: 'var(--color-primary)' }} /> Collections
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Curated app bundles hand-picked for specific use cases
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
          <Sparkles size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }} />
          <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>No collections yet</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>Collections will appear here once created by admins.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {collections.map(col => (
            <Link key={col.slug} href={`/apps/store/collections/${col.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card padding="lg" style={{ border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 36 }}>{col.icon || '📦'}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-bold)' }}>{col.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{col.items.length} apps</span>
                  </div>
                  {col.featured && <span style={{ fontSize: '10px', background: '#f59e0b20', color: '#f59e0b', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)', marginLeft: 'auto' }}>Featured</span>}
                </div>
                <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>
                  {col.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex' }}>
                    {col.items.slice(0, 4).map((item, i) => (
                      <div key={i} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', border: '2px solid var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                        {item.app.icon || '📦'}
                      </div>
                    ))}
                    {col.items.length > 4 && (
                      <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-sunken)', border: '2px solid var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: -8, color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>
                        +{col.items.length - 4}
                      </div>
                    )}
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 2 }}>
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
  );
}
