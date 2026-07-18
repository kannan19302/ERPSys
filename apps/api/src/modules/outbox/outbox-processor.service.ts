import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { OutboxHandlerRegistry } from './outbox-handler.registry';
import { OutboxMetricsService } from './outbox-metrics.service';

const MAX_ATTEMPTS = 10;

interface OutboxJobData {
  deliveryId: string;
  tenantId: string;
  outboxEventId: string;
  destination: string;
}

@Processor('outbox')
export class OutboxProcessorService extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessorService.name);

  constructor(
    private readonly handlerRegistry: OutboxHandlerRegistry,
    private readonly metrics: OutboxMetricsService,
  ) {
    super();
  }

  async process(job: Job<OutboxJobData>): Promise<void> {
    const { deliveryId, tenantId, outboxEventId, destination } = job.data;

    const delivery = await prisma.outboxDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      this.logger.warn({ deliveryId }, 'Delivery not found, skipping');
      return;
    }

    if (delivery.status !== 'LEASED' && delivery.status !== 'PENDING') {
      this.logger.debug({ deliveryId, status: delivery.status }, 'Delivery already processed');
      return;
    }

    const event = await prisma.outboxEvent.findUnique({
      where: { id: outboxEventId },
    });

    if (!event) {
      this.logger.error({ outboxEventId }, 'OutboxEvent not found');
      await this.failDelivery(deliveryId, 'OutboxEvent not found');
      return;
    }

    if (event.tenantId !== tenantId) {
      this.logger.error({ deliveryId, eventTenant: event.tenantId, jobTenant: tenantId }, 'Tenant mismatch');
      await this.failDelivery(deliveryId, 'Tenant mismatch');
      return;
    }

    try {
      const handler = this.handlerRegistry.get(destination);

      if (handler) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.outboxConsumerReceipt.create({
            data: {
              tenantId,
              consumer: destination,
              outboxEventId,
            },
          });

          await handler({
            eventId: event.id,
            tenantId: event.tenantId,
            eventName: event.eventName,
            eventVersion: event.eventVersion,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            sequence: event.sequence,
            payload: event.payload as Record<string, unknown>,
            correlationId: event.correlationId ?? undefined,
            causationId: event.causationId ?? undefined,
          });

          await tx.outboxDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
        });
      } else {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.outboxConsumerReceipt.create({
            data: {
              tenantId,
              consumer: destination,
              outboxEventId,
            },
          });

          await tx.outboxDelivery.update({
            where: { id: deliveryId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.handleRetry(deliveryId, message);
    }
  }

  private async handleRetry(deliveryId: string, error: string): Promise<void> {
    const delivery = await prisma.outboxDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) return;

    if (delivery.attempts >= MAX_ATTEMPTS) {
      await prisma.outboxDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DEAD',
          lastError: error,
          failedAt: new Date(),
        },
      });
      this.metrics.incrementTerminalFailure();
      this.logger.warn({ deliveryId, attempts: delivery.attempts }, 'Delivery moved to DEAD');
      return;
    }

    const baseDelay = 1000;
    const delay = Math.min(baseDelay * Math.pow(2, delivery.attempts - 1), 60000);
    const jitter = Math.random() * 1000;
    const availableAt = new Date(Date.now() + delay + jitter);

    await prisma.outboxDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'PENDING',
        lastError: error,
        availableAt,
      },
    });

    this.metrics.incrementRetry();
    this.logger.debug({ deliveryId, attempt: delivery.attempts, delay }, 'Delivery queued for retry');
  }

  private async failDelivery(deliveryId: string, error: string): Promise<void> {
    await prisma.outboxDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'DEAD',
        lastError: error,
        failedAt: new Date(),
      },
    });
    this.metrics.incrementTerminalFailure();
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<OutboxJobData> | undefined, error: Error): Promise<void> {
    if (!job) return;
    this.logger.error({ deliveryId: job.data.deliveryId, error: error.message, attempts: job.attemptsMade }, 'Worker job failed');
  }
}
