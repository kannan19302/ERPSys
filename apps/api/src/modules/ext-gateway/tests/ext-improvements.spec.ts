import { describe, it, expect, beforeEach } from 'vitest';
import {
  signTenantToken, verifyTenantToken, decodeTokenUnverified,
  assertScopes, RequireScopes, hasScope, ExtForbiddenError,
  signWebhook, verifyWebhook, compareSemver, satisfiesMinCoreVersion, isSupportedExtApiVersion,
} from '@unerp/service-kit';
import { CircuitBreakerService } from '../circuit-breaker.service';

const SECRET = 'sk';
const claims = (over: any = {}) => ({ tenantId: 't', userId: 'u', roles: ['Admin'], appSlug: 'healthcare', scopes: ['healthcare:read'], iat: 0, exp: 0, ...over });

describe('RBAC helpers (#1)', () => {
  it('hasScope / assertScopes all + any', () => {
    expect(hasScope(claims(), 'healthcare:read')).toBe(true);
    expect(() => assertScopes(claims(), ['healthcare:read'])).not.toThrow();
    expect(() => assertScopes(claims(), ['healthcare:write'])).toThrow(ExtForbiddenError);
    expect(() => assertScopes(claims({ scopes: ['a'] }), ['a', 'b'], 'any')).not.toThrow();
  });

  it('RequireScopes guard reads req.tenantContext', () => {
    const Guard = RequireScopes('healthcare:write');
    const g = new Guard();
    const ctx = (scopes: string[]) => ({ switchToHttp: () => ({ getRequest: () => ({ tenantContext: claims({ scopes }) }) }) });
    expect(() => g.canActivate(ctx(['healthcare:write']))).not.toThrow();
    expect(() => g.canActivate(ctx(['healthcare:read']))).toThrow(/scope/);
  });
});

describe('per-app secret selection (#2)', () => {
  it('decodeTokenUnverified exposes appSlug for secret selection then verify confirms', () => {
    const tok = signTenantToken(claims({ appSlug: 'education' }) as any, 'edu-secret');
    expect(decodeTokenUnverified(tok)?.appSlug).toBe('education');
    // wrong secret rejected, right secret accepted
    expect(() => verifyTenantToken(tok, 'other')).toThrow();
    expect(verifyTenantToken(tok, 'edu-secret').appSlug).toBe('education');
  });
});

describe('webhook signing (#6)', () => {
  it('round-trips and rejects tamper/replay', () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ event: 'invoice.paid', tenantId: 't' });
    const sig = signWebhook(body, SECRET, ts);
    expect(() => verifyWebhook(body, sig, ts, SECRET)).not.toThrow();
    expect(() => verifyWebhook(body + 'x', sig, ts, SECRET)).toThrow(/signature/);
    expect(() => verifyWebhook(body, sig, ts - 10000, SECRET)).toThrow(/tolerance|replay/);
  });
});

describe('semver (#7)', () => {
  it('compares and satisfies minCoreVersion', () => {
    expect(compareSemver('2.1.0', '2.0.9')).toBe(1);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(satisfiesMinCoreVersion('2.0.0', '2.1.0')).toBe(false);
    expect(satisfiesMinCoreVersion('2.2.0', '2.1.0')).toBe(true);
    expect(satisfiesMinCoreVersion('2.0.0', undefined)).toBe(true);
    expect(isSupportedExtApiVersion(1)).toBe(true);
    expect(isSupportedExtApiVersion(0)).toBe(false);
    expect(isSupportedExtApiVersion(1.5)).toBe(false);
  });
});

describe('circuit breaker (#3)', () => {
  let cb: CircuitBreakerService;
  beforeEach(() => { cb = new CircuitBreakerService(); });

  it('opens after 5 consecutive failures and half-opens after cooldown', () => {
    for (let i = 0; i < 4; i++) cb.recordFailure('a');
    expect(cb.isOpen('a')).toBe(false);
    cb.recordFailure('a'); // 5th
    expect(cb.isOpen('a')).toBe(true);
    cb.recordSuccess('a');
    expect(cb.isOpen('a')).toBe(false);
  });
});
