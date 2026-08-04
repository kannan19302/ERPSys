import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class ApiQuotasService {
  async getQuotaPolicies(tenantId: string) {
    return prisma.apiQuotaPolicy.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getQuotaPolicyByClient(tenantId: string, clientAppId: string) {
    const policy = await prisma.apiQuotaPolicy.findFirst({
      where: { tenantId, clientAppId },
    });
    if (!policy)
      throw new NotFoundException(
        `Quota policy for client '${clientAppId}' not found`,
      );
    return policy;
  }

  async createQuotaPolicy(tenantId: string, data: any) {
    return prisma.apiQuotaPolicy.create({
      data: {
        ...data,
        tenantId,
        resetDate: data.resetDate
          ? new Date(data.resetDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async recordApiCall(tenantId: string, clientAppId: string) {
    const policy = await prisma.apiQuotaPolicy.findFirst({
      where: { tenantId, clientAppId, isActive: true },
    });
    if (!policy) return null;

    return prisma.apiQuotaPolicy.update({
      where: { id: policy.id },
      data: {
        callsToday: { increment: 1 },
        callsThisMonth: { increment: 1 },
      },
    });
  }
}
