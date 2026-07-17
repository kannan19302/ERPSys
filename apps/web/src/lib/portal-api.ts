const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const PORTAL_TOKEN_KEY = 'portal_token';

export class PortalApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'PortalApiError';
  }
}

export function getPortalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PORTAL_TOKEN_KEY);
}

export function setPortalToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
}

export function clearPortalToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PORTAL_TOKEN_KEY);
}

/**
 * Fetch wrapper for the CRM customer self-service portal (`/portal/*`).
 * Deliberately separate from `src/lib/api.ts` — portal sessions use their own
 * bearer token (`portal_token`) so a customer's browser session never mixes
 * with a tenant staff member's session in the same localStorage key.
 */
export async function portalApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const token = getPortalToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // ignore
    }
    throw new PortalApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const portalGet = <T = unknown>(path: string) => portalApi<T>(path);
export const portalPost = <T = unknown>(path: string, body?: unknown) =>
  portalApi<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

/**
 * Downloads a binary response (PDF) from a portal endpoint and opens it in a
 * new browser tab. Used by the portal quote/invoice PDF download buttons
 * (Up Next item 36) — separate from `portalApi` since the response is a
 * blob, not JSON.
 */
export async function portalDownload(path: string, filename: string): Promise<void> {
  const url = `${API_BASE}${path}`;
  const token = getPortalToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new PortalApiError(`Download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
