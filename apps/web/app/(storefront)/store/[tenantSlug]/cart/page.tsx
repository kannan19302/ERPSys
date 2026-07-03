'use client';

import React, { useEffect, useState } from 'react';
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

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const currency = config?.currency || 'USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) var(--space-6)' }}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to {config?.storeName || 'store'}
        </Button>
      </header>

      <main style={{ padding: 'var(--space-6)', flex: 1, maxWidth: 700, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--space-5)' }}>Your Cart</h1>

        {error && (
          <Card>
            <div style={{ padding: 'var(--space-4)', color: 'var(--color-danger-text)', marginBottom: 'var(--space-4)' }}>{error}</div>
          </Card>
        )}

        {!cart || cart.items.length === 0 ? (
          <Card>
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
              <ShoppingCart size={40} style={{ color: 'var(--color-text-tertiary)' }} />
              <div>
                <h2 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-base)' }}>Your cart is empty</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
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
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      borderBottom: idx < cart.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--weight-medium)' }}>{item.productName}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>{item.sku}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        {formatMoney(item.unitPrice, currency)} each
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updatingItemId === item.id || item.quantity <= 1}
                        style={{ padding: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ padding: '0 var(--space-2)', minWidth: 24, textAlign: 'center', fontSize: 'var(--text-sm)' }}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updatingItemId === item.id}
                        style={{ padding: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>
                      {formatMoney(item.lineTotal, currency)}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingItemId === item.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 'var(--space-2)' }}
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>
                  <span>Subtotal</span>
                  <span>{formatMoney(cart.subtotal, currency)}</span>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => router.push(`/store/${tenantSlug}/checkout`)}>
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
