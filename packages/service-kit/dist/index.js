"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_TOKEN_TTL_SECONDS = exports.REQUEST_ID_HEADER = exports.TENANT_TOKEN_HEADER = exports.EXT_API_VERSION = void 0;
exports.buildHealthResponse = buildHealthResponse;
exports.signTenantToken = signTenantToken;
exports.verifyTenantToken = verifyTenantToken;
exports.tenantContextMiddleware = tenantContextMiddleware;
/**
 * @unerp/service-kit — the contract between the UniERP core gateway and
 * out-of-process extension services (industry apps in their own repos).
 *
 * Core signs a short-lived tenant-context token per proxied request; the
 * service verifies it and derives all tenant/user context from it. Services
 * never trust raw headers — only the signed token.
 */
const crypto_1 = require("crypto");
/** Contract version. Core refuses manifests with a newer apiVersion. */
exports.EXT_API_VERSION = 1;
/** Header carrying the signed tenant-context token on proxied requests. */
exports.TENANT_TOKEN_HEADER = 'x-unierp-tenant-token';
/** Correlation id propagated from the gateway. */
exports.REQUEST_ID_HEADER = 'x-request-id';
/** Default TTL for tenant-context tokens (seconds). */
exports.TENANT_TOKEN_TTL_SECONDS = 60;
function buildHealthResponse(app, version) {
    return { status: 'ok', app, version, apiVersion: exports.EXT_API_VERSION, time: new Date().toISOString() };
}
// ─── Minimal HS256 JWT (no dependencies) ───
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
function hs256(input, secret) {
    return (0, crypto_1.createHmac)('sha256', secret).update(input).digest();
}
/** Sign a tenant-context token (HS256). Used by core's gateway. */
function signTenantToken(claims, secret, ttlSeconds = exports.TENANT_TOKEN_TTL_SECONDS) {
    if (!secret)
        throw new Error('signTenantToken: secret is required');
    const now = Math.floor(Date.now() / 1000);
    const full = { ...claims, iat: now, exp: now + ttlSeconds };
    const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const payload = b64url(Buffer.from(JSON.stringify(full)));
    const sig = b64url(hs256(`${header}.${payload}`, secret));
    return `${header}.${payload}.${sig}`;
}
/**
 * Verify a tenant-context token. Throws on any problem (bad signature, expired,
 * wrong app). Returns the claims on success.
 */
function verifyTenantToken(token, secret, opts = {}) {
    if (!secret)
        throw new Error('verifyTenantToken: secret is required');
    const parts = (token || '').split('.');
    if (parts.length !== 3)
        throw new Error('Malformed tenant token');
    const [header, payload, sig] = parts;
    const expected = hs256(`${header}.${payload}`, secret);
    const actual = fromB64url(sig);
    if (actual.length !== expected.length || !(0, crypto_1.timingSafeEqual)(actual, expected)) {
        throw new Error('Invalid tenant token signature');
    }
    let claims;
    try {
        claims = JSON.parse(fromB64url(payload).toString('utf8'));
    }
    catch {
        throw new Error('Malformed tenant token payload');
    }
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp < now)
        throw new Error('Tenant token expired');
    if (!claims.tenantId)
        throw new Error('Tenant token missing tenantId');
    if (opts.expectedAppSlug && claims.appSlug !== opts.expectedAppSlug) {
        throw new Error(`Tenant token issued for app "${claims.appSlug}", not "${opts.expectedAppSlug}"`);
    }
    return claims;
}
/**
 * Express-style middleware factory for extension services: verifies the token
 * and attaches `req.tenantContext`. Skips paths in `publicPaths` (health checks).
 */
function tenantContextMiddleware(options) {
    const publicPaths = new Set(options.publicPaths || []);
    return (req, res, next) => {
        if (publicPaths.has(req.path))
            return next();
        const token = req.headers?.[exports.TENANT_TOKEN_HEADER];
        try {
            req.tenantContext = verifyTenantToken(String(token || ''), options.secret, {
                expectedAppSlug: options.appSlug,
            });
            return next();
        }
        catch (e) {
            res.status(401).json({
                statusCode: 401,
                error: 'Unauthorized',
                message: e?.message || 'Invalid tenant token',
                app: options.appSlug,
            });
        }
    };
}
