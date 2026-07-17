import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AppInstalledGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { tenantId: string } | undefined;
    if (!user || !user.tenantId) {
      return true; // If no user/tenant session, let other guards (like JwtAuthGuard) handle it
    }

    const path = request.route?.path;
    if (!path) {
      return true;
    }

    // Extract first segment after prefix (e.g. "/healthcare/patients" -> "healthcare")
    // If the path starts with /api/v1/ (which might be the case), clean it.
    const cleanPath = path.replace(/^\/api\/v\d+\//, '/');
    const segment = cleanPath.split('/')[1]; // get the first path segment
    if (!segment) {
      return true;
    }

    // List of core platform modules that bypass the installation check
    const coreApps = [
      'auth',
      'dashboard',
      'finance',
      'hr',
      'crm',
      'inventory',
      'procurement',
      'sales',
      'supply-chain',
      'projects',
      'manufacturing',
      'analytics',
      'drive',
      'communication',
      'pos',
      'workflows',
      'storage',
      'saas',
      'admin',
    ];

    if (coreApps.includes(segment)) {
      return true;
    }

    // Check if the application is installed for this tenant
    const installed = await prisma.installedApp.findUnique({
      where: {
        tenantId_appId: {
          tenantId: user.tenantId,
          appId: segment,
        },
      },
    });

    if (!installed) {
      throw new ForbiddenException(`Application '${segment}' is not installed for this tenant.`);
    }

    return true;
  }
}
