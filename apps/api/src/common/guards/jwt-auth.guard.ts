import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyTypedToken, TOKEN_TYPE } from '@unerp/auth';

const AUTH_COOKIE = 'auth_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Prefer httpOnly cookie
    let token: string | undefined = request.cookies?.[AUTH_COOKIE];

    // 2. Fall back to Authorization header (backwards-compat during migration)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('Missing authentication credentials');
    }

    // Purpose-scoped: a password-reset or MFA-challenge token carries a valid
    // signature but must never be accepted as a session.
    const decoded = verifyTypedToken(token, TOKEN_TYPE.SESSION);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    request.user = decoded;
    return true;
  }
}
