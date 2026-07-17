import { Injectable } from '@nestjs/common';
import { signTenantToken, TenantContextClaims } from '@unerp/service-kit';
import { secretForApp } from './ext-secret.util';

/**
 * Signs the short-lived tenant-context token the gateway attaches to every
 * proxied request, using the target app's own secret (#2). Extension services
 * verify it with their secret and trust nothing else about the request.
 */
@Injectable()
export class TenantTokenService {
  sign(claims: Omit<TenantContextClaims, 'iat' | 'exp'>): string {
    return signTenantToken(claims, secretForApp(claims.appSlug));
  }
}
