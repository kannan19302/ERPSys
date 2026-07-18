import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { SalesService, CreateOnlineOrderInput } from './sales.service';
import type { OutboxEventPayload } from '../outbox/outbox-handler.registry';

/** Shape of the payload written by the ecommerce module's checkout flow. */
export interface EcommerceCheckoutCompletedPayload {
  storefrontSlug: string;
  cartId: string;
  onlineOrderInput: CreateOnlineOrderInput;
  createdBy: string;
  organizationId: string;
  paymentInfo: {
    provider: string;
    providerIntentId: string;
    amount: number;
    currency: string;
    rawResponse: Record<string, unknown>;
  };
}

const DESTINATION = 'sales.createOrder';

@Injectable()
export class SalesOutboxHandler {
  private readonly logger = new Logger(SalesOutboxHandler.name);

  constructor(private readonly salesService: SalesService) {}

  get destination(): string {
    return DESTINATION;
  }

  async handle(event: OutboxEventPayload): Promise<void> {
    const payload = event.payload as unknown as EcommerceCheckoutCompletedPayload;
    const { tenantId } = event;

    this.logger.log(`Processing outbox event ${event.eventId} for cart ${payload.cartId}`);

    try {
      const salesOrder = await this.salesService.createConfirmedOnlineOrder(
        tenantId,
        payload.organizationId,
        payload.onlineOrderInput,
        payload.createdBy,
      );

      await prisma.storefrontOrderPayment.create({
        data: {
          tenantId,
          salesOrderId: salesOrder.id,
          provider: payload.paymentInfo.provider,
          providerIntentId: payload.paymentInfo.providerIntentId,
          status: 'SUCCEEDED',
          amount: payload.paymentInfo.amount,
          currency: payload.paymentInfo.currency,
          rawResponse: payload.paymentInfo.rawResponse as Prisma.InputJsonValue,
        },
      });

      await prisma.storefrontCheckoutState.updateMany({
        where: { tenantId, cartId: payload.cartId, status: 'ORDER_CREATING' },
        data: { status: 'ORDER_COMPLETED', salesOrderId: salesOrder.id },
      });

      this.logger.log(`Order ${salesOrder.id} created for cart ${payload.cartId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to create order for cart ${payload.cartId}: ${message}`);

      await prisma.storefrontCheckoutState.updateMany({
        where: { tenantId, cartId: payload.cartId, status: 'ORDER_CREATING' },
        data: { status: 'ORDER_FAILED', errorMessage: message },
      });

      throw err;
    }
  }
}
