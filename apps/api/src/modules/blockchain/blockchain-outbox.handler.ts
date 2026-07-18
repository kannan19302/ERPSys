import { Injectable, Logger } from '@nestjs/common';
import type { OutboxEventPayload } from '../outbox/outbox-handler.registry';
import { BlockchainAnchorService } from './services/blockchain-anchor.service';

@Injectable()
export class BlockchainOutboxHandler {
  private readonly logger = new Logger(BlockchainOutboxHandler.name);

  constructor(
    private readonly anchorService: BlockchainAnchorService,
  ) {}

  async handle(event: OutboxEventPayload): Promise<void> {
    this.logger.debug(`Handling blockchain-anchor event: ${event.eventName} (${event.aggregateType}:${event.aggregateId})`);

    const anchorEvent = {
      tenantId: event.tenantId,
      entityType: event.aggregateType,
      entityId: event.aggregateId,
      chaincodeName: (event.payload['_chaincodeName'] as string) ?? '',
      channelName: (event.payload['_channelName'] as string) ?? '',
      payload: event.payload,
      eventName: event.eventName,
    };

    await this.anchorService.anchorEvent(anchorEvent);

    this.logger.log(`Anchored ${event.eventName} for ${event.aggregateType}:${event.aggregateId}`);
  }
}
