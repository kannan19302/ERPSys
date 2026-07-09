/**
 * @unerp/service-kit — the contract between the UniERP core gateway and
 * out-of-process extension services (industry apps in their own repos).
 *
 * Core signs a short-lived tenant-context token per proxied request; the
 * service verifies it and derives all tenant/user context from it. Services
 * never trust raw headers — only the signed token.
 */
import { createHmac, timingSafeEqual } from 'crypto';

/** Contract version. Core refuses manifests with a newer apiVersion. */
export const EXT_API_VERSION = 1;

/** Header carrying the signed tenant-context token on proxied requests. */
export const TENANT_TOKEN_HEADER = 'x-unierp-tenant-token';
/** Correlation id propagated from the gateway. */
export const REQUEST_ID_HEADER = 'x-request-id';

/** Default TTL for tenant-context tokens (seconds). */
export const TENANT_TOKEN_TTL_SECONDS = 60;

/** `service` section of an AppManifest (runtime: 'declarative+service'). */
export interface ManifestService {
  /** Route prefix under /api/v1/ext/<prefix>/* on core. Defaults to the app slug. */
  routePrefix?: string;
  /** Env var core reads to find the service base URL (overrides defaultBaseUrl). */
  baseUrlEnv?: string;
  /** Fallback base URL, e.g. http://fieldservice-svc:4103 for docker-compose. */
  defaultBaseUrl?: string;
  /** Health check path on the service, e.g. /svc/health. */
  healthcheck: string;
  /** Scopes core embeds in the tenant-context token. */
  scopes?: string[];
  /** Per-request proxy timeout (ms). Default 15000. */
  timeoutMs?: number;
}

/** Claims inside the tenant-context token. */
export interface TenantContextClaims {
  tenantId: string;
  userId: string;
  email?: string;
  roles: string[];
  appSlug: string;
  scopes: string[];
  iat: number;
  exp: number;
}

/** Standard error envelope the gateway and services both emit. */
export interface ExtErrorEnvelope {
  statusCode: number;
  error: string;
  message: string;
  app?: string;
  requestId?: string;
}

/** Standard health response shape (GET <healthcheck>). */
export interface ExtHealthResponse {
  status: 'ok';
  app: string;
  version?: string;
  apiVersion: number;
  time: string;
}

export function buildHealthResponse(app: string, version?: string): ExtHealthResponse {
  return { status: 'ok', app, version, apiVersion: EXT_API_VERSION, time: new Date().toISOString() };
}

// ─── Minimal HS256 JWT (no dependencies) ───

const b64url = (buf: Buffer) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function hs256(input: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(input).digest();
}

/** Sign a tenant-context token (HS256). Used by core's gateway. */
export function signTenantToken(
  claims: Omit<TenantContextClaims, 'iat' | 'exp'>,
  secret: string,
  ttlSeconds: number = TENANT_TOKEN_TTL_SECONDS,
): string {
  if (!secret) throw new Error('signTenantToken: secret is required');
  const now = Math.floor(Date.now() / 1000);
  const full: TenantContextClaims = { ...claims, iat: now, exp: now + ttlSeconds };
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(Buffer.from(JSON.stringify(full)));
  const sig = b64url(hs256(`${header}.${payload}`, secret));
  return `${header}.${payload}.${sig}`;
}

/**
 * Verify a tenant-context token. Throws on any problem (bad signature, expired,
 * wrong app). Returns the claims on success.
 */
export function verifyTenantToken(
  token: string,
  secret: string,
  opts: { expectedAppSlug?: string } = {},
): TenantContextClaims {
  if (!secret) throw new Error('verifyTenantToken: secret is required');
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed tenant token');
  const [header, payload, sig] = parts as [string, string, string];
  const expected = hs256(`${header}.${payload}`, secret);
  const actual = fromB64url(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error('Invalid tenant token signature');
  }
  let claims: TenantContextClaims;
  try {
    claims = JSON.parse(fromB64url(payload).toString('utf8'));
  } catch {
    throw new Error('Malformed tenant token payload');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp < now) throw new Error('Tenant token expired');
  if (!claims.tenantId) throw new Error('Tenant token missing tenantId');
  if (opts.expectedAppSlug && claims.appSlug !== opts.expectedAppSlug) {
    throw new Error(`Tenant token issued for app "${claims.appSlug}", not "${opts.expectedAppSlug}"`);
  }
  return claims;
}

/**
 * Express-style middleware factory for extension services: verifies the token
 * and attaches `req.tenantContext`. Skips paths in `publicPaths` (health checks).
 */
export function tenantContextMiddleware(options: {
  secret: string;
  appSlug: string;
  publicPaths?: string[];
}) {
  const publicPaths = new Set(options.publicPaths || []);
  return (req: any, res: any, next: any) => {
    if (publicPaths.has(req.path)) return next();
    const token = req.headers?.[TENANT_TOKEN_HEADER];
    try {
      req.tenantContext = verifyTenantToken(String(token || ''), options.secret, {
        expectedAppSlug: options.appSlug,
      });
      return next();
    } catch (e: any) {
      res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: e?.message || 'Invalid tenant token',
        app: options.appSlug,
      } satisfies ExtErrorEnvelope);
    }
  };
}
