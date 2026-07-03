const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

/**
 * Fetch helper for the PUBLIC/unauthenticated `/store/:tenantSlug/*` storefront
 * routes. Deliberately does NOT attach the dashboard's Bearer token or CSRF
 * header — these endpoints serve anonymous external customers with no UniERP
 * account (see apps/api/src/modules/ecommerce/ecommerce-public.controller.ts
 * header comment for the backend-side rationale). Do not import `@/lib/api`
 * here; that helper is for the authenticated `/ecommerce/*` admin pages only.
 */
export class StorefrontApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'StorefrontApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // response wasn't JSON
    }
    throw new StorefrontApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function storefrontGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function storefrontPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function storefrontPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function storefrontDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// ─── Shared response shapes (see backend contract in ecommerce.dto.ts / services) ───

export interface StorefrontPublicConfig {
  storeName: string;
  storeSlug: string;
  currency: string;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface StorefrontPublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface StorefrontPublicProduct {
  listingId: string;
  productId: string;
  name: string;
  description: string | null;
  sku: string;
  images: string[];
  categoryId: string | null;
  categoryName: string | null;
  price: number;
}

export interface PaginatedProducts {
  data: StorefrontPublicProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CartItemRow {
  id: string;
  productListingId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartDetail {
  sessionToken: string;
  status: string;
  currency: string;
  items: CartItemRow[];
  subtotal: number;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
