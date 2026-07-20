import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SaasPortalService {
  async getPlatformOverview() {
    const [tenants, users, apps, revenue] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.marketplaceApp.count(),
      prisma.invoice.aggregate({ _sum: { totalAmount: true } }),
    ]);

    return {
      totalTenants: tenants,
      totalUsers: users,
      totalApps: apps,
      totalRevenue: revenue._sum.totalAmount ?? 0,
    };
  }

  async getInstalledApps(tenantId: string) {
    const installed = await prisma.installedApp.findMany({
      where: { tenantId },
      select: { appId: true, appSlug: true },
    });
    const list = new Set<string>();
    for (const i of installed) {
      if (i.appId) list.add(i.appId);
      if (i.appSlug) list.add(i.appSlug);
    }
    return Array.from(list);
  }
}