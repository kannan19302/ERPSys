import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class SaasTenantMigrationDeepService {
  async getMigrationJobs(tenantId: string) {
    return [
      {
        id: "mig-job-101",
        tenantId,
        sourceCluster: "us-east-1-shared",
        targetCluster: "us-east-1-dedicated-01",
        status: "COMPLETED",
        recordsMigrated: 14500,
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date().toISOString(),
      },
    ];
  }

  async startMigration(
    tenantId: string,
    dto: { sourceCluster: string; targetCluster: string },
  ) {
    return {
      id: `mig-job-${Date.now()}`,
      tenantId,
      sourceCluster: dto.sourceCluster,
      targetCluster: dto.targetCluster,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
    };
  }
}
