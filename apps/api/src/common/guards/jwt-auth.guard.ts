import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyTypedToken, TOKEN_TYPE } from '@unerp/auth';
import { prisma } from '@unerp/database';

const AUTH_COOKIE = 'auth_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const decoded = verifyTypedToken<{ sid?: string }>(token, TOKEN_TYPE.SESSION);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // 3. Revocable sessions: if the token carries a session id, the session must
    // still be active and unexpired. Tokens minted before sessions were tracked
    // have no `sid` and remain valid until they expire (within a day).
    if (decoded.sid) {
      const session = await prisma.userSession.findUnique({ where: { id: decoded.sid } });
      const now = new Date();
      if (!session || !session.isActive || (session.expiresAt && session.expiresAt < now)) {
        throw new UnauthorizedException('Session has been revoked or expired');
      }
    }

    request.user = decoded;
    return true;
  }
}
