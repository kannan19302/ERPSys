import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  RequeueDlqDto,
  DlqActionDto,
  DlqBatchActionDto,
  UpdateDispatcherDto,
  DeadLetterActionDto,
} from "@unerp/shared";

@Injectable()
export class OutboxDeepService {
  // DLQ operations
  async getDlqEntries(tenantId: string, status?: string, page = 1, limit = 20) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.outboxDLQ.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outboxDLQ.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getDlqEntry(tenantId: string, id: string) {
    const entry = await prisma.outboxDLQ.findFirst({ where: { id, tenantId } });
    if (!entry) throw new NotFoundException("DLQ entry not found");
    return entry;
  }

  async requeueDlqEntry(tenantId: string, id: string) {
    const entry = await this.getDlqEntry(tenantId, id);
    if (entry.requeueCount >= entry.maxRequeues)
      throw new Error("Max requeues reached for this DLQ entry");
    await prisma.outboxDLQ.update({
      where: { id },
      data: { status: "RETRYING", requeueCount: entry.requeueCount + 1 },
    });
    return prisma.outboxDelivery.update({
      where: { id: entry.outboxDeliveryId },
      data: { status: "PENDING", availableAt: new Date(), lastError: null },
    });
  }

  async batchRequeue(tenantId: string, dto: RequeueDlqDto) {
    const results = [];
    for (const id of dto.ids) {
      try {
        results.push(await this.requeueDlqEntry(tenantId, id));
      } catch {
        results.push({ id, error: "Failed to requeue" });
      }
    }
    return results;
  }

