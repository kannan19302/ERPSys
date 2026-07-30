// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasClusterRoutingDeepService {
  async getClusters() {
    return prisma.saasMultiTenantCluster.findMany({
      orderBy: { activeTenants: "desc" },
    });
  }

  async createCluster(dto: any) {
    return prisma.saasMultiTenantCluster.create({
      data: {
        clusterName: dto.clusterName,
        region: dto.region,
        provider: dto.provider || "AWS",
        endpoint: dto.endpoint,
        maxTenants: dto.maxTenants || 500,
      },
    });
  }

  async getTenantRouting(tenantId: string) {
    return prisma.saasTenantNodeRouting.findFirst({
      where: { tenantId },
    });
  }

  async setTenantRouting(tenantId: string, dto: any) {
    return prisma.saasTenantNodeRouting.upsert({
      where: {
        tenantId_clusterId: {
          tenantId,
          clusterId: dto.clusterId,
        },
      },
      create: {
        tenantId,
        clusterId: dto.clusterId,
        nodeGroup: dto.nodeGroup || "shared-workers",
        databaseHost: dto.databaseHost,
        redisHost: dto.redisHost,
        isDedicated: dto.isDedicated || false,
      },
      update: {
        nodeGroup: dto.nodeGroup,
        databaseHost: dto.databaseHost,
        redisHost: dto.redisHost,
        isDedicated: dto.isDedicated,
      },
    });
  }
}
