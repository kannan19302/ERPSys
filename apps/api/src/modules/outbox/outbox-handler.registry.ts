import { Injectable } from '@nestjs/common';

export type OutboxEventPayload = {
  eventId: string;
  tenantId: string;
  eventName: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  sequence: number;
  payload: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
};

export type OutboxEventHandler = (
  event: OutboxEventPayload,
) => Promise<void>;

@Injectable()
export class OutboxHandlerRegistry {
  private handlers = new Map<string, OutboxEventHandler>();

  register(destination: string, handler: OutboxEventHandler): void {
    if (this.handlers.has(destination)) {
      throw new Error(`Handler already registered for destination: ${destination}`);
    }
    this.handlers.set(destination, handler);
  }

  get(destination: string): OutboxEventHandler | undefined {
    return this.handlers.get(destination);
  }

  has(destination: string): boolean {
    return this.handlers.has(destination);
  }
}
