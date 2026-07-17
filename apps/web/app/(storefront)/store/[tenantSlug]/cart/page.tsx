'use client';
import styles from './page.module.css';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Spinner } from '@unerp/ui';
import { ArrowLeft, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import {
  storefrontGet, storefrontPatch, storefrontDelete, StorefrontApiError, formatMoney,
  type StorefrontPublicConfig, type CartDetail,
} from '../../../lib/storefront-api';
import { getStoredSessionToken } from '../../../lib/cart-session';

export default function CartPage() {
  const params = useParams<{ tenantSlug: string }>();
  const router = useRouter();
  const tenantSlug = params.tenantSlug;

  const [config, setConfig] = useState<StorefrontPublicConfig | null>(null);
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = await storefrontGet<StorefrontPublicConfig>(`/store/${tenantSlug}/config`);
      setConfig(cfg);

      const token = getStoredSessionToken(tenantSlug);
      if (!token) {
        setCart(null);
        return;
      }
      const cartData = await storefrontGet<CartDetail>(`/store/${tenantSlug}/cart/${token}`);
      setCart(cartData);
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart || quantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      await storefrontPatch(`/store/${tenantSlug}/cart/${cart.sessionToken}/items/${itemId}`, { quantity });
      await load();
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to update item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart) return;
    setUpdatingItemId(itemId);
    try {
      await storefrontDelete(`/store/${tenantSlug}/cart/${cart.sessionToken}/items/${itemId}`);
      await load();
    } catch (err) {
      setError(err instanceof StorefrontApiError ? err.message : 'Failed to remove item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  const currency = config?.currency || 'USD';

  return (
    <div className={styles.s2}>
      <header className={styles.s3}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to {config?.storeName || 'store'}
        </Button>
      </header>

      <main className={styles.s4}>
        <h1 className={styles.s5}>Your Cart</h1>

        {error && (
          <Card>
            <div className={styles.s6}>{error}</div>
          </Card>
        )}

        {!cart || cart.items.length === 0 ? (
          <Card>
            <div className={styles.s7}>
              <ShoppingCart size={40} className={styles.s8} />
              <div>
                <h2 className={styles.s9}>Your cart is empty</h2>
                <p className={styles.s10}>
                  Browse the catalog and add items to get started.
                </p>
              </div>
              <Button variant="primary" onClick={() => router.push(`/store/${tenantSlug}`)}>
                Continue shopping
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card padding="none">
              <div>
                {cart.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{ borderBottom: idx < cart.items.length - 1 ? '1px solid var(--color-border)' : 'none' }} className={styles.s11}
                  >
                    <div className={styles.s12}>
                      <div className={styles.s13}>{item.productName}</div>
                      <div className={styles.s14}>{item.sku}</div>
                      <div className={styles.s15}>
                        {formatMoney(item.unitPrice, currency)} each
                      </div>
                    </div>
                    <div className={styles.s16}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updatingItemId === item.id || item.quantity <= 1}
                        className={styles.s17}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className={styles.s18}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updatingItemId === item.id}
                        className={styles.s17}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div className={styles.s19}>
                      {formatMoney(item.lineTotal, currency)}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingItemId === item.id}
                      className={styles.s20}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className={styles.s21}>
                <div className={styles.s22}>
                  <span>Subtotal</span>
                  <span>{formatMoney(cart.subtotal, currency)}</span>
                </div>
                <Button variant="primary" className={styles.s23} onClick={() => router.push(`/store/${tenantSlug}/checkout`)}>
                  Checkout
                </Button>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
