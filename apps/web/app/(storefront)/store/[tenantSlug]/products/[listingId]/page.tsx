'use client';
import styles from './page.module.css';
import Image from 'next/image';
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
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className={styles.s2}>
        <Card>
          <div className={styles.s3}>
            <h2 className={styles.s4}>Product not found</h2>
            <p className={styles.s5}>
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
    <div className={styles.s6}>
      <header className={styles.s7}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to {config?.storeName || 'store'}
        </Button>
      </header>

      <main className={styles.s8}>
        {error && (
          <Card>
            <div className={styles.s9}>{error}</div>
          </Card>
        )}
        <div className={styles.s10}>
          <div className={styles.s11}>
            {Array.isArray(product.images) && product.images.length > 0 ? (
              <Image src={product.images[0] ?? ''} alt={product.name} fill unoptimized sizes="(max-width: 768px) 100vw, 450px" className={styles.s12} />
            ) : (
              <Store size={64} />
            )}
          </div>

          <div className={styles.s13}>
            {product.categoryName && <Badge variant="info">{product.categoryName}</Badge>}
            <h1 className={styles.s14}>{product.name}</h1>
            <div style={{ color: brandColor }} className={styles.s15}>
              {formatMoney(product.price, config?.currency || 'USD')}
            </div>
            {product.description && (
              <p className={styles.s16}>
                {product.description}
              </p>
            )}
            <div className={styles.s17}>SKU: {product.sku}</div>

            <div className={styles.s18}>
              <div className={styles.s19}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className={styles.s20}
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className={styles.s21}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className={styles.s20}
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
              <div className={styles.s22}>
                Added to cart. <a href={`/store/${tenantSlug}/cart`} style={{ color: brandColor }}>View cart</a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
