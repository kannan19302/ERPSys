import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { runWithTenantSession } from '@unerp/database';
import { SKIP_TENANT_SCOPE_KEY } from '../decorators/skip-tenant-scope.decorator';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { tenantId: string; userId?: string; sub?: string } | undefined;

    if (user && user.tenantId) {
      const userId = user.userId || user.sub;
      if (!userId) {
        throw new UnauthorizedException('User ID not found in session');
      }
      return from(
        runWithTenantSession(
          {
            tenantId: user.tenantId,
            userId,
          },
          async () => {
            const { lastValueFrom } = await import('rxjs');
            return lastValueFrom(next.handle());
          },
        ),
      );
    }

    return next.handle();
  }
}
