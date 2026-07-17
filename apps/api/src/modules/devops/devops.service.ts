import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DevopsService {
  async getSystemMetrics() {
    const memoryUsage = process.memoryUsage();

    // DB connection count
    let dbConnections = 0;
    try {
      const result: any[] = await prisma.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity`;
      dbConnections = result[0]?.count ?? 0;
    } catch {
      dbConnections = -1;
    }

    // API request/error counters from Setting model
    let apiRequestsTotal = 0;
    let apiErrorsTotal = 0;
    try {
      const reqSetting = await prisma.setting.findFirst({
        where: { key: 'devops.api_requests_total' },
      });
      if (reqSetting) apiRequestsTotal = Number(reqSetting.value) || 0;

      const errSetting = await prisma.setting.findFirst({
        where: { key: 'devops.api_errors_total' },
      });
      if (errSetting) apiErrorsTotal = Number(errSetting.value) || 0;
    } catch {
      // settings not available yet
    }

    // DB latency measurement
    let latencyMs = 0;
    try {
      const start = performance.now();
      await prisma.$queryRaw`SELECT 1`;
      latencyMs = Math.round(performance.now() - start);
    } catch {
      latencyMs = -1;
    }

    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024),
      },
      dbConnections,
      apiRequestsTotal,
      apiErrorsTotal,
      latencyMs,
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage(),
    };
  }

  async getRecentErrors(tenantId: string) {
    try {
      const errors = await prisma.auditLog.findMany({
        where: {
          tenantId,
          action: 'ERROR',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return errors;
    } catch {
      return [];
    }
  }

  async getIntegrationLinks() {
    return {
      prometheus: 'http://localhost:9090',
      grafana: 'http://localhost:3000/d/unerp-dashboard',
      jaeger: 'http://localhost:16686',
      sentry: 'https://sentry.io/organizations/unerp/issues/',
    };
  }
}
