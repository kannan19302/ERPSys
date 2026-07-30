// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasQuotaGuardDeepService {
  async getTierConfigs(tenantId: string) {
    return prisma.saasTenantTierConfig.findMany({
      where: { tenantId },
    });
  }

  async setTierConfig(tenantId: string, dto: any) {
    return prisma.saasTenantTierConfig.upsert({
      where: {
        tenantId_tierName: {
          tenantId,
          tierName: dto.tierName,
        },
      },
      create: {
        tenantId,
        tierName: dto.tierName,
        maxUsers: dto.maxUsers || 10,
        maxStorageGb: dto.maxStorageGb || 50,
        maxApiReqPerMin: dto.maxApiReqPerMin || 1000,
        slaTier: dto.slaTier || "99.9%",
        features: dto.features || null,
      },
      update: {
        maxUsers: dto.maxUsers,
        maxStorageGb: dto.maxStorageGb,
        maxApiReqPerMin: dto.maxApiReqPerMin,
        slaTier: dto.slaTier,
        features: dto.features,
      },
    });
  }

  async getCustomQuotas(tenantId: string) {
    return prisma.saasTenantCustomQuota.findMany({
      where: { tenantId },
    });
  }

  async setCustomQuota(tenantId: string, dto: any) {
    return prisma.saasTenantCustomQuota.upsert({
      where: {
        tenantId_resourceKey: {
          tenantId,
          resourceKey: dto.resourceKey,
        },
      },
      create: {
        tenantId,
        resourceKey: dto.resourceKey,
        quotaLimit: BigInt(dto.quotaLimit || 1000),
        warningThresholdBigInt: BigInt(dto.warningThreshold || 80),
        softEnforce: dto.softEnforce !== undefined ? dto.softEnforce : true,
      },
      update: {
        quotaLimit: BigInt(dto.quotaLimit),
        warningThresholdBigInt: BigInt(dto.warningThreshold || 80),
        softEnforce: dto.softEnforce,
      },
    });
  }
}
