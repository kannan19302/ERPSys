import { Injectable } from '@nestjs/common';

@Injectable()
export class DevopsService {
  private startTime = Date.now();

  async getSystemMetrics() {
    // Return resource statistics and metrics
    const memoryUsage = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        rss: Math.floor(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
      },
      dbConnections: 5,
      apiRequestsTotal: 2543,
      apiErrorsTotal: 12,
      latencyMs: 14,
    };
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
