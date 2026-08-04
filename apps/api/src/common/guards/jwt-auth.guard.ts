import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyTypedToken, TOKEN_TYPE } from "@unerp/auth";
import { idpClient } from "../idp-client";

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

    // 3. Revocable sessions. If the token carries a session id, that session must
    // still be active and unexpired.
    //
    // This check was removed during the platform split in favour of "stateless
    // validation", on the stated grounds that revocation would be handled by
    // "short token lifetimes or asynchronous invalidation lists". No invalidation
    // list exists anywhere in the repository, so the only remaining bound was the
    // access-token TTL — 15 minutes by default. That meant logging out, disabling
    // a user, or revoking a stolen session left the bearer fully authorised for up
    // to a quarter of an hour, with no way to intervene. For an emergency lockout
    // or a compromised administrator session that is the window that matters.
    //
    // Restored deliberately, at the cost of one indexed primary-key lookup per
    // request. Reinstate a stateless model only alongside a real denylist that is
    // actually consulted here.
    //
    // UserSession moved to the IdP schema in the split, so this reads through the
    // IdP client rather than the main one.
    if (decoded.sid) {
      const session = await idpClient.userSession.findUnique({
        where: { id: decoded.sid },
        select: { isActive: true, expiresAt: true },
      });
      if (
        !session ||
        !session.isActive ||
        (session.expiresAt && session.expiresAt < new Date())
      ) {
        throw new UnauthorizedException("Session has been revoked or expired");
      }
    }

    request.user = decoded;
    return true;
  }
}
