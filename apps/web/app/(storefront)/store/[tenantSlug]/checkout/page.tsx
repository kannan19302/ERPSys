'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Spinner, TextField, FormField, Textarea, Select } from '@unerp/ui';
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  storefrontGet, storefrontPost, StorefrontApiError, formatMoney,
  type StorefrontPublicConfig, type CartDetail, type CheckoutResult,
} from '../../../lib/storefront-api';
import { getStoredSessionToken, clearStoredSessionToken } from '../../../lib/cart-session';

interface CheckoutFormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
}

const EMPTY_FORM: CheckoutFormState = {
  customerName: '', customerEmail: '', customerPhone: '',
  street: '', city: '', state: '', zip: '', country: 'US', notes: '',
};

export default function CheckoutPage() {
  const params = useParams<{ tenantSlug: string }>();
  const router = useRouter();
  const tenantSlug = params.tenantSlug;

  const [config, setConfig] = useState<StorefrontPublicConfig | null>(null);
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CheckoutFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cfg = await storefrontGet<StorefrontPublicConfig>(`/store/${tenantSlug}/config`);
        setConfig(cfg);

        const token = getStoredSessionToken(tenantSlug);
        if (token) {
          try {
            const cartData = await storefrontGet<CartDetail>(`/store/${tenantSlug}/cart/${token}`);
            setCart(cartData);
          } catch {
            setCart(null);
          }
        }
      } catch {
        // config load failure surfaces as an empty page; the storefront home
        // page is the canonical place that shows the "store unavailable" state.
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSlug]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.customerName.trim()) errors.customerName = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) errors.customerEmail = 'A valid email is required';
    if (!form.street.trim()) errors.street = 'Street address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State/province is required';
    if (!form.zip.trim()) errors.zip = 'Postal code is required';
    if (form.country.trim().length !== 2) errors.country = 'Country must be a 2-letter code (e.g. US)';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeclineError(null);
    if (!cart) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const checkoutResult = await storefrontPost<CheckoutResult>(`/store/${tenantSlug}/checkout`, {
        sessionToken: cart.sessionToken,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        shippingAddress: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country.toUpperCase(),
        },
        notes: form.notes || undefined,
      });
      clearStoredSessionToken(tenantSlug);
      setResult(checkoutResult);
    } catch (err) {
      // Do NOT silently swallow a payment decline — surface it clearly with a retry option.
      setDeclineError(err instanceof StorefrontApiError ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-success)' }} />
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)' }}>Order Confirmed</h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Thank you for your order. A confirmation has been recorded for:
            </p>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
              {result.orderNumber}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Total charged: {formatMoney(result.totalAmount, result.currency)}
            </div>
            <Button variant="primary" onClick={() => router.push(`/store/${tenantSlug}`)}>
              Continue shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' }}>
        <Card>
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 var(--space-2)' }}>Your cart is empty</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Add items to your cart before checking out.
            </p>
          </div>
        </Card>
        <Button variant="outline" onClick={() => router.push(`/store/${tenantSlug}`)} leftIcon={<ArrowLeft size={14} />}>
          Back to store
        </Button>
      </div>
    );
  }

  const currency = config?.currency || cart.currency || 'USD';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--space-4) var(--space-6)' }}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}/cart`)} leftIcon={<ArrowLeft size={14} />}>
          Back to cart
        </Button>
      </header>

      <main style={{ padding: 'var(--space-6)', flex: 1, maxWidth: 900, width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '0 0 var(--space-5)' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            <Card>
              <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {declineError && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                    padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                    background: 'var(--color-danger-light)', color: 'var(--color-danger-text)', fontSize: 'var(--text-sm)',
                  }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Payment was not completed.</strong>
                      <div>{declineError} Please review your details and try again.</div>
                    </div>
                  </div>
                )}

                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Contact Information</h3>
                <TextField
                  label="Full Name"
                  required
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  error={formErrors.customerName}
                />
                <TextField
                  label="Email"
                  type="email"
                  required
                  value={form.customerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                  error={formErrors.customerEmail}
                />
                <TextField
                  label="Phone (optional)"
                  value={form.customerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                />

                <h3 style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Shipping Address</h3>
                <TextField
                  label="Street Address"
                  required
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  error={formErrors.street}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <TextField
                    label="City"
                    required
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    error={formErrors.city}
                  />
                  <TextField
                    label="State / Province"
                    required
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    error={formErrors.state}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <TextField
                    label="Postal Code"
                    required
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                    error={formErrors.zip}
                  />
                  <TextField
                    label="Country Code"
                    required
                    maxLength={2}
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
                    error={formErrors.country}
                    hint="ISO 3166-1 alpha-2, e.g. US"
                  />
                </div>
                <FormField label="Order Notes (optional)">
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </FormField>

                <div style={{
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)',
                  padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)',
                }}>
                  Test payment — no real charge will be made.
                </div>

                <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Processing payment...' : `Pay ${formatMoney(cart.subtotal, currency)}`}
                </Button>
              </div>
            </Card>
          </form>

          <Card>
            <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Order Summary</h3>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatMoney(item.lineTotal, currency)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', fontWeight: 'var(--weight-bold)' }}>
                <span>Total</span>
                <span>{formatMoney(cart.subtotal, currency)}</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
