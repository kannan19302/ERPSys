import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class AnalyticsAnomalyDetectionDeepService {
  async getAnomalies(tenantId: string) {
    return [
      {
        id: "anom-1",
        tenantId,
        metric: "PAYMENT_FAILED_RATE",
        severity: "CRITICAL",
        deviationPercent: "+320%",
        detectedAt: new Date().toISOString(),
        status: "INVESTIGATING",
      },
    ];
  }
}
