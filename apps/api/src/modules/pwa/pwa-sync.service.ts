import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class PwaSyncService {
  async getSyncQueue(tenantId: string, userId: string) {
    return prisma.pwaOfflineSyncQueue.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async enqueueOfflineAction(tenantId: string, userId: string, data: any) {
    return prisma.pwaOfflineSyncQueue.create({
      data: {
        tenantId,
        userId,
        actionType: data.actionType,
        payload: data.payload || {},
        status: "PENDING",
      },
    });
  }

  async processSyncQueueItem(
    tenantId: string,
    id: string,
    success: boolean,
    errorMessage?: string,
  ) {
    const existing = await prisma.pwaOfflineSyncQueue.findFirst({
      where: { tenantId, id },
    });
    if (!existing)
      throw new NotFoundException("Offline sync queue item not found");

    return prisma.pwaOfflineSyncQueue.update({
      where: { id },
      data: {
        status: success ? "SYNCED" : "FAILED",
        errorMessage: success ? null : errorMessage,
        syncedAt: success ? new Date() : null,
        retryCount: success ? existing.retryCount : existing.retryCount + 1,
      },
    });
  }
}
