'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner } from '@unerp/ui';
import { ShoppingCart, Store, PackageX } from 'lucide-react';
import {
  storefrontGet, storefrontPost, StorefrontApiError, formatMoney,
  type StorefrontPublicConfig, type StorefrontPublicCategory, type PaginatedProducts, type StorefrontPublicProduct,
} from '../../lib/storefront-api';
import { ensureCart, getStoredSessionToken } from '../../lib/cart-session';

export default function StorefrontHomePage() {
  const params = useParams<{ tenantSlug: string }>();
  const router = useRouter();
  const tenantSlug = params.tenantSlug;

  const [config, setConfig] = useState<StorefrontPublicConfig | null>(null);
  const [categories, setCategories] = useState<StorefrontPublicCategory[]>([]);
  const [products, setProducts] = useState<StorefrontPublicProduct[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeUnavailable, setStoreUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const loadConfigAndCategories = async () => {
    try {
      const [cfg, cats] = await Promise.all([
        storefrontGet<StorefrontPublicConfig>(`/store/${tenantSlug}/config`),
        storefrontGet<StorefrontPublicCategory[]>(`/store/${tenantSlug}/categories`),
      ]);
      setConfig(cfg);
      setCategories(cats);
      return true;
    } catch (err) {
      if (err instanceof StorefrontApiError && err.statusCode === 404) {
        setStoreUnavailable(true);
      } else {
        setError(err instanceof StorefrontApiError ? err.message : 'Failed to load storefront.');
      }
      return false;
    }
  };

  const loadProducts = async (categoryId: string | null) => {
    try {
      const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
      const page = await storefrontGet<PaginatedProducts>(`/store/${tenantSlug}/products${qs}`);
      setProducts(page.data);
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to load products.');
    }
  };

  const refreshCartCount = async () => {
    const token = getStoredSessionToken(tenantSlug);
    if (!token) { setCartCount(0); return; }
    try {
      const cart = await storefrontGet<{ items: { quantity: number }[] }>(`/store/${tenantSlug}/cart/${token}`);
      setCartCount(cart.items.reduce((sum, i) => sum + i.quantity, 0));
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const ok = await loadConfigAndCategories();
      if (ok) {
        await loadProducts(null);
        await refreshCartCount();
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  const handleCategoryClick = async (categoryId: string | null) => {
    setActiveCategoryId(categoryId);
    setLoading(true);
    await loadProducts(categoryId);
    setLoading(false);
  };

  const handleAddToCart = async (listing: StorefrontPublicProduct) => {
    setAddingId(listing.listingId);
    try {
      const cart = await ensureCart(tenantSlug, config?.currency);
      await storefrontPost(`/store/${tenantSlug}/cart/${cart.sessionToken}/items`, {
        productListingId: listing.listingId,
        quantity: 1,
      });
      await refreshCartCount();
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to add item to cart.');
    } finally {
      setAddingId(null);
    }
  };

  if (loading && !config && !storeUnavailable) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (storeUnavailable) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 420 }}>
            <PackageX size={40} style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }} />
            <h2 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)' }}>This store is not available</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              This storefront either doesn&apos;t exist or has not been enabled by its owner yet.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const brandColor = config?.primaryColor || 'var(--color-primary)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-6)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {config?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt={config.storeName} style={{ height: 32, width: 32, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Store size={16} />
            </div>
          )}
          <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)' }}>{config?.storeName}</span>
        </div>
        <Button variant="outline" onClick={() => router.push(`/store/${tenantSlug}/cart`)} leftIcon={<ShoppingCart size={16} />}>
          Cart{cartCount > 0 ? ` (${cartCount})` : ''}
        </Button>
      </header>

      <main style={{ padding: 'var(--space-6)', flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {error && (
          <Card>
            <div style={{ padding: 'var(--space-4)', color: 'var(--color-danger-text)', marginBottom: 'var(--space-4)' }}>{error}</div>
          </Card>
        )}

        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
            <Button
              variant={activeCategoryId === null ? 'primary' : 'outline'}
              onClick={() => handleCategoryClick(null)}
            >
              All Products
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategoryId === cat.id ? 'primary' : 'outline'}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No products are available in this category yet.
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-5)' }}>
            {products.map((product) => (
              <Card key={product.listingId} padding="none">
                <div
                  role="link"
                  onClick={() => router.push(`/store/${tenantSlug}/products/${product.listingId}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    height: 160, background: 'var(--color-bg-sunken)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)',
                  }}>
                    {Array.isArray(product.images) && product.images.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }} />
                    ) : (
                      <Store size={32} />
                    )}
                  </div>
                  <div style={{ padding: 'var(--space-4)' }}>
                    {product.categoryName && <Badge variant="info">{product.categoryName}</Badge>}
                    <h3 style={{ margin: 'var(--space-2) 0 var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
                      {product.name}
                    </h3>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: brandColor }}>
                      {formatMoney(product.price, config?.currency || 'USD')}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
                  <Button
                    variant="primary"
                    style={{ width: '100%' }}
                    disabled={addingId === product.listingId}
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    leftIcon={<ShoppingCart size={14} />}
                  >
                    {addingId === product.listingId ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
