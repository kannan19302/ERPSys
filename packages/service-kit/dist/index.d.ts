/** Contract version. Core refuses manifests with a newer apiVersion. */
export declare const EXT_API_VERSION = 1;
/** Header carrying the signed tenant-context token on proxied requests. */
export declare const TENANT_TOKEN_HEADER = "x-unierp-tenant-token";
/** Correlation id propagated from the gateway. */
export declare const REQUEST_ID_HEADER = "x-request-id";
/** Default TTL for tenant-context tokens (seconds). */
export declare const TENANT_TOKEN_TTL_SECONDS = 60;
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
export declare function buildHealthResponse(app: string, version?: string): ExtHealthResponse;
/** Sign a tenant-context token (HS256). Used by core's gateway. */
export declare function signTenantToken(claims: Omit<TenantContextClaims, 'iat' | 'exp'>, secret: string, ttlSeconds?: number): string;
/**
 * Verify a tenant-context token. Throws on any problem (bad signature, expired,
 * wrong app). Returns the claims on success.
 */
export declare function verifyTenantToken(token: string, secret: string, opts?: {
    expectedAppSlug?: string;
}): TenantContextClaims;
/**
 * Express-style middleware factory for extension services: verifies the token
 * and attaches `req.tenantContext`. Skips paths in `publicPaths` (health checks).
 */
export declare function tenantContextMiddleware(options: {
    secret: string;
    appSlug: string;
    publicPaths?: string[];
}): (req: any, res: any, next: any) => any;
