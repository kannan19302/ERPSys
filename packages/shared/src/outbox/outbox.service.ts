import type { WriteEventParams } from './outbox.schema.js';

export interface OutboxDeliveryRow {
  id: string;
  tenantId: string;
  outboxEventId: string;
  destination: string;
  status: string;
  attempts: number;
}

export interface OutboxTxClient {
  outboxEvent: {
    create: (args: {
      data: Record<string, unknown>;
    }) => Promise<{ id: string; eventKey: string }>;
    aggregate: (args: {
      where: Record<string, unknown>;
      _max: { sequence: boolean };
    }) => Promise<{ _max: { sequence: number | null } }>;
  };
  outboxDelivery: {
    createMany: (args: {
      data: Record<string, unknown>[];
      skipDuplicates?: boolean;
    }) => Promise<{ count: number }>;
  };
  outboxConsumerReceipt: {
    create: (args: {
      data: Record<string, unknown>;
    }) => Promise<{ id: string }>;
  };
}

export class OutboxService {
  private destinations = new Map<string, Set<string>>();

  registerDestination(eventName: string, destination: string): void {
    const existing = this.destinations.get(eventName) ?? new Set();
    existing.add(destination);
    this.destinations.set(eventName, existing);
  }

  getRegisteredDestinations(eventName: string): string[] {
    return Array.from(this.destinations.get(eventName) ?? []);
  }

  async writeEvent(
    tx: OutboxTxClient,
    params: WriteEventParams,
  ): Promise<{ eventId: string; eventKey: string }> {
    const sequence = await this.nextSequence(
      tx,
      params.tenantId,
      params.aggregateType,
      params.aggregateId,
    );

    const eventKey =
      params.eventKey ??
      `${params.aggregateType}:${params.aggregateId}:${params.eventName}:${sequence}`;

    const event = await tx.outboxEvent.create({
      data: {
        tenantId: params.tenantId,
        eventName: params.eventName,
        eventVersion: params.eventVersion,
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId,
        sequence,
        payload: params.payload as Record<string, unknown>,
        correlationId: params.correlationId ?? null,
        causationId: params.causationId ?? null,
        eventKey,
      },
    });

    const destinations = this.getRegisteredDestinations(params.eventName);
    if (destinations.length > 0) {
      await tx.outboxDelivery.createMany({
        data: destinations.map((destination) => ({
          tenantId: params.tenantId,
          outboxEventId: event.id,
          destination,
          status: 'PENDING',
          availableAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return { eventId: event.id, eventKey };
  }

  private async nextSequence(
    tx: OutboxTxClient,
    tenantId: string,
    aggregateType: string,
    aggregateId: string,
  ): Promise<number> {
    const result = await tx.outboxEvent.aggregate({
      where: { tenantId, aggregateType, aggregateId },
      _max: { sequence: true },
    });
    return (result._max.sequence ?? 0) + 1;
  }
}