  async archiveDlqEntry(tenantId: string, id: string, notes?: string) {
    await this.getDlqEntry(tenantId, id);
    return prisma.outboxDLQ.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async discardDlqEntry(tenantId: string, id: string, notes?: string) {
    await this.getDlqEntry(tenantId, id);
    return prisma.outboxDLQ.update({
      where: { id },
      data: { status: "DISCARDED" },
    });
  }

  async batchAction(tenantId: string, dto: DlqBatchActionDto) {
    const results = [];
    for (const id of dto.ids) {
      try {
        if (dto.action === "RETRY")
          results.push(await this.requeueDlqEntry(tenantId, id));
        else if (dto.action === "ARCHIVE")
          results.push(await this.archiveDlqEntry(tenantId, id, dto.notes));
        else if (dto.action === "DISCARD")
          results.push(await this.discardDlqEntry(tenantId, id, dto.notes));
      } catch {
        results.push({ id, error: `Failed to ${dto.action}` });
      }
    }
    return results;
  }

  async getDlqStats(tenantId: string) {
    const [pendingReview, retrying, archived, discarded] = await Promise.all([
      prisma.outboxDLQ.count({ where: { tenantId, status: "PENDING_REVIEW" } }),
      prisma.outboxDLQ.count({ where: { tenantId, status: "RETRYING" } }),
      prisma.outboxDLQ.count({ where: { tenantId, status: "ARCHIVED" } }),
      prisma.outboxDLQ.count({ where: { tenantId, status: "DISCARDED" } }),
    ]);
    return {
      total: pendingReview + retrying + archived + discarded,
      pendingReview,
      retrying,
      archived,
      discarded,
    };
  }

  // Dead Letter Messages
  async getDeadLetters(tenantId: string, page = 1, limit = 20) {
    const where: any = { tenantId };
    const [items, total] = await Promise.all([
      prisma.outboxDeadLetterMessage.findMany({
        where,
        orderBy: { deadLetterAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outboxDeadLetterMessage.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getDeadLetter(tenantId: string, id: string) {
    const msg = await prisma.outboxDeadLetterMessage.findFirst({
      where: { id, tenantId },
    });
    if (!msg) throw new NotFoundException("Dead letter message not found");
    return msg;
  }

  async actionDeadLetter(
    tenantId: string,
    id: string,
    action: string,
    actionedBy: string,
    notes?: string,
  ) {
    await this.getDeadLetter(tenantId, id);
    return prisma.outboxDeadLetterMessage.update({
      where: { id },
      data: {
        action,
        actionedBy,
        actionedAt: new Date(),
        notes: notes || null,
      },
    });
  }

  async retryDeadLetter(tenantId: string, id: string) {
    const msg = await this.getDeadLetter(tenantId, id);
    await prisma.outboxDeadLetterMessage.update({
      where: { id },
      data: { action: "RETRY", actionedAt: new Date() },
    });
    return prisma.outboxDelivery.update({
      where: { id: msg.outboxDeliveryId },
      data: { status: "PENDING", availableAt: new Date(), lastError: null },
    });
  }

  // Retry Logs
  async getRetryLogs(
    tenantId: string,
    deliveryId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId };
    if (deliveryId) where.outboxDeliveryId = deliveryId;
    const [items, total] = await Promise.all([
      prisma.outboxRetryLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outboxRetryLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  // Dispatcher State
  async getDispatcherStates(tenantId: string) {
    return prisma.outboxDispatcherState.findMany({ where: { tenantId } });
  }

  async getDispatcherState(tenantId: string, dispatcherName: string) {
    const state = await prisma.outboxDispatcherState.findFirst({
      where: { tenantId, dispatcherName },
    });
    if (!state) throw new NotFoundException("Dispatcher not found");
    return state;
  }

  async updateDispatcherState(
    tenantId: string,
    dispatcherName: string,
    dto: UpdateDispatcherDto,
  ) {
    const existing = await prisma.outboxDispatcherState.findFirst({
      where: { tenantId, dispatcherName },
    });
    if (existing) {
      return prisma.outboxDispatcherState.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          config: (dto.config || existing.config) as any,
          version: existing.version + 1,
        },
      });
    }
    return prisma.outboxDispatcherState.create({
      data: {
        tenantId,
        dispatcherName,
        status: dto.status,
        config: (dto.config || {}) as any,
      },
    });
  }

  // Analytics
  async getAnalytics(tenantId: string, period = "7d") {
    const now = new Date();
    const start = new Date(now);
    if (period === "24h") start.setHours(start.getHours() - 24);
    else if (period === "7d") start.setDate(start.getDate() - 7);
    else if (period === "30d") start.setDate(start.getDate() - 30);
    else if (period === "90d") start.setDate(start.getDate() - 90);

    const [
      totalEvents,
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      dlqCount,
      deadLetterCount,
      avgDuration,
      dispatcherCount,
    ] = await Promise.all([
      prisma.outboxEvent.count({
        where: { tenantId, occurredAt: { gte: start } },
      }),
      prisma.outboxDelivery.count({
        where: { tenantId, createdAt: { gte: start } },
      }),
      prisma.outboxDelivery.count({
        where: { tenantId, status: "COMPLETED", createdAt: { gte: start } },
      }),
      prisma.outboxDelivery.count({
        where: {
          tenantId,
          status: { in: ["DEAD", "FAILED"] },
          createdAt: { gte: start },
        },
      }),
      prisma.outboxDLQ.count({
        where: { tenantId, createdAt: { gte: start } },
      }),
      prisma.outboxDeadLetterMessage.count({
        where: { tenantId, deadLetterAt: { gte: start } },
      }),
      prisma.outboxRetryLog.aggregate({
        where: { tenantId, createdAt: { gte: start } },
        _avg: { durationMs: true },
      }),
      prisma.outboxDispatcherState.count({ where: { tenantId } }),
    ]);

    return {
      period,
      totalEvents,
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      successRate:
        totalDeliveries > 0
          ? Math.round((completedDeliveries / totalDeliveries) * 100)
          : 0,
      dlqCount,
      deadLetterCount,
      avgDurationMs: avgDuration._avg.durationMs || 0,
      dispatcherCount,
      activeDispatchers: 0,
    };
  }

  async getDispatcherHealth(tenantId: string) {
    const states = await prisma.outboxDispatcherState.findMany({
      where: { tenantId },
    });
    const active = states.filter((s) => s.status === "ACTIVE").length;
    const paused = states.filter((s) => s.status === "PAUSED").length;
    const error = states.filter((s) => s.status === "ERROR").length;
    const totalItemsProcessed = states.reduce(
      (sum, s) => sum + s.itemsProcessed,
      0,
    );
    const totalItemsFailed = states.reduce((sum, s) => sum + s.itemsFailed, 0);
    const pendingDeliveries = await prisma.outboxDelivery.count({
      where: { tenantId, status: "PENDING" },
    });
    const leasedDeliveries = await prisma.outboxDelivery.count({
      where: { tenantId, status: "LEASED" },
    });
    return {
      total: states.length,
      active,
      paused,
      error,
      totalItemsProcessed,
      totalItemsFailed,
      pendingDeliveries,
      leasedDeliveries,
      states,
    };
  }

  async detectPoisonMessages(tenantId: string) {
    const poisonThreshold = 5;
    const deliveries = await prisma.outboxDelivery.findMany({
      where: {
        tenantId,
        status: "DEAD",
        updatedAt: { gte: new Date(Date.now() - 86400000) },
      },
      orderBy: { updatedAt: "desc" },
    });
    const poisonMessages = deliveries.filter((d) => {
      const attempts = d.attempts;
      return attempts >= poisonThreshold;
    });
    return {
      poisonCount: poisonMessages.length,
      poisonMessages: poisonMessages.slice(0, 20),
    };
  }
}
