import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { prisma, runWithTenantSession } from "@unerp/database";
import { hasPermission } from "@unerp/auth";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtAuthGuard

    if (!user) {
      throw new ForbiddenException("User session not found");
    }

    // Extract permissions from the decoded JWT claims, which were injected by
    // JwtAuthGuard. A malformed claim (a string, an object, anything not an
    // array of strings) must deny, not crash: `[].some` on a non-array threw a
    // TypeError that surfaced as a 500, turning an authorization failure into
    // what looks like a server fault. Anything unrecognised collapses to no
    // permissions, which the check below denies by default.
    const claimed = (user as any).permissions;
    const userPermissions: string[] = Array.isArray(claimed)
      ? claimed.filter((p): p is string => typeof p === "string")
      : [];

    // Verify if the user possesses the permissions required by the endpoint
    const isAuthorized = requiredPermissions.every((required) =>
      hasPermission(userPermissions, required),
    );

    if (!isAuthorized) {
      throw new ForbiddenException(
        "You do not have the required permissions to access this resource",
      );
    }

    return true;
  }
}
