const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export class ApiRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiRequestError";
  }
}

// Endpoints that must never trigger a silent refresh (they ARE the auth flow).
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register",
];

// Deduplicates concurrent refreshes: parallel 401s share one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the httpOnly refresh cookie into a fresh short-lived access token.
 * Returns true when the session was renewed (localStorage token updated).
 */
async function trySilentRefresh(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!refreshInFlight) {
    const headers = new Headers();
    const csrf = getCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as { token?: string; user?: unknown };
        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        return Boolean(data.token);
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers = new Headers(options.headers);

  if (
    !headers.has("Content-Type") &&
    options.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Attach auth token (Bearer) — will be phased out as cookie auth propagates
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Attach CSRF token for state-changing requests
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set("x-csrf-token", csrf);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  // Access tokens are short-lived by design: on a 401, rotate the refresh
  // cookie once and replay the request with the renewed token.
  if (
    res.status === 401 &&
    !isRetry &&
    !NO_REFRESH_PATHS.some((p) => path.startsWith(p))
  ) {
    const renewed = await trySilentRefresh();
    if (renewed) {
      const retryHeaders = new Headers(options.headers);
      retryHeaders.delete("Authorization");
      return api<T>(path, { ...options, headers: retryHeaders }, true);
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // response wasn't JSON
    }
    throw new ApiRequestError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export function apiGet<T = unknown>(path: string): Promise<T> {
  return api<T>(path);
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T = unknown>(
  path: string,
  body?: unknown,
): Promise<T> {
  return api<T>(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T = unknown>(path: string): Promise<T> {
  return api<T>(path, { method: "DELETE" });
}
