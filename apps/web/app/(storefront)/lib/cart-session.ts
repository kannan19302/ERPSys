'use client';

import { storefrontGet, storefrontPost, StorefrontApiError, type CartDetail } from './storefront-api';

/**
 * Cart/session persistence — implements the design from
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md: cart identity is the `sessionToken`
 * string returned by `POST /store/:tenantSlug/cart`, persisted per-tenant in
 * localStorage under `storefront_cart_{tenantSlug}`.
 */
function storageKey(tenantSlug: string): string {
  return `storefront_cart_${tenantSlug}`;
}

export function getStoredSessionToken(tenantSlug: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey(tenantSlug));
}

export function setStoredSessionToken(tenantSlug: string, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(tenantSlug), token);
}

export function clearStoredSessionToken(tenantSlug: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(tenantSlug));
}

/**
 * Resolves a valid cart for this tenant: reuses the stored sessionToken if it
 * still resolves (GET succeeds), otherwise transparently creates a fresh cart
 * (covers both "no cart yet" and "stored token 404s / expired" cases).
 */
export async function ensureCart(tenantSlug: string, currency?: string): Promise<CartDetail> {
  const existingToken = getStoredSessionToken(tenantSlug);
  if (existingToken) {
    try {
      const cart = await storefrontGet<CartDetail>(`/store/${tenantSlug}/cart/${existingToken}`);
      return cart;
    } catch (err) {
      if (err instanceof StorefrontApiError && err.statusCode === 404) {
        clearStoredSessionToken(tenantSlug);
      } else {
        throw err;
      }
    }
  }

  const created = await storefrontPost<{ sessionToken: string }>(`/store/${tenantSlug}/cart`, currency ? { currency } : undefined);
  setStoredSessionToken(tenantSlug, created.sessionToken);
  const cart = await storefrontGet<CartDetail>(`/store/${tenantSlug}/cart/${created.sessionToken}`);
  return cart;
}

export async function getCartQuietly(tenantSlug: string): Promise<CartDetail | null> {
  const token = getStoredSessionToken(tenantSlug);
  if (!token) return null;
  try {
    return await storefrontGet<CartDetail>(`/store/${tenantSlug}/cart/${token}`);
  } catch (err) {
    if (err instanceof StorefrontApiError && err.statusCode === 404) {
      clearStoredSessionToken(tenantSlug);
      return null;
    }
    throw err;
  }
}
