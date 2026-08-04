import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class StorageBucketsService {
  async getBuckets(tenantId: string) {
    return prisma.storageBucketConfig.findMany({
      where: { tenantId },
      orderBy: { bucketName: "asc" },
    });
  }

  async getBucketByName(tenantId: string, bucketName: string) {
    const bucket = await prisma.storageBucketConfig.findFirst({
      where: { tenantId, bucketName },
    });
    if (!bucket)
      throw new NotFoundException(`Storage bucket '${bucketName}' not found`);
    return bucket;
  }

  async createBucket(tenantId: string, data: any) {
    return prisma.storageBucketConfig.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateBucketQuota(
    tenantId: string,
    bucketName: string,
    maxQuotaGb: number,
  ) {
    const existing = await prisma.storageBucketConfig.findFirst({
      where: { tenantId, bucketName },
    });
    if (!existing)
      throw new NotFoundException(`Storage bucket '${bucketName}' not found`);
    return prisma.storageBucketConfig.update({
      where: { id: existing.id },
      data: { maxQuotaGb },
    });
  }
}
