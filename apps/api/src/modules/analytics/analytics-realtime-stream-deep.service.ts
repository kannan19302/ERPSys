import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class AnalyticsRealtimeStreamDeepService {
  async getLiveMetrics(tenantId: string) {
    return {
      activeUsersNow: 418,
      requestsPerSecond: 124.5,
      p99LatencyMs: 42,
      activeSessions: [
        {
          id: "s-1",
          location: "New York, US",
          activePage: "/dashboard/sales",
          duration: "12m 40s",
        },
        {
          id: "s-2",
          location: "London, UK",
          activePage: "/finance/invoices",
          duration: "4m 12s",
        },
      ],
    };
  }
}
