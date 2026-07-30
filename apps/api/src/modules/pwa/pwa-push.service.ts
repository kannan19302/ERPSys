// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class PwaPushService {
  async getSubscriptions(tenantId: string, userId?: string) {
    const where: any = { tenantId, status: "ACTIVE" };
    if (userId) where.userId = userId;
    return prisma.pwaPushSubscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async saveSubscription(tenantId: string, userId: string, data: any) {
    const existing = await prisma.pwaPushSubscription.findFirst({
      where: { tenantId, endpoint: data.endpoint },
    });
    if (existing) {
      return prisma.pwaPushSubscription.update({
        where: { id: existing.id },
        data: { ...data, userId, status: "ACTIVE" },
      });
    }
    return prisma.pwaPushSubscription.create({
      data: {
        ...data,
        tenantId,
        userId,
      },
    });
  }

  async unsubscribe(tenantId: string, endpoint: string) {
    const existing = await prisma.pwaPushSubscription.findFirst({
      where: { tenantId, endpoint },
    });
    if (!existing) throw new NotFoundException("Push subscription not found");
    return prisma.pwaPushSubscription.update({
      where: { id: existing.id },
      data: { status: "UNSUBSCRIBED" },
    });
  }
}
