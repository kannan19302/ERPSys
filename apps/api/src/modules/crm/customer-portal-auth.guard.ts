import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@unerp/auth';

/**
 * Guards the customer self-service portal's own endpoints (`/portal/*`).
 * Portal users are NOT tenant staff — they have no Role/Permission records,
 * so `RbacGuard` doesn't apply to them. This guard instead verifies the JWT
 * issued by `CustomerPortalService.login` carries `{ portal: true, customerId }`
 * and attaches that as `req.user`, scoping every subsequent query to the
 * portal user's own customer record.
 */
@Injectable()
export class CustomerPortalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    let token: string | undefined = request.cookies?.['portal_auth_token'];
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Missing portal authentication credentials');
    }

    const decoded = verifyToken(token) as
      | { tenantId?: string; userId?: string; customerId?: string; portal?: boolean }
      | null;

    if (!decoded || decoded.portal !== true || !decoded.tenantId || !decoded.customerId) {
      throw new UnauthorizedException('Invalid or expired portal session');
    }

    request.user = decoded;
    return true;
  }
}
