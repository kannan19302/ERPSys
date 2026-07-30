// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ApiRateLimitsService {
  async getRateLimitRules(tenantId: string) {
    return prisma.apiRateLimitRule.findMany({
      where: { tenantId, isActive: true },
      orderBy: { endpointPath: "asc" },
    });
  }

  async createRateLimitRule(tenantId: string, data: any) {
    return prisma.apiRateLimitRule.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async updateRateLimitRule(tenantId: string, id: string, data: any) {
    const existing = await prisma.apiRateLimitRule.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("API rate limit rule not found");
    return prisma.apiRateLimitRule.update({
      where: { id },
      data,
    });
  }

  async deleteRateLimitRule(tenantId: string, id: string) {
    const existing = await prisma.apiRateLimitRule.findFirst({
      where: { tenantId, id },
    });
    if (!existing) throw new NotFoundException("API rate limit rule not found");
    return prisma.apiRateLimitRule.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
