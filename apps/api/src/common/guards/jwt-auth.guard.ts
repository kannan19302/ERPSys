import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyTypedToken, TOKEN_TYPE } from "@unerp/auth";
import { prisma, runWithTenantSession } from "@unerp/database";

const AUTH_COOKIE = "auth_token";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Prefer httpOnly cookie
    let token: string | undefined = request.cookies?.[AUTH_COOKIE];

    // 2. Fall back to Authorization header (backwards-compat during migration)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException("Missing authentication credentials");
    }

    // Purpose-scoped: a password-reset or MFA-challenge token carries a valid
    // signature but must never be accepted as a session.
    const decoded = verifyTypedToken<{
      sid?: string;
      tenantId?: string;
      userId?: string;
    }>(token, TOKEN_TYPE.SESSION);
    if (!decoded) {
      throw new UnauthorizedException(
        "Invalid or expired authentication token",
      );
    }

    // 3. Stateless validation: we trust the JWT signature.
    // In a fully decoupled architecture, revocation is handled via short token lifetimes
    // or asynchronous invalidation lists, not by a synchronous database hop to the IdP.

    request.user = decoded;
    return true;
  }
}
