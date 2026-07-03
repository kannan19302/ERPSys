'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner } from '@unerp/ui';
import { ArrowLeft, ShoppingCart, Store, Minus, Plus } from 'lucide-react';
import {
  storefrontGet, storefrontPost, StorefrontApiError, formatMoney,
  type StorefrontPublicProduct, type StorefrontPublicConfig,
} from '../../../../lib/storefront-api';
import { ensureCart } from '../../../../lib/cart-session';

export default function ProductDetailPage() {
  const params = useParams<{ tenantSlug: string; listingId: string }>();
  const router = useRouter();
  const { tenantSlug, listingId } = params;

  const [config, setConfig] = useState<StorefrontPublicConfig | null>(null);
  const [product, setProduct] = useState<StorefrontPublicProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cfg, item] = await Promise.all([
          storefrontGet<StorefrontPublicConfig>(`/store/${tenantSlug}/config`),
          storefrontGet<StorefrontPublicProduct>(`/store/${tenantSlug}/products/${listingId}`),
        ]);
        setConfig(cfg);
        setProduct(item);
      } catch (err) {
        if (err instanceof StorefrontApiError && err.statusCode === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof StorefrontApiError ? err.message : 'Failed to load product.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSlug, listingId]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    setAdded(false);
    try {
      const cart = await ensureCart(tenantSlug, config?.currency);
      await storefrontPost(`/store/${tenantSlug}/cart/${cart.sessionToken}/items`, {
        productListingId: product.listingId,
        quantity,
      });
      setAdded(true);
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' }}>
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 var(--space-2)' }}>Product not found</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              This product may have been unpublished or no longer exists.
            </p>
          </div>
        </Card>
        <Button variant="outline" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to store
        </Button>
      </div>
    );
  }

  const brandColor = config?.primaryColor || 'var(--color-primary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) var(--space-6)' }}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to {config?.storeName || 'store'}
        </Button>
      </header>

      <main style={{ padding: 'var(--space-6)', flex: 1, maxWidth: 900, width: '100%', margin: '0 auto' }}>
        {error && (
          <Card>
            <div style={{ padding: 'var(--space-4)', color: 'var(--color-danger-text)', marginBottom: 'var(--space-4)' }}>{error}</div>
          </Card>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <div style={{
            aspectRatio: '1', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', overflow: 'hidden',
          }}>
            {Array.isArray(product.images) && product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Store size={64} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {product.categoryName && <Badge variant="info">{product.categoryName}</Badge>}
            <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{product.name}</h1>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: brandColor }}>
              {formatMoney(product.price, config?.currency || 'USD')}
            </div>
            {product.description && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                {product.description}
              </p>
            )}
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>SKU: {product.sku}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: 'var(--space-2) var(--space-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span style={{ padding: '0 var(--space-3)', minWidth: 32, textAlign: 'center', fontSize: 'var(--text-sm)' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ padding: 'var(--space-2) var(--space-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <Button variant="primary" onClick={handleAddToCart} disabled={adding} leftIcon={<ShoppingCart size={14} />}>
                {adding ? 'Adding...' : 'Add to Cart'}
              </Button>
            </div>

            {added && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-success-text)' }}>
                Added to cart. <a href={`/store/${tenantSlug}/cart`} style={{ color: brandColor }}>View cart</a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
