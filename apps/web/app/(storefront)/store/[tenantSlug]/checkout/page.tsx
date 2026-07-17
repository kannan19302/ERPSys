'use client';
import styles from './page.module.css';
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
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (result) {
    return (
      <div className={styles.s2}>
        <Card>
          <div className={styles.s3}>
            <CheckCircle2 size={48} className={styles.s4} />
            <h1 className={styles.s5}>Order Confirmed</h1>
            <p className={styles.s6}>
              Thank you for your order. A confirmation has been recorded for:
            </p>
            <div className={styles.s7}>
              {result.orderNumber}
            </div>
            <div className={styles.s8}>
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
      <div className={styles.s9}>
        <Card>
          <div className={styles.s10}>
            <h2 className={styles.s11}>Your cart is empty</h2>
            <p className={styles.s8}>
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
    <div className={styles.s12}>
      <header className={styles.s13}>
        <Button variant="ghost" onClick={() => router.push(`/store/${tenantSlug}/cart`)} leftIcon={<ArrowLeft size={14} />}>
          Back to cart
        </Button>
      </header>

      <main className={styles.s14}>
        <h1 className={styles.s15}>Checkout</h1>

        <div className={styles.s16}>
          <form onSubmit={handleSubmit}>
            <Card>
              <div className={styles.s17}>
                {declineError && (
                  <div className={styles.s18}>
                    <AlertTriangle size={16} className={styles.s19} />
                    <div>
                      <strong>Payment was not completed.</strong>
                      <div>{declineError} Please review your details and try again.</div>
                    </div>
                  </div>
                )}

                <h3 className={styles.s20}>Contact Information</h3>
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

                <h3 className={styles.s21}>Shipping Address</h3>
                <TextField
                  label="Street Address"
                  required
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                  error={formErrors.street}
                />
                <div className={styles.s22}>
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
                <div className={styles.s22}>
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

                <div className={styles.s23}>
                  Test payment — no real charge will be made.
                </div>

                <Button type="submit" variant="primary" disabled={submitting} className={styles.s24}>
                  {submitting ? 'Processing payment...' : `Pay ${formatMoney(cart.subtotal, currency)}`}
                </Button>
              </div>
            </Card>
          </form>

          <Card>
            <div className={styles.s25}>
              <h3 className={styles.s20}>Order Summary</h3>
              {cart.items.map((item) => (
                <div key={item.id} className={styles.s26}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatMoney(item.lineTotal, currency)}</span>
                </div>
              ))}
              <div className={styles.s27}>
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
