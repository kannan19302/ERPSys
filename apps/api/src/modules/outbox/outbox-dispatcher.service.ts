import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@unerp/database';

const CLAIM_LIMIT = 100;
const LEASE_SECONDS = 30;
const POLL_INTERVAL_MS = 2000;
const LEASE_OWNER_PREFIX = 'dispatcher-';

@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private readonly leaseOwner: string;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectQueue('outbox') private readonly queue: Queue,
  ) {
    this.leaseOwner = `${LEASE_OWNER_PREFIX}${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  }

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    this.poll();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async poll(): Promise<void> {
    try {
      const deliveries = await this.claimDeliveries();
      if (deliveries.length === 0) return;
      await this.enqueueDeliveries(deliveries);
    } catch (err) {
      this.logger.error({ err }, 'Outbox dispatch poll failed');
    }
  }

  private async claimDeliveries(): Promise<
    Array<{ id: string; tenantId: string; outboxEventId: string; destination: string }>
  > {
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + LEASE_SECONDS * 1000);

    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `
      UPDATE outbox_deliveries
      SET status = 'LEASED',
          "leaseOwner" = $1,
          "leaseExpiresAt" = $2,
          attempts = attempts + 1,
          "updatedAt" = NOW()
      WHERE id IN (
        SELECT id
        FROM outbox_deliveries
        WHERE status = 'PENDING'
          AND "availableAt" <= NOW()
        ORDER BY "availableAt" ASC
        LIMIT $3
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, tenant_id, outbox_event_id, destination
      `,
      this.leaseOwner,
      leaseExpiresAt,
      CLAIM_LIMIT,
    );

    const deliveries = rows.map((r) => ({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      outboxEventId: String(r.outbox_event_id),
      destination: String(r.destination),
    }));

    if (deliveries.length > 0) {
      this.logger.debug(`Claimed ${deliveries.length} outbox deliveries`);
    }

    return deliveries;
  }

  private async enqueueDeliveries(
    deliveries: Array<{ id: string; tenantId: string; outboxEventId: string; destination: string }>,
  ): Promise<void> {
    const jobs = deliveries.map((d) => ({
      name: d.id,
      data: {
        deliveryId: d.id,
        tenantId: d.tenantId,
        outboxEventId: d.outboxEventId,
        destination: d.destination,
      },
      opts: {
        jobId: d.id,
        attempts: 1,
      },
    }));

    await this.queue.addBulk(jobs);
  }
}
