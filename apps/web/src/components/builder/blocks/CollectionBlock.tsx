'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from './cart';

/**
 * A CMS-bound block that renders published items from a Web Studio collection
 * (products, projects, team, testimonials…). Self-fetching so it works in both
 * the builder canvas (authenticated, current tenant) and on the live public
 * site (unauthenticated public API). Pass `items`/`collection` to skip fetching.
 */
export interface CollectionBlockProps {
  collectionSlug?: string;
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list';
  columns?: number;
  limit?: number;
  featuredOnly?: boolean;
  tenantSlug?: string;
  // Pre-resolved (optional)
  items?: any[];
  collection?: any;
}

interface FieldMeta { name: string; label: string; type: string }

function resolveMeta(collection: any) {
  const settings = collection?.settings || {};
  const fields: FieldMeta[] = Array.isArray(collection?.fields) ? collection.fields : [];
  const titleField = settings.titleField
    || fields.find((f) => /name|title|author/i.test(f.name))?.name
    || 'title';
  const imageField = settings.imageField
    || fields.find((f) => f.type === 'Image' || f.type === 'Gallery')?.name;
  const priceField = fields.find((f) => f.type === 'Price')?.name;
  const subField = fields.find((f) => /role|company|category|client|excerpt|summary|shortDescription|quote/i.test(f.name) && f.name !== titleField)?.name;
  return { titleField, imageField, priceField, subField, fields };
}

function firstImage(val: any): string | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val[0];
  return typeof val === 'string' ? val : undefined;
}

export function CollectionBlock(props: CollectionBlockProps) {
  const { collectionSlug, title, subtitle, layout = 'grid', columns = 3, limit = 9, featuredOnly } = props;
  const cart = useCart();
  const [collection, setCollection] = useState<any>(props.collection || null);
  const [items, setItems] = useState<any[]>(props.items || []);
  const [loading, setLoading] = useState(!props.items);
  const [error, setError] = useState('');

  useEffect(() => {
    if (props.items) { setItems(props.items); setCollection(props.collection); setLoading(false); return; }
    if (!collectionSlug) { setLoading(false); return; }
    let active = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        if (token) {
          // Builder / dashboard context — authenticated, current tenant.
          const listRes = await fetch('/api/v1/builder/web-collections', { headers: { Authorization: `Bearer ${token}` } });
          const cols = listRes.ok ? await listRes.json() : [];
          const col = (cols as any[]).find((c) => c.slug === collectionSlug);
          if (!col) throw new Error('Collection not found');
          const itemsRes = await fetch(`/api/v1/builder/web-collections/${col.id}/items?status=PUBLISHED&pageSize=100`, { headers: { Authorization: `Bearer ${token}` } });
          const d = itemsRes.ok ? await itemsRes.json() : { data: [] };
          if (active) { setCollection(col); setItems(d.data || []); }
        } else {
          // Public live site.
          const q = props.tenantSlug ? `?tenant=${encodeURIComponent(props.tenantSlug)}` : '';
          const res = await fetch(`/api/v1/public/web/collections/${collectionSlug}${q}`);
          if (!res.ok) throw new Error('Collection not found');
          const d = await res.json();
          if (active) { setCollection(d.collection); setItems(d.items || []); }
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [collectionSlug, props.items, props.tenantSlug]);

  const meta = resolveMeta(collection);
  let shown = featuredOnly ? items.filter((i) => i.featured) : items;
  shown = shown.slice(0, limit);

  return (
    <section style={{ padding: '72px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {(title || subtitle) && (
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {title && <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: 12 }}>{title}</h2>}
            {subtitle && <p style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: 640, margin: '0 auto' }}>{subtitle}</p>}
          </div>
        )}

        {!collectionSlug ? (
          <div style={{ textAlign: 'center', padding: 60, border: '2px dashed rgba(128,128,128,0.35)', borderRadius: 12, opacity: 0.7 }}>
            <strong>Collection block</strong><br />Bind a collection in the inspector to display content.
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>Loading {collectionSlug}…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>Could not load “{collectionSlug}”.</div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>No published items in “{collectionSlug}” yet.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: layout === 'list' ? '1fr' : `repeat(auto-fit, minmax(${Math.max(220, Math.floor(1100 / columns))}px, 1fr))`,
            gap: 28,
          }}>
            {shown.map((item) => {
              const data = item.data || {};
              const img = meta.imageField ? firstImage(data[meta.imageField]) : undefined;
              const itemTitle = data[meta.titleField] || item.slug;
              const sub = meta.subField ? data[meta.subField] : undefined;
              const price = meta.priceField ? data[meta.priceField] : undefined;
              const isTestimonial = collection?.kind === 'TESTIMONIAL';
              return (
                <article key={item.id} style={{
                  border: '1px solid rgba(128,128,128,0.18)', borderRadius: 14, overflow: 'hidden',
                  background: 'var(--color-bg-elevated, #fff)', display: 'flex',
                  flexDirection: layout === 'list' ? 'row' : 'column',
                }}>
                  {img && (
                    <div style={{ width: layout === 'list' ? 200 : '100%', height: layout === 'list' ? 'auto' : 190, flexShrink: 0, background: `#f1f5f9 center/cover url(${img})` }} />
                  )}
                  <div style={{ padding: 20, flex: 1 }}>
                    {isTestimonial ? (
                      <>
                        <p style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 14 }}>&ldquo;{data.quote}&rdquo;</p>
                        <strong>{itemTitle}</strong>
                        {sub && <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{sub}</div>}
                        {data.rating ? <div style={{ color: '#f59e0b', marginTop: 6 }}>{'★'.repeat(Math.min(5, Number(data.rating) || 0))}</div> : null}
                      </>
                    ) : (
                      <>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>{itemTitle}</h3>
                        {sub && <div style={{ fontSize: '0.9rem', opacity: 0.65, marginBottom: 10 }}>{sub}</div>}
                        {price != null && price !== '' && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>${price}</span>
                            {data.compareAtPrice ? <span style={{ textDecoration: 'line-through', opacity: 0.45 }}>${data.compareAtPrice}</span> : null}
                          </div>
                        )}
                        {item.featured && <span style={{ display: 'inline-block', marginTop: 10, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#b45309' }}>★ Featured</span>}
                        {collection?.kind === 'PRODUCT' && price != null && price !== '' && (
                          <button
                            type="button"
                            onClick={() => cart.add({ productSlug: item.slug, name: String(itemTitle), price: Number(price) || 0, image: img, qty: 1 })}
                            style={{ marginTop: 14, width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'var(--color-primary,#4f46e5)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Add to Cart
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
