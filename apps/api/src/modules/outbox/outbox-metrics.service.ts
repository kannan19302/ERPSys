import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class OutboxMetricsService {
  private pendingCount = 0;
  private leasedCount = 0;
  private completedCount = 0;
  private deadCount = 0;
  private retryCount = 0;
  private terminalFailureCount = 0;
  private oldestPendingAgeMs = 0;
  private lastRefresh = 0;

  async refresh(): Promise<void> {
    const now = Date.now();
    const fiveSecAgo = now - 5000;
    if (this.lastRefresh > fiveSecAgo) return;
    this.lastRefresh = now;

    const [pending, leased, completed, dead, oldest] = await Promise.all([
      prisma.outboxDelivery.count({ where: { status: 'PENDING' } }),
      prisma.outboxDelivery.count({ where: { status: 'LEASED' } }),
      prisma.outboxDelivery.count({ where: { status: 'COMPLETED' } }),
      prisma.outboxDelivery.count({ where: { status: 'DEAD' } }),
      prisma.outboxDelivery.findFirst({
        where: { status: 'PENDING' },
        orderBy: { availableAt: 'asc' },
        select: { availableAt: true },
      }),
    ]);

    this.pendingCount = pending;
    this.leasedCount = leased;
    this.completedCount = completed;
    this.deadCount = dead;
    this.oldestPendingAgeMs = oldest
      ? now - oldest.availableAt.getTime()
      : 0;
  }

  getSnapshot() {
    return {
      pendingCount: this.pendingCount,
      leasedCount: this.leasedCount,
      completedCount: this.completedCount,
      deadCount: this.deadCount,
      oldestPendingAgeMs: this.oldestPendingAgeMs,
      retryCount: this.retryCount,
      terminalFailureCount: this.terminalFailureCount,
    };
  }

  incrementRetry(): void {
    this.retryCount++;
  }

  incrementTerminalFailure(): void {
    this.terminalFailureCount++;
  }
}
