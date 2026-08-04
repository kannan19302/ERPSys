import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class StoragePoliciesService {
  async getAccessPolicies(tenantId: string, bucketName?: string) {
    const where: any = { tenantId };
    if (bucketName) where.bucketName = bucketName;
    return prisma.storageAccessPolicy.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createAccessPolicy(tenantId: string, data: any) {
    return prisma.storageAccessPolicy.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getLifecycleRules(tenantId: string, bucketName?: string) {
    const where: any = { tenantId, isActive: true };
    if (bucketName) where.bucketName = bucketName;
    return prisma.storageLifecycleRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createLifecycleRule(tenantId: string, data: any) {
    return prisma.storageLifecycleRule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }
}
