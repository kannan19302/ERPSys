import { Injectable } from '@nestjs/common';
import { signTenantToken, TenantContextClaims } from '@unerp/service-kit';

/**
 * Signs the short-lived tenant-context token the gateway attaches to every
 * proxied request. Extension services verify it with the shared secret and
 * trust nothing else about the request.
 */
@Injectable()
export class TenantTokenService {
  private get secret(): string {
    const s = process.env.EXT_SERVICE_JWT_SECRET;
    if (!s) throw new Error('EXT_SERVICE_JWT_SECRET is not configured');
    return s;
  }

  sign(claims: Omit<TenantContextClaims, 'iat' | 'exp'>): string {
    return signTenantToken(claims, this.secret);
  }
}
