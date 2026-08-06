import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyTypedToken, TOKEN_TYPE } from "@unerp/auth";
import { idpClient } from "../idp-client";
import { runWithTenantSession } from "@unerp/database";

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
      // The lookup runs inside a tenant session derived from the token's own
      // claim, and it has to.
      //
      // user_sessions carries RLS with ENABLE + FORCE, and the application role
      // is NOBYPASSRLS. Querying it before any tenant context is established
      // returns zero rows — not "revoked", simply invisible — so this guard
      // rejected EVERY authenticated request with "Session has been revoked or
      // expired" while the row sat there active and unexpired. Authentication
      // could not work at all against a correctly-secured database; it only
      // appeared to work where RLS was unenforced or the connection was the
      // table owner.
      //
      // Using the token's tenantId is safe here even though the token is not yet
      // fully trusted: the signature has already been verified above, and the
      // context only widens visibility to that one tenant's own sessions. A
      // forged tenantId cannot help an attacker, because the session id must
      // still exist within it.
      const session = await runWithTenantSession(
        { tenantId: decoded.tenantId ?? "", userId: decoded.userId ?? "" },
        () =>
          idpClient.userSession.findUnique({
            where: { id: decoded.sid },
            select: { isActive: true, expiresAt: true },
          }),
      );
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
