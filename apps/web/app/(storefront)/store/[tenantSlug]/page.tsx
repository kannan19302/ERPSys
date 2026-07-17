'use client';
import styles from './page.module.css';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
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

  const loadConfigAndCategories = useCallback(async () => {
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
  }, [tenantSlug]);

  const loadProducts = useCallback(async (categoryId: string | null) => {
    try {
      const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
      const page = await storefrontGet<PaginatedProducts>(`/store/${tenantSlug}/products${qs}`);
      setProducts(page.data);
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to load products.');
    }
  }, [tenantSlug]);

  const refreshCartCount = useCallback(async () => {
    const token = getStoredSessionToken(tenantSlug);
    if (!token) { setCartCount(0); return; }
    try {
      const cart = await storefrontGet<{ items: { quantity: number }[] }>(`/store/${tenantSlug}/cart/${token}`);
      setCartCount(cart.items.reduce((sum, i) => sum + i.quantity, 0));
    } catch {
      setCartCount(0);
    }
  }, [tenantSlug]);

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
  }, [loadConfigAndCategories, loadProducts, refreshCartCount]);

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
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (storeUnavailable) {
    return (
      <div className={styles.s2}>
        <Card>
          <div className={styles.s3}>
            <PackageX size={40} className={styles.s4} />
            <h2 className={styles.s5}>This store is not available</h2>
            <p className={styles.s6}>
              This storefront either doesn&apos;t exist or has not been enabled by its owner yet.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const brandColor = config?.primaryColor || 'var(--color-primary)';

  return (
    <div className={styles.s7}>
      <header
        className={styles.s8}
      >
        <div className={styles.s9}>
          {config?.logoUrl ? (
            <Image src={config.logoUrl} alt={config.storeName} width={32} height={32} unoptimized className={styles.s10} />
          ) : (
            <div style={{ background: brandColor }} className={styles.s11}>
              <Store size={16} />
            </div>
          )}
          <span className={styles.s12}>{config?.storeName}</span>
        </div>
        <Button variant="outline" onClick={() => router.push(`/store/${tenantSlug}/cart`)} leftIcon={<ShoppingCart size={16} />}>
          Cart{cartCount > 0 ? ` (${cartCount})` : ''}
        </Button>
      </header>

      <main className={styles.s13}>
        {error && (
          <Card>
            <div className={styles.s14}>{error}</div>
          </Card>
        )}

        {categories.length > 0 && (
          <div className={styles.s15}>
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
          <div className={styles.s16}>
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <div className={styles.s17}>
              No products are available in this category yet.
            </div>
          </Card>
        ) : (
          <div className={styles.s18}>
            {products.map((product) => (
              <Card key={product.listingId} padding="none">
                <div
                  role="link"
                  onClick={() => router.push(`/store/${tenantSlug}/products/${product.listingId}`)}
                  className={styles.s19}
                >
                  <div className={styles.s20}>
                    {Array.isArray(product.images) && product.images.length > 0 ? (
                      <Image src={product.images[0] ?? ''} alt={product.name} fill unoptimized sizes="(max-width: 768px) 100vw, 240px" className={styles.s21} />
                    ) : (
                      <Store size={32} />
                    )}
                  </div>
                  <div className={styles.s22}>
                    {product.categoryName && <Badge variant="info">{product.categoryName}</Badge>}
                    <h3 className={styles.s23}>
                      {product.name}
                    </h3>
                    <div style={{ color: brandColor }} className={styles.s24}>
                      {formatMoney(product.price, config?.currency || 'USD')}
                    </div>
                  </div>
                </div>
                <div className={styles.s25}>
                  <Button
                    variant="primary"
                    className={styles.s26}
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
